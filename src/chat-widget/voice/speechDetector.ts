/**
 * @package @botuyo/chat-widget
 * Speech Detector — provider-agnostic Silero VAD wrapper.
 *
 * Thin adapter over `@ricky0123/vad-web` (Silero VAD running on ONNX Runtime
 * Web). It is loaded **lazily at call time** from a pinned CDN so it adds ZERO
 * weight to the widget bundle and requires NO configuration from the embedding
 * site ("completely transparent"). If anything fails to load — offline, a strict
 * Content-Security-Policy, an unsupported browser — {@link createSpeechDetector}
 * resolves to `null` and the caller transparently falls back to the energy-only
 * gate. The end user never sees a broken call.
 *
 * This module is intentionally THIN and side-effectful: the speech-vs-noise
 * POLICY lives in the pure, unit-tested {@link ./vadGate}. Here we only:
 *   1. lazy-load the model,
 *   2. forward each analysed frame as `{ speechProb, rms }`,
 *   3. optionally share the caller's already-captured MediaStream so the VAD
 *      analyses exactly the audio we stream (consistent barge-in, AEC-aware).
 */

import { logger } from '../utils/logger'

/** A single analysed frame: Silero probability + near-field energy. */
export interface SpeechFrame {
  speechProb: number
  rms: number
}

/** Silero per-frame output (subset of `@ricky0123/vad-web`). */
export interface SpeechProbabilities {
  isSpeech: number
  notSpeech: number
}

/** Minimal subset of the `MicVAD` instance we depend on. */
export interface MicVadInstance {
  start: () => void | Promise<void>
  pause: () => void | Promise<void>
  destroy: () => void | Promise<void>
}

export interface MicVadStatic {
  new: (opts: Record<string, unknown>) => Promise<MicVadInstance>
}

/** Minimal subset of the `@ricky0123/vad-web` module we depend on. */
export interface VadModule {
  MicVAD: MicVadStatic
}

export interface ISpeechDetector {
  /** Begin analysing the microphone. */
  start: () => Promise<void>
  /** Stop and release the model + audio nodes. Never throws. */
  destroy: () => void
  /** Whether the detector is currently analysing. */
  readonly running: boolean
}

export interface SpeechDetectorOptions {
  /** Called for every analysed frame. */
  onFrame: (frame: SpeechFrame) => void
  /** Share an already-captured stream so the VAD sees exactly what we send. */
  stream?: MediaStream
  /** Reuse an AudioContext (optional). */
  audioContext?: AudioContext
  /** Override where the worklet + `.onnx` model load from (CSP / self-host). */
  assetBaseUrl?: string
  /** Override where the ONNX Runtime `.wasm`/`.mjs` files load from. */
  onnxWasmBaseUrl?: string
  /** Silero model variant. Defaults to the newer `v5`. */
  model?: 'v5' | 'legacy'
  /** Injectable module loader — defaults to a pinned CDN import (used by tests). */
  loadVad?: () => Promise<VadModule>
}

// Pinned versions — bump deliberately, never float, so behavior is reproducible.
export const VAD_WEB_VERSION = '0.0.30'
export const ORT_WEB_VERSION = '1.22.0'

export const DEFAULT_VAD_ASSET_BASE = `https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@${VAD_WEB_VERSION}/dist/`
export const DEFAULT_ORT_WASM_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_WEB_VERSION}/dist/`

const VAD_ESM_URL = `https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@${VAD_WEB_VERSION}/+esm`

/** Root-mean-square amplitude of a frame on the 0–1 Float scale. */
export function computeRms(frame: Float32Array): number {
  if (frame.length === 0) return 0
  let sumSq = 0
  for (let i = 0; i < frame.length; i++) sumSq += frame[i] * frame[i]
  return Math.sqrt(sumSq / frame.length)
}

/** Default loader: a runtime ESM import from the pinned CDN (kept out of the bundle). */
async function defaultLoadVad(): Promise<VadModule> {
  const mod = await import(/* @vite-ignore */ VAD_ESM_URL)
  return mod as VadModule
}

function buildMicVadOptions(
  opts: SpeechDetectorOptions,
  onFrameProcessed: (probabilities: SpeechProbabilities, frame: Float32Array) => void
): Record<string, unknown> {
  const micOptions: Record<string, unknown> = {
    model: opts.model ?? 'v5',
    baseAssetPath: opts.assetBaseUrl ?? DEFAULT_VAD_ASSET_BASE,
    onnxWASMBasePath: opts.onnxWasmBaseUrl ?? DEFAULT_ORT_WASM_BASE,
    // We own the speech start/end policy in VadGate, so the model must not
    // auto-start; we only consume the per-frame probabilities.
    startOnLoad: false,
    onFrameProcessed,
  }

  if (opts.audioContext) {
    micOptions.audioContext = opts.audioContext
  }

  // Share the caller's stream and neutralize pause/resume so MicVAD never tears
  // down the capture stream we rely on for the actual upstream audio.
  if (opts.stream) {
    const shared = opts.stream
    micOptions.getStream = async () => shared
    micOptions.pauseStream = async () => {}
    micOptions.resumeStream = async () => {}
  }

  return micOptions
}

class SileroSpeechDetector implements ISpeechDetector {
  private _running = false

  constructor(private readonly instance: MicVadInstance) {}

  get running(): boolean {
    return this._running
  }

  async start(): Promise<void> {
    await this.instance.start()
    this._running = true
  }

  destroy(): void {
    try {
      void this.instance.destroy()
    } catch (err) {
      logger.warn('[VAD] error while destroying detector', err)
    }
    this._running = false
  }
}

/**
 * Creates a Silero-backed speech detector, or `null` if the model cannot be
 * loaded/initialised (caller should fall back to the energy-only gate).
 */
export async function createSpeechDetector(
  opts: SpeechDetectorOptions
): Promise<ISpeechDetector | null> {
  const load = opts.loadVad ?? defaultLoadVad

  try {
    const mod = await load()
    const onFrameProcessed = (probabilities: SpeechProbabilities, frame: Float32Array): void => {
      opts.onFrame({ speechProb: probabilities?.isSpeech ?? 0, rms: computeRms(frame) })
    }
    const instance = await mod.MicVAD.new(buildMicVadOptions(opts, onFrameProcessed))
    logger.info('[VAD] Silero speech detector ready')
    return new SileroSpeechDetector(instance)
  } catch (err) {
    logger.warn('[VAD] Silero unavailable — falling back to energy gate', err)
    return null
  }
}
