/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChatState } from '../../chat-widget/hooks/useChatState'
import type { ChatMessage } from '../../chat-widget/types'

// Mock del storage
vi.mock('../../chat-widget/utils/storage', () => ({
  chatStorage: {
    getMessages: vi.fn(() => Promise.resolve([])),
    getMetadata: vi.fn(() => Promise.resolve(null)),
    saveMessages: vi.fn(() => Promise.resolve()),
    setMetadata: vi.fn(() => Promise.resolve()),
    migrateFromLocalStorage: vi.fn(() => Promise.resolve()),
  },
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
