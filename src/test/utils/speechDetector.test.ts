/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  computeRms,
  createSpeechDetector,
  DEFAULT_VAD_ASSET_BASE,
  DEFAULT_ORT_WASM_BASE,
  type VadModule,
  type SpeechFrame,
} from '../../chat-widget/voice/speechDetector'

/** Builds a fake @ricky0123/vad-web module whose MicVAD.new records its options. */
function makeFakeVad() {
  const instance = {
    start: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn().mockResolvedValue(undefined),
  }
  const newMock = vi.fn(async (_opts: Record<string, unknown>) => instance)
  const module: VadModule = { MicVAD: { new: newMock } }
  return { module, instance, newMock, loadVad: async () => module }
}

describe('speechDetector', () => {
  // The detector logs via the centralized logger (console.* in dev). Keep test
  // output clean — several cases intentionally trigger the warn path.
  let infoSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    infoSpy.mockRestore()
    warnSpy.mockRestore()
  })

  describe('computeRms', () => {
    it('returns 0 for an empty frame', () => {
      expect(computeRms(new Float32Array([]))).toBe(0)
    })

    it('returns 0 for pure silence', () => {
      expect(computeRms(new Float32Array([0, 0, 0, 0]))).toBe(0)
    })

    it('computes the root-mean-square of the samples', () => {
      // sqrt(mean(0.25*4)) = sqrt(0.25) = 0.5
      expect(computeRms(new Float32Array([0.5, -0.5, 0.5, -0.5]))).toBeCloseTo(0.5, 6)
    })
  })

  describe('createSpeechDetector — success path', () => {
    it('returns a detector that is not running until start() is called', async () => {
      const { loadVad, instance } = makeFakeVad()
      const detector = await createSpeechDetector({ onFrame: vi.fn(), loadVad })
      expect(detector).not.toBeNull()
      expect(detector!.running).toBe(false)
      await detector!.start()
      expect(instance.start).toHaveBeenCalledOnce()
      expect(detector!.running).toBe(true)
    })

    it('configures MicVAD with the pinned CDN asset paths and the v5 model by default', async () => {
      const { loadVad, newMock } = makeFakeVad()
      await createSpeechDetector({ onFrame: vi.fn(), loadVad })
      const opts = newMock.mock.calls[0][0]
      expect(opts.baseAssetPath).toBe(DEFAULT_VAD_ASSET_BASE)
      expect(opts.onnxWASMBasePath).toBe(DEFAULT_ORT_WASM_BASE)
      expect(opts.model).toBe('v5')
      // We own start/stop policy via VadGate, so MicVAD must not auto-start.
      expect(opts.startOnLoad).toBe(false)
    })

    it('allows overriding the asset base URLs (CSP / self-host escape hatch)', async () => {
      const { loadVad, newMock } = makeFakeVad()
      await createSpeechDetector({
        onFrame: vi.fn(),
        loadVad,
        assetBaseUrl: 'https://cdn.acme.test/vad/',
        onnxWasmBaseUrl: 'https://cdn.acme.test/ort/',
      })
      const opts = newMock.mock.calls[0][0]
      expect(opts.baseAssetPath).toBe('https://cdn.acme.test/vad/')
      expect(opts.onnxWASMBasePath).toBe('https://cdn.acme.test/ort/')
    })

    it('translates each MicVAD frame into a SpeechFrame (probability + near-field RMS)', async () => {
      const { loadVad, newMock } = makeFakeVad()
      const frames: SpeechFrame[] = []
      await createSpeechDetector({ onFrame: f => frames.push(f), loadVad })
      const onFrameProcessed = newMock.mock.calls[0][0].onFrameProcessed as (
        p: { isSpeech: number; notSpeech: number },
        frame: Float32Array
      ) => void

      onFrameProcessed({ isSpeech: 0.91, notSpeech: 0.09 }, new Float32Array([0.5, -0.5, 0.5, -0.5]))

      expect(frames).toHaveLength(1)
      expect(frames[0].speechProb).toBeCloseTo(0.91, 6)
      expect(frames[0].rms).toBeCloseTo(0.5, 6)
    })

    it('shares an existing MediaStream and neutralizes pause/resume so it is not torn down', async () => {
      const { loadVad, newMock } = makeFakeVad()
      const fakeStream = { id: 'shared' } as unknown as MediaStream
      await createSpeechDetector({ onFrame: vi.fn(), loadVad, stream: fakeStream })
      const opts = newMock.mock.calls[0][0] as Record<string, any>
      expect(typeof opts.getStream).toBe('function')
      await expect(opts.getStream()).resolves.toBe(fakeStream)
      // pause/resume must be no-ops so the shared capture stream survives
      expect(typeof opts.pauseStream).toBe('function')
      expect(typeof opts.resumeStream).toBe('function')
      await expect(opts.pauseStream(fakeStream)).resolves.toBeUndefined()
    })
  })

  describe('createSpeechDetector — graceful fallback', () => {
    it('returns null when the module fails to load (offline / CSP)', async () => {
      const detector = await createSpeechDetector({
        onFrame: vi.fn(),
        loadVad: async () => {
          throw new Error('network blocked')
        },
      })
      expect(detector).toBeNull()
    })

    it('returns null when MicVAD.new rejects', async () => {
      const failingModule: VadModule = {
        MicVAD: { new: vi.fn().mockRejectedValue(new Error('worklet unsupported')) },
      }
      const detector = await createSpeechDetector({
        onFrame: vi.fn(),
        loadVad: async () => failingModule,
      })
      expect(detector).toBeNull()
    })
  })

  describe('destroy', () => {
    it('tears down the MicVAD instance and reports not running', async () => {
      const { loadVad, instance } = makeFakeVad()
      const detector = await createSpeechDetector({ onFrame: vi.fn(), loadVad })
      await detector!.start()
      detector!.destroy()
      expect(instance.destroy).toHaveBeenCalledOnce()
      expect(detector!.running).toBe(false)
    })

    it('does not throw if the instance destroy() throws', async () => {
      const { loadVad, instance } = makeFakeVad()
      instance.destroy.mockImplementation(() => {
        throw new Error('already gone')
      })
      const detector = await createSpeechDetector({ onFrame: vi.fn(), loadVad })
      expect(() => detector!.destroy()).not.toThrow()
      expect(detector!.running).toBe(false)
    })
  })
})
