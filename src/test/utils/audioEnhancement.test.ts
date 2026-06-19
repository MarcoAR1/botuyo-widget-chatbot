import { describe, it, expect } from 'vitest'
import {
  ENHANCED_AUDIO_CONSTRAINTS,
  NOISE_GATE_THRESHOLD,
  NOISE_GATE_HOLD_FRAMES,
  ENHANCEMENT_CONFIG,
  createEnhancementChain,
  generateNoiseGateCode,
  VOICE_GATE_CONFIG,
  computeExpanderGain,
  buildVoiceProcessorCode,
  VOICE_GATE_PRESETS,
  resolveVoiceGateConfig,
} from '../../chat-widget/voice/audioEnhancement'

describe('audioEnhancement', () => {
  describe('ENHANCED_AUDIO_CONSTRAINTS', () => {
    it('should have required getUserMedia constraints', () => {
      expect(ENHANCED_AUDIO_CONSTRAINTS.sampleRate).toBe(16000)
      expect(ENHANCED_AUDIO_CONSTRAINTS.channelCount).toBe(1)
      expect(ENHANCED_AUDIO_CONSTRAINTS.echoCancellation).toBe(true)
      expect(ENHANCED_AUDIO_CONSTRAINTS.noiseSuppression).toBe(true)
      expect(ENHANCED_AUDIO_CONSTRAINTS.autoGainControl).toBe(true)
    })
  })

  describe('NOISE_GATE_THRESHOLD', () => {
    it('should be a positive number less than 1', () => {
      expect(NOISE_GATE_THRESHOLD).toBeGreaterThan(0)
      expect(NOISE_GATE_THRESHOLD).toBeLessThan(1)
    })

    it('should be tuned for near-field voice isolation (~0.012)', () => {
      expect(NOISE_GATE_THRESHOLD).toBe(0.012)
    })
  })

  describe('NOISE_GATE_HOLD_FRAMES', () => {
    it('should be a positive integer', () => {
      expect(NOISE_GATE_HOLD_FRAMES).toBeGreaterThan(0)
      expect(Number.isInteger(NOISE_GATE_HOLD_FRAMES)).toBe(true)
    })
  })

  describe('ENHANCEMENT_CONFIG', () => {
    it('should have highpass filter config for cutting low-freq noise', () => {
      expect(ENHANCEMENT_CONFIG.highpass.frequency).toBe(85)
      expect(ENHANCEMENT_CONFIG.highpass.q).toBe(0.7)
    })

    it('should have de-rumble filter for secondary low-freq attenuation', () => {
      expect(ENHANCEMENT_CONFIG.deRumble.frequency).toBe(200)
      expect(ENHANCEMENT_CONFIG.deRumble.q).toBe(0.5)
    })

    it('should have presence boost config for near-field emphasis', () => {
      expect(ENHANCEMENT_CONFIG.presenceBoost.frequency).toBe(3000)
      expect(ENHANCEMENT_CONFIG.presenceBoost.q).toBe(1.0)
      expect(ENHANCEMENT_CONFIG.presenceBoost.gain).toBe(6)
    })

    it('should have lowpass filter config for cutting high-freq noise', () => {
      expect(ENHANCEMENT_CONFIG.lowpass.frequency).toBe(7500)
      expect(ENHANCEMENT_CONFIG.lowpass.q).toBe(0.7)
    })

    it('should have aggressive compressor config for voice isolation', () => {
      expect(ENHANCEMENT_CONFIG.compressor.threshold).toBe(-20)
      expect(ENHANCEMENT_CONFIG.compressor.ratio).toBe(6)
      expect(ENHANCEMENT_CONFIG.compressor.attack).toBeLessThan(0.005) // Very fast attack
      expect(ENHANCEMENT_CONFIG.compressor.release).toBeGreaterThan(0.1) // Smooth release
    })
  })

  describe('createEnhancementChain', () => {
    it('should create a 5-node chain (2 highpass + peaking + lowpass + compressor)', () => {
      // Mock AudioContext and nodes
      const mockConnect = vi.fn().mockReturnThis()
      const mockFilter = { type: '', frequency: { value: 0 }, Q: { value: 0 }, gain: { value: 0 }, connect: mockConnect }
      const mockCompressor = {
        threshold: { value: 0 },
        knee: { value: 0 },
        ratio: { value: 0 },
        attack: { value: 0 },
        release: { value: 0 },
        connect: mockConnect
      }

      const mockCtx = {
        createBiquadFilter: vi.fn().mockReturnValue({ ...mockFilter }),
        createDynamicsCompressor: vi.fn().mockReturnValue({ ...mockCompressor })
      } as any

      const mockSource = { connect: mockConnect } as any

      const result = createEnhancementChain(mockCtx, mockSource)

      // Should create 4 filters (highpass + deRumble + presenceBoost + lowpass) + 1 compressor
      expect(mockCtx.createBiquadFilter).toHaveBeenCalledTimes(4)
      expect(mockCtx.createDynamicsCompressor).toHaveBeenCalledOnce()

      // Chain has 5 connections: source→hp, hp→deRumble, deRumble→presence, presence→lp, lp→compressor
      expect(mockSource.connect).toHaveBeenCalled()

      // Result should be the compressor (last node in chain)
      expect(result).toBeDefined()
    })
  })

  describe('generateNoiseGateCode', () => {
    it('should return constructor init and gate check code strings', () => {
      const { constructorInit, gateCheck } = generateNoiseGateCode()

      expect(constructorInit).toContain('holdCounter')
      expect(gateCheck).toContain('RMS')
      expect(gateCheck).toContain('sumSq')
      expect(gateCheck).toContain('holdCounter')
    })

    it('should embed custom threshold and holdFrames values', () => {
      const { gateCheck } = generateNoiseGateCode(0.05, 10)

      expect(gateCheck).toContain('0.05')
      expect(gateCheck).toContain('10')
    })

    it('should use default values when no args provided', () => {
      const { gateCheck } = generateNoiseGateCode()

      expect(gateCheck).toContain(String(NOISE_GATE_THRESHOLD))
      expect(gateCheck).toContain(String(NOISE_GATE_HOLD_FRAMES))
    })
  })

  describe('VOICE_GATE_CONFIG', () => {
    it('has a conservative open threshold below normal near-field speech', () => {
      expect(VOICE_GATE_CONFIG.openThreshold).toBeGreaterThan(0)
      expect(VOICE_GATE_CONFIG.openThreshold).toBeLessThan(0.02)
    })

    it('attenuates to a non-zero floor (keeps a continuous stream for server VAD)', () => {
      expect(VOICE_GATE_CONFIG.floorGain).toBeGreaterThan(0)
      expect(VOICE_GATE_CONFIG.floorGain).toBeLessThan(1)
    })

    it('opens instantly (attack) but releases gradually (hold)', () => {
      expect(VOICE_GATE_CONFIG.attackStep).toBeGreaterThanOrEqual(1)
      expect(VOICE_GATE_CONFIG.releaseStep).toBeGreaterThan(0)
      expect(VOICE_GATE_CONFIG.releaseStep).toBeLessThan(1)
    })
  })

  describe('computeExpanderGain', () => {
    const cfg = VOICE_GATE_CONFIG

    it('opens fully when RMS is above the threshold', () => {
      expect(computeExpanderGain(0.05, cfg.floorGain, cfg)).toBe(1)
    })

    it('never exceeds unity gain', () => {
      expect(computeExpanderGain(0.5, 1, cfg)).toBe(1)
    })

    it('releases gradually toward the floor when RMS is below threshold', () => {
      const g = computeExpanderGain(0.001, 1, cfg)
      expect(g).toBeLessThan(1)
      expect(g).toBeGreaterThanOrEqual(cfg.floorGain)
      // a single frame steps down by releaseStep only — not an instant cut
      expect(g).toBeCloseTo(1 - cfg.releaseStep, 5)
    })

    it('never drops below the floor gain', () => {
      expect(computeExpanderGain(0, cfg.floorGain, cfg)).toBe(cfg.floorGain)
    })

    it('takes multiple frames to fully close (hold behaviour prevents choppy speech)', () => {
      const afterOneFrame = computeExpanderGain(0, 1, cfg)
      expect(afterOneFrame).toBeGreaterThan(cfg.floorGain)
    })
  })

  describe('buildVoiceProcessorCode', () => {
    it('registers the voice-pcm-processor worklet', () => {
      expect(buildVoiceProcessorCode()).toContain("registerProcessor('voice-pcm-processor'")
    })

    it('embeds the gate config values', () => {
      const code = buildVoiceProcessorCode()
      expect(code).toContain(String(VOICE_GATE_CONFIG.openThreshold))
      expect(code).toContain(String(VOICE_GATE_CONFIG.floorGain))
    })

    it('always posts a chunk (continuous stream — never drops frames for server VAD)', () => {
      const code = buildVoiceProcessorCode()
      expect(code).toContain('postMessage')
      // must NOT use the chunk-dropping hold counter (would break server-side VAD)
      expect(code).not.toContain('holdCounter')
    })

    it('computes RMS and applies a smoothed per-sample gain ramp', () => {
      const code = buildVoiceProcessorCode()
      expect(code.toLowerCase()).toContain('rms')
      expect(code).toContain('gain')
    })

    it('accepts a custom config', () => {
      const code = buildVoiceProcessorCode({
        openThreshold: 0.05,
        floorGain: 0.3,
        attackStep: 1,
        releaseStep: 0.2,
      })
      expect(code).toContain('0.05')
      expect(code).toContain('0.3')
    })
  })

  describe('VOICE_GATE_PRESETS', () => {
    it('provides off / low / standard / high presets', () => {
      expect(VOICE_GATE_PRESETS.off).toBeDefined()
      expect(VOICE_GATE_PRESETS.low).toBeDefined()
      expect(VOICE_GATE_PRESETS.standard).toBeDefined()
      expect(VOICE_GATE_PRESETS.high).toBeDefined()
    })

    it('standard preset equals the recommended VOICE_GATE_CONFIG', () => {
      expect(VOICE_GATE_PRESETS.standard).toEqual(VOICE_GATE_CONFIG)
    })

    it('off preset disables the gate (full pass, no attenuation)', () => {
      expect(VOICE_GATE_PRESETS.off.openThreshold).toBe(0)
      expect(VOICE_GATE_PRESETS.off.floorGain).toBe(1)
    })

    it('high filters more background than standard; low filters less', () => {
      // higher threshold = gate opens only for louder/closer speech = more filtering
      expect(VOICE_GATE_PRESETS.high.openThreshold).toBeGreaterThan(VOICE_GATE_PRESETS.standard.openThreshold)
      expect(VOICE_GATE_PRESETS.low.openThreshold).toBeLessThan(VOICE_GATE_PRESETS.standard.openThreshold)
      // lower floor = stronger attenuation of below-threshold background
      expect(VOICE_GATE_PRESETS.high.floorGain).toBeLessThan(VOICE_GATE_PRESETS.standard.floorGain)
      expect(VOICE_GATE_PRESETS.low.floorGain).toBeGreaterThan(VOICE_GATE_PRESETS.standard.floorGain)
    })
  })

  describe('resolveVoiceGateConfig', () => {
    it('defaults to the standard preset when undefined', () => {
      expect(resolveVoiceGateConfig()).toEqual(VOICE_GATE_PRESETS.standard)
    })

    it('treats true as standard and false as off', () => {
      expect(resolveVoiceGateConfig(true)).toEqual(VOICE_GATE_PRESETS.standard)
      expect(resolveVoiceGateConfig(false)).toEqual(VOICE_GATE_PRESETS.off)
    })

    it('resolves named presets', () => {
      expect(resolveVoiceGateConfig('high')).toEqual(VOICE_GATE_PRESETS.high)
      expect(resolveVoiceGateConfig('low')).toEqual(VOICE_GATE_PRESETS.low)
      expect(resolveVoiceGateConfig('off')).toEqual(VOICE_GATE_PRESETS.off)
      expect(resolveVoiceGateConfig('standard')).toEqual(VOICE_GATE_PRESETS.standard)
    })

    it('merges a partial override on top of the standard preset', () => {
      const resolved = resolveVoiceGateConfig({ openThreshold: 0.03 })
      expect(resolved.openThreshold).toBe(0.03)
      expect(resolved.floorGain).toBe(VOICE_GATE_PRESETS.standard.floorGain)
    })

    it('returns a fresh copy (does not mutate the preset)', () => {
      const resolved = resolveVoiceGateConfig('standard')
      resolved.openThreshold = 999
      expect(VOICE_GATE_PRESETS.standard.openThreshold).not.toBe(999)
    })

    it('falls back to standard for an unknown string (untyped CDN consumers)', () => {
      // @ts-expect-error — runtime guard for values outside the typed union
      expect(resolveVoiceGateConfig('bogus')).toEqual(VOICE_GATE_PRESETS.standard)
    })
  })
})
