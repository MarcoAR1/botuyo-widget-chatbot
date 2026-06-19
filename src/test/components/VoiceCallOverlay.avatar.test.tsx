/**
 * @package @botuyo/chat-widget
 * VoiceCallOverlay — active-agent avatar identity (voice_ready + voice_agent_switched)
 *
 * Hardening: the call overlay must show the ACTIVE agent's avatar on every call start and
 * after a live transfer — independent of the connect-time props (connection_ack), which go
 * stale after a mid-session switch + re-call without a page reload. The backend now sends the
 * active agent's avatar in `voice_ready` / `voice_agent_switched`; the overlay applies it,
 * overriding the (possibly stale) connect-time `logoUrl` / `avatars` props. Works for ANY
 * agent family.
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

describe('VoiceCallOverlay — active-agent avatar identity', () => {
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

  it('applies the active agent avatar from voice_ready (resume identity)', async () => {
    const socket = createMockSocket()
    render(<VoiceCallOverlay isOpen onClose={vi.fn()} getSocket={() => socket} />)
    await act(async () => {
      await Promise.resolve()
    })

    act(() => {
      socket.handlers['voice_ready']({
        agentName: 'Ms. Ellis B1',
        agentAvatar: { avatars: null, logoUrl: 'https://cdn/b1.png', avatar3dUrl: null },
      })
    })

    const img = screen.getByAltText('Bot avatar') as HTMLImageElement
    expect(img.src).toContain('https://cdn/b1.png')
  })

  it('prefers the server agentAvatar over a stale connect-time prop (mid-session switch + re-call)', async () => {
    const socket = createMockSocket()
    // Stale prop = entry agent (Nivelador) logo from the original connection_ack.
    render(
      <VoiceCallOverlay
        isOpen
        onClose={vi.fn()}
        getSocket={() => socket}
        logoUrl="https://cdn/nivelador.png"
      />
    )
    await act(async () => {
      await Promise.resolve()
    })

    act(() => {
      socket.handlers['voice_ready']({
        agentAvatar: { avatars: null, logoUrl: 'https://cdn/b1.png', avatar3dUrl: null },
      })
    })

    const img = screen.getByAltText('Bot avatar') as HTMLImageElement
    expect(img.src).toContain('https://cdn/b1.png')
    expect(img.src).not.toContain('nivelador')
  })

  it('updates the avatar on a live voice_agent_switched', async () => {
    const socket = createMockSocket()
    render(
      <VoiceCallOverlay
        isOpen
        onClose={vi.fn()}
        getSocket={() => socket}
        logoUrl="https://cdn/a2.png"
      />
    )
    await act(async () => {
      await Promise.resolve()
    })

    act(() => {
      socket.handlers['voice_agent_switched']({
        agentId: 'agent-b1',
        agentName: 'Ms. Ellis B1',
        agentAvatar: { avatars: null, logoUrl: 'https://cdn/b1.png', avatar3dUrl: null },
      })
    })

    const img = screen.getByAltText('Bot avatar') as HTMLImageElement
    expect(img.src).toContain('https://cdn/b1.png')
  })

  it('keeps the connect-time avatar when voice_ready carries no agentAvatar', async () => {
    const socket = createMockSocket()
    render(
      <VoiceCallOverlay
        isOpen
        onClose={vi.fn()}
        getSocket={() => socket}
        logoUrl="https://cdn/entry.png"
      />
    )
    await act(async () => {
      await Promise.resolve()
    })

    act(() => {
      socket.handlers['voice_ready']({})
    })

    const img = screen.getByAltText('Bot avatar') as HTMLImageElement
    expect(img.src).toContain('https://cdn/entry.png')
  })
})
