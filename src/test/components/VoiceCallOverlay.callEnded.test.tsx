/**
 * @package @botuyo/chat-widget
 * VoiceCallOverlay — server-ended call (onCallEnded)
 *
 * Verifies the voice-first end-of-call bridge:
 *  1. A `voice_call_ended` socket listener is registered when the call starts.
 *  2. The backend reason (e.g. 'interview_completed') is forwarded to onCallEnded,
 *     so a voice-first host (the recruiting interview room) can show its
 *     completion screen.
 */

import { render, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { VoiceCallOverlay } from '@/chat-widget/components/VoiceCallOverlay'

// Minimal AudioContext stub — startCall pre-creates a playback context before
// registering socket listeners. happy-dom has no AudioContext.
class AudioContextStub {
  state = 'running'
  resume = vi.fn().mockResolvedValue(undefined)
  close = vi.fn().mockResolvedValue(undefined)
  createGain = vi.fn(() => ({ connect: vi.fn(), gain: { value: 1 } }))
  createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }))
  destination = {}
  audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) }
  constructor(_opts?: unknown) {}
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

async function renderOverlay(onCallEnded: (reason?: string) => void) {
  const socket = createMockSocket()
  render(<VoiceCallOverlay isOpen onClose={vi.fn()} onCallEnded={onCallEnded} getSocket={() => socket} />)
  // Flush the async startCall path (mic capture rejects in test → caught gracefully),
  // which registers the socket listeners.
  await act(async () => {
    await Promise.resolve()
  })
  return socket
}

describe('VoiceCallOverlay — server-ended call (onCallEnded)', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', AudioContextStub)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('no mic in test')) },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('registers a voice_call_ended listener when the call starts', async () => {
    const socket = await renderOverlay(vi.fn())
    expect(socket.on).toHaveBeenCalledWith('voice_call_ended', expect.any(Function))
    expect(typeof socket.handlers['voice_call_ended']).toBe('function')
  })

  it('forwards the backend reason to onCallEnded when the server ends the call', async () => {
    const onCallEnded = vi.fn()
    const socket = await renderOverlay(onCallEnded)

    act(() => {
      socket.handlers['voice_call_ended']({ reason: 'interview_completed' })
    })

    expect(onCallEnded).toHaveBeenCalledWith('interview_completed')
  })

  it('still forwards (with undefined reason) when the server sends no reason', async () => {
    const onCallEnded = vi.fn()
    const socket = await renderOverlay(onCallEnded)

    act(() => {
      socket.handlers['voice_call_ended']({})
    })

    expect(onCallEnded).toHaveBeenCalledWith(undefined)
  })

  it('requests fresh server history after the call ends (server-authoritative reload, no local dump)', async () => {
    const socket = await renderOverlay(vi.fn())
    vi.useFakeTimers()
    try {
      act(() => {
        socket.handlers['voice_call_ended']({ reason: 'done' })
      })
      // The history pull is delayed so the backend can persist the final turn first.
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(socket.emit).toHaveBeenCalledWith('request_history')
    } finally {
      vi.useRealTimers()
    }
  })
})
