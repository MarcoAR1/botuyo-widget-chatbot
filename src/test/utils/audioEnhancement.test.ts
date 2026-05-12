import { describe, it, expect } from 'vitest'
import {
  ENHANCED_AUDIO_CONSTRAINTS,
  NOISE_GATE_THRESHOLD,
  NOISE_GATE_HOLD_FRAMES,
  ENHANCEMENT_CONFIG,
  createEnhancementChain,
  generateNoiseGateCode,
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
})
