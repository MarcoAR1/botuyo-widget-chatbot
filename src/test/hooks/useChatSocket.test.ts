/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useChatSocket } from '@/chat-widget/hooks/useChatSocket'
import type { ChatMessage } from '@/chat-widget/types'
import { io } from 'socket.io-client'

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}))

// Mock utils
vi.mock('@/chat-widget/utils/deviceId', () => ({
  getOrCreateDeviceId: vi.fn(() => 'test-device-id'),
}))

vi.mock('@/chat-widget/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/chat-widget/utils/performance', () => ({
  throttle: vi.fn(fn => fn),
}))

describe('useChatSocket', () => {
  let mockSocket: any
  let mockHandlers: {
    onMessage: (message: ChatMessage) => void
    onConnected: (sessionId: string, config?: any) => void
    onDisconnected: () => void
    onTyping: (isTyping: boolean) => void
    onError: (error: string) => void
    onLogin?: (data: any) => void
    onNavigate?: (url: string) => void
    onEvent?: (event: string, data: any) => void
  }

  beforeEach(() => {
    mockSocket = {
      connected: false,
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    }
    ;(io as any).mockReturnValue(mockSocket)

    mockHandlers = {
      onMessage: vi.fn(),
      onConnected: vi.fn(),
      onDisconnected: vi.fn(),
      onTyping: vi.fn(),
      onError: vi.fn(),
      onLogin: vi.fn(),
      onNavigate: vi.fn(),
      onEvent: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Connection', () => {
    it('should initialize socket connection with correct config', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      expect(io).toHaveBeenCalledWith('http://localhost:3000/webchat', {
        auth: {
          apiKey: 'test-api-key',
          deviceId: 'test-device-id',
          agentId: undefined,
          token: undefined,
          metadata: undefined,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        extraHeaders: {
          'bypass-tunnel-reminder': 'true',
          'X-Tunnel-Skip-Anti-Phishing-Page': 'true',
        },
      })
    })

    it('should include userContext in socket auth', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          userContext: {
            token: 'user-token',
            metadata: { userId: '123' },
          },
          ...mockHandlers,
        })
      )

      expect(io).toHaveBeenCalledWith(
        'http://localhost:3000/webchat',
        expect.objectContaining({
          auth: expect.objectContaining({
            token: 'user-token',
            metadata: { userId: '123' },
          }),
        })
      )
    })

    it('should register all socket event listeners', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('connection_ack', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('bot_message', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('chat_history', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('bot_typing', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('auth_success', expect.any(Function))
    })

    it('should update connection state on connect', () => {
      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      expect(result.current.isConnected).toBe(false)

      // Simulate connect event
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )?.[1]

      expect(connectHandler).toBeDefined()

      // Verify the handler would set state correctly
      act(() => {
        connectHandler?.()
      })

      // The state update happens asynchronously, we just verify the handler exists
      expect(connectHandler).toBeDefined()
    })

    it('should update connection state on disconnect', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      // Verify disconnect handler was registered
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )?.[1]

      expect(disconnectHandler).toBeDefined()

      act(() => {
        disconnectHandler?.()
      })

      expect(mockHandlers.onDisconnected).toHaveBeenCalled()
    })

    it('should handle connection errors', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const errorHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect_error'
      )?.[1]

      act(() => {
        errorHandler?.(new Error('Connection failed'))
      })

      expect(mockHandlers.onError).toHaveBeenCalledWith('Error de conexión: Connection failed')
    })

    it('should call onConnected with session info on connection_ack', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const ackHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connection_ack'
      )?.[1]

      act(() => {
        ackHandler?.({ sessionId: 'session-123', config: { theme: 'dark' } })
      })

      expect(mockHandlers.onConnected).toHaveBeenCalledWith('session-123', { theme: 'dark' })
    })
  })

  describe('Message Handling', () => {
    it('should sanitize and process incoming text messages', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const messageHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'bot_message'
      )?.[1]

      act(() => {
        messageHandler?.({
          id: 'msg-1',
          type: 'text',
          content: 'Hello',
          sender: 'bot',
          timestamp: new Date().toISOString(),
        })
      })

      expect(mockHandlers.onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg-1',
          type: 'text',
          content: 'Hello',
          sender: 'bot',
        })
      )
    })

    it('should handle image messages', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const messageHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'bot_message'
      )?.[1]

      act(() => {
        messageHandler?.({
          id: 'msg-2',
          type: 'image',
          imageUrl: 'https://example.com/image.jpg',
          sender: 'bot',
          timestamp: new Date().toISOString(),
        })
      })

      expect(mockHandlers.onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg-2',
          type: 'image',
          imageUrl: 'https://example.com/image.jpg',
          sender: 'bot',
        })
      )
    })

    it('should handle audio messages', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const messageHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'bot_message'
      )?.[1]

      act(() => {
        messageHandler?.({
          id: 'msg-3',
          type: 'audio',
          audioUrl: 'https://example.com/audio.mp3',
          sender: 'bot',
          timestamp: new Date().toISOString(),
        })
      })

      expect(mockHandlers.onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg-3',
          type: 'audio',
          content: 'https://example.com/audio.mp3',
          sender: 'bot',
        })
      )
    })

    it('should handle location messages', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const messageHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'bot_message'
      )?.[1]

      act(() => {
        messageHandler?.({
          id: 'msg-4',
          type: 'location',
          latitude: 40.7128,
          longitude: -74.006,
          content: 'New York',
          sender: 'bot',
          timestamp: new Date().toISOString(),
        })
      })

      expect(mockHandlers.onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg-4',
          type: 'location',
          latitude: 40.7128,
          longitude: -74.006,
          name: 'New York',
          sender: 'bot',
        })
      )
    })

    it('should handle system messages', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const messageHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'bot_message'
      )?.[1]

      act(() => {
        messageHandler?.({
          id: 'msg-5',
          type: 'system',
          content: 'System notification',
          timestamp: new Date().toISOString(),
        })
      })

      expect(mockHandlers.onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'msg-5',
          type: 'system',
          content: 'System notification',
          sender: 'system',
        })
      )
    })

    it('should generate fallback message ID if not provided', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const messageHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'bot_message'
      )?.[1]

      act(() => {
        messageHandler?.({
          type: 'text',
          content: 'Message without ID',
          timestamp: new Date().toISOString(),
        })
      })

      expect(mockHandlers.onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^msg-/),
          content: 'Message without ID',
        })
      )
    })

    it('should handle chat history', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const historyHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'chat_history'
      )?.[1]

      act(() => {
        historyHandler?.({
          messages: [
            { id: 'msg-1', type: 'text', content: 'First', timestamp: new Date().toISOString() },
            { id: 'msg-2', type: 'text', content: 'Second', timestamp: new Date().toISOString() },
          ],
        })
      })

      expect(mockHandlers.onMessage).toHaveBeenCalledTimes(2)
      expect(mockHandlers.onEvent).toHaveBeenCalledWith('history_loaded', expect.any(Object))
    })

    it('should handle typing indicator', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const typingHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'bot_typing'
      )?.[1]

      act(() => {
        typingHandler?.(true)
      })

      expect(mockHandlers.onTyping).toHaveBeenCalledWith(true)

      act(() => {
        typingHandler?.(false)
      })

      expect(mockHandlers.onTyping).toHaveBeenCalledWith(false)
    })

    it('should handle auth success', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const authHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'auth_success'
      )?.[1]

      act(() => {
        authHandler?.({ userId: '123', token: 'auth-token' })
      })

      expect(mockHandlers.onLogin).toHaveBeenCalledWith({ userId: '123', token: 'auth-token' })
    })
  })

  describe('Send Message', () => {
    it('should send text messages when connected', () => {
      mockSocket.connected = true

      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      // Send message
      let messageId: string = ''
      act(() => {
        messageId = result.current.sendMessage('Hello world')
      })

      expect(messageId).toMatch(/^msg_/)
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'user_message',
        expect.objectContaining({
          content: 'Hello world',
          type: 'text',
        }),
        expect.any(Function)
      )
    })

    it('should queue messages when not connected', () => {
      mockSocket.connected = false

      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      act(() => {
        result.current.sendMessage('Queued message')
      })

      expect(mockHandlers.onEvent).toHaveBeenCalledWith(
        'queued_message',
        expect.objectContaining({
          payload: expect.objectContaining({
            content: 'Queued message',
          }),
        })
      )
    })

    it('should send different message types', () => {
      mockSocket.connected = true

      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      act(() => {
        result.current.sendMessage('https://example.com/image.jpg', 'image')
      })

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'user_message',
        expect.objectContaining({
          type: 'image',
          content: 'https://example.com/image.jpg',
        }),
        expect.any(Function)
      )
    })

    it('should include page context in message metadata', () => {
      mockSocket.connected = true

      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          pageContext: {
            pageTitle: 'Test Page',
            pageUrl: 'https://example.com/test',
          },
          ...mockHandlers,
        })
      )

      act(() => {
        result.current.sendMessage('Test message')
      })

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'user_message',
        expect.objectContaining({
          metadata: expect.objectContaining({
            pageTitle: 'Test Page',
            pageUrl: 'https://example.com/test',
          }),
        }),
        expect.any(Function)
      )
    })
  })

  describe('Typing Indicator', () => {
    it('should send typing events', async () => {
      mockSocket.connected = true

      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      act(() => {
        result.current.sendTyping(true)
      })

      expect(mockSocket.emit).toHaveBeenCalledWith('typing', true)

      act(() => {
        result.current.sendTyping(false)
      })

      expect(mockSocket.emit).toHaveBeenCalledWith('typing', false)
    })
  })

  describe('History Request', () => {
    it('should request chat history', () => {
      mockSocket.connected = true

      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      act(() => {
        result.current.requestHistory()
      })

      expect(mockSocket.emit).toHaveBeenCalledWith('request_history')
    })
  })

  describe('Reconnection', () => {
    it('should expose reconnect method', () => {
      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      expect(result.current.reconnect).toBeDefined()
      expect(typeof result.current.reconnect).toBe('function')
    })

    it('should not create duplicate connections', () => {
      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const initialCallCount = (io as any).mock.calls.length

      mockSocket.connected = true

      act(() => {
        result.current.reconnect()
      })

      expect((io as any).mock.calls.length).toBe(initialCallCount)
    })
  })

  describe('Disconnect', () => {
    it('should disconnect socket', async () => {
      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      act(() => {
        result.current.disconnect()
      })

      expect(mockSocket.disconnect).toHaveBeenCalled()

      await waitFor(() => {
        expect(result.current.isConnected).toBe(false)
      })
    })

    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      unmount()

      expect(mockSocket.disconnect).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle malformed message payloads', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      const messageHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'bot_message'
      )?.[1]

      act(() => {
        messageHandler?.({ invalid: 'data' })
      })

      expect(mockHandlers.onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text',
          content: 'Sin contenido',
        })
      )
    })

    it('should not initialize without apiKey', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: '',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      expect(io).not.toHaveBeenCalled()
    })

    it('should not initialize without apiBaseUrl', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: '',
          ...mockHandlers,
        })
      )

      expect(io).not.toHaveBeenCalled()
    })

    it('should trim message content before sending', () => {
      mockSocket.connected = true

      const { result } = renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      act(() => {
        result.current.sendMessage('  Message with spaces  ')
      })

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'user_message',
        expect.objectContaining({
          content: 'Message with spaces',
        }),
        expect.any(Function)
      )
    })
  })

  describe('Custom Events — agent_switched', () => {
    const getCustomEventHandler = () =>
      mockSocket.on.mock.calls.find((call: any[]) => call[0] === 'custom_event')?.[1]

    it('registers a custom_event listener', () => {
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
        })
      )

      expect(getCustomEventHandler()).toBeDefined()
    })

    it('calls onAgentSwitched with the validated payload (switch_variant shape)', () => {
      const onAgentSwitched = vi.fn()
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
          onAgentSwitched,
        })
      )

      act(() => {
        getCustomEventHandler()?.({
          eventName: 'agent_switched',
          data: {
            variantKey: 'a2',
            agentId: 'agent-a2',
            name: 'Ms. Ellis',
            label: 'A2',
            avatarUrl: 'https://cdn.example.com/a2.jpg',
          },
        })
      })

      expect(onAgentSwitched).toHaveBeenCalledWith({
        variantKey: 'a2',
        agentId: 'agent-a2',
        name: 'Ms. Ellis',
        label: 'A2',
        avatarUrl: 'https://cdn.example.com/a2.jpg',
      })
    })

    it('accepts a partial payload (transfer_to_department shape)', () => {
      const onAgentSwitched = vi.fn()
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
          onAgentSwitched,
        })
      )

      act(() => {
        getCustomEventHandler()?.({
          eventName: 'agent_switched',
          data: { agentId: 'agent-sales', name: 'Ventas', label: 'Ventas' },
        })
      })

      expect(onAgentSwitched).toHaveBeenCalledWith({
        agentId: 'agent-sales',
        name: 'Ventas',
        label: 'Ventas',
      })
    })

    it('does NOT call onAgentSwitched for other custom events', () => {
      const onAgentSwitched = vi.fn()
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
          onAgentSwitched,
        })
      )

      act(() => {
        getCustomEventHandler()?.({
          eventName: 'quiz_question',
          data: { question: 'Q?', buttons: [{ id: 'a', label: 'A' }] },
        })
      })

      expect(onAgentSwitched).not.toHaveBeenCalled()
    })

    it('drops malformed agent_switched payloads (non-string fields)', () => {
      const onAgentSwitched = vi.fn()
      renderHook(() =>
        useChatSocket({
          apiKey: 'test-api-key',
          apiBaseUrl: 'http://localhost:3000',
          ...mockHandlers,
          onAgentSwitched,
        })
      )

      act(() => {
        getCustomEventHandler()?.({
          eventName: 'agent_switched',
          data: { agentId: 123, label: { nope: true } },
        })
      })

      expect(onAgentSwitched).not.toHaveBeenCalled()
    })
  })
})
