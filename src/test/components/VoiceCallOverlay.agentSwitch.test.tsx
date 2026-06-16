/**
 * @package @botuyo/chat-widget
 * VoiceCallOverlay — live agent switch (transfer_to_department in voice)
 *
 * Verifies the in-call agent-switch flow:
 *  1. A `voice_agent_switched` socket listener is registered when the call starts.
 *  2. The event shows the new agent name (header pill) + a transcript continuity cue.
 *  3. Without an agentName, a generic cue is shown.
 *  4. The listener is removed on cleanup.
 */

import { render, screen, act } from '@testing-library/react'
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

async function renderOverlay() {
  const socket = createMockSocket()
  render(<VoiceCallOverlay isOpen onClose={vi.fn()} getSocket={() => socket} />)
  await act(async () => {
    await Promise.resolve()
  })
  return socket
}

describe('VoiceCallOverlay — live agent switch', () => {
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

  it('registers a voice_agent_switched listener when the call starts', async () => {
    const socket = await renderOverlay()
    expect(socket.on).toHaveBeenCalledWith('voice_agent_switched', expect.any(Function))
    expect(typeof socket.handlers['voice_agent_switched']).toBe('function')
  })

  it('shows the new agent name and a transcript cue on voice_agent_switched', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['voice_agent_switched']({ agentId: 'agent-b1', agentName: 'Ms. Ellis B1', voice: 'Aoede' })
    })

    // Header pill + transcript continuity cue both reference the new agent name.
    expect(screen.getAllByText(/Ms\. Ellis B1/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Continuás con Ms\. Ellis B1/)).toBeInTheDocument()
  })

  it('shows a generic cue when no agentName is provided', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['voice_agent_switched']({ agentId: 'agent-b1' })
    })

    expect(screen.getByText(/Te derivé con el área correspondiente/)).toBeInTheDocument()
  })

  it('removes the voice_agent_switched listener on unmount', async () => {
    const socket = createMockSocket()
    const { unmount } = render(<VoiceCallOverlay isOpen onClose={vi.fn()} getSocket={() => socket} />)
    await act(async () => {
      await Promise.resolve()
    })

    act(() => {
      unmount()
    })

    // The unmount-cleanup effect calls removeSocketListeners(), detaching every listener.
    expect(socket.off).toHaveBeenCalledWith('voice_agent_switched', expect.any(Function))
  })
})
