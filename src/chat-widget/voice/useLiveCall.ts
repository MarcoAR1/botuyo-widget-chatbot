/**
 * @package @botuyo/chat-widget
 * Live Call Hook
 *
 * Real-time voice conversation like a phone call from the browser.
 * Uses WebSocket for bidirectional audio streaming.
 */

'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type {
  LiveCallState,
  LiveCallServerMessage,
  UseLiveCallOptions,
  UseLiveCallReturn,
  LiveCallErrorMessage,
} from './types'
import { VOICE_AUDIO_CONFIG } from './types'

/**
 * Inline AudioWorklet processor code
 * Converts microphone input to PCM 16-bit at 16kHz
 */
const AUDIO_PROCESSOR_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(${VOICE_AUDIO_CONFIG.input.chunkSize});
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    for (let i = 0; i < input.length; i++) {
      this.buffer[this.bufferIndex++] = input[i];

      if (this.bufferIndex >= ${VOICE_AUDIO_CONFIG.input.chunkSize}) {
        // Convert Float32 to Int16 PCM
        const int16Buffer = new Int16Array(${VOICE_AUDIO_CONFIG.input.chunkSize});
        for (let j = 0; j < ${VOICE_AUDIO_CONFIG.input.chunkSize}; j++) {
          const s = Math.max(-1, Math.min(1, this.buffer[j]));
          int16Buffer[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        this.port.postMessage(int16Buffer.buffer, [int16Buffer.buffer]);
        this.buffer = new Float32Array(${VOICE_AUDIO_CONFIG.input.chunkSize});
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
`

/**
 * Hook for live call voice conversation
 */
export function useLiveCall(options: UseLiveCallOptions): UseLiveCallReturn {
  const {
    apiBaseUrl,
    tenantId,
    sessionId,
    conversationId,
    wsEndpoint,
    onStateChange,
    onTranscription,
    onBotResponse,
    onError,
  } = options

  // State
  const [state, setState] = useState<LiveCallState>('idle')
  const [callDuration, setCallDuration] = useState(0)

  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const playbackContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const handlersRef = useRef({ onStateChange, onTranscription, onBotResponse, onError })

  // Keep handlers ref updated
  useEffect(() => {
    handlersRef.current = { onStateChange, onTranscription, onBotResponse, onError }
  }, [onStateChange, onTranscription, onBotResponse, onError])

  // Check browser support
  const isSupported = useMemo(() => {
    if (typeof window === 'undefined') return false
    if (!navigator.mediaDevices) return false
    return (
      'getUserMedia' in navigator.mediaDevices &&
      'AudioContext' in window &&
      'AudioWorkletNode' in window
    )
  }, [])

  // Build WebSocket URL
  const wsUrl = useMemo(() => {
    if (wsEndpoint) return wsEndpoint
    const base = apiBaseUrl.replace(/^http/, 'ws')
    return `${base}/voice/widget`
  }, [apiBaseUrl, wsEndpoint])

  /**
   * Update state and notify
   */
  const updateState = useCallback((newState: LiveCallState) => {
    setState(newState)
    handlersRef.current.onStateChange?.(newState)
  }, [])

  /**
   * Play audio chunk from server
   */
  const playAudioChunk = useCallback(async (buffer: ArrayBuffer) => {
    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContext({
        sampleRate: VOICE_AUDIO_CONFIG.output.sampleRate,
      })
    }

    // Convert PCM 16-bit to Float32
    const int16View = new Int16Array(buffer)
    const float32 = new Float32Array(int16View.length)
    for (let i = 0; i < int16View.length; i++) {
      float32[i] = int16View[i] / 32768
    }

    const audioBuffer = playbackContextRef.current.createBuffer(
      1,
      float32.length,
      VOICE_AUDIO_CONFIG.output.sampleRate
    )
    audioBuffer.copyToChannel(float32, 0)

    const source = playbackContextRef.current.createBufferSource()
    source.buffer = audioBuffer
    source.connect(playbackContextRef.current.destination)
    source.start()
  }, [])

  /**
   * Handle server messages
   */
  const handleServerMessage = useCallback(
    (msg: LiveCallServerMessage) => {
      switch (msg.type) {
        case 'call_started':
          updateState('ready')
          break

        case 'listening':
          updateState('listening')
          break

        case 'transcription':
          handlersRef.current.onTranscription?.(msg.text)
          break

        case 'speaking':
          updateState('speaking')
          break

        case 'response_text':
          handlersRef.current.onBotResponse?.(msg.text)
          break

        case 'done':
          updateState('ready')
          break

        case 'error':
          handlersRef.current.onError?.(msg)
          updateState('idle')
          break
      }
    },
    [updateState]
  )

  /**
   * Start microphone capture
   */
  const startMicrophone = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: VOICE_AUDIO_CONFIG.input.sampleRate,
        channelCount: VOICE_AUDIO_CONFIG.input.channels,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    streamRef.current = stream

    audioContextRef.current = new AudioContext({
      sampleRate: VOICE_AUDIO_CONFIG.input.sampleRate,
    })

    // Create inline AudioWorklet
    const blob = new Blob([AUDIO_PROCESSOR_CODE], { type: 'application/javascript' })
    const workletUrl = URL.createObjectURL(blob)
    await audioContextRef.current.audioWorklet.addModule(workletUrl)
    URL.revokeObjectURL(workletUrl)

    const source = audioContextRef.current.createMediaStreamSource(stream)
    processorRef.current = new AudioWorkletNode(audioContextRef.current, 'pcm-processor')

    // Send audio chunks to WebSocket
    processorRef.current.port.onmessage = e => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(e.data as ArrayBuffer)
      }
    }

    source.connect(processorRef.current)
  }, [])

  /**
   * Stop microphone capture
   */
  const stopMicrophone = useCallback(() => {
    processorRef.current?.disconnect()
    processorRef.current = null
    audioContextRef.current?.close()
    audioContextRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  /**
   * Start call timer
   */
  const startCallTimer = useCallback(() => {
    setCallDuration(0)
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)
  }, [])

  /**
   * Stop call timer
   */
  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current)
      callTimerRef.current = null
    }
  }, [])

  /**
   * Start a live call
   */
  const startCall = useCallback(async () => {
    if (!isSupported) {
      const error: LiveCallErrorMessage = {
        type: 'error',
        code: 'browser_unsupported',
        message: 'Your browser does not support voice calls',
      }
      handlersRef.current.onError?.(error)
      return
    }

    updateState('calling')

    try {
      // Request microphone first
      await startMicrophone()

      // Connect WebSocket
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[BotUyo] Live call WebSocket connected')

        // Authenticate
        ws.send(
          JSON.stringify({
            type: 'auth',
            tenantId,
            sessionId,
            conversationId,
          })
        )

        // Start call
        ws.send(JSON.stringify({ type: 'start_call' }))
        startCallTimer()
      }

      ws.onmessage = async event => {
        // Binary = audio chunk
        if (event.data instanceof Blob) {
          const buffer = await event.data.arrayBuffer()
          playAudioChunk(buffer)
          return
        }

        // JSON message
        try {
          const msg: LiveCallServerMessage = JSON.parse(event.data)
          handleServerMessage(msg)
        } catch (e) {
          console.error('[BotUyo] Failed to parse message:', e)
        }
      }

      ws.onclose = event => {
        console.log('[BotUyo] Live call WebSocket closed:', event.code)
        stopMicrophone()
        stopCallTimer()
        updateState('idle')
      }

      ws.onerror = () => {
        console.error('[BotUyo] Live call WebSocket error')
        const error: LiveCallErrorMessage = {
          type: 'error',
          code: 'connection_error',
          message: 'Failed to connect to voice server',
        }
        handlersRef.current.onError?.(error)
        stopMicrophone()
        stopCallTimer()
        updateState('idle')
      }
    } catch (err) {
      console.error('[BotUyo] Failed to start call:', err)
      const error: LiveCallErrorMessage = {
        type: 'error',
        code: 'microphone_denied',
        message: 'Microphone access denied',
      }
      handlersRef.current.onError?.(error)
      updateState('idle')
    }
  }, [
    isSupported,
    wsUrl,
    tenantId,
    sessionId,
    conversationId,
    updateState,
    startMicrophone,
    stopMicrophone,
    startCallTimer,
    stopCallTimer,
    playAudioChunk,
    handleServerMessage,
  ])

  /**
   * End the live call
   */
  const endCall = useCallback(() => {
    console.log('[BotUyo] Ending live call')

    // Send end_call message
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end_call' }))
    }

    // Close WebSocket
    wsRef.current?.close()
    wsRef.current = null

    // Stop audio
    stopMicrophone()
    playbackContextRef.current?.close()
    playbackContextRef.current = null
    audioQueueRef.current = []

    // Stop timer
    stopCallTimer()

    // Reset state
    updateState('idle')
    setCallDuration(0)
  }, [stopMicrophone, stopCallTimer, updateState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall()
    }
  }, [endCall])

  return {
    state,
    isSupported,
    callDuration,
    startCall,
    endCall,
  }
}
