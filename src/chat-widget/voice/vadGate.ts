/**
 * @package @botuyo/chat-widget
 * VAD Gate — provider-agnostic speech gate (pure logic, fully unit-tested).
 *
 * Decides, per audio frame, whether the upstream should carry the frame to the
 * voice provider. It combines TWO independent signals so background noise never
 * reaches the provider's own VAD (which we treat as an implementation detail of
 * one provider, not something to depend on):
 *
 *   1. `speechProb` — a real speech-vs-noise probability (Silero VAD). Rejects
 *      loud NON-speech (door slams, music, keyboard) that an energy gate alone
 *      would pass.
 *   2. `rms` — near-field energy. Rejects voiced-but-distant sources (a TV or a
 *      person across the room) via the inverse-square law: the device user is
 *      the loudest source in front of the mic.
 *
 * BARGE-IN: the gate runs continuously, INCLUDING while the bot is speaking, so
 * the user can always interrupt — but only with a *clear and frontal* voice. A
 * stricter near-field bar (`bargeInRms`) applies while `botSpeaking` is true so
 * the bot's own echo / ambient chatter does not self-interrupt, while a real
 * voice talking into the device does.
 *
 * Hysteresis: `onsetFrames` consecutive voiced frames are required to OPEN
 * (debounces transients) and `redemptionFrames` of non-voiced audio are
 * tolerated before CLOSING (so natural pauses between words are not chopped).
 */

export type VadGateState = 'silence' | 'speech'

export type VadGateEvent = 'speech_start' | 'speech_end' | 'barge_in'

export interface VadGateConfig {
  /** Silero speech probability (0–1) required to consider a frame voiced at ONSET. */
  positiveSpeechThreshold: number
  /** Silero probability below which an ongoing turn stops being sustained (hysteresis). */
  negativeSpeechThreshold: number
  /** Min near-field RMS (0–1) for the device user while idle/listening. */
  nearFieldRms: number
  /** Stricter near-field RMS required to BARGE IN over the bot ("clear & frontal"). */
  bargeInRms: number
  /** Consecutive voiced frames required to open the gate. */
  onsetFrames: number
  /** Consecutive non-voiced frames tolerated before the gate closes (word-gap hangover). */
  redemptionFrames: number
  /**
   * When true, ignore `speechProb` and gate on near-field energy only. Used as a
   * graceful fallback when the Silero model cannot be loaded (offline / CSP).
   */
  energyOnly?: boolean
}

/** A single analysed audio frame fed to the gate. */
export interface VadFrame {
  /** Silero speech probability 0–1 (ignored when `energyOnly`). */
  speechProb: number
  /** Frame RMS on the 0–1 Float scale. */
  rms: number
  /** Whether the bot is currently playing audio (enables the barge-in bar). */
  botSpeaking: boolean
}

export interface VadGateResult {
  /** Whether this frame should be sent upstream to the provider. */
  shouldStream: boolean
  /** Gate state after processing this frame. */
  state: VadGateState
  /** Transition event, if any, emitted on this frame. */
  event?: VadGateEvent
}

/**
 * Sensitivity presets. Higher = more background isolation: it demands a clearer
 * (higher Silero prob) and louder/closer (higher RMS) voice, rejecting more
 * ambient noise at the cost of a soft/distant speaker.
 */
export const VAD_GATE_PRESETS: Record<'low' | 'standard' | 'high', VadGateConfig> = {
  low: {
    positiveSpeechThreshold: 0.4,
    negativeSpeechThreshold: 0.3,
    nearFieldRms: 0.012,
    bargeInRms: 0.022,
    onsetFrames: 1,
    redemptionFrames: 10,
  },
  standard: {
    positiveSpeechThreshold: 0.5,
    negativeSpeechThreshold: 0.35,
    nearFieldRms: 0.02,
    bargeInRms: 0.035,
    onsetFrames: 2,
    redemptionFrames: 8,
  },
  high: {
    positiveSpeechThreshold: 0.6,
    negativeSpeechThreshold: 0.45,
    nearFieldRms: 0.032,
    bargeInRms: 0.055,
    onsetFrames: 3,
    redemptionFrames: 6,
  },
}

/** What a consumer can pass to configure the gate. */
export type VadGateSetting = 'low' | 'standard' | 'high' | Partial<VadGateConfig>

/** How far below `nearFieldRms` a frame may dip and still SUSTAIN an open turn. */
const SUSTAIN_RMS_FACTOR = 0.5

/**
 * Resolves a consumer setting into a full config. Defaults to `standard`;
 * a partial object is merged over `standard`.
 */
export function resolveVadGateConfig(setting?: VadGateSetting): VadGateConfig {
  if (setting === undefined || setting === 'standard') {
    return { ...VAD_GATE_PRESETS.standard }
  }
  if (typeof setting === 'string') {
    return { ...(VAD_GATE_PRESETS[setting] ?? VAD_GATE_PRESETS.standard) }
  }
  return { ...VAD_GATE_PRESETS.standard, ...setting }
}

/** Inputs for {@link resolveVadInput}. */
export interface VadInputContext {
  /** Whether the bot is currently playing audio. */
  botSpeaking: boolean
  /** Whether a real Silero VAD frame arrived recently (vs the energy-only fallback). */
  vadFresh: boolean
  /** Latest Silero speech probability (only meaningful when `vadFresh`). */
  speechProb: number
  /** Frame RMS (near-field energy). */
  rms: number
}

/**
 * Resolves the {@link VadFrame} to feed the gate, plus whether a streamed chunk is
 * CONFIRMED real speech (used by the provider's server-side greeting gate).
 *
 * Echo safety: without a fresh REAL VAD signal we cannot distinguish the user's
 * voice from the bot's own audio leaking into the mic (imperfect AEC), so while the
 * bot is speaking we feed a SILENT frame — the gate stays closed and we never
 * self-interrupt. A clear, frontal voice resumes barge-in once Silero is live.
 */
export function resolveVadInput(ctx: VadInputContext): { frame: VadFrame; confirmedSpeech: boolean } {
  if (ctx.botSpeaking && !ctx.vadFresh) {
    return { frame: { speechProb: 0, rms: 0, botSpeaking: true }, confirmedSpeech: false }
  }
  return {
    frame: {
      speechProb: ctx.vadFresh ? ctx.speechProb : 1,
      rms: ctx.rms,
      botSpeaking: ctx.botSpeaking,
    },
    confirmedSpeech: ctx.vadFresh,
  }
}

/**
 * Resolves the `speech` flag carried with a STREAMED audio chunk (i.e. one the
 * {@link VadGate} already decided to forward). The server's greeting audio-gate drops
 * unmarked mic audio while the greeting plays, so this flag is what lets the user be heard.
 *
 * - A fresh Silero confirmation (`confirmedSpeech`) is the strong signal — trust it.
 * - Otherwise we are in the energy-only fallback (Silero/ONNX could not load — offline,
 *   CSP, or a network that blocks the CDN). There, a frame the energy gate chose to stream
 *   IS itself the near-field-speech decision, so we mark it as speech. This keeps the voice
 *   INPUT path working WITHOUT depending on the third-party VAD CDN being reachable.
 *
 * Echo safety is unaffected: while the bot speaks with no fresh VAD, {@link resolveVadInput}
 * feeds a silent frame so the gate never streams — those frames never reach this function.
 */
export function resolveSpeechFlag(ctx: { confirmedSpeech: boolean; vadFresh: boolean }): boolean {
  return ctx.confirmedSpeech || !ctx.vadFresh
}

/**
 * Final upstream decision for a captured frame — combines the {@link VadGate} verdict with
 * a deliberate "defer to the server-side VAD while the bot is idle" rule.
 *
 * WHILE THE BOT IS SPEAKING the gate is authoritative: that is exactly when echo / ambient
 * noise must NOT self-interrupt the greeting, so we trust the gate's barge-in bar (plus the
 * silent frame {@link resolveVadInput} feeds when there is no fresh real-VAD signal) to keep
 * the half-duplex protection.
 *
 * WHILE THE BOT IS IDLE (the user's turn to talk) we stream EVERY frame and let the
 * provider's own server-side VAD decide where speech starts/ends — the pre-VAD, "as it was"
 * behavior. A client-side near-field energy threshold is unreliable across microphones and
 * input gains (and is bypassed entirely when the Silero model can't load behind a strict
 * network), and it was silently dropping the audio of legitimate, normal-volume users. Being
 * heard must never depend on it, so when it's the user's turn the mic always reaches upstream.
 */
export function resolveShouldStream(ctx: { gateShouldStream: boolean; botSpeaking: boolean }): boolean {
  if (!ctx.botSpeaking) return true
  return ctx.gateShouldStream
}

/**
 * Ground-truth "is the bot AUDIBLY speaking right now?" used to drive the half-duplex
 * gating. We deliberately do NOT rely solely on the `isPlaying` flag: that flag is only
 * cleared by an `onended` callback on the last scheduled audio source, and if that callback
 * never fires (a suspended/closed `AudioContext`, a stalled or stopped source, jitter) the
 * flag gets STUCK at `true` — which would keep the gate authoritative forever and silence
 * the user even though the bot has long finished. Instead we cross-check the playback
 * schedule against the audio clock:
 *
 * - If nothing is playing (`isPlaying` false) → not speaking.
 * - If there is no running `AudioContext` → nothing can be audible → not speaking.
 * - Otherwise the bot is speaking only while the gapless schedule cursor (`nextPlayTime`)
 *   is still AHEAD of the context clock (`currentTime`). Once the clock passes the cursor,
 *   every scheduled chunk has elapsed → the bot is done and the user must be heard again,
 *   regardless of whether `onended` fired.
 */
export function resolveBotSpeaking(ctx: {
  isPlaying: boolean
  contextRunning: boolean
  nextPlayTime: number
  currentTime: number
}): boolean {
  if (!ctx.isPlaying) return false
  if (!ctx.contextRunning) return false
  return ctx.nextPlayTime > ctx.currentTime
}

/**
 * Stateful speech gate. Feed it one analysed frame at a time via {@link process};
 * it returns whether to stream the frame plus any transition event.
 */
export class VadGate {
  private readonly config: VadGateConfig
  private _state: VadGateState = 'silence'
  private onsetCount = 0
  private redemptionCount = 0

  constructor(config: Partial<VadGateConfig> = {}) {
    this.config = { ...VAD_GATE_PRESETS.standard, ...config }
  }

  get state(): VadGateState {
    return this._state
  }

  /** Resets the gate to the closed (silence) state. */
  reset(): void {
    this._state = 'silence'
    this.onsetCount = 0
    this.redemptionCount = 0
  }

  process(frame: VadFrame): VadGateResult {
    if (this._state === 'silence') return this.processSilence(frame)
    return this.processSpeech(frame)
  }

  // ── State: SILENCE → waiting for a confident onset ───────────────────────
  private processSilence(frame: VadFrame): VadGateResult {
    const nearFieldBar = frame.botSpeaking ? this.config.bargeInRms : this.config.nearFieldRms
    const probOk = this.config.energyOnly || frame.speechProb >= this.config.positiveSpeechThreshold
    const voiced = probOk && frame.rms >= nearFieldBar

    if (!voiced) {
      this.onsetCount = 0
      return { shouldStream: false, state: 'silence' }
    }

    this.onsetCount += 1
    if (this.onsetCount < this.config.onsetFrames) {
      return { shouldStream: false, state: 'silence' }
    }

    // Confident onset → open the gate.
    this._state = 'speech'
    this.onsetCount = 0
    this.redemptionCount = 0
    return {
      shouldStream: true,
      state: 'speech',
      event: frame.botSpeaking ? 'barge_in' : 'speech_start',
    }
  }

  // ── State: SPEECH → stream, tolerating brief gaps (hangover) ─────────────
  private processSpeech(frame: VadFrame): VadGateResult {
    const sustainRms = this.config.nearFieldRms * SUSTAIN_RMS_FACTOR
    const probOk = this.config.energyOnly || frame.speechProb >= this.config.negativeSpeechThreshold
    const sustained = probOk && frame.rms >= sustainRms

    if (sustained) {
      this.redemptionCount = 0
      return { shouldStream: true, state: 'speech' }
    }

    this.redemptionCount += 1
    if (this.redemptionCount < this.config.redemptionFrames) {
      // Within the hangover budget → keep the stream open through the pause.
      return { shouldStream: true, state: 'speech' }
    }

    // Sustained silence → close.
    this._state = 'silence'
    this.redemptionCount = 0
    return { shouldStream: false, state: 'silence', event: 'speech_end' }
  }
}
