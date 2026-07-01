/**
 * @package @botuyo/chat-widget
 * VoiceCallOverlay — voice_start emit payload
 *
 * Regression for the WID-P2-2 cleanup: when a call starts and mic capture
 * succeeds, the widget emits `voice_start` WITHOUT the dead `language` field.
 * The backend dropped the threaded language param (BE-P2-4) — live-voice
 * language is prompt-driven — so sending `language` was dead weight. `voice`
 * is still sent as a fallback for agents without a configured voice.
 */

import { render, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { VoiceCallOverlay } from '@/chat-widget/components/VoiceCallOverlay'

// The lazily-loaded Silero detector hits the network; stub it so mic capture
// succeeds deterministically (the call already works on the energy gate).
vi.mock('@/chat-widget/voice/speechDetector', () => ({
  createSpeechDetector: vi.fn().mockResolvedValue(null),
}))

// A generic Web Audio node covering every param the enhancement chain touches.
function makeNode() {
  return {
    connect: vi.fn((n?: unknown) => n),
    disconnect: vi.fn(),
    type: '',
    fftSize: 0,
    frequencyBinCount: 128,
    getByteFrequencyData: vi.fn(),
    frequency: { value: 0 },
    Q: { value: 0 },
    gain: { value: 0 },
    threshold: { value: 0 },
    knee: { value: 0 },
    ratio: { value: 0 },
    attack: { value: 0 },
    release: { value: 0 },
  }
}

// Full AudioContext stub — covers both the playback context (startCall) and the
// mic context (startMicCapture → createEnhancementChain + analyser + worklet).
class AudioContextStub {
  state = 'running'
  currentTime = 0
  sampleRate = 16000
  destination = {}
  audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) }
  resume = vi.fn().mockResolvedValue(undefined)
  close = vi.fn().mockResolvedValue(undefined)
  createGain = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn(), gain: { value: 1 } }))
  createMediaStreamSource = vi.fn(() => makeNode())
  createBiquadFilter = vi.fn(() => makeNode())
  createDynamicsCompressor = vi.fn(() => makeNode())
  createAnalyser = vi.fn(() => makeNode())
  constructor(_opts?: unknown) {}
}

class AudioWorkletNodeStub {
  port = { onmessage: null as unknown, postMessage: vi.fn() }
  connect = vi.fn()
  disconnect = vi.fn()
  constructor(_ctx?: unknown, _name?: string) {}
}

type Handler = (...args: unknown[]) => void

function createMockSocket() {
  const handlers: Record<string, Handler> = {}
  return {
    connected: true,
    on: vi.fn((event: string, cb: Handler) => {
      handlers[event] = cb
    }),
    off: vi.fn(),
    emit: vi.fn(),
    handlers,
  }
}

describe('VoiceCallOverlay — voice_start payload', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', AudioContextStub)
    vi.stubGlobal('AudioWorkletNode', AudioWorkletNodeStub)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 0))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    if (!('createObjectURL' in URL)) {
      // happy-dom provides URL; ensure createObjectURL exists
      ;(URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(() => 'blob:mock')
    } else {
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    }
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('emits voice_start with a voice fallback and NO language field', async () => {
    const socket = createMockSocket()
    render(<VoiceCallOverlay isOpen onClose={vi.fn()} getSocket={() => socket} />)

    await waitFor(() => {
      expect(socket.emit).toHaveBeenCalledWith('voice_start', expect.anything())
    })

    const startCall = socket.emit.mock.calls.find(c => c[0] === 'voice_start')
    expect(startCall).toBeDefined()
    const payload = startCall![1] as Record<string, unknown>
    expect(payload).not.toHaveProperty('language')
    expect(payload).toEqual({ voice: 'Kore' })
  })
})
