/**
 * @package @botuyo/chat-widget
 * VoiceCallOverlay — interactive quiz rendering tests
 *
 * Verifies the quiz-in-voice flow:
 *  1. The canonical `quiz_question` custom_event renders the question + clickable buttons.
 *  2. Clicking an option emits `voice_text_input` (Answer: <label>) back to the agent.
 *  3. The legacy `voice_tool_visual` path for `present_quiz` early-returns (no double render).
 */

import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { VoiceCallOverlay } from '@/chat-widget/components/VoiceCallOverlay'

// Minimal AudioContext stub — startCall pre-creates a playback context (and calls
// resume()) before registering socket listeners. happy-dom has no AudioContext.
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

/** Render the overlay (open) and flush the startCall effect so socket listeners register. */
async function renderOverlay() {
  const socket = createMockSocket()
  render(<VoiceCallOverlay isOpen onClose={vi.fn()} getSocket={() => socket} />)
  // Flush the async startCall path (mic capture rejects in test → caught gracefully).
  await act(async () => {
    await Promise.resolve()
  })
  return socket
}

const QUIZ_EVENT = {
  eventName: 'quiz_question',
  data: {
    question: "What is the past tense of 'go'?",
    buttons: [
      { id: 'a', label: 'goed' },
      { id: 'b', label: 'went' },
      { id: 'c', label: 'gone' },
    ],
  },
}

describe('VoiceCallOverlay — interactive quiz', () => {
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

  it('registers a custom_event listener when the call starts', async () => {
    const socket = await renderOverlay()
    expect(socket.on).toHaveBeenCalledWith('custom_event', expect.any(Function))
    expect(typeof socket.handlers['custom_event']).toBe('function')
  })

  it('renders the question and clickable option buttons from quiz_question', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](QUIZ_EVENT)
    })

    expect(screen.getByText(/What is the past tense/)).toBeInTheDocument()
    expect(screen.getByText('goed')).toBeInTheDocument()
    expect(screen.getByText('went')).toBeInTheDocument()
    expect(screen.getByText('gone')).toBeInTheDocument()
  })

  it('emits voice_text_input with the chosen answer when an option is clicked', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](QUIZ_EVENT)
    })
    socket.emit.mockClear() // ignore any emits from call setup

    fireEvent.click(screen.getByText('went'))

    expect(socket.emit).toHaveBeenCalledWith('voice_text_input', { text: 'Answer: went' })
  })

  it('removes the buttons and shows the answer as a user turn after clicking', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](QUIZ_EVENT)
    })
    act(() => {
      fireEvent.click(screen.getByText('went'))
    })

    // The two unchosen options are gone (buttons removed); the chosen label remains as the user message.
    expect(screen.queryByText('goed')).not.toBeInTheDocument()
    expect(screen.queryByText('gone')).not.toBeInTheDocument()
    expect(screen.getByText('went')).toBeInTheDocument()
  })

  it('ignores a quiz_question event without buttons', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event']({ eventName: 'quiz_question', data: { question: 'No options?', buttons: [] } })
    })

    expect(screen.queryByText(/No options/)).not.toBeInTheDocument()
  })

  it('does NOT render a visual card for present_quiz (voice_tool_visual early-returns)', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['voice_tool_visual']({
        tool: 'present_quiz',
        items: [{ type: 'card', content: 'LEGACY_MARKDOWN_SHOULD_NOT_RENDER' }],
      })
    })

    expect(screen.queryByText('LEGACY_MARKDOWN_SHOULD_NOT_RENDER')).not.toBeInTheDocument()
  })
})
