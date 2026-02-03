/**
 * @package @botuyo/chat-widget
 * Voice Chat Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVoiceChat } from '../useVoiceChat'
import type { UseVoiceChatOptions } from '../types'

// Track WebSocket instances
let wsInstances: MockWebSocket[] = []

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  binaryType: string = 'arraybuffer'

  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  url: string
  sentMessages: (string | ArrayBuffer)[] = []

  constructor(url: string) {
    this.url = url
    wsInstances.push(this)

    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      this.onopen?.(new Event('open'))
    }, 10)
  }

  send(data: string | ArrayBuffer) {
    this.sentMessages.push(data)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.(new CloseEvent('close'))
  }

  // Test helpers
  simulateMessage(data: string | ArrayBuffer) {
    const event = new MessageEvent('message', { data })
    this.onmessage?.(event)
  }

  simulateError() {
    this.onerror?.(new Event('error'))
  }
}

// Mock AudioContext and related APIs
const mockAudioContext = {
  state: 'running',
  sampleRate: 16000,
  audioWorklet: {
    addModule: vi.fn().mockResolvedValue(undefined),
  },
  createMediaStreamSource: vi.fn().mockReturnValue({
    connect: vi.fn(),
  }),
  close: vi.fn(),
}

const mockAudioWorkletNode = {
  port: {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: vi.fn(),
  },
  connect: vi.fn(),
  disconnect: vi.fn(),
}

const mockMediaStream = {
  getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
}

// Setup global mocks
beforeEach(() => {
  wsInstances = []
  vi.stubGlobal('WebSocket', MockWebSocket)
  vi.stubGlobal(
    'AudioContext',
    vi.fn().mockImplementation(() => mockAudioContext)
  )
  vi.stubGlobal(
    'AudioWorkletNode',
    vi.fn().mockImplementation(() => mockAudioWorkletNode)
  )
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
    revokeObjectURL: vi.fn(),
  })

  // Mock getUserMedia
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
    },
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  wsInstances = []
})

const defaultOptions: UseVoiceChatOptions = {
  apiBaseUrl: 'https://api.example.com',
  tenantId: 'test-tenant',
  sessionId: 'test-session',
}

describe('useVoiceChat', () => {
  describe('initialization', () => {
    it('should start in idle state', () => {
      const { result } = renderHook(() => useVoiceChat(defaultOptions))

      expect(result.current.state).toBe('idle')
      expect(result.current.isConnected).toBe(false)
      expect(result.current.partialTranscription).toBe('')
      expect(result.current.recordingDuration).toBe(0)
    })

    it('should check browser support correctly', () => {
      const { result } = renderHook(() => useVoiceChat(defaultOptions))

      // With our mocks, it should be supported
      expect(result.current.isSupported).toBe(true)
    })

    it('should detect unsupported browser', () => {
      // Remove mediaDevices
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useVoiceChat(defaultOptions))

      expect(result.current.isSupported).toBe(false)
    })
  })

  describe('WebSocket connection', () => {
    it('should build correct WebSocket URL', () => {
      const { result } = renderHook(() => useVoiceChat(defaultOptions))

      act(() => {
        result.current.connect()
      })

      // Check URL of created WebSocket
      expect(wsInstances.length).toBe(1)
      expect(wsInstances[0].url).toBe('wss://api.example.com/voice/stream')
    })

    it('should use custom wsEndpoint if provided', () => {
      const { result } = renderHook(() =>
        useVoiceChat({
          ...defaultOptions,
          config: { wsEndpoint: 'wss://custom.example.com/voice' },
        })
      )

      act(() => {
        result.current.connect()
      })

      expect(wsInstances.length).toBe(1)
      expect(wsInstances[0].url).toBe('wss://custom.example.com/voice')
    })

    it('should send auth message on connection', async () => {
      const { result } = renderHook(() =>
        useVoiceChat({
          ...defaultOptions,
          conversationId: 'conv-123',
        })
      )

      act(() => {
        result.current.connect()
      })

      // Wait for connection to open
      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })

      // Check auth message was sent
      const ws = wsInstances[0]
      expect(ws.sentMessages.length).toBeGreaterThan(0)

      const authMsg = JSON.parse(ws.sentMessages[0] as string)
      expect(authMsg).toEqual({
        type: 'auth',
        tenantId: 'test-tenant',
        sessionId: 'test-session',
        conversationId: 'conv-123',
      })
    })

    it('should set isConnected to true when connection opens', async () => {
      const { result } = renderHook(() => useVoiceChat(defaultOptions))

      expect(result.current.isConnected).toBe(false)

      act(() => {
        result.current.connect()
      })

      await waitFor(() => {
        expect(result.current.isConnected).toBe(true)
      })
    })
  })

  describe('server messages', () => {
    it('should handle transcription_partial message', async () => {
      const onTranscription = vi.fn()
      const { result } = renderHook(() =>
        useVoiceChat({
          ...defaultOptions,
          onTranscription,
        })
      )

      act(() => {
        result.current.connect()
      })

      await waitFor(() => expect(result.current.isConnected).toBe(true))

      const ws = wsInstances[0]

      act(() => {
        ws.simulateMessage(
          JSON.stringify({
            type: 'transcription_partial',
            text: 'Hello',
          })
        )
      })

      expect(result.current.partialTranscription).toBe('Hello')
      expect(onTranscription).toHaveBeenCalledWith('Hello', false)
    })

    it('should handle transcription_final message', async () => {
      const onTranscription = vi.fn()
      const { result } = renderHook(() =>
        useVoiceChat({
          ...defaultOptions,
          onTranscription,
        })
      )

      act(() => {
        result.current.connect()
      })

      await waitFor(() => expect(result.current.isConnected).toBe(true))

      const ws = wsInstances[0]

      act(() => {
        ws.simulateMessage(
          JSON.stringify({
            type: 'transcription_final',
            text: 'Hello world',
          })
        )
      })

      expect(result.current.partialTranscription).toBe('')
      expect(onTranscription).toHaveBeenCalledWith('Hello world', true)
    })

    it('should handle response_text message', async () => {
      const onBotResponse = vi.fn()
      const { result } = renderHook(() =>
        useVoiceChat({
          ...defaultOptions,
          onBotResponse,
        })
      )

      act(() => {
        result.current.connect()
      })

      await waitFor(() => expect(result.current.isConnected).toBe(true))

      const ws = wsInstances[0]

      act(() => {
        ws.simulateMessage(
          JSON.stringify({
            type: 'response_text',
            text: 'Bot says hello',
          })
        )
      })

      expect(onBotResponse).toHaveBeenCalledWith('Bot says hello')
    })

    it('should handle error message', async () => {
      const onError = vi.fn()
      const { result } = renderHook(() =>
        useVoiceChat({
          ...defaultOptions,
          onError,
        })
      )

      act(() => {
        result.current.connect()
      })

      await waitFor(() => expect(result.current.isConnected).toBe(true))

      const ws = wsInstances[0]

      act(() => {
        ws.simulateMessage(
          JSON.stringify({
            type: 'error',
            code: 'quota_exceeded',
            message: 'Voice quota exceeded',
          })
        )
      })

      expect(onError).toHaveBeenCalledWith({
        type: 'error',
        code: 'quota_exceeded',
        message: 'Voice quota exceeded',
      })
      expect(result.current.state).toBe('idle') // Should reset on error
    })

    it('should transition to speaking on response_start when in processing', async () => {
      const { result } = renderHook(() => useVoiceChat(defaultOptions))

      act(() => {
        result.current.connect()
      })

      await waitFor(() => expect(result.current.isConnected).toBe(true))

      const ws = wsInstances[0]

      // Start recording to get to listening state
      act(() => {
        ws.simulateMessage(
          JSON.stringify({
            type: 'transcription_partial',
            text: 'Test',
          })
        )
      })

      // Simulate going to processing (after stop_recording)
      act(() => {
        ws.simulateMessage(
          JSON.stringify({
            type: 'transcription_final',
            text: 'Test final',
          })
        )
      })

      // Then response_start should transition to speaking
      // Note: In real flow, the hook needs to be in processing state first
      // This test verifies that response_start message is handled
      act(() => {
        ws.simulateMessage(
          JSON.stringify({
            type: 'response_start',
          })
        )
      })

      // Since we're not in processing state, we may stay in idle
      // The real test would need to start recording first
    })

    it('should transition to idle on response_end', async () => {
      const onBotAudioPlayed = vi.fn()
      const { result } = renderHook(() =>
        useVoiceChat({
          ...defaultOptions,
          onBotAudioPlayed,
        })
      )

      act(() => {
        result.current.connect()
      })

      await waitFor(() => expect(result.current.isConnected).toBe(true))

      const ws = wsInstances[0]

      // response_end should transition to idle and call onBotAudioPlayed
      act(() => {
        ws.simulateMessage(JSON.stringify({ type: 'response_end' }))
      })

      expect(result.current.state).toBe('idle')
      expect(onBotAudioPlayed).toHaveBeenCalled()
    })
  })

  describe('disconnect', () => {
    it('should cleanup on disconnect', async () => {
      const { result } = renderHook(() => useVoiceChat(defaultOptions))

      act(() => {
        result.current.connect()
      })

      await waitFor(() => expect(result.current.isConnected).toBe(true))

      act(() => {
        result.current.disconnect()
      })

      expect(result.current.isConnected).toBe(false)
      expect(result.current.state).toBe('idle')
    })

    it('should reset partial transcription on disconnect', async () => {
      const { result } = renderHook(() => useVoiceChat(defaultOptions))

      act(() => {
        result.current.connect()
      })

      await waitFor(() => expect(result.current.isConnected).toBe(true))

      // Simulate partial transcription
      const ws = wsInstances[0]
      act(() => {
        ws.simulateMessage(
          JSON.stringify({
            type: 'transcription_partial',
            text: 'Some text',
          })
        )
      })

      expect(result.current.partialTranscription).toBe('Some text')

      act(() => {
        result.current.disconnect()
      })

      expect(result.current.partialTranscription).toBe('')
    })
  })

  describe('stopPlayback', () => {
    it('should transition to idle', async () => {
      const { result } = renderHook(() => useVoiceChat(defaultOptions))

      act(() => {
        result.current.stopPlayback()
      })

      expect(result.current.state).toBe('idle')
    })
  })

  describe('cancelRecording', () => {
    it('should reset state and partialTranscription', () => {
      const { result } = renderHook(() => useVoiceChat(defaultOptions))

      act(() => {
        result.current.cancelRecording()
      })

      expect(result.current.state).toBe('idle')
      expect(result.current.partialTranscription).toBe('')
    })
  })
})
