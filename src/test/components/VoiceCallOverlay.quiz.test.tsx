/**
 * @package @botuyo/chat-widget
 * VoiceCallOverlay — interactive quiz rendering tests
 *
 * Verifies the quiz-in-voice flow:
 *  1. The canonical `quiz_question` custom_event renders the question + clickable buttons.
 *  2. Clicking an option emits `voice_text_input` (Answer: <label>) back to the agent.
 *  3. The legacy `voice_tool_visual` path for `present_quiz` early-returns (no double render).
 */

import { render, screen, fireEvent, act, within } from '@testing-library/react'
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

  it('renders each option as a clearly-styled button with a number badge', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](QUIZ_EVENT)
    })

    // Number badges (1, 2, 3) mirror the agent's spoken "Option 1, 2, 3" and make
    // the options read unmistakably as interactive buttons (not plain text).
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()

    // Each option label still lives inside a real, clickable <button>.
    expect(screen.getByText('went').closest('button')).not.toBeNull()
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

  // ─── Tool render vs AI transcript separation ───
  // The agent SPEAKS while a tool draws (the backend injects the tool's voiceInstruction
  // so the model reads it aloud). The spoken transcript must stay in its OWN bubble — it
  // must NOT get concatenated into the quiz/card bubble ("todo pegado todo junto").

  it('keeps the AI spoken transcript in a SEPARATE bubble from the quiz (not concatenated)', async () => {
    const socket = await renderOverlay()

    // 1) Tool draws the quiz first
    act(() => {
      socket.handlers['custom_event'](QUIZ_EVENT)
    })
    // 2) Then the AI speaks (model transcript streams in right after)
    act(() => {
      socket.handlers['voice_model_transcript']({ text: "Let's try a quick quiz!" })
    })

    // The quiz bubble must NOT absorb the spoken line.
    const quizNode = screen.getByText(/What is the past tense/)
    expect(quizNode).not.toHaveTextContent("Let's try a quick quiz")
    // ...and the spoken line renders on its own.
    expect(screen.getByText(/Let's try a quick quiz/)).toBeInTheDocument()
    // Options stay intact under the quiz.
    expect(screen.getByText('went')).toBeInTheDocument()
  })

  it('keeps the AI transcript separate from a tool content card', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['voice_tool_visual']({
        tool: 'show_content',
        items: [{ type: 'text', label: 'CARD_CONTENT_HERE' }],
      })
    })
    act(() => {
      socket.handlers['voice_model_transcript']({ text: 'Here is some info for you.' })
    })

    const cardNode = screen.getByText('CARD_CONTENT_HERE')
    expect(cardNode).not.toHaveTextContent('Here is some info')
    expect(screen.getByText(/Here is some info/)).toBeInTheDocument()
  })

  it('still merges consecutive AI transcript fragments into ONE bubble when no tool is involved', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['voice_model_transcript']({ text: 'Hello' })
    })
    act(() => {
      socket.handlers['voice_model_transcript']({ text: 'there!' })
    })

    // Streaming fragments of the same turn coalesce — regression guard for the fix above.
    expect(screen.getByText('Hello there!')).toBeInTheDocument()
  })

  // ─── Pinned quiz dock ───
  // The question + options must NOT scroll away with the transcript while the bot keeps
  // talking — they live in a dock pinned above the controls until the user answers.

  it('pins the quiz in a dock and keeps it visible while the bot keeps talking', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](QUIZ_EVENT)
    })
    // The bot keeps talking AFTER the quiz was shown.
    act(() => {
      socket.handlers['voice_model_transcript']({ text: 'Take your time to answer.' })
    })

    const dock = screen.getByTestId('voice-quiz-dock')
    expect(dock).toBeInTheDocument()
    expect(dock).toHaveTextContent(/What is the past tense/)
    expect(within(dock).getByText('went')).toBeInTheDocument()
    // The later spoken line lives in the transcript, NOT in the pinned dock.
    expect(dock).not.toHaveTextContent('Take your time')
    expect(screen.getByText(/Take your time/)).toBeInTheDocument()
  })

  it('emits voice_text_input and dismisses the dock when a docked option is clicked', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](QUIZ_EVENT)
    })
    socket.emit.mockClear()

    act(() => {
      fireEvent.click(within(screen.getByTestId('voice-quiz-dock')).getByText('went'))
    })

    expect(socket.emit).toHaveBeenCalledWith('voice_text_input', { text: 'Answer: went' })
    // Resolved → the dock is gone and the chosen answer shows as a user turn.
    expect(screen.queryByTestId('voice-quiz-dock')).not.toBeInTheDocument()
    expect(screen.getByText('went')).toBeInTheDocument()
    expect(screen.queryByText('goed')).not.toBeInTheDocument()
  })

  // ─── Give the student time to think ───
  // Previously the quiz was dismissed the instant ANY final user transcript arrived, so
  // thinking out loud / background noise made the question vanish before they could answer.
  // The quiz now stays pinned until the bot actually responds (or the user taps an option).

  it('keeps the pinned quiz visible after the user speaks (so they get time to think)', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](QUIZ_EVENT)
    })
    expect(screen.getByTestId('voice-quiz-dock')).toBeInTheDocument()

    // The student thinks out loud / starts answering — the dock must NOT vanish immediately.
    act(() => {
      socket.handlers['voice_user_transcript_final']({ text: 'hmm, let me think... maybe went' })
    })

    expect(screen.getByTestId('voice-quiz-dock')).toBeInTheDocument()
  })

  it('dismisses the pinned quiz once the bot responds after the student answered', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](QUIZ_EVENT)
    })
    act(() => {
      socket.handlers['voice_user_transcript_final']({ text: 'I think it is went' })
    })
    // Still pinned while waiting for Ms. Ellis to react.
    expect(screen.getByTestId('voice-quiz-dock')).toBeInTheDocument()

    // Ms. Ellis responds (new spoken turn) → the quiz turn is over → dock dismissed.
    act(() => {
      socket.handlers['voice_model_transcript']({ text: 'Correct! "went" is the past tense.' })
    })

    expect(screen.queryByTestId('voice-quiz-dock')).not.toBeInTheDocument()
  })

  it('does NOT dismiss the quiz while the bot is still reading the options (no answer yet)', async () => {
    const socket = await renderOverlay()

    act(() => {
      socket.handlers['custom_event'](QUIZ_EVENT)
    })
    // Bot narrates the options right after presenting (no user turn in between).
    act(() => {
      socket.handlers['voice_model_transcript']({ text: 'Option 1 goed, option 2 went, option 3 gone.' })
    })

    expect(screen.getByTestId('voice-quiz-dock')).toBeInTheDocument()
  })
})
