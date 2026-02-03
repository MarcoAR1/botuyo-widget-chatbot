/**
 * @package @botuyo/chat-widget
 * Voice Chat Hook
 *
 * Main hook for managing real-time voice chat functionality via WebSocket.
 * Handles audio capture, streaming, and playback.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { UseVoiceChatOptions, UseVoiceChatReturn, VoiceServerMessage } from './types'
import { VOICE_AUDIO_CONFIG } from './types'
import { useVoiceState } from './useVoiceState'
import { logger } from '../utils/logger'

/**
 * AudioWorklet processor code as inline string
 * This gets converted to a Blob URL for loading
 */
const AUDIO_PROCESSOR_CODE = `
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(1600);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    for (let i = 0; i < input.length; i++) {
      this.buffer[this.bufferIndex++] = input[i];

      if (this.bufferIndex >= 1600) {
        // Convert Float32 to Int16 PCM
        const int16Buffer = new Int16Array(1600);
        for (let j = 0; j < 1600; j++) {
          const s = Math.max(-1, Math.min(1, this.buffer[j]));
          int16Buffer[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Send to main thread
        this.port.postMessage(int16Buffer.buffer, [int16Buffer.buffer]);

        // Reset buffer
        this.buffer = new Float32Array(1600);
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor);
`

/**
 * Create a Blob URL for the AudioWorklet processor
 */
function createProcessorUrl(): string {
  const blob = new Blob([AUDIO_PROCESSOR_CODE], { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}

/**
 * Hook for managing real-time voice chat
 */
export function useVoiceChat(options: UseVoiceChatOptions): UseVoiceChatReturn {
  const {
    apiBaseUrl,
    tenantId,
    sessionId,
    conversationId,
    config,
    onTranscription,
    onBotResponse,
    onBotAudioPlayed,
    onError,
    onStateChange,
  } = options

  // Keep handlers in ref to avoid reconnection on handler change
  const handlersRef = useRef({
    onTranscription,
    onBotResponse,
    onBotAudioPlayed,
    onError,
    onStateChange,
  })

  useEffect(() => {
    handlersRef.current = {
      onTranscription,
      onBotResponse,
      onBotAudioPlayed,
      onError,
      onStateChange,
    }
  }, [onTranscription, onBotResponse, onBotAudioPlayed, onError, onStateChange])

  // State management
  const voiceState = useVoiceState({
    maxDuration: config?.maxDurationSeconds ?? 60,
    onMaxDurationReached: () => {
      stopRecording()
    },
    onStateChange: state => handlersRef.current.onStateChange?.(state),
  })

  const [isConnected, setIsConnected] = useState(false)
  const [partialTranscription, setPartialTranscription] = useState('')

  // Refs for audio handling
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const processorUrlRef = useRef<string | null>(null)

  // Audio playback refs
  const playbackContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const isPlayingRef = useRef(false)
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null)

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
    if (config?.wsEndpoint) return config.wsEndpoint
    // Convert http(s) to ws(s)
    const base = apiBaseUrl.replace(/^http/, 'ws')
    return `${base}/voice/stream`
  }, [apiBaseUrl, config?.wsEndpoint])

  /**
   * Handle incoming server messages
   */
  const handleServerMessage = useCallback(
    (msg: VoiceServerMessage) => {
      switch (msg.type) {
        case 'transcription_partial':
          setPartialTranscription(msg.text)
          handlersRef.current.onTranscription?.(msg.text, false)
          break

        case 'transcription_final':
          setPartialTranscription('')
          handlersRef.current.onTranscription?.(msg.text, true)
          break

        case 'response_start':
          voiceState.transition('speaking')
          break

        case 'response_text':
          handlersRef.current.onBotResponse?.(msg.text)
          break

        case 'response_end':
          voiceState.transition('idle')
          handlersRef.current.onBotAudioPlayed?.()
          break

        case 'error':
          handlersRef.current.onError?.(msg)
          voiceState.reset()
          break
      }
    },
    [voiceState]
  )

  /**
   * Play audio chunks from the queue
   */
  const playNextChunk = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return
    isPlayingRef.current = true

    try {
      // Create playback context if needed
      if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
        playbackContextRef.current = new AudioContext({
          sampleRate: VOICE_AUDIO_CONFIG.output.sampleRate,
        })
      }

      const ctx = playbackContextRef.current

      while (audioQueueRef.current.length > 0) {
        const chunk = audioQueueRef.current.shift()!

        // Convert Int16 PCM to Float32
        const int16View = new Int16Array(chunk)
        const float32 = new Float32Array(int16View.length)
        for (let i = 0; i < int16View.length; i++) {
          float32[i] = int16View[i] / 32768
        }

        // Create audio buffer
        const buffer = ctx.createBuffer(1, float32.length, VOICE_AUDIO_CONFIG.output.sampleRate)
        buffer.copyToChannel(float32, 0)

        // Create and play source
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        currentSourceRef.current = source
        source.start()

        // Wait for chunk to finish
        await new Promise<void>(resolve => {
          source.onended = () => {
            currentSourceRef.current = null
            resolve()
          }
        })
      }
    } catch (error) {
      logger.error('Audio playback error:', error)
    } finally {
      isPlayingRef.current = false
    }
  }, [])

  /**
   * Connect to voice WebSocket
   */
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    logger.log('Connecting to voice WebSocket:', wsUrl)
    const ws = new WebSocket(wsUrl)

    ws.binaryType = 'arraybuffer'

    ws.onopen = () => {
      logger.log('Voice WebSocket connected')
      setIsConnected(true)

      // Send auth message
      ws.send(
        JSON.stringify({
          type: 'auth',
          tenantId,
          sessionId,
          conversationId,
        })
      )
    }

    ws.onmessage = async event => {
      // Binary data = audio chunk
      if (event.data instanceof ArrayBuffer) {
        audioQueueRef.current.push(event.data)
        playNextChunk()
        return
      }

      // JSON message
      try {
        const msg: VoiceServerMessage = JSON.parse(event.data as string)
        handleServerMessage(msg)
      } catch (e) {
        logger.error('Failed to parse voice message:', e)
      }
    }

    ws.onclose = event => {
      logger.log('Voice WebSocket closed:', event.code, event.reason)
      setIsConnected(false)
      voiceState.reset()
    }

    ws.onerror = error => {
      logger.error('Voice WebSocket error:', error)
      handlersRef.current.onError?.({
        type: 'error',
        code: 'connection_error',
        message: 'WebSocket connection failed',
      })
    }

    wsRef.current = ws
  }, [wsUrl, tenantId, sessionId, conversationId, handleServerMessage, playNextChunk, voiceState])

  /**
   * Start voice recording
   */
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      handlersRef.current.onError?.({
        type: 'error',
        code: 'stt_error',
        message: 'Browser does not support voice chat',
      })
      return
    }

    if (voiceState.state !== 'idle') {
      logger.warn('Cannot start recording while not idle')
      return
    }

    try {
      // Request microphone access
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

      // Ensure WebSocket connection
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connect()
        // Wait for connection
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000)
          const interval = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              clearTimeout(timeout)
              clearInterval(interval)
              resolve()
            }
          }, 100)
        })
      }

      // Setup AudioContext
      audioContextRef.current = new AudioContext({
        sampleRate: VOICE_AUDIO_CONFIG.input.sampleRate,
      })

      // Create processor URL if needed
      if (!processorUrlRef.current) {
        processorUrlRef.current = createProcessorUrl()
      }

      // Load AudioWorklet
      await audioContextRef.current.audioWorklet.addModule(processorUrlRef.current)

      // Create processing chain
      const source = audioContextRef.current.createMediaStreamSource(stream)
      processorRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor')

      // Send audio chunks to WebSocket
      processorRef.current.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(e.data)
        }
      }

      source.connect(processorRef.current)

      // Notify server
      wsRef.current?.send(
        JSON.stringify({
          type: 'start_recording',
          timestamp: Date.now(),
        })
      )

      voiceState.transition('listening')
      logger.log('Voice recording started')
    } catch (error) {
      logger.error('Failed to start recording:', error)

      // Determine error type
      const isPermissionError =
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')

      handlersRef.current.onError?.({
        type: 'error',
        code: isPermissionError ? 'permission_denied' : 'stt_error',
        message: isPermissionError ? 'Microphone access denied' : 'Failed to start recording',
      })
    }
  }, [isSupported, voiceState, connect])

  /**
   * Stop recording and send for processing
   */
  const stopRecording = useCallback(() => {
    if (voiceState.state !== 'listening') return

    // Stop audio processing
    processorRef.current?.disconnect()
    processorRef.current = null

    audioContextRef.current?.close()
    audioContextRef.current = null

    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null

    // Notify server
    wsRef.current?.send(
      JSON.stringify({
        type: 'stop_recording',
        timestamp: Date.now(),
      })
    )

    voiceState.transition('processing')
    setPartialTranscription('')
    logger.log('Voice recording stopped, processing...')
  }, [voiceState])

  /**
   * Cancel recording without sending
   */
  const cancelRecording = useCallback(() => {
    // Stop audio processing
    processorRef.current?.disconnect()
    processorRef.current = null

    audioContextRef.current?.close()
    audioContextRef.current = null

    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null

    voiceState.reset()
    setPartialTranscription('')
    logger.log('Voice recording cancelled')
  }, [voiceState])

  /**
   * Stop audio playback
   */
  const stopPlayback = useCallback(() => {
    currentSourceRef.current?.stop()
    currentSourceRef.current = null
    audioQueueRef.current = []
    isPlayingRef.current = false

    if (voiceState.state === 'speaking') {
      voiceState.transition('idle')
    }
  }, [voiceState])

  /**
   * Disconnect from voice WebSocket
   */
  const disconnect = useCallback(() => {
    // Cleanup audio
    processorRef.current?.disconnect()
    audioContextRef.current?.close()
    streamRef.current?.getTracks().forEach(t => t.stop())
    playbackContextRef.current?.close()

    // Close WebSocket
    wsRef.current?.close()
    wsRef.current = null

    // Reset state
    voiceState.reset()
    setIsConnected(false)
    setPartialTranscription('')
    audioQueueRef.current = []

    // Cleanup processor URL
    if (processorUrlRef.current) {
      URL.revokeObjectURL(processorUrlRef.current)
      processorUrlRef.current = null
    }

    logger.log('Voice chat disconnected')
  }, [voiceState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    state: voiceState.state,
    isConnected,
    isSupported,
    partialTranscription,
    recordingDuration: voiceState.recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    stopPlayback,
    connect,
    disconnect,
  }
}
