/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChatState } from '../../chat-widget/hooks/useChatState'
import type { ChatMessage } from '../../chat-widget/types'

// Mock del storage
vi.mock('../../chat-widget/utils/storage', () => ({
  getChatStorage: vi.fn(() => ({
    getMessages: vi.fn(() => Promise.resolve([])),
    getMetadata: vi.fn(() => Promise.resolve(null)),
    saveMessages: vi.fn(() => Promise.resolve()),
    setMetadata: vi.fn(() => Promise.resolve()),
    migrateFromLocalStorage: vi.fn(() => Promise.resolve()),
  })),
}))

// Mock del logger
vi.mock('../../chat-widget/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useChatState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useChatState())

      expect(result.current.state.isOpen).toBe(false)
      expect(result.current.state.isConnected).toBe(false)
      expect(result.current.state.isTyping).toBe(false)
      expect(result.current.state.messages).toEqual([])
      expect(result.current.state.error).toBeNull()
      expect(result.current.state.sessionId).toBeNull()
    })

    it('should set isHydrated to true after mounting', async () => {
      const { result } = renderHook(() => useChatState())

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true)
      })
    })
  })

  describe('Window Actions', () => {
    it('should toggle window state', () => {
      const { result } = renderHook(() => useChatState())

      expect(result.current.state.isOpen).toBe(false)

      act(() => {
        result.current.actions.toggleWindow()
      })

      expect(result.current.state.isOpen).toBe(true)

      act(() => {
        result.current.actions.toggleWindow()
      })

      expect(result.current.state.isOpen).toBe(false)
    })

    it('should open window', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.openWindow()
      })

      expect(result.current.state.isOpen).toBe(true)
    })

    it('should close window', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.openWindow()
      })

      expect(result.current.state.isOpen).toBe(true)

      act(() => {
        result.current.actions.closeWindow()
      })

      expect(result.current.state.isOpen).toBe(false)
    })
  })

  describe('Connection State', () => {
    it('should set connected state to true', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.setConnected(true)
      })

      expect(result.current.state.isConnected).toBe(true)
    })

    it('should set connected state to false', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.setConnected(false)
      })

      expect(result.current.state.isConnected).toBe(false)
    })
  })

  describe('Typing State', () => {
    it('should set typing state to true', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.setTyping(true)
      })

      expect(result.current.state.isTyping).toBe(true)
    })

    it('should set typing state to false', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.setTyping(false)
      })

      expect(result.current.state.isTyping).toBe(false)
    })
  })

  describe('Message Management', () => {
    it('should add a message', () => {
      const { result } = renderHook(() => useChatState())

      const message: ChatMessage = {
        id: 'msg-1',
        type: 'text',
        content: 'Hello',
        sender: 'user',
        timestamp: new Date(),
      }

      act(() => {
        result.current.actions.addMessage(message)
      })

      expect(result.current.state.messages).toHaveLength(1)
      expect(result.current.state.messages[0]).toEqual(message)
    })

    it('should add multiple messages', () => {
      const { result } = renderHook(() => useChatState())

      const message1: ChatMessage = {
        id: 'msg-1',
        type: 'text',
        content: 'Hello',
        sender: 'user',
        timestamp: new Date(),
      }

      const message2: ChatMessage = {
        id: 'msg-2',
        type: 'text',
        content: 'Hi there',
        sender: 'bot',
        timestamp: new Date(),
      }

      act(() => {
        result.current.actions.addMessage(message1)
        result.current.actions.addMessage(message2)
      })

      expect(result.current.state.messages).toHaveLength(2)
      expect(result.current.state.messages[0]).toEqual(message1)
      expect(result.current.state.messages[1]).toEqual(message2)
    })

    it('should not add duplicate messages with same ID', () => {
      const { result } = renderHook(() => useChatState())

      const message: ChatMessage = {
        id: 'msg-1',
        type: 'text',
        content: 'Hello',
        sender: 'user',
        timestamp: new Date(),
      }

      act(() => {
        result.current.actions.addMessage(message)
        result.current.actions.addMessage(message) // Same ID
      })

      expect(result.current.state.messages).toHaveLength(1)
    })

    it('should turn off typing when bot message is added', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.setTyping(true)
      })

      expect(result.current.state.isTyping).toBe(true)

      const botMessage: ChatMessage = {
        id: 'msg-1',
        type: 'text',
        content: 'Hi',
        sender: 'bot',
        timestamp: new Date(),
      }

      act(() => {
        result.current.actions.addMessage(botMessage)
      })

      expect(result.current.state.isTyping).toBe(false)
    })

    it('should keep typing state when user message is added', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.setTyping(true)
      })

      const userMessage: ChatMessage = {
        id: 'msg-1',
        type: 'text',
        content: 'Hello',
        sender: 'user',
        timestamp: new Date(),
      }

      act(() => {
        result.current.actions.addMessage(userMessage)
      })

      expect(result.current.state.isTyping).toBe(true)
    })

    it('should set messages array', () => {
      const { result } = renderHook(() => useChatState())

      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          type: 'text',
          content: 'Hello',
          sender: 'user',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          type: 'text',
          content: 'Hi',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]

      act(() => {
        result.current.actions.setMessages(messages)
      })

      expect(result.current.state.messages).toEqual(messages)
    })

    it('should drop duplicate-id messages when setting the array (server transcript with repeated ids)', () => {
      const { result } = renderHook(() => useChatState())

      const messages: ChatMessage[] = [
        { id: 'x', type: 'text', content: 'A', sender: 'bot', timestamp: new Date() },
        { id: 'x', type: 'text', content: 'A', sender: 'bot', timestamp: new Date() },
        { id: 'y', type: 'text', content: 'B', sender: 'user', timestamp: new Date() },
      ]

      act(() => {
        result.current.actions.setMessages(messages)
      })

      expect(result.current.state.messages).toHaveLength(2)
      expect(result.current.state.messages.map(m => m.id)).toEqual(['x', 'y'])
    })

    it('orders messages by timestamp regardless of insertion/id order', () => {
      const { result } = renderHook(() => useChatState())
      const older: ChatMessage = {
        id: 'srv-2',
        type: 'text',
        content: 'first',
        sender: 'user',
        timestamp: new Date('2024-01-01T10:00:00Z'),
      }
      const newer: ChatMessage = {
        id: 'srv-1',
        type: 'text',
        content: 'second',
        sender: 'bot',
        timestamp: new Date('2024-01-01T10:05:00Z'),
      }
      act(() => {
        result.current.actions.addMessage(newer) // inserted first, but chronologically later
        result.current.actions.addMessage(older)
      })
      expect(result.current.state.messages.map(m => (m as { content: string }).content)).toEqual([
        'first',
        'second',
      ])
    })

    it('collapses an optimistic message against its server echo (same content, different ids)', () => {
      const { result } = renderHook(() => useChatState())
      const t = new Date()
      act(() => {
        result.current.actions.addMessage({ id: 'msg-abc', type: 'text', content: 'hola', sender: 'user', timestamp: t })
        result.current.actions.addMessage({
          id: 'srv-99',
          type: 'text',
          content: 'hola',
          sender: 'user',
          timestamp: new Date(t.getTime() + 1200),
        })
      })
      expect(result.current.state.messages).toHaveLength(1)
      expect(result.current.state.messages[0].id).toBe('srv-99') // the real server id wins
    })

    it('keeps two genuinely repeated messages (both real ids)', () => {
      const { result } = renderHook(() => useChatState())
      const t = new Date()
      act(() => {
        result.current.actions.addMessage({ id: 'srv-1', type: 'text', content: 'sí', sender: 'user', timestamp: t })
        result.current.actions.addMessage({
          id: 'srv-2',
          type: 'text',
          content: 'sí',
          sender: 'user',
          timestamp: new Date(t.getTime() + 500),
        })
      })
      expect(result.current.state.messages).toHaveLength(2)
    })

    it('should clear messages', () => {
      const { result } = renderHook(() => useChatState())

      const message: ChatMessage = {
        id: 'msg-1',
        type: 'text',
        content: 'Hello',
        sender: 'user',
        timestamp: new Date(),
      }

      act(() => {
        result.current.actions.addMessage(message)
      })

      expect(result.current.state.messages).toHaveLength(1)

      act(() => {
        result.current.actions.clearMessages()
      })

      expect(result.current.state.messages).toHaveLength(0)
    })
  })

  describe('mergeHistory (server reconcile on reconnect)', () => {
    it('replaces the optimistic local turn with the server transcript — no pile-up', () => {
      const { result } = renderHook(() => useChatState())
      act(() => {
        result.current.actions.addMessage({
          id: 'temp-1',
          type: 'text',
          content: 'hola',
          sender: 'user',
          timestamp: new Date('2024-01-01T10:00:00Z'),
        })
      })
      // chat_history re-pushed on reconnect: same turn with its REAL id + the bot reply.
      act(() => {
        result.current.actions.mergeHistory([
          { id: 'srv-1', type: 'text', content: 'hola', sender: 'user', timestamp: new Date('2024-01-01T10:00:00Z') },
          { id: 'srv-2', type: 'text', content: 'buenas!', sender: 'bot', timestamp: new Date('2024-01-01T10:00:05Z') },
        ])
      })
      const msgs = result.current.state.messages
      expect(msgs).toHaveLength(2) // "hola" is NOT duplicated
      expect(msgs.map(m => m.id)).toEqual(['srv-1', 'srv-2'])
    })

    it('keeps a genuinely in-flight local message newer than the server transcript', () => {
      const { result } = renderHook(() => useChatState())
      act(() => {
        result.current.actions.mergeHistory([
          { id: 'srv-1', type: 'text', content: 'hola', sender: 'user', timestamp: new Date('2024-01-01T10:00:00Z') },
        ])
      })
      act(() => {
        result.current.actions.addMessage({
          id: 'temp-2',
          type: 'text',
          content: '¿seguís ahí?',
          sender: 'user',
          timestamp: new Date('2024-01-01T10:05:00Z'),
        })
      })
      // A second reconnect re-pushes only the server transcript (temp-2 not persisted yet).
      act(() => {
        result.current.actions.mergeHistory([
          { id: 'srv-1', type: 'text', content: 'hola', sender: 'user', timestamp: new Date('2024-01-01T10:00:00Z') },
        ])
      })
      const contents = result.current.state.messages.map(m => (m as { content: string }).content)
      expect(contents).toEqual(['hola', '¿seguís ahí?']) // in-flight message survives
    })
  })

  describe('Quiz', () => {
    const makeQuiz = (id: string): ChatMessage => ({
      id,
      type: 'buttons',
      sender: 'bot',
      timestamp: new Date(),
      content: 'Pick one',
      buttons: [
        { id: 'a', label: 'Option A' },
        { id: 'b', label: 'Option B' },
      ],
    })

    it('marks a quiz answered and records the selected button id', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.addMessage(makeQuiz('q1'))
      })
      act(() => {
        result.current.actions.answerQuiz('q1', 'b')
      })

      const m = result.current.state.messages[0] as ChatMessage & {
        answered?: boolean
        selectedId?: string
      }
      expect(m.answered).toBe(true)
      expect(m.selectedId).toBe('b')
    })

    it('marks a quiz answered without a selection (dismiss) when no button id is given', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.addMessage(makeQuiz('q1'))
      })
      act(() => {
        result.current.actions.answerQuiz('q1')
      })

      const m = result.current.state.messages[0] as ChatMessage & {
        answered?: boolean
        selectedId?: string
      }
      expect(m.answered).toBe(true)
      expect(m.selectedId).toBeUndefined()
    })

    it('leaves other messages untouched', () => {
      const { result } = renderHook(() => useChatState())
      const other: ChatMessage = {
        id: 'm1',
        type: 'text',
        sender: 'bot',
        timestamp: new Date(),
        content: 'hi',
      }

      act(() => {
        result.current.actions.addMessage(other)
        result.current.actions.addMessage(makeQuiz('q1'))
      })
      act(() => {
        result.current.actions.answerQuiz('q1', 'a')
      })

      expect(result.current.state.messages[0]).toEqual(other)
    })
  })

  describe('Error Handling', () => {
    it('should set error message', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.setError('Connection failed')
      })

      expect(result.current.state.error).toBe('Connection failed')
    })

    it('should clear error message', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.setError('Connection failed')
      })

      expect(result.current.state.error).toBe('Connection failed')

      act(() => {
        result.current.actions.setError(null)
      })

      expect(result.current.state.error).toBeNull()
    })
  })

  describe('Session Management', () => {
    it('should set session ID', () => {
      const { result } = renderHook(() => useChatState())

      act(() => {
        result.current.actions.setSessionId('session-123')
      })

      expect(result.current.state.sessionId).toBe('session-123')
    })

    it('should clear chat and reset to initial state', () => {
      const { result } = renderHook(() => useChatState())

      const message: ChatMessage = {
        id: 'msg-1',
        type: 'text',
        content: 'Hello',
        sender: 'user',
        timestamp: new Date(),
      }

      act(() => {
        result.current.actions.openWindow()
        result.current.actions.setConnected(true)
        result.current.actions.setTyping(true)
        result.current.actions.addMessage(message)
        result.current.actions.setSessionId('session-123')
        result.current.actions.setError('Some error')
      })

      const wasOpen = result.current.state.isOpen

      act(() => {
        result.current.actions.clearChat()
      })

      expect(result.current.state.messages).toHaveLength(0)
      expect(result.current.state.isConnected).toBe(false)
      expect(result.current.state.isTyping).toBe(false)
      expect(result.current.state.error).toBeNull()
      expect(result.current.state.sessionId).toBeNull()
      expect(result.current.state.isOpen).toBe(wasOpen) // Preserves isOpen state
    })
  })

  describe('Actions Stability', () => {
    it('should maintain stable individual action references', () => {
      const { result, rerender } = renderHook(() => useChatState())

      const initialAddMessage = result.current.actions.addMessage
      const initialToggleWindow = result.current.actions.toggleWindow

      rerender()

      expect(result.current.actions.addMessage).toBe(initialAddMessage)
      expect(result.current.actions.toggleWindow).toBe(initialToggleWindow)
    })
  })
})
