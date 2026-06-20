/**
 * @package @botuyo/chat-widget
 * Audio Enhancement Utilities
 *
 * Shared audio processing chain for voice capture:
 * - Highpass filter (cuts low-freq ambient noise: HVAC, traffic, rumble)
 * - Lowpass filter (cuts high-freq noise above speech range)
 * - Dynamic compressor (normalizes volume, boosts close speech)
 *
 * Plus a noise gate implemented inside AudioWorklet processors
 * to silence chunks below an RMS threshold (background chatter, distant voices).
 *
 * Compatible with desktop and mobile browsers (Chrome, Safari, Firefox).
 */

import { VOICE_AUDIO_CONFIG } from './types'

// ============================================================================
// ENHANCED getUserMedia CONSTRAINTS
// ============================================================================

/**
 * Optimized audio constraints for voice capture.
 * These leverage browser-level DSP which works on both desktop and mobile.
 */
export const ENHANCED_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  sampleRate: VOICE_AUDIO_CONFIG.input.sampleRate,
  channelCount: VOICE_AUDIO_CONFIG.input.channels,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}

// ============================================================================
// NOISE GATE CONFIGURATION
// ============================================================================

/**
 * RMS threshold for the noise gate (Float32 scale 0–1).
 * - Quiet room ambient ≈ 0.003–0.008
 * - Normal speech at arm's length ≈ 0.02–0.10
 * - 0.012 aggressively cuts background chatter/distant voices while keeping soft near-field speech
 */
export const NOISE_GATE_THRESHOLD = 0.012

/**
 * Number of consecutive silent frames before the gate closes.
 * Prevents choppy cutoffs on natural pauses between words.
 * At 16kHz with 1600-sample buffers (100ms each), 3 frames = 300ms hold.
 * At 16kHz with 320-sample buffers (20ms each), 15 frames = 300ms hold.
 */
export const NOISE_GATE_HOLD_FRAMES = 3

// ============================================================================
// WEB AUDIO ENHANCEMENT CHAIN
// ============================================================================

/**
 * Audio enhancement chain parameters.
 * Tuned for speech capture on mobile and desktop.
 */
export const ENHANCEMENT_CONFIG = {
  /** Highpass filter — removes low-frequency rumble (HVAC, traffic, wind) */
  highpass: {
    frequency: 85, // Hz — below male voice fundamental (~85Hz)
    q: 0.7, // Gentle slope, no resonance
  },
  /** Secondary highpass (de-rumble) — further attenuates low-freq ambient that leaks past 85Hz */
  deRumble: {
    frequency: 200, // Hz — gentle cut below 200Hz reduces room rumble, distant bass
    q: 0.5, // Very gentle slope, preserves natural voice body
  },
  /** Presence boost — peaks at 3kHz to emphasize near-field speech clarity */
  presenceBoost: {
    frequency: 3000, // Hz — voice presence/clarity zone (2–4kHz)
    q: 1.0, // Moderate Q for a focused but natural boost
    gain: 6, // dB — +6dB makes close speech stand out over distant ambient
  },
  /** Lowpass filter — removes high-frequency hiss/noise above speech */
  lowpass: {
    frequency: 7500, // Hz — speech content is mostly below 4kHz, harmonics to ~7.5kHz
    q: 0.7,
  },
  /** Dynamic compressor — normalizes volume, aggressively boosts close speaker */
  compressor: {
    threshold: -20, // dB — more aggressive, catches more dynamic range
    knee: 8, // dB — tighter knee for more consistent output
    ratio: 6, // 6:1 — aggressive compression to equalize close vs far sources
    attack: 0.002, // 2ms — very fast attack catches transients immediately
    release: 0.12, // 120ms — slightly faster release for responsive tracking
  },
} as const

/**
 * Creates a Web Audio processing chain for near-field voice enhancement.
 * Designed to isolate the speaker directly in front of the device
 * while rejecting ambient noise, distant voices, and room reverb.
 *
 * Chain: source → highpass(85Hz) → deRumble(200Hz) → presenceBoost(3kHz)
 *        → lowpass(7.5kHz) → compressor(6:1) → (output node)
 *
 * @param ctx - AudioContext to create nodes in
 * @param source - MediaStreamAudioSourceNode from getUserMedia
 * @returns The final node in the chain (connect your worklet/processor to this)
 *
 * @example
 * ```ts
 * const source = ctx.createMediaStreamSource(stream)
 * const enhanced = createEnhancementChain(ctx, source)
 * enhanced.connect(workletNode) // or analyser, etc.
 * ```
 */
export function createEnhancementChain(
  ctx: AudioContext,
  source: MediaStreamAudioSourceNode
): AudioNode {
  // 1. Highpass — cut deep rumble below 85Hz
  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = ENHANCEMENT_CONFIG.highpass.frequency
  highpass.Q.value = ENHANCEMENT_CONFIG.highpass.q

  // 2. De-rumble — secondary gentle highpass at 200Hz
  //    Reduces low-freq ambient noise that leaks past the 85Hz filter
  //    (HVAC harmonics, distant traffic, room resonance)
  const deRumble = ctx.createBiquadFilter()
  deRumble.type = 'highpass'
  deRumble.frequency.value = ENHANCEMENT_CONFIG.deRumble.frequency
  deRumble.Q.value = ENHANCEMENT_CONFIG.deRumble.q

  // 3. Presence boost — peaking EQ at 3kHz (+6dB)
  //    Near-field speech has strong energy at 2–4kHz (consonant clarity).
  //    Distant voices and ambient sound have flatter spectrum here,
  //    so boosting this range naturally emphasizes the close speaker.
  const presenceBoost = ctx.createBiquadFilter()
  presenceBoost.type = 'peaking'
  presenceBoost.frequency.value = ENHANCEMENT_CONFIG.presenceBoost.frequency
  presenceBoost.Q.value = ENHANCEMENT_CONFIG.presenceBoost.q
  presenceBoost.gain.value = ENHANCEMENT_CONFIG.presenceBoost.gain

  // 4. Lowpass — cut hiss above 7.5kHz
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = ENHANCEMENT_CONFIG.lowpass.frequency
  lowpass.Q.value = ENHANCEMENT_CONFIG.lowpass.q

  // 5. Dynamic compressor — aggressive volume normalization
  //    6:1 ratio with fast attack equalizes close vs far sources
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = ENHANCEMENT_CONFIG.compressor.threshold
  compressor.knee.value = ENHANCEMENT_CONFIG.compressor.knee
  compressor.ratio.value = ENHANCEMENT_CONFIG.compressor.ratio
  compressor.attack.value = ENHANCEMENT_CONFIG.compressor.attack
  compressor.release.value = ENHANCEMENT_CONFIG.compressor.release

  // Connect chain: source → highpass → deRumble → presenceBoost → lowpass → compressor
  source.connect(highpass)
  highpass.connect(deRumble)
  deRumble.connect(presenceBoost)
  presenceBoost.connect(lowpass)
  lowpass.connect(compressor)

  return compressor
}

// ============================================================================
// NOISE GATE CODE FOR AUDIOWORKLET PROCESSORS
// ============================================================================

/**
 * Generates the noise gate logic as a string to inject into AudioWorklet code.
 * This adds RMS calculation + hold-time gating to prevent sending silent/noisy chunks.
 *
 * The generated code expects:
 * - `this.holdCounter` initialized in constructor
 * - The buffer to be checked as a Float32Array
 *
 * @param threshold - RMS threshold (default: NOISE_GATE_THRESHOLD)
 * @param holdFrames - Frames to hold gate open after speech (default: NOISE_GATE_HOLD_FRAMES)
 */
export function generateNoiseGateCode(
  threshold: number = NOISE_GATE_THRESHOLD,
  holdFrames: number = NOISE_GATE_HOLD_FRAMES
): { constructorInit: string; gateCheck: string } {
  return {
    constructorInit: `this.holdCounter = 0;`,
    gateCheck: `
        // Noise gate: calculate RMS and only send if above threshold
        let sumSq = 0;
        for (let k = 0; k < int16Buffer.length; k++) {
          const normalized = int16Buffer[k] / 0x7FFF;
          sumSq += normalized * normalized;
        }
        const rms = Math.sqrt(sumSq / int16Buffer.length);

        if (rms > ${threshold}) {
          this.holdCounter = ${holdFrames};
        } else if (this.holdCounter > 0) {
          this.holdCounter--;
        }

        // Only send chunk if gate is open (speech detected or within hold time)
        if (this.holdCounter > 0) {`,
  }
}

// ============================================================================
// CONTINUOUS (VAD-SAFE) NOISE GATE — for the live Gemini path
// ============================================================================

/**
 * Downward-expander gate config for the live voice path (VoiceCallOverlay).
 *
 * Unlike `generateNoiseGateCode` (which DROPS sub-threshold chunks and is only
 * safe for paths without server-side VAD), this gate ATTENUATES sub-threshold
 * audio toward a non-zero floor while STILL sending every chunk. The stream
 * stays continuous, so Gemini Live's server-side VAD keeps working, but the
 * room ambience / background chatter that leaks in during the user's pauses is
 * suppressed instead of being streamed up at full level.
 *
 * Tuning notes (RMS on the enhanced signal, Float32 scale 0–1):
 * - `openThreshold` 0.0125 sits just above quiet room ambient (~0.003–0.008)
 *   and below normal near-field speech (~0.02–0.10), so the person in front of
 *   the device opens the gate while distant / low-level background does not.
 * - `floorGain` 0.12 (≈ −18 dB) is an attenuation, not a hard mute: it keeps the
 *   stream continuous and click-free, and is forgiving if a soft speaker briefly
 *   dips below threshold (worst case they are attenuated, never cut to silence).
 * - `attackStep` 1 opens the gate within a single 100 ms frame (never clips a
 *   word onset); `releaseStep` 0.16 closes gradually (~0.5 s hold) so natural
 *   pauses between words are not chopped.
 *
 * NOTE: an energy gate leverages the inverse-square law (the near speaker is the
 * loudest source) — it cannot separate a second person talking AT the device at
 * conversational volume. That needs hardware beamforming / ML source separation
 * which browsers do not expose; the browser-level `noiseSuppression` constraint
 * plus this gate are the strongest client-side levers available.
 */
export interface VoiceGateConfig {
  /** RMS at/above which the gate is fully open (gain → 1) */
  openThreshold: number
  /** Gain applied when fully closed (0–1; non-zero keeps the stream continuous) */
  floorGain: number
  /** Max gain increase per frame when opening (1 = instant, never clips onsets) */
  attackStep: number
  /** Max gain decrease per frame when closing (smaller = longer hold) */
  releaseStep: number
}

export const VOICE_GATE_CONFIG: VoiceGateConfig = {
  openThreshold: 0.0125,
  floorGain: 0.12,
  attackStep: 1,
  releaseStep: 0.16,
}

/**
 * Friendly sensitivity presets so each tenant can dial background isolation up
 * or down without understanding the raw DSP knobs:
 * - `off`      → gate disabled (every frame passes at full level — legacy behaviour)
 * - `low`      → gentle; only the quietest ambience is attenuated (safest for soft speakers)
 * - `standard` → recommended default (= VOICE_GATE_CONFIG)
 * - `high`     → aggressive; cuts more background, higher risk of clipping a soft speaker
 */
export type VoiceGateSensitivity = 'off' | 'low' | 'standard' | 'high'

export const VOICE_GATE_PRESETS: Record<VoiceGateSensitivity, VoiceGateConfig> = {
  off: { openThreshold: 0, floorGain: 1, attackStep: 1, releaseStep: 1 },
  low: { openThreshold: 0.008, floorGain: 0.25, attackStep: 1, releaseStep: 0.12 },
  standard: { ...VOICE_GATE_CONFIG },
  high: { openThreshold: 0.02, floorGain: 0.05, attackStep: 1, releaseStep: 0.2 },
}

/**
 * What a widget consumer can pass to configure the gate:
 * - a boolean (`true` = standard, `false` = off)
 * - a named sensitivity preset (`'low' | 'standard' | 'high' | 'off'`)
 * - a partial config to fine-tune specific knobs (merged over `standard`)
 */
export type VoiceGateSetting = boolean | VoiceGateSensitivity | Partial<VoiceGateConfig>

/**
 * Resolves a consumer-provided gate setting into a full VoiceGateConfig.
 * Always returns a fresh object; defaults to the recommended `standard` preset.
 */
export function resolveVoiceGateConfig(setting?: VoiceGateSetting): VoiceGateConfig {
  if (setting === undefined || setting === true || setting === 'standard') {
    return { ...VOICE_GATE_PRESETS.standard }
  }
  if (setting === false || setting === 'off') {
    return { ...VOICE_GATE_PRESETS.off }
  }
  if (typeof setting === 'string') {
    return { ...(VOICE_GATE_PRESETS[setting] ?? VOICE_GATE_PRESETS.standard) }
  }
  // Partial object → fine-tune specific knobs on top of the recommended default
  return { ...VOICE_GATE_PRESETS.standard, ...setting }
}

/**
 * Pure downward-expander gain curve — the single source of truth replicated by
 * the AudioWorklet. Given the current frame RMS and the previously applied gain,
 * returns the next gain: fast attack, slow release, clamped to [floorGain, 1].
 *
 * @param rms - RMS of the current frame (Float32 scale 0–1)
 * @param prevGain - gain applied to the previous frame
 * @param config - gate tuning (defaults to VOICE_GATE_CONFIG)
 */
export function computeExpanderGain(
  rms: number,
  prevGain: number,
  config: VoiceGateConfig = VOICE_GATE_CONFIG
): number {
  const target = rms >= config.openThreshold ? 1 : config.floorGain
  if (target >= prevGain) {
    return Math.min(target, prevGain + config.attackStep)
  }
  return Math.max(target, prevGain - config.releaseStep)
}

/**
 * Builds the AudioWorklet processor source for the live voice path.
 *
 * Captures mic input as PCM 16-bit, computes per-frame RMS, applies the
 * downward-expander gain (smoothed per-sample to avoid clicks) and posts EVERY
 * frame — as `{ pcm, rms }` — to the main thread. The client-side VAD gate (see
 * VoiceCallOverlay) decides, per frame, what is forwarded to the voice provider,
 * using the RMS as the near-field energy signal.
 *
 * @param config - gate tuning (defaults to VOICE_GATE_CONFIG)
 * @param processorName - registered worklet name (default 'voice-pcm-processor')
 * @param chunkSize - samples per frame (default 1600 = 100 ms at 16 kHz)
 */
export function buildVoiceProcessorCode(
  config: VoiceGateConfig = VOICE_GATE_CONFIG,
  processorName = 'voice-pcm-processor',
  chunkSize = 1600
): string {
  return `
class VoicePCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(${chunkSize});
    this.bufferIndex = 0;
    this.gain = 1; // current applied gain — starts open
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (let i = 0; i < input.length; i++) {
      this.buffer[this.bufferIndex++] = input[i];
      if (this.bufferIndex >= ${chunkSize}) {
        // 1. Frame RMS — near-field speaker vs. background energy
        let sumSq = 0;
        for (let j = 0; j < ${chunkSize}; j++) sumSq += this.buffer[j] * this.buffer[j];
        const rms = Math.sqrt(sumSq / ${chunkSize});

        // 2. Downward-expander target + smoothed gain (fast attack, slow release)
        const target = rms >= ${config.openThreshold} ? 1 : ${config.floorGain};
        let nextGain;
        if (target >= this.gain) {
          nextGain = Math.min(target, this.gain + ${config.attackStep});
        } else {
          nextGain = Math.max(target, this.gain - ${config.releaseStep});
        }

        // 3. Apply gain with a per-sample ramp (click-free) → Int16 PCM
        const int16 = new Int16Array(${chunkSize});
        const gStep = (nextGain - this.gain) / ${chunkSize};
        let g = this.gain;
        for (let j = 0; j < ${chunkSize}; j++) {
          g += gStep;
          const s = Math.max(-1, Math.min(1, this.buffer[j] * g));
          int16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        this.gain = nextGain;

        // 4. ALWAYS post PCM + this frame's RMS. The client VAD gate decides
        //    per frame what actually reaches the provider.
        this.port.postMessage({ pcm: int16.buffer, rms: rms }, [int16.buffer]);

        this.buffer = new Float32Array(${chunkSize});
        this.bufferIndex = 0;
      }
    }
    return true;
  }
}
registerProcessor('${processorName}', VoicePCMProcessor);
`
}
