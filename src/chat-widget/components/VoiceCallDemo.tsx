/**
 * @package @botuyo/chat-widget
 * Voice Call Component (Gemini Live Edition)
 *
 * Real-time voice call overlay using Gemini Live API via Socket.IO.
 * Sends raw PCM 16kHz audio chunks and receives PCM 24kHz audio responses.
 *
 * Flow: User Mic (PCM 16kHz) → Socket.IO → Backend → Gemini Live API → 
 *       PCM 24kHz audio → Socket.IO → Web Audio API playback
 */

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react'
import type { EmotionAvatarMap } from './Launcher'
import { DEFAULT_AVATAR_URL } from '../utils/defaultAssets'

/** Configurable voice call overlay options */
export interface VoiceOverlayConfig {
  /** Background color of the overlay. Default: '#0a0a0a' */
  backgroundColor?: string
  /** Glow color when listening. Default: '#10b981' (emerald) */
  listeningColor?: string
  /** Glow color when speaking. Default: uses primaryColor */
  speakingColor?: string
  /** Glow color when thinking. Default: '#a855f7' (purple) */
  thinkingColor?: string
  /** Show emojis for emotions when no avatar is provided. Default: true */
  showEmojis?: boolean
  /** Show the emotion text label on the avatar/header. Default: true */
  showEmotionLabel?: boolean
  /** Show waveform bars visualizer. Default: true */
  showWaveform?: boolean
  /** Show the "Gemini Live" badge. Default: true */
  showBadge?: boolean
  /** Custom badge text. Default: 'Gemini Live' */
  badgeText?: string
  /** Custom emoji map overrides. Merged with defaults. */
  emotionEmojis?: Partial<Record<string, string>>
  /** Custom status labels per state */
  statusLabels?: Partial<Record<CallState, string>>
  /** Avatar orb size in px. Default: 128 */
  orbSize?: number
  /** Scale factor when speaking. Default: 1.08 */
  speakingScale?: number
  /** Scale factor when thinking. Default: 0.95 */
  thinkingScale?: number
}

interface VoiceCallDemoProps {
  isOpen: boolean
  onClose: () => void
  primaryColor?: string
  getSocket?: () => any
  avatars?: EmotionAvatarMap
  logoUrl?: string
  /** Voice overlay configuration for full customizability */
  voiceConfig?: VoiceOverlayConfig
}

type CallState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking'

interface VoiceEntry {
  role: 'user' | 'bot'
  text: string
}

const DEFAULT_EMOTION_EMOJIS: Record<string, string> = {
  happy: '😊', wink: '😉', thinking: '🤔', sad: '😢', excited: '🤩',
  love: '❤️', laugh: '😄', surprised: '😲', angry: '😠', confused: '😕',
  sorry: '😔', default: '💬',
}

const DEFAULT_STATUS_LABELS: Record<CallState, string> = {
  idle: 'Llamada de voz',
  connecting: 'Conectando...',
  listening: 'Escuchando...',
  thinking: 'Pensando...',
  speaking: 'Hablando...',
}

/** Simple inline markdown renderer for voice transcripts */
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.1);padding:0 4px;border-radius:3px">$1</code>')
    .replace(/\n/g, '<br>')
}

const INPUT_SAMPLE_RATE = 16000
const OUTPUT_SAMPLE_RATE = 24000

// Inline AudioWorklet processor for PCM capture at 16kHz
const AUDIO_PROCESSOR_CODE = `
class VoicePCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Float32Array(1600); // 100ms at 16kHz
    this.bufferIndex = 0;
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (let i = 0; i < input.length; i++) {
      this.buffer[this.bufferIndex++] = input[i];
      if (this.bufferIndex >= 1600) {
        // Convert Float32 → Int16 PCM
        const int16 = new Int16Array(1600);
        for (let j = 0; j < 1600; j++) {
          const s = Math.max(-1, Math.min(1, this.buffer[j]));
          int16[j] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        this.port.postMessage(int16.buffer, [int16.buffer]);
        this.buffer = new Float32Array(1600);
        this.bufferIndex = 0;
      }
    }
    return true;
  }
}
registerProcessor('voice-pcm-processor', VoicePCMProcessor);
`

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const int16 = new Int16Array(bytes.buffer)
  const float32 = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 0x8000
  }
  return float32
}

// ═══════════════════════════════════════
// AVATAR ORB — Emotion-reactive centerpiece for voice calls
// ═══════════════════════════════════════
interface AvatarOrbProps {
  avatars?: EmotionAvatarMap
  logoUrl?: string
  emotion: string | null
  callState: CallState
  audioLevel: number
  config: Required_VoiceOverlayConfig
}

/** Resolved config with all defaults applied */
type Required_VoiceOverlayConfig = {
  backgroundColor: string
  listeningColor: string
  speakingColor: string
  thinkingColor: string
  showEmojis: boolean
  showEmotionLabel: boolean
  showWaveform: boolean
  showBadge: boolean
  badgeText: string
  emotionEmojis: Record<string, string>
  statusLabels: Record<CallState, string>
  orbSize: number
  speakingScale: number
  thinkingScale: number
}

function resolveVoiceConfig(cfg?: VoiceOverlayConfig, primaryColor = '#10b981'): Required_VoiceOverlayConfig {
  return {
    backgroundColor: cfg?.backgroundColor ?? '#0a0a0a',
    listeningColor: cfg?.listeningColor ?? '#10b981',
    speakingColor: cfg?.speakingColor ?? primaryColor,
    thinkingColor: cfg?.thinkingColor ?? '#a855f7',
    showEmojis: cfg?.showEmojis ?? true,
    showEmotionLabel: cfg?.showEmotionLabel ?? true,
    showWaveform: cfg?.showWaveform ?? true,
    showBadge: cfg?.showBadge ?? true,
    badgeText: cfg?.badgeText ?? 'Gemini Live',
    emotionEmojis: { ...DEFAULT_EMOTION_EMOJIS, ...(cfg?.emotionEmojis as Record<string, string> | undefined) },
    statusLabels: { ...DEFAULT_STATUS_LABELS, ...(cfg?.statusLabels as Record<CallState, string> | undefined) },
    orbSize: cfg?.orbSize ?? 128,
    speakingScale: cfg?.speakingScale ?? 1.08,
    thinkingScale: cfg?.thinkingScale ?? 0.95,
  }
}

function AvatarOrb({ avatars, logoUrl, emotion, callState, audioLevel, config }: AvatarOrbProps) {
  const hasAvatars = avatars && Object.keys(avatars).length > 0
  const hasLogo = !!logoUrl

  // Resolve avatar URL from emotion — same logic as Launcher
  const avatarUrl = useMemo(() => {
    if (!hasAvatars && !hasLogo) return null
    if (hasAvatars) {
      const emotionKey = (emotion || 'default') as keyof EmotionAvatarMap
      return avatars![emotionKey] || avatars!.default || logoUrl || DEFAULT_AVATAR_URL
    }
    return logoUrl || DEFAULT_AVATAR_URL
  }, [hasAvatars, hasLogo, avatars, emotion, logoUrl])

  const isActive = callState === 'listening' || callState === 'speaking'
  const glowColor = callState === 'speaking' ? config.speakingColor
    : callState === 'thinking' ? config.thinkingColor
    : callState === 'listening' ? config.listeningColor
    : '#ffffff20'

  const scale = callState === 'speaking' ? config.speakingScale
    : callState === 'thinking' ? config.thinkingScale
    : 1

  const orbPx = config.orbSize

  // If no avatar configured, show emoji orb or plain indicator
  if (!avatarUrl) {
    const emoji = config.showEmojis
      ? (emotion ? (config.emotionEmojis[emotion] || '💬') : '🎤')
      : null
    return (
      <div className="relative flex flex-col items-center gap-4">
        {/* Glow ring */}
        <div
          className={cn(
            'rounded-full flex items-center justify-center text-5xl',
            'transition-all duration-500 ease-out',
            isActive && 'animate-pulse',
          )}
          style={{
            width: `${orbPx}px`,
            height: `${orbPx}px`,
            background: `radial-gradient(circle, ${glowColor}30 0%, transparent 70%)`,
            boxShadow: isActive ? `0 0 40px ${glowColor}40, 0 0 80px ${glowColor}20` : 'none',
            transform: `scale(${scale})`,
          }}
        >
          {emoji}
        </div>
        {/* Waveform bars below */}
        {config.showWaveform && (
          <WaveformBars isActive={isActive} audioLevel={audioLevel} color={glowColor} />
        )}
      </div>
    )
  }

  // Avatar orb with emotion switching
  return (
    <div className="relative flex flex-col items-center gap-4">
      {/* Outer glow ring */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center',
          'transition-all duration-500 ease-out',
        )}
        style={{
          width: `${orbPx}px`,
          height: `${orbPx}px`,
          boxShadow: isActive
            ? `0 0 0 4px ${glowColor}40, 0 0 30px ${glowColor}30, 0 0 60px ${glowColor}15`
            : `0 0 0 2px ${glowColor}20`,
          transform: `scale(${scale})`,
        }}
      >
        {/* Avatar image */}
        <img
          src={avatarUrl}
          alt="Bot avatar"
          className={cn(
            'h-full w-full rounded-full object-cover',
            'transition-all duration-300',
            callState === 'thinking' && 'opacity-80',
          )}
          style={{
            boxShadow: callState === 'listening'
              ? `0 0 0 2px ${config.listeningColor}80`
              : callState === 'speaking'
                ? `0 0 0 2px ${config.speakingColor}80`
                : 'none',
          }}
        />
        {/* Emotion label overlay */}
        {config.showEmotionLabel && emotion && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-bold text-white whitespace-nowrap">
            {config.showEmojis && (config.emotionEmojis[emotion] || '💬')} {emotion}
          </div>
        )}
      </div>
      {/* Waveform bars */}
      {config.showWaveform && (
        <WaveformBars isActive={isActive} audioLevel={audioLevel} color={glowColor} />
      )}
    </div>
  )
}

/** Reusable waveform bars component */
function WaveformBars({ isActive, audioLevel, color }: { isActive: boolean; audioLevel: number; color: string }) {
  return (
    <div className="flex items-end gap-1 h-8">
      {Array.from({ length: 9 }).map((_, i) => {
        const h = isActive
          ? Math.max(3, audioLevel * 32 * (0.5 + Math.sin(Date.now() / 120 + i * 0.7) * 0.5))
          : 3
        return (
          <div key={i} className="w-1 rounded-full transition-all duration-75"
            style={{ height: `${h}px`, backgroundColor: `${color}80` }} />
        )
      })}
    </div>
  )
}

export function VoiceCallDemo({
  isOpen,
  onClose,
  primaryColor = '#10b981',
  getSocket,
  avatars,
  logoUrl,
  voiceConfig,
}: VoiceCallDemoProps) {
  // Resolve all config defaults once
  const cfg = useMemo(() => resolveVoiceConfig(voiceConfig, primaryColor), [voiceConfig, primaryColor])

  const [callState, setCallState] = useState<CallState>('idle')
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null)
  const [conversation, setConversation] = useState<VoiceEntry[]>([])

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const socketListenersRef = useRef(false)
  const processorUrlRef = useRef<string | null>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)

  // Audio playback
  const playbackCtxRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<Float32Array[]>([])
  const isPlayingRef = useRef(false)

  // Format duration as MM:SS
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // ═══════════════════════════════════════
  // AUDIO PLAYBACK — PCM 24kHz via Web Audio API
  // ═══════════════════════════════════════
  const playNextChunk = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false
      setCallState(prev => prev === 'speaking' ? 'listening' : prev)
      return
    }

    isPlayingRef.current = true
    setCallState('speaking')

    if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
      playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE })
    }

    const ctx = playbackCtxRef.current
    const float32Data = audioQueueRef.current.shift()!
    const buffer = ctx.createBuffer(1, float32Data.length, OUTPUT_SAMPLE_RATE)
    buffer.getChannelData(0).set(float32Data)

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.onended = () => playNextChunk()
    source.start()
  }, [])

  // ═══════════════════════════════════════
  // SOCKET EVENT LISTENERS
  // ═══════════════════════════════════════
  const voiceListenersRef = useRef<{
    voiceReady?: (d: any) => void
    voiceAudioChunk?: (d: any) => void
    voiceInterrupted?: () => void
    voiceTurnComplete?: () => void
    voiceError?: (d: any) => void
    voiceEmotion?: (d: any) => void
    voiceUserTranscript?: (d: any) => void
    voiceModelTranscript?: (d: any) => void
    voiceModelThinking?: () => void
  }>({})

  const setupSocketListeners = useCallback(() => {
    const socket = getSocket?.()
    if (!socket || socketListenersRef.current) return

    const onVoiceReady = () => {
      setCallState('listening')
    }

    const onVoiceAudioChunk = (data: { data: string; sampleRate?: number }) => {
      if (!data?.data) return
      const pcmFloat32 = base64ToFloat32(data.data)
      audioQueueRef.current.push(pcmFloat32)
      if (!isPlayingRef.current) playNextChunk()
    }

    const onVoiceInterrupted = () => {
      // Barge-in: clear playback queue
      audioQueueRef.current.length = 0
      isPlayingRef.current = false
      setCallState('listening')
    }

    const onVoiceTurnComplete = () => {
      // Model finished speaking, playback may still be in queue
    }

    const onVoiceError = (data: any) => {
      console.error('[VoiceCall] Voice error:', data)
    }

    const onVoiceEmotion = (data: { emotion: string }) => {
      if (data?.emotion) {
        setCurrentEmotion(data.emotion)
        setTimeout(() => setCurrentEmotion(prev => prev === data.emotion ? null : prev), 4000)
      }
    }

    const onVoiceUserTranscript = (data: { text: string }) => {
      if (!data?.text) return
      setConversation(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'user') {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: updated[updated.length - 1].text + data.text }
          return updated
        }
        return [...prev, { role: 'user', text: data.text }]
      })
    }

    const onVoiceModelTranscript = (data: { text: string }) => {
      if (!data?.text) return
      setConversation(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'bot') {
          const updated = [...prev]
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: updated[updated.length - 1].text + data.text }
          return updated
        }
        return [...prev, { role: 'bot', text: data.text }]
      })
    }

    const onVoiceModelThinking = () => {
      setCallState('thinking')
    }

    voiceListenersRef.current = {
      voiceReady: onVoiceReady,
      voiceAudioChunk: onVoiceAudioChunk,
      voiceInterrupted: onVoiceInterrupted,
      voiceTurnComplete: onVoiceTurnComplete,
      voiceError: onVoiceError,
      voiceEmotion: onVoiceEmotion,
      voiceUserTranscript: onVoiceUserTranscript,
      voiceModelTranscript: onVoiceModelTranscript,
      voiceModelThinking: onVoiceModelThinking,
    }

    socket.on('voice_ready', onVoiceReady)
    socket.on('voice_audio_chunk', onVoiceAudioChunk)
    socket.on('voice_interrupted', onVoiceInterrupted)
    socket.on('voice_turn_complete', onVoiceTurnComplete)
    socket.on('voice_error', onVoiceError)
    socket.on('voice_emotion', onVoiceEmotion)
    socket.on('voice_user_transcript', onVoiceUserTranscript)
    socket.on('voice_model_transcript', onVoiceModelTranscript)
    socket.on('voice_model_thinking', onVoiceModelThinking)

    socketListenersRef.current = true
  }, [getSocket, playNextChunk])

  const removeSocketListeners = useCallback(() => {
    const socket = getSocket?.()
    if (!socket || !socketListenersRef.current) return

    const l = voiceListenersRef.current
    if (l.voiceReady) socket.off('voice_ready', l.voiceReady)
    if (l.voiceAudioChunk) socket.off('voice_audio_chunk', l.voiceAudioChunk)
    if (l.voiceInterrupted) socket.off('voice_interrupted', l.voiceInterrupted)
    if (l.voiceTurnComplete) socket.off('voice_turn_complete', l.voiceTurnComplete)
    if (l.voiceError) socket.off('voice_error', l.voiceError)
    if (l.voiceEmotion) socket.off('voice_emotion', l.voiceEmotion)
    if (l.voiceUserTranscript) socket.off('voice_user_transcript', l.voiceUserTranscript)
    if (l.voiceModelTranscript) socket.off('voice_model_transcript', l.voiceModelTranscript)
    if (l.voiceModelThinking) socket.off('voice_model_thinking', l.voiceModelThinking)

    voiceListenersRef.current = {}
    socketListenersRef.current = false
  }, [getSocket])

  // ═══════════════════════════════════════
  // MIC CAPTURE — PCM 16kHz via AudioWorklet
  // ═══════════════════════════════════════
  const startMicCapture = useCallback(async () => {
    const socket = getSocket?.()
    if (!socket) return

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: INPUT_SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    streamRef.current = stream

    const ctx = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE })
    audioCtxRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)

    // Analyser for visualization
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    // Create processor URL
    if (!processorUrlRef.current) {
      const blob = new Blob([AUDIO_PROCESSOR_CODE], { type: 'application/javascript' })
      processorUrlRef.current = URL.createObjectURL(blob)
    }

    await ctx.audioWorklet.addModule(processorUrlRef.current)
    const workletNode = new AudioWorkletNode(ctx, 'voice-pcm-processor')
    workletNodeRef.current = workletNode

    // Send PCM chunks to Socket.IO
    workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      if (socket.connected && !isMuted) {
        const base64 = arrayBufferToBase64(e.data)
        socket.emit('voice_audio_chunk', { data: base64 })
      }
    }

    source.connect(workletNode)

    // Start visualization loop
    const updateLevel = () => {
      if (!analyserRef.current) return
      const data = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(data)
      const avg = data.reduce((a, b) => a + b, 0) / data.length
      setAudioLevel(avg / 255)
      animFrameRef.current = requestAnimationFrame(updateLevel)
    }
    updateLevel()
  }, [getSocket, isMuted])

  const stopMicCapture = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    workletNodeRef.current?.disconnect()
    workletNodeRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    analyserRef.current = null
    setAudioLevel(0)
  }, [])

  // ═══════════════════════════════════════
  // CALL LIFECYCLE
  // ═══════════════════════════════════════
  const startCall = useCallback(async () => {
    const socket = getSocket?.()
    if (!socket?.connected) {
      console.error('[VoiceCall] Socket not connected')
      return
    }

    setCallState('connecting')
    setDuration(0)
    setConversation([])
    setCurrentEmotion(null)
    audioQueueRef.current = []

    // Setup listeners first
    setupSocketListeners()

    // Start mic capture
    try {
      await startMicCapture()
    } catch (err) {
      console.error('[VoiceCall] Mic error:', err)
      setCallState('idle')
      return
    }

    // Tell backend to create Gemini Live session
    socket.emit('voice_start', { language: 'es-AR', voice: 'Kore' })

    // Timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)
  }, [getSocket, setupSocketListeners, startMicCapture])

  const endCall = useCallback(() => {
    // Stop mic
    stopMicCapture()

    // Stop playback
    audioQueueRef.current = []
    isPlayingRef.current = false
    playbackCtxRef.current?.close()
    playbackCtxRef.current = null

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Notify backend
    const socket = getSocket?.()
    if (socket?.connected) socket.emit('voice_stop')

    // Cleanup
    removeSocketListeners()
    setCallState('idle')
    setAudioLevel(0)
    setDuration(0)
    setIsMuted(false)

    onClose()
  }, [getSocket, stopMicCapture, removeSocketListeners, onClose])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  // Start call when overlay opens
  useEffect(() => {
    if (isOpen && callState === 'idle') {
      startCall()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicCapture()
      if (timerRef.current) clearInterval(timerRef.current)
      removeSocketListeners()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex flex-col',
        'animate-in fade-in duration-300'
      )}
      style={{ backgroundColor: cfg.backgroundColor }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-3 w-3 rounded-full',
              callState === 'idle' || callState === 'connecting'
                ? 'bg-amber-500 animate-pulse'
                : callState === 'thinking'
                  ? 'bg-purple-500 animate-pulse'
                  : callState === 'speaking'
                    ? 'bg-violet-500'
                    : 'bg-emerald-500'
            )}
          />
          <span className="text-sm font-medium text-white/70">
            {cfg.statusLabels[callState] || callState}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {cfg.showEmotionLabel && currentEmotion && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 transition-opacity duration-300">
              {cfg.showEmojis && (cfg.emotionEmojis[currentEmotion] || '💬')} {currentEmotion}
            </span>
          )}
          <span className="text-sm font-mono text-white/50 tabular-nums">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Badge */}
      {cfg.showBadge && (
        <div className="flex justify-center py-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            {cfg.badgeText}
          </span>
        </div>
      )}

      {/* Conversation Transcript */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
        {conversation.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            {/* Avatar Center — resolves per emotion */}
            <AvatarOrb
              avatars={avatars}
              logoUrl={logoUrl}
              emotion={currentEmotion}
              callState={callState}
              audioLevel={audioLevel}
              config={cfg}
            />
          </div>
        )}
        {conversation.map((entry, i) => (
          <div
            key={i}
            className={cn(
              'max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed',
              entry.role === 'user'
                ? 'ml-auto bg-white/10 text-white rounded-br-sm'
                : 'mr-auto text-white rounded-bl-sm'
            )}
            style={entry.role === 'bot' ? { backgroundColor: `${primaryColor}33` } : undefined}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.text) }}
          />
        ))}
        <div ref={conversationEndRef} />
      </div>

      {/* Status Text */}
      <div className="text-center pb-4">
        <p className="text-xs text-white/30 font-mono">
          {isMuted ? '🔇 Micrófono silenciado' : callState === 'thinking' ? '🧠 Pensando...' : callState === 'speaking' ? '🔊 Respuesta de voz' : '🎤 Habla cuando quieras'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-8 pb-8">
        {/* Mute button */}
        <button
          onClick={toggleMute}
          className={cn(
            'h-14 w-14 rounded-full flex items-center justify-center transition-all',
            isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70 hover:bg-white/15'
          )}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>

        {/* End call button */}
        <button
          onClick={endCall}
          className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg hover:bg-red-600 transition-all active:scale-95"
        >
          <PhoneOff className="h-7 w-7" />
        </button>

        {/* Speaker indicator */}
        <div
          className={cn(
            'h-14 w-14 rounded-full flex items-center justify-center',
            callState === 'speaking' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/70'
          )}
        >
          <Volume2 className={cn('h-6 w-6', callState === 'speaking' && 'animate-pulse')} />
        </div>
      </div>
    </div>
  )
}
