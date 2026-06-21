import { describe, it, expect } from 'vitest'
import {
  VadGate,
  VAD_GATE_PRESETS,
  resolveVadGateConfig,
  resolveVadInput,
  resolveSpeechFlag,
  resolveShouldStream,
  type VadFrame,
} from '../../chat-widget/voice/vadGate'

/** Push the same frame `n` times, returning the LAST result. */
function pushN(gate: VadGate, frame: VadFrame, n: number) {
  let last = gate.process(frame)
  for (let i = 1; i < n; i++) last = gate.process(frame)
  return last
}

// Loud, clearly-voiced near-field frame (user talking into the device)
const CLEAR_SPEECH: VadFrame = { speechProb: 0.92, rms: 0.06, botSpeaking: false }
// Loud energy but NOT speech (a door slam, music transient) — Silero rejects it
const LOUD_NOISE: VadFrame = { speechProb: 0.08, rms: 0.06, botSpeaking: false }
// Voiced but distant/quiet (TV in another room) — below near-field bar
const DISTANT_SPEECH: VadFrame = { speechProb: 0.9, rms: 0.006, botSpeaking: false }
// True silence
const SILENCE: VadFrame = { speechProb: 0.02, rms: 0.002, botSpeaking: false }

describe('vadGate', () => {
  describe('VAD_GATE_PRESETS / resolveVadGateConfig', () => {
    it('exposes low / standard / high presets', () => {
      expect(VAD_GATE_PRESETS.low).toBeDefined()
      expect(VAD_GATE_PRESETS.standard).toBeDefined()
      expect(VAD_GATE_PRESETS.high).toBeDefined()
    })

    it('higher sensitivity preset requires clearer/louder speech (stricter)', () => {
      // "high" = more background isolation → higher near-field bar than "low"
      expect(VAD_GATE_PRESETS.high.nearFieldRms).toBeGreaterThan(VAD_GATE_PRESETS.low.nearFieldRms)
      expect(VAD_GATE_PRESETS.high.bargeInRms).toBeGreaterThanOrEqual(VAD_GATE_PRESETS.high.nearFieldRms)
    })

    it('defaults to standard, accepts a named preset, and merges a partial', () => {
      expect(resolveVadGateConfig()).toEqual(VAD_GATE_PRESETS.standard)
      expect(resolveVadGateConfig('high')).toEqual(VAD_GATE_PRESETS.high)
      const merged = resolveVadGateConfig({ nearFieldRms: 0.099 })
      expect(merged.nearFieldRms).toBe(0.099)
      expect(merged.redemptionFrames).toBe(VAD_GATE_PRESETS.standard.redemptionFrames)
    })

    it('barge-in bar is always >= near-field bar (interrupting needs clear & frontal voice)', () => {
      for (const p of Object.values(VAD_GATE_PRESETS)) {
        expect(p.bargeInRms).toBeGreaterThanOrEqual(p.nearFieldRms)
      }
    })
  })

  describe('initial state', () => {
    it('starts in silence and does not stream', () => {
      const gate = new VadGate()
      expect(gate.state).toBe('silence')
      const r = gate.process(SILENCE)
      expect(r.shouldStream).toBe(false)
      expect(r.state).toBe('silence')
      expect(r.event).toBeUndefined()
    })
  })

  describe('onset (speech_start)', () => {
    it('requires onsetFrames consecutive voiced frames before opening', () => {
      const cfg = resolveVadGateConfig({ onsetFrames: 3 })
      const gate = new VadGate(cfg)
      expect(gate.process(CLEAR_SPEECH).shouldStream).toBe(false) // 1
      expect(gate.process(CLEAR_SPEECH).shouldStream).toBe(false) // 2
      const r = gate.process(CLEAR_SPEECH) // 3 → opens
      expect(r.shouldStream).toBe(true)
      expect(r.state).toBe('speech')
      expect(r.event).toBe('speech_start')
    })

    it('a single voiced blip below onsetFrames does NOT open (debounces transients)', () => {
      const gate = new VadGate(resolveVadGateConfig({ onsetFrames: 2 }))
      expect(gate.process(CLEAR_SPEECH).shouldStream).toBe(false)
      // interrupted by a non-voiced frame → onset counter resets
      gate.process(SILENCE)
      expect(gate.process(CLEAR_SPEECH).shouldStream).toBe(false)
      expect(gate.state).toBe('silence')
    })
  })

  describe('noise rejection (the whole point — provider-agnostic)', () => {
    it('rejects loud NON-speech energy (Silero prob below threshold)', () => {
      const gate = new VadGate(resolveVadGateConfig({ onsetFrames: 2 }))
      const r = pushN(gate, LOUD_NOISE, 10)
      expect(r.shouldStream).toBe(false)
      expect(gate.state).toBe('silence')
    })

    it('rejects voiced-but-distant audio (below near-field RMS bar)', () => {
      const gate = new VadGate(resolveVadGateConfig({ onsetFrames: 2 }))
      const r = pushN(gate, DISTANT_SPEECH, 10)
      expect(r.shouldStream).toBe(false)
      expect(gate.state).toBe('silence')
    })
  })

  describe('hangover (do not chop natural pauses) + speech_end', () => {
    it('keeps streaming through brief non-voiced gaps, then closes after redemptionFrames', () => {
      const gate = new VadGate(resolveVadGateConfig({ onsetFrames: 1, redemptionFrames: 3 }))
      const open = gate.process(CLEAR_SPEECH)
      expect(open.shouldStream).toBe(true)
      expect(open.event).toBe('speech_start')

      // gap frames within redemption budget → still streaming, no end yet
      expect(gate.process(SILENCE).shouldStream).toBe(true) // 1
      expect(gate.process(SILENCE).shouldStream).toBe(true) // 2
      const end = gate.process(SILENCE) // 3 → closes
      expect(end.shouldStream).toBe(false)
      expect(end.state).toBe('silence')
      expect(end.event).toBe('speech_end')
    })

    it('a voiced frame within the gap resets the redemption counter', () => {
      const gate = new VadGate(resolveVadGateConfig({ onsetFrames: 1, redemptionFrames: 2 }))
      gate.process(CLEAR_SPEECH) // open
      gate.process(SILENCE) // gap 1
      gate.process(CLEAR_SPEECH) // re-voiced → reset
      expect(gate.process(SILENCE).shouldStream).toBe(true) // gap 1 again, not closed
      expect(gate.state).toBe('speech')
    })
  })

  describe('barge-in while the bot is speaking ("clear & frontal" only)', () => {
    it('opens with a barge_in event when the user speaks clearly & loudly over the bot', () => {
      const gate = new VadGate(resolveVadGateConfig({ onsetFrames: 1 }))
      const loudFrontal: VadFrame = { speechProb: 0.95, rms: 0.08, botSpeaking: true }
      const r = gate.process(loudFrontal)
      expect(r.shouldStream).toBe(true)
      expect(r.event).toBe('barge_in')
      expect(r.state).toBe('speech')
    })

    it('does NOT interrupt the bot for a moderate voice that would open when idle', () => {
      const cfg = resolveVadGateConfig({ onsetFrames: 1, nearFieldRms: 0.02, bargeInRms: 0.05 })
      const gate = new VadGate(cfg)
      // rms 0.03: above idle near-field bar (0.02) but below barge-in bar (0.05)
      const moderate: VadFrame = { speechProb: 0.95, rms: 0.03, botSpeaking: true }
      const r = pushN(gate, moderate, 5)
      expect(r.shouldStream).toBe(false)
      expect(gate.state).toBe('silence')
    })

    it('the SAME moderate voice DOES open when the bot is not speaking', () => {
      const cfg = resolveVadGateConfig({ onsetFrames: 1, nearFieldRms: 0.02, bargeInRms: 0.05 })
      const gate = new VadGate(cfg)
      const moderateIdle: VadFrame = { speechProb: 0.95, rms: 0.03, botSpeaking: false }
      expect(gate.process(moderateIdle).shouldStream).toBe(true)
    })
  })

  describe('energyOnly fallback (Silero unavailable)', () => {
    it('ignores speechProb and gates purely on near-field RMS', () => {
      const gate = new VadGate(resolveVadGateConfig({ energyOnly: true, onsetFrames: 1 }))
      // loud but non-speech prob → still opens in energy-only mode
      expect(gate.process({ speechProb: 0.0, rms: 0.06, botSpeaking: false }).shouldStream).toBe(true)
    })

    it('still rejects quiet frames in energy-only mode', () => {
      const gate = new VadGate(resolveVadGateConfig({ energyOnly: true, onsetFrames: 1 }))
      expect(gate.process({ speechProb: 0.99, rms: 0.003, botSpeaking: false }).shouldStream).toBe(false)
    })
  })

  describe('reset', () => {
    it('returns the gate to silence and clears counters', () => {
      const gate = new VadGate(resolveVadGateConfig({ onsetFrames: 1 }))
      gate.process(CLEAR_SPEECH)
      expect(gate.state).toBe('speech')
      gate.reset()
      expect(gate.state).toBe('silence')
      expect(gate.process(SILENCE).shouldStream).toBe(false)
    })
  })

  describe('resolveVadInput (echo-safe frame + speech confirmation)', () => {
    it('stays half-duplex over the bot WITHOUT a fresh real-VAD signal (silent frame)', () => {
      // botSpeaking + energy-only: cannot tell the user from the bot's own echo,
      // so feed a silent frame → gate stays closed, no self-interrupt.
      const { frame, confirmedSpeech } = resolveVadInput({
        botSpeaking: true,
        vadFresh: false,
        speechProb: 0.9,
        rms: 0.08,
      })
      expect(frame.speechProb).toBe(0)
      expect(frame.rms).toBe(0)
      expect(frame.botSpeaking).toBe(true)
      expect(confirmedSpeech).toBe(false)
    })

    it('passes the real frame and CONFIRMS speech for a fresh Silero signal over the bot (barge-in)', () => {
      const { frame, confirmedSpeech } = resolveVadInput({
        botSpeaking: true,
        vadFresh: true,
        speechProb: 0.93,
        rms: 0.07,
      })
      expect(frame.speechProb).toBeCloseTo(0.93, 6)
      expect(frame.rms).toBeCloseTo(0.07, 6)
      expect(confirmedSpeech).toBe(true)
    })

    it('uses the energy gate (speechProb=1) and does NOT confirm speech when not fresh and the bot is idle', () => {
      const { frame, confirmedSpeech } = resolveVadInput({
        botSpeaking: false,
        vadFresh: false,
        speechProb: 0,
        rms: 0.05,
      })
      expect(frame.speechProb).toBe(1)
      expect(frame.rms).toBeCloseTo(0.05, 6)
      expect(confirmedSpeech).toBe(false)
    })

    it('confirms speech with a fresh Silero signal while idle', () => {
      const { frame, confirmedSpeech } = resolveVadInput({
        botSpeaking: false,
        vadFresh: true,
        speechProb: 0.8,
        rms: 0.05,
      })
      expect(frame.speechProb).toBeCloseTo(0.8, 6)
      expect(confirmedSpeech).toBe(true)
    })
  })

  describe('resolveSpeechFlag (wire `speech` flag — CDN-independent input path)', () => {
    it('marks speech when Silero confirmed it (fresh VAD)', () => {
      expect(resolveSpeechFlag({ confirmedSpeech: true, vadFresh: true })).toBe(true)
    })

    it('marks speech in the energy-only fallback so being heard never depends on the VAD CDN', () => {
      // Silero unavailable (no fresh VAD) → a frame the energy gate chose to stream IS
      // the near-field-speech decision. Mark it so the server greeting-gate lets the
      // user through even when the Silero/ONNX CDN is blocked (corporate net / CSP).
      expect(resolveSpeechFlag({ confirmedSpeech: false, vadFresh: false })).toBe(true)
    })

    it('does NOT mark speech when VAD is fresh but Silero did not confirm it', () => {
      // With a live Silero signal we trust its confirmation only — no over-marking.
      expect(resolveSpeechFlag({ confirmedSpeech: false, vadFresh: true })).toBe(false)
    })
  })

  describe('resolveShouldStream (defer to server VAD while the bot is idle)', () => {
    it('streams EVERY frame while the bot is idle, even if the client gate would close it', () => {
      // The user's turn to talk: a client near-field energy threshold (or a failed Silero
      // load behind a strict network) must never silence a real, normal-volume voice — being
      // heard cannot depend on it, so when the bot is idle we always reach the server-side VAD.
      expect(resolveShouldStream({ gateShouldStream: false, botSpeaking: false })).toBe(true)
      expect(resolveShouldStream({ gateShouldStream: true, botSpeaking: false })).toBe(true)
    })

    it('keeps the gate authoritative while the bot is speaking (echo / greeting protection)', () => {
      // Over the bot only a gate-confirmed barge-in streams; otherwise stay half-duplex so the
      // bot's own audio leaking into the mic cannot self-interrupt the greeting.
      expect(resolveShouldStream({ gateShouldStream: false, botSpeaking: true })).toBe(false)
      expect(resolveShouldStream({ gateShouldStream: true, botSpeaking: true })).toBe(true)
    })
  })
})
