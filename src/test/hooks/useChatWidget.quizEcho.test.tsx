import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { LanguageProvider } from '@/chat-widget/i18n/LanguageContext'
import type { ButtonsMessage } from '@/chat-widget/types'

/**
 * Regression: tapping a present_options button must ECHO the chosen option as a user bubble
 * in the transcript (in sync with the bot's reply), not silently send it. Previously the text
 * path only highlighted the quiz + sent `Answer: <label>` with no user message → the selection
 * looked "desfasada" (out of sync) with the conversation.
 */

const sendMessage = vi.fn()

vi.mock('@/chat-widget/hooks/useChatSocket', () => ({
  useChatSocket: () => ({
    isConnected: true,
    sendMessage,
    getSocket: () => null,
    confirmProposal: vi.fn(),
    rejectProposal: vi.fn(),
  }),
}))
vi.mock('@/chat-widget/hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    trackOpen: vi.fn(),
    trackClose: vi.fn(),
    trackMessageSent: vi.fn(),
    trackMessageReceived: vi.fn(),
    trackError: vi.fn(),
    trackConnectionStatus: vi.fn(),
  }),
}))
vi.mock('@/chat-widget/hooks/useNotifications', () => ({
  useNotifications: () => ({ notifyWithSound: vi.fn() }),
}))
vi.mock('@/chat-widget/hooks/useRateLimit', () => ({
  useRateLimit: () => ({ isAllowed: () => true, getTimeUntilReset: () => 0 }),
}))
vi.mock('@/chat-widget/hooks/useSEOMetadata', () => ({
  useSEOMetadata: () => undefined,
}))

// eslint-disable-next-line import/first
import { useChatWidget } from '@/chat-widget/hooks/useChatWidget'

const wrapper = ({ children }: { children: ReactNode }) => (
  <LanguageProvider defaultLocale="es">{children}</LanguageProvider>
)

const quiz: ButtonsMessage = {
  id: 'quiz-1',
  type: 'buttons',
  sender: 'bot',
  timestamp: new Date(),
  content: '¿Cuál es tu sexo biológico?',
  buttons: [
    { id: 'a', label: 'Masculino' },
    { id: 'b', label: 'Femenino' },
  ],
}

describe('useChatWidget — quiz answer echoes the chosen option as a user bubble', () => {
  beforeEach(() => vi.clearAllMocks())

  it('adds a user message with the chosen label AND sends it to the backend', () => {
    const { result } = renderHook(() => useChatWidget({ apiKey: 'k', apiBaseUrl: 'http://x' }), { wrapper })

    act(() => {
      result.current.handleQuizAnswer(quiz, 'Masculino', 'a')
    })

    const userMsgs = result.current.state.messages.filter(m => m.sender === 'user')
    expect(userMsgs.some(m => m.content === 'Masculino')).toBe(true)
    expect(sendMessage).toHaveBeenCalledWith('Answer: Masculino', 'text')
  })
})
