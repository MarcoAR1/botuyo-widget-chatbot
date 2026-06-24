/**
 * @package @botuyo/chat-widget
 * VoiceCallOverlay — "Próxima clase" (suggest_next_class) in-call card tests
 *
 * Ms. Ellis proposes the next class via a `suggest_next_class` custom_event. During a
 * fullscreen voice call the hero page card is hidden behind the overlay, so the overlay
 * must surface the proposal itself ("la agenda no aparece en pantalla" fix).
 */

import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { VoiceCallOverlay } from '@/chat-widget/components/VoiceCallOverlay'

// Minimal AudioContext stub — startCall pre-creates a playback context before listeners register.
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

const NEXT_CLASS_EVENT = {
  eventName: 'suggest_next_class',
  data: {
    scheduledAt: '2030-03-15T18:30:00.000Z',
    title: 'Tu clase de inglés con Ms. Ellis',
    body: 'Seguimos con Present Perfect',
  },
}

describe('VoiceCallOverlay — próxima clase (suggest_next_class)', () => {
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

  it('renders a "Próxima clase" card in-call when suggest_next_class arrives', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](NEXT_CLASS_EVENT)
    })

    expect(screen.getByText(/Próxima clase/i)).toBeInTheDocument()
    expect(screen.getByText(/Tu clase de inglés con Ms\. Ellis/)).toBeInTheDocument()
    expect(screen.getByText(/Present Perfect/)).toBeInTheDocument()
  })

  it('renders the card with only the date when title/body are omitted', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event']({
        eventName: 'suggest_next_class',
        data: { scheduledAt: '2030-03-15T18:30:00.000Z' },
      })
    })

    expect(screen.getByText(/Próxima clase/i)).toBeInTheDocument()
  })

  it('ignores a suggest_next_class event without a scheduledAt', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event']({ eventName: 'suggest_next_class', data: { title: 'no date' } })
    })

    expect(screen.queryByText(/Próxima clase/i)).not.toBeInTheDocument()
  })

  it('keeps the agent spoken transcript separate from the próxima clase card', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](NEXT_CLASS_EVENT)
    })
    act(() => {
      socket.handlers['voice_model_transcript']({ text: 'Te dejo agendada la próxima clase.' })
    })

    // The spoken line lives in its own bubble, not glued into the card.
    expect(screen.getByText(/Te dejo agendada/)).toBeInTheDocument()
    expect(screen.getByText(/Present Perfect/)).toBeInTheDocument()
  })
})
