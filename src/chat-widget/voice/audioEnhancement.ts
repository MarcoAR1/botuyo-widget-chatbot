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
