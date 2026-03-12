/**
 * @package @botuyo/chat-widget
 * Voice Call Overlay Component
 *
 * Real-time voice call overlay using Gemini Live API via Socket.IO.
 * Sends raw PCM 16kHz audio chunks and receives PCM 24kHz audio responses.
 *
 * Flow: User Mic (PCM 16kHz) → Socket.IO → Backend → Gemini Live API → 
 *       PCM 24kHz audio → Socket.IO → Web Audio API playback
 */

'use client'

import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, Component, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PhoneOff, Mic, MicOff, Volume2, Keyboard, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import type { EmotionAvatarMap } from './Launcher'
import { DEFAULT_AVATAR_URL } from '../utils/defaultAssets'

// Lazy-loaded 3D avatar — separate chunk, 0KB impact on main bundle
const Avatar3D = lazy(() => import('./Avatar3D'))

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
  /** URL to a .vrm/.glb 3D model. When set, replaces 2D avatar with 3D. */
  avatar3dUrl?: string
}

interface VoiceCallOverlayProps {
  isOpen: boolean
  onClose: () => void
  primaryColor?: string
  getSocket?: () => any
  avatars?: EmotionAvatarMap
  logoUrl?: string
  /** URL to a .vrm/.glb 3D model for the avatar */
  avatar3dUrl?: string
  /** Voice overlay configuration for full customizability */
  voiceConfig?: VoiceOverlayConfig
  /** Callback to persist voice transcripts to the main chat history */
  onAddMessage?: (message: { sender: 'user' | 'bot'; content: string; timestamp?: Date }) => void
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

/** Sanitize config for voice transcript markdown */
const voiceSanitizeSchema = {
  tagNames: ['p', 'a', 'img', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'span', 'code', 'hr'],
  attributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt'],
    span: ['className'],
    code: ['className'],
  },
  protocols: {
    a: { href: ['http', 'https', 'mailto', 'tel'] },
    img: { src: ['http', 'https', 'data'] },
  },
}

const INPUT_SAMPLE_RATE = 16000
const OUTPUT_SAMPLE_RATE = 24000
const INACTIVITY_TIMEOUT_SECONDS = 120 // 2 minutes of silence → auto-end
const INACTIVITY_WARNING_SECONDS = 90  // Warn at 1:30 of silence

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
  avatar3dUrl?: string
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
  avatar3dUrl?: string
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
    showBadge: cfg?.showBadge ?? false,
    badgeText: cfg?.badgeText ?? '',
    emotionEmojis: { ...DEFAULT_EMOTION_EMOJIS, ...(cfg?.emotionEmojis as Record<string, string> | undefined) },
    statusLabels: { ...DEFAULT_STATUS_LABELS, ...(cfg?.statusLabels as Record<CallState, string> | undefined) },
    orbSize: cfg?.orbSize ?? 128,
    speakingScale: cfg?.speakingScale ?? 1.08,
    thinkingScale: cfg?.thinkingScale ?? 0.95,
    avatar3dUrl: cfg?.avatar3dUrl,
  }
}

/** Error boundary for Avatar3D — falls back silently when Three.js fails */
class Avatar3DErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error) {
    console.warn('[Avatar3D] Three.js failed, falling back to 2D orb:', error.message)
    this.props.onError()
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function AvatarOrb({ avatars, logoUrl, avatar3dUrl, emotion, callState, audioLevel, config }: AvatarOrbProps) {
  const hasAvatars = avatars && Object.keys(avatars).length > 0
  const hasLogo = !!logoUrl
  const [avatar3dFailed, setAvatar3dFailed] = useState(false)

  // ── ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ──
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

  // ── 3D AVATAR PATH (lazy loaded, with graceful fallback) ──
  if (avatar3dUrl && !avatar3dFailed) {
    return (
      <div className="relative flex flex-col items-center gap-4">
        <Avatar3DErrorBoundary onError={() => setAvatar3dFailed(true)}>
          <Suspense
            fallback={
              <div
                className="rounded-full flex items-center justify-center animate-pulse"
                style={{
                  width: `${config.orbSize}px`,
                  height: `${config.orbSize}px`,
                  background: `radial-gradient(circle at 35% 35%, ${config.speakingColor}40, ${config.speakingColor}10 60%, transparent 80%)`,
                  boxShadow: `0 0 30px ${config.speakingColor}15`,
                }}
              />
            }
          >
            <Avatar3D
              modelUrl={avatar3dUrl}
              emotion={emotion}
              callState={callState}
              audioLevel={audioLevel}
              primaryColor={config.speakingColor}
              size={config.orbSize}
            />
          </Suspense>
        </Avatar3DErrorBoundary>
        {config.showWaveform && (
          <WaveformBars
            isActive={callState === 'listening' || callState === 'speaking'}
            audioLevel={audioLevel}
            color={callState === 'speaking' ? config.speakingColor : callState === 'thinking' ? config.thinkingColor : config.listeningColor}
          />
        )}
      </div>
    )
  }

  // If no avatar configured, show premium animated orb
  if (!avatarUrl) {
    return (
      <div className="relative flex flex-col items-center gap-6">
        {/* Orbital rings */}
        <div className="relative" style={{ width: `${orbPx + 48}px`, height: `${orbPx + 48}px` }}>
          {/* Outer orbit */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: `1.5px solid ${glowColor}20`,
              animation: isActive ? 'spin 8s linear infinite' : 'none',
            }}
          />
          {/* Middle orbit */}
          <div
            className="absolute rounded-full"
            style={{
              inset: '12px',
              border: `1px solid ${glowColor}15`,
              animation: isActive ? 'spin 12s linear infinite reverse' : 'none',
            }}
          />
          {/* Center orb */}
          <div
            className="absolute rounded-full flex items-center justify-center"
            style={{
              inset: '24px',
              background: `radial-gradient(circle at 35% 35%, ${glowColor}40, ${glowColor}10 60%, transparent 80%)`,
              boxShadow: isActive
                ? `0 0 60px ${glowColor}35, 0 0 120px ${glowColor}15, inset 0 0 40px ${glowColor}10`
                : `0 0 30px ${glowColor}15`,
              transform: `scale(${scale})`,
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Inner glow dot */}
            <div
              className="rounded-full"
              style={{
                width: `${orbPx * 0.35}px`,
                height: `${orbPx * 0.35}px`,
                background: `radial-gradient(circle, ${glowColor}90, ${glowColor}40)`,
                boxShadow: `0 0 20px ${glowColor}60`,
                animation: isActive ? 'pulse 2s ease-in-out infinite' : 'none',
              }}
            />
          </div>
          {/* Orbiting dots */}
          {isActive && [0, 1, 2].map(i => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: '4px',
                height: '4px',
                backgroundColor: glowColor,
                opacity: 0.6,
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 120 + (Date.now() / 20) % 360}deg) translateX(${(orbPx + 48) / 2}px)`,
                animation: `spin ${6 + i * 2}s linear infinite`,
                boxShadow: `0 0 6px ${glowColor}`,
              }}
            />
          ))}
        </div>
        {/* Waveform bars */}
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

/** Reusable waveform bars component — premium style */
function WaveformBars({ isActive, audioLevel, color }: { isActive: boolean; audioLevel: number; color: string }) {
  return (
    <div className="flex items-center gap-[3px] h-10">
      {Array.from({ length: 12 }).map((_, i) => {
        const center = 5.5
        const dist = Math.abs(i - center) / center
        const h = isActive
          ? Math.max(4, audioLevel * 40 * (1 - dist * 0.5) * (0.5 + Math.sin(Date.now() / 100 + i * 0.8) * 0.5))
          : 4
        return (
          <div key={i} className="rounded-full transition-all duration-100"
            style={{
              width: '3px',
              height: `${h}px`,
              backgroundColor: color,
              opacity: isActive ? 0.7 - dist * 0.3 : 0.2,
            }} />
        )
      })}
    </div>
  )
}

export function VoiceCallOverlay({
  isOpen,
  onClose,
  primaryColor = '#10b981',
  getSocket,
  avatars,
  logoUrl,
  avatar3dUrl,
  voiceConfig,
  onAddMessage,
}: VoiceCallOverlayProps) {
  // Resolve all config defaults once
  const cfg = useMemo(() => resolveVoiceConfig(voiceConfig, primaryColor), [voiceConfig, primaryColor])

  const [callState, setCallState] = useState<CallState>('idle')
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null)
  const [conversation, setConversation] = useState<VoiceEntry[]>([])
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInputValue, setTextInputValue] = useState('')
  const [timeoutWarning, setTimeoutWarning] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const socketListenersRef = useRef(false)
  const processorUrlRef = useRef<string | null>(null)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const endCallRef = useRef<() => void>(() => {})
  const inactivityRef = useRef<NodeJS.Timeout | null>(null)
  const inactivitySecondsRef = useRef(0)

  // Audio playback — gapless scheduling
  const playbackCtxRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<Float32Array[]>([])
  const isPlayingRef = useRef(false)
  const nextPlayTimeRef = useRef(0) // Schedule cursor for gapless playback
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([])

  // Format duration as MM:SS
  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // ═══════════════════════════════════════
  // AUDIO PLAYBACK — Gapless PCM 24kHz scheduling
  // ═══════════════════════════════════════
  const scheduleChunks = useCallback(() => {
    if (audioQueueRef.current.length === 0) return

    if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
      playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE })
    }

    // Resume if suspended (browsers suspend AudioContexts not created during user gesture)
    if (playbackCtxRef.current.state === 'suspended') {
      playbackCtxRef.current.resume().catch(() => {})
    }

    const ctx = playbackCtxRef.current
    isPlayingRef.current = true
    setCallState('speaking')

    // Ensure the schedule cursor is at least "now"
    const now = ctx.currentTime
    if (nextPlayTimeRef.current < now) {
      nextPlayTimeRef.current = now
    }

    // Schedule all queued chunks back-to-back
    while (audioQueueRef.current.length > 0) {
      const float32Data = audioQueueRef.current.shift()!
      const buffer = ctx.createBuffer(1, float32Data.length, OUTPUT_SAMPLE_RATE)
      buffer.getChannelData(0).set(float32Data)

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start(nextPlayTimeRef.current)

      // Track active sources for cleanup on interrupt
      activeSourcesRef.current.push(source)
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source)
        // When the last source finishes and no more queued → back to listening
        if (activeSourcesRef.current.length === 0 && audioQueueRef.current.length === 0) {
          isPlayingRef.current = false
          setCallState(prev => prev === 'speaking' ? 'listening' : prev)
        }
      }

      // Advance cursor by chunk duration (samples / sampleRate)
      nextPlayTimeRef.current += float32Data.length / OUTPUT_SAMPLE_RATE
    }
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
    voiceUserTranscriptFinal?: (d: any) => void
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
      // Schedule immediately — gapless scheduling handles timing
      scheduleChunks()
      // Reset inactivity — agent is speaking
      resetInactivityTimer()
    }

    const onVoiceInterrupted = () => {
      // Barge-in: stop all scheduled sources + clear queue
      activeSourcesRef.current.forEach(s => { try { s.stop() } catch {} })
      activeSourcesRef.current = []
      audioQueueRef.current.length = 0
      nextPlayTimeRef.current = 0
      isPlayingRef.current = false
      setCallState('listening')
    }

    const onVoiceTurnComplete = () => {
      // Model finished speaking, playback may still be in queue
    }

    const onVoiceError = (data: any) => {
      console.error('[VoiceCall] Voice error:', data)
    }

    const onVoiceTimeout = () => {
      // Server forced the session to end
      endCallRef.current()
    }

    const onVoiceEmotion = (data: { emotion: string }) => {
      if (data?.emotion) {
        setCurrentEmotion(data.emotion)
        setTimeout(() => setCurrentEmotion(prev => prev === data.emotion ? null : prev), 4000)
      }
    }

    const onVoiceUserTranscript = (data: { text: string }) => {
      if (!data?.text) return
      resetInactivityTimer() // User is speaking
      setConversation(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'user') {
          const updated = [...prev]
          const existing = updated[updated.length - 1].text
          // Add space between fragments if neither ends/starts with one
          const needsSpace = existing.length > 0 && !existing.endsWith(' ') && !data.text.startsWith(' ')
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: existing + (needsSpace ? ' ' : '') + data.text }
          return updated
        }
        return [...prev, { role: 'user', text: data.text }]
      })
    }

    // Final consolidated user transcript — replaces the streaming fragments with clean text
    const onVoiceUserTranscriptFinal = (data: { text: string }) => {
      if (!data?.text) return
      setConversation(prev => {
        // Find the last user entry and replace its text with the clean version
        const lastUserIdx = prev.map(e => e.role).lastIndexOf('user')
        if (lastUserIdx >= 0) {
          const updated = [...prev]
          updated[lastUserIdx] = { ...updated[lastUserIdx], text: data.text }
          return updated
        }
        // If no user entry exists (edge case), add one
        return [...prev, { role: 'user', text: data.text }]
      })
    }

    const onVoiceModelTranscript = (data: { text: string }) => {
      if (!data?.text) return
      resetInactivityTimer() // Agent is responding
      setConversation(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'bot') {
          const updated = [...prev]
          const existing = updated[updated.length - 1].text
          // Add space between fragments if neither ends/starts with one
          const needsSpace = existing.length > 0 && !existing.endsWith(' ') && !data.text.startsWith(' ')
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: existing + (needsSpace ? ' ' : '') + data.text }
          return updated
        }
        return [...prev, { role: 'bot', text: data.text }]
      })
    }

    const onVoiceModelThinking = () => {
      setCallState('thinking')
      resetInactivityTimer() // Agent is processing
    }

    voiceListenersRef.current = {
      voiceReady: onVoiceReady,
      voiceAudioChunk: onVoiceAudioChunk,
      voiceInterrupted: onVoiceInterrupted,
      voiceTurnComplete: onVoiceTurnComplete,
      voiceError: onVoiceError,
      voiceEmotion: onVoiceEmotion,
      voiceUserTranscript: onVoiceUserTranscript,
      voiceUserTranscriptFinal: onVoiceUserTranscriptFinal,
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
    socket.on('voice_user_transcript_final', onVoiceUserTranscriptFinal)
    socket.on('voice_model_transcript', onVoiceModelTranscript)
    socket.on('voice_model_thinking', onVoiceModelThinking)
    socket.on('voice_timeout', onVoiceTimeout)

    socketListenersRef.current = true
  }, [getSocket, scheduleChunks])

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
    if (l.voiceUserTranscriptFinal) socket.off('voice_user_transcript_final', l.voiceUserTranscriptFinal)
    if (l.voiceModelTranscript) socket.off('voice_model_transcript', l.voiceModelTranscript)
    if (l.voiceModelThinking) socket.off('voice_model_thinking', l.voiceModelThinking)
    socket.off('voice_timeout')

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
    // Resume mic AudioContext — required by some browsers
    if (ctx.state === 'suspended') await ctx.resume()
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

    // Pre-create playback AudioContext during user gesture (click)
    // This prevents the browser from suspending it when audio arrives via socket
    if (!playbackCtxRef.current || playbackCtxRef.current.state === 'closed') {
      playbackCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE })
    }
    // Explicitly resume — some browsers need this even on user gesture
    playbackCtxRef.current.resume().catch(() => {})

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

    // Duration counter (display only)
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1)
    }, 1000)

    // Start inactivity timeout
    startInactivityTimer()
  }, [getSocket, setupSocketListeners, startMicCapture])

  const endCall = useCallback(() => {
    // Stop mic
    stopMicCapture()

    // Stop all scheduled audio sources
    activeSourcesRef.current.forEach(s => { try { s.stop() } catch {} })
    activeSourcesRef.current = []
    audioQueueRef.current = []
    nextPlayTimeRef.current = 0
    isPlayingRef.current = false
    playbackCtxRef.current?.close()
    playbackCtxRef.current = null

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    // Clear inactivity timeout
    if (inactivityRef.current) {
      clearInterval(inactivityRef.current)
      inactivityRef.current = null
    }

    // Notify backend
    const socket = getSocket?.()
    if (socket?.connected) socket.emit('voice_stop')

    // Persist voice transcripts to main chat history
    // Assign incremental timestamps (1s apart) so the MessageList grouping logic
    // correctly separates user↔bot turns instead of collapsing them (overlap fix)
    if (onAddMessage && conversation.length > 0) {
      const baseTime = Date.now() - conversation.length * 1000
      conversation.forEach((entry, i) => {
        onAddMessage({
          sender: entry.role === 'user' ? 'user' : 'bot',
          content: entry.text,
          timestamp: new Date(baseTime + i * 1000),
        })
      })
    }

    // Cleanup
    removeSocketListeners()
    setCallState('idle')
    setAudioLevel(0)
    setDuration(0)
    setIsMuted(false)
    setConversation([])
    setTimeoutWarning(false)

    onClose()
  }, [getSocket, stopMicCapture, removeSocketListeners, onClose, onAddMessage, conversation])

  // Keep endCallRef synced so the inactivity timer doesn't capture stale closure
  useEffect(() => {
    endCallRef.current = endCall
  }, [endCall])

  // ═══════════════════════════════════════
  // INACTIVITY TIMEOUT — reset on any voice activity
  // ═══════════════════════════════════════
  const resetInactivityTimer = useCallback(() => {
    inactivitySecondsRef.current = 0
    setTimeoutWarning(false)
  }, [])

  const startInactivityTimer = useCallback(() => {
    inactivitySecondsRef.current = 0
    if (inactivityRef.current) clearInterval(inactivityRef.current)
    inactivityRef.current = setInterval(() => {
      inactivitySecondsRef.current += 1
      const idle = inactivitySecondsRef.current
      if (idle >= INACTIVITY_WARNING_SECONDS && idle < INACTIVITY_TIMEOUT_SECONDS) {
        setTimeoutWarning(true)
      }
      if (idle >= INACTIVITY_TIMEOUT_SECONDS) {
        endCallRef.current()
      }
    }, 1000)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  /** Send typed text to the voice session via socket */
  const sendTextInput = useCallback(() => {
    const text = textInputValue.trim()
    if (!text) return
    const socket = getSocket?.()
    if (!socket?.connected) return

    socket.emit('voice_text_input', { text })
    setTextInputValue('')
    setShowTextInput(false)
  }, [textInputValue, getSocket])

  // Start call when overlay opens
  useEffect(() => {
    if (isOpen && callState === 'idle') {
      startCall()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Auto-scroll conversation to bottom
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

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

  // Derive state-based colors
  const stateColor = callState === 'speaking' ? cfg.speakingColor
    : callState === 'thinking' ? cfg.thinkingColor
    : callState === 'listening' ? cfg.listeningColor
    : primaryColor

  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex flex-col overflow-hidden',
        'animate-in fade-in duration-300'
      )}
      style={{ backgroundColor: '#0a0a0f', borderRadius: 'inherit' }}
    >
      {/* Ambient gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'hidden' }}>
        <div
          className="absolute rounded-full"
          style={{
            width: '300px',
            height: '300px',
            top: '-80px',
            right: '-60px',
            background: `radial-gradient(circle, ${stateColor}18 0%, transparent 70%)`,
            transition: 'background 1.5s ease',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '250px',
            height: '250px',
            bottom: '-40px',
            left: '-50px',
            background: `radial-gradient(circle, ${cfg.thinkingColor}12 0%, transparent 70%)`,
            filter: 'blur(50px)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '200px',
            height: '200px',
            top: '40%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: `radial-gradient(circle, ${stateColor}10 0%, transparent 70%)`,
            transition: 'background 1.5s ease',
            filter: 'blur(60px)',
          }}
        />
      </div>

      {/* Header — glassmorphism bar */}
      <div
        className="relative flex items-center justify-between"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 24px',
          paddingTop: '20px',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: stateColor,
                boxShadow: `0 0 8px ${stateColor}80`,
                animation: callState !== 'idle' ? 'pulse 2s ease-in-out infinite' : 'none',
              }}
            />
          </div>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 500, letterSpacing: '-0.01em' }}>
            {cfg.statusLabels[callState] || callState}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {cfg.showEmotionLabel && currentEmotion && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '20px',
                background: `${stateColor}15`,
                border: `1px solid ${stateColor}25`,
                color: stateColor,
                fontWeight: 600,
              }}
            >
              {cfg.showEmojis && (cfg.emotionEmojis[currentEmotion] || '💬')} {currentEmotion}
            </span>
          )}
          <span style={{
            fontSize: '13px',
            fontFamily: 'ui-monospace, monospace',
            color: 'rgba(255,255,255,0.4)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatDuration(duration)}
          </span>
          {timeoutWarning && (() => {
            const remaining = INACTIVITY_TIMEOUT_SECONDS - inactivitySecondsRef.current
            const isUrgent = remaining <= 15
            return (
              <span style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)',
                color: isUrgent ? '#ef4444' : '#f59e0b',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                animation: isUrgent ? 'pulse 1s ease-in-out infinite' : 'none',
              }}>
                ⏸ Inactivo — {remaining > 0 ? remaining : 0}s
              </span>
            )
          })()}
        </div>
      </div>

      {/* Badge — only if explicitly enabled */}
      {cfg.showBadge && cfg.badgeText && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <span style={{
            padding: '4px 14px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${primaryColor}, ${cfg.thinkingColor})`,
            color: 'white',
          }}>
            {cfg.badgeText}
          </span>
        </div>
      )}

      {/* Main content — Avatar always on top + last 2 messages below */}
      <div className="relative flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex flex-col items-center justify-start h-full gap-4">
          {/* Avatar — always visible */}
          <AvatarOrb
            avatars={avatars}
            logoUrl={logoUrl}
            avatar3dUrl={avatar3dUrl || cfg.avatar3dUrl}
            emotion={currentEmotion}
            callState={callState}
            audioLevel={audioLevel}
            config={cfg}
          />

          {/* Full scrollable conversation */}
          {conversation.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {conversation.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: entry.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '13.5px',
                    lineHeight: 1.5,
                    color: 'white',
                    marginLeft: entry.role === 'user' ? 'auto' : '0',
                    marginRight: entry.role === 'user' ? '0' : 'auto',
                    backgroundColor: entry.role === 'user'
                      ? 'rgba(255,255,255,0.08)'
                      : `${primaryColor}25`,
                    backdropFilter: 'blur(8px)',
                    border: entry.role === 'user'
                      ? '1px solid rgba(255,255,255,0.08)'
                      : `1px solid ${primaryColor}20`,
                  }}
                >
                  <div className="prose prose-sm prose-invert max-w-none break-words leading-relaxed" style={{ fontSize: '13.5px' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[[rehypeSanitize, voiceSanitizeSchema]]}
                      components={{
                        p: ({ children }) => <p style={{ margin: '0 0 4px' }}>{children}</p>,
                        a: ({ href, children }) => {
                          if (!href) return null
                          const textContent = String(children).toLowerCase()
                          const isCTA = textContent.includes('reservar') || textContent.includes('ver') || textContent.includes('pagar')
                          const isGoogleMaps = href.includes('maps.google') || href.includes('goo.gl') || href.includes('google.com/maps')

                          if (isGoogleMaps) {
                            return (
                              <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', margin: '6px 0', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: primaryColor, textDecoration: 'none', fontSize: '12px', fontWeight: 700 }}>
                                📍 Ver ubicación
                              </a>
                            )
                          }

                          if (isCTA) {
                            return (
                              <a href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 16px', margin: '6px 0', borderRadius: '10px', background: primaryColor, color: 'white', textDecoration: 'none', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase' as const, width: '100%', textAlign: 'center' as const }}>
                                {children} →
                              </a>
                            )
                          }

                          return (
                            <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: primaryColor, textDecoration: 'underline', fontWeight: 600 }}>
                              {children}
                            </a>
                          )
                        },
                        strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{children}</strong>,
                        em: ({ children }) => <em style={{ color: 'rgba(255,255,255,0.8)' }}>{children}</em>,
                        ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ul>,
                        ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ol>,
                        li: ({ children }) => <li style={{ marginBottom: '2px' }}>{children}</li>,
                        hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />,
                        img: ({ src, alt }) => (
                          <img src={src} alt={alt || ''} style={{ maxWidth: '100%', borderRadius: '8px', margin: '6px 0' }} />
                        ),
                        code: ({ children }) => (
                          <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px', fontSize: '12px' }}>
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {entry.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={conversationEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Status pill */}
      <div style={{ textAlign: 'center', paddingBottom: '12px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 16px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.35)',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          letterSpacing: '0.02em',
        }}>
          {isMuted ? (
            <><MicOff style={{ width: '12px', height: '12px' }} /> Micrófono silenciado</>
          ) : callState === 'thinking' ? (
            'Procesando...'
          ) : callState === 'speaking' ? (
            <><Volume2 style={{ width: '12px', height: '12px' }} /> Respuesta de voz</>
          ) : (
            'Habla cuando quieras'
          )}
        </span>
      </div>

      {/* Controls — glassmorphism bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
          paddingBottom: '28px',
          paddingTop: '8px',
        }}
      >
        {/* Mute button */}
        <button
          onClick={toggleMute}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            backgroundColor: isMuted ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
            color: isMuted ? '#f87171' : 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
          }}
          aria-label={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
        >
          {isMuted ? <MicOff style={{ width: '22px', height: '22px' }} /> : <Mic style={{ width: '22px', height: '22px' }} />}
        </button>

        {/* End call button — prominent red */}
        <button
          onClick={endCall}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ef4444',
            color: 'white',
            boxShadow: '0 4px 24px rgba(239,68,68,0.4), 0 0 0 4px rgba(239,68,68,0.1)',
            transition: 'all 0.2s',
          }}
          aria-label="Finalizar llamada"
        >
          <PhoneOff style={{ width: '26px', height: '26px' }} />
        </button>

        {/* Speaker indicator */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: callState === 'speaking' ? `${cfg.listeningColor}15` : 'rgba(255,255,255,0.08)',
            color: callState === 'speaking' ? cfg.listeningColor : 'rgba(255,255,255,0.5)',
            border: `1px solid ${callState === 'speaking' ? `${cfg.listeningColor}25` : 'rgba(255,255,255,0.08)'}`,
            transition: 'all 0.3s',
          }}
        >
          <Volume2 style={{ width: '22px', height: '22px' }} />
        </div>

        {/* Keyboard button */}
        <button
          onClick={() => setShowTextInput(prev => !prev)}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            backgroundColor: showTextInput ? `${primaryColor}20` : 'rgba(255,255,255,0.08)',
            color: showTextInput ? primaryColor : 'rgba(255,255,255,0.5)',
            border: `1px solid ${showTextInput ? `${primaryColor}30` : 'rgba(255,255,255,0.08)'}`,
          }}
          aria-label="Escribir texto"
        >
          <Keyboard style={{ width: '20px', height: '20px' }} />
        </button>
      </div>

      {/* Text input fallback — for structured data */}
      {showTextInput && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px 20px',
        }}>
          <input
            type="text"
            value={textInputValue}
            onChange={e => setTextInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendTextInput()}
            placeholder="Escribí email, teléfono, etc."
            autoFocus
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: 'white',
              fontSize: '13px',
              outline: 'none',
              backdropFilter: 'blur(8px)',
            }}
          />
          <button
            onClick={sendTextInput}
            disabled={!textInputValue.trim()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              cursor: textInputValue.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: textInputValue.trim() ? primaryColor : 'rgba(255,255,255,0.06)',
              color: textInputValue.trim() ? 'white' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.2s',
            }}
            aria-label="Enviar texto"
          >
            <Send style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      )}

      {/* CSS keyframes for orbital animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
      `}</style>
    </div>
  )
}
