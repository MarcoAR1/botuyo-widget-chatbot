/**
 * @package @botuyo/chat-widget
 * useLiveCall Hook Tests
 *
 * Tests for the real-time live call functionality.
 * Uses jsdom instead of happy-dom because React's scheduler uses setImmediate
 * which happy-dom processes synchronously, causing re-entrance errors.
 *
 * @vitest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useLiveCall } from '../useLiveCall'

// Store WebSocket instances for testing
let wsInstances: MockWebSocket[] = []

// Mock WebSocket
class MockWebSocket {
  url: string
  readyState: number = 0 // CONNECTING
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  sentMessages: (string | ArrayBuffer)[] = []
  isClosed = false

  constructor(url: string) {
    this.url = url
    wsInstances.push(this)
  }

  send(data: string | ArrayBuffer) {
    if (!this.isClosed && this.readyState === 1) {
      this.sentMessages.push(data)
    }
  }

  close() {
    if (!this.isClosed) {
      this.isClosed = true
      this.readyState = 3 // CLOSED
      this.onclose?.(new CloseEvent('close', { code: 1000 }))
    }
  }

  // Test helper to simulate connection
  simulateOpen() {
    this.readyState = 1 // OPEN
    this.onopen?.(new Event('open'))
  }

  // Test helper to simulate incoming message
  simulateMessage(data: string) {
    this.onmessage?.({ data } as MessageEvent)
  }
}

// Mock constants
const MOCK_STREAM = {
  getTracks: () => [{ stop: vi.fn() }],
}

// Helper: wait for microtask queue to flush (replaces vi.advanceTimersByTimeAsync)
const tick = (ms = 0) => new Promise<void>(r => setTimeout(r, ms))

describe('useLiveCall', () => {
  const defaultOptions = {
    apiBaseUrl: 'https://api.example.com',
    tenantId: 'tenant_123',
    sessionId: 'session_456',
  }

  beforeEach(() => {
    wsInstances = []

    // Mock WebSocket
    vi.stubGlobal('WebSocket', MockWebSocket)

    // Mock navigator.mediaDevices
    vi.stubGlobal('navigator', {
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(MOCK_STREAM),
      },
    })

    // Mock AudioContext (includes Web Audio nodes for createEnhancementChain)
    const mockConnectableNode = () => ({
      connect: vi.fn().mockReturnThis(),
      type: '',
      frequency: { value: 0 },
      Q: { value: 0 },
      threshold: { value: 0 },
      knee: { value: 0 },
      ratio: { value: 0 },
      attack: { value: 0 },
      release: { value: 0 },
    })
    vi.stubGlobal(
      'AudioContext',
      class MockAudioContext {
        sampleRate = 16000
        audioWorklet = { addModule: vi.fn().mockResolvedValue(undefined) }
        createMediaStreamSource = vi.fn().mockReturnValue({ connect: vi.fn() })
        createBiquadFilter = vi.fn().mockReturnValue(mockConnectableNode())
        createDynamicsCompressor = vi.fn().mockReturnValue(mockConnectableNode())
        close = vi.fn()
      }
    )

    // Mock AudioWorkletNode
    vi.stubGlobal(
      'AudioWorkletNode',
      class MockAudioWorkletNode {
        port = { onmessage: null }
        connect = vi.fn()
        disconnect = vi.fn()
      }
    )

    // Mock URL
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:test'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    wsInstances.forEach(ws => ws.close())
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useLiveCall(defaultOptions))

      expect(result.current.state).toBe('idle')
      expect(result.current.isSupported).toBe(true)
      expect(result.current.callDuration).toBe(0)
    })
    it('should report unsupported if mediaDevices is unavailable', () => {
      vi.stubGlobal('navigator', { mediaDevices: undefined })

      const { result } = renderHook(() => useLiveCall(defaultOptions))

      expect(result.current.isSupported).toBe(false)
    })
  })

  describe('startCall', () => {
    it('should transition to calling state when startCall is called', async () => {
      const { result, unmount } = renderHook(() => useLiveCall(defaultOptions))

      await act(async () => {
        result.current.startCall()
      })

      expect(result.current.state).toBe('calling')

      unmount()
    })

    it('should create WebSocket with correct URL', async () => {
      const { result, unmount } = renderHook(() => useLiveCall(defaultOptions))

      await act(async () => {
        await result.current.startCall()
        await tick(10)
      })

      expect(wsInstances.length).toBe(1)
      expect(wsInstances[0].url).toBe('wss://api.example.com/voice/widget')

      unmount()
    })

    it('should use custom wsEndpoint if provided', async () => {
      const { result, unmount } = renderHook(() =>
        useLiveCall({
          ...defaultOptions,
          wsEndpoint: 'wss://custom.example.com/voice',
        })
      )

      await act(async () => {
        await result.current.startCall()
        await tick(10)
      })

      expect(wsInstances[0].url).toBe('wss://custom.example.com/voice')

      unmount()
    })

    it('should send auth and start_call messages on connection', async () => {
      const { result, unmount } = renderHook(() => useLiveCall(defaultOptions))

      await act(async () => {
        await result.current.startCall()
        await tick(10)
      })

      const ws = wsInstances[0]

      await act(async () => {
        ws.simulateOpen()
        await tick(10)
      })

      const jsonMessages = ws.sentMessages
        .filter((m): m is string => typeof m === 'string')
        .map(m => JSON.parse(m))

      expect(jsonMessages).toContainEqual(
        expect.objectContaining({ type: 'auth', tenantId: 'tenant_123' })
      )
      expect(jsonMessages).toContainEqual({ type: 'start_call' })

      unmount()
    })
  })

  describe('server messages', () => {
    it('should transition to ready on call_started message', async () => {
      const { result, unmount } = renderHook(() => useLiveCall(defaultOptions))

      await act(async () => {
        await result.current.startCall()
        await tick(10)
      })

      const ws = wsInstances[0]

      await act(async () => {
        ws.simulateOpen()
        ws.simulateMessage(JSON.stringify({ type: 'call_started' }))
      })

      expect(result.current.state).toBe('ready')

      unmount()
    })

    it('should transition to listening on listening message', async () => {
      const { result, unmount } = renderHook(() => useLiveCall(defaultOptions))

      await act(async () => {
        await result.current.startCall()
        await tick(10)
      })

      const ws = wsInstances[0]

      await act(async () => {
        ws.simulateOpen()
        ws.simulateMessage(JSON.stringify({ type: 'call_started' }))
        ws.simulateMessage(JSON.stringify({ type: 'listening' }))
      })

      expect(result.current.state).toBe('listening')

      unmount()
    })

    it('should call onTranscription callback', async () => {
      const onTranscription = vi.fn()
      const { result, unmount } = renderHook(() =>
        useLiveCall({ ...defaultOptions, onTranscription })
      )

      await act(async () => {
        await result.current.startCall()
        await tick(10)
      })

      const ws = wsInstances[0]

      await act(async () => {
        ws.simulateOpen()
        ws.simulateMessage(JSON.stringify({ type: 'transcription', text: 'Hello world' }))
      })

      expect(onTranscription).toHaveBeenCalledWith('Hello world')

      unmount()
    })

    it('should transition to speaking on speaking message', async () => {
      const { result, unmount } = renderHook(() => useLiveCall(defaultOptions))

      await act(async () => {
        await result.current.startCall()
        await tick(10)
      })

      const ws = wsInstances[0]

      await act(async () => {
        ws.simulateOpen()
        ws.simulateMessage(JSON.stringify({ type: 'speaking' }))
      })

      expect(result.current.state).toBe('speaking')

      unmount()
    })

    it('should call onBotResponse callback', async () => {
      const onBotResponse = vi.fn()
      const { result, unmount } = renderHook(() =>
        useLiveCall({ ...defaultOptions, onBotResponse })
      )

      await act(async () => {
        await result.current.startCall()
        await tick(10)
      })

      const ws = wsInstances[0]

      await act(async () => {
        ws.simulateOpen()
        ws.simulateMessage(JSON.stringify({ type: 'response_text', text: 'Bot response' }))
      })

      expect(onBotResponse).toHaveBeenCalledWith('Bot response')

      unmount()
    })

    it('should transition to ready on done message', async () => {
      const { result, unmount } = renderHook(() => useLiveCall(defaultOptions))

      await act(async () => {
        await result.current.startCall()
        await tick(10)
      })

      const ws = wsInstances[0]

      await act(async () => {
        ws.simulateOpen()
        ws.simulateMessage(JSON.stringify({ type: 'call_started' }))
        ws.simulateMessage(JSON.stringify({ type: 'speaking' }))
        ws.simulateMessage(JSON.stringify({ type: 'done' }))
      })

      expect(result.current.state).toBe('ready')

      unmount()
    })
  })

  describe('endCall', () => {
    it('should transition to idle when endCall is called', async () => {
      const onStateChange = vi.fn()
      const { result } = renderHook(() => useLiveCall({ ...defaultOptions, onStateChange }))

      // Start a call
      await act(async () => {
        result.current.startCall()
      })

      expect(result.current.state).toBe('calling')

      // End the call
      await act(async () => {
        result.current.endCall()
      })

      expect(result.current.state).toBe('idle')
      expect(onStateChange).toHaveBeenCalledWith('idle')
    })

    it('should clean up resources on endCall', async () => {
      const { result } = renderHook(() => useLiveCall(defaultOptions))

      await act(async () => {
        result.current.startCall()
      })

      await act(async () => {
        result.current.endCall()
      })

      // After endCall, state should be idle and duration reset
      expect(result.current.state).toBe('idle')
      expect(result.current.callDuration).toBe(0)
    })
  })

  describe('callbacks', () => {
    it('should call onStateChange on state transitions', async () => {
      const onStateChange = vi.fn()
      const { result, unmount } = renderHook(() =>
        useLiveCall({ ...defaultOptions, onStateChange })
      )

      await act(async () => {
        await result.current.startCall()
      })

      expect(onStateChange).toHaveBeenCalledWith('calling')

      unmount()
    })
    it('should call onError when browser is not supported', async () => {
      vi.stubGlobal('navigator', { mediaDevices: undefined })

      const onError = vi.fn()
      const { result } = renderHook(() => useLiveCall({ ...defaultOptions, onError }))

      await act(async () => {
        await result.current.startCall()
      })

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          code: 'browser_unsupported',
        })
      )
    })
  })
})
