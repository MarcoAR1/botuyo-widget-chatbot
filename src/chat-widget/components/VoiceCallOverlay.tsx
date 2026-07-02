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

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  lazy,
  Suspense,
  Component,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import { logger } from '../utils/logger'
import { PhoneOff, Mic, MicOff, Volume2, Keyboard, Send } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import type { EmotionAvatarMap } from './Launcher'
import {
  ENHANCED_AUDIO_CONSTRAINTS,
  createEnhancementChain,
  buildVoiceProcessorCode,
  resolveVoiceGateConfig,
  type VoiceGateConfig,
  type VoiceGateSetting,
} from '../voice/audioEnhancement'
import {
  VadGate,
  resolveVadGateConfig,
  resolveVadInput,
  resolveSpeechFlag,
  resolveShouldStream,
  resolveBotSpeaking,
  type VadGateConfig,
  type VadGateSetting,
} from '../voice/vadGate'
import { createSpeechDetector, type ISpeechDetector } from '../voice/speechDetector'
import { useWakeLock } from '../hooks/useWakeLock'

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
  /**
   * Background-noise gate sensitivity for the live voice call — isolates the
   * speaker in front of the device by attenuating background ambience/chatter
   * during their pauses. Higher = filters more background but risks clipping a
   * soft speaker. Default: 'standard' (recommended).
   * - `'off' | 'low' | 'standard' | 'high'` presets, or
   * - `false` to disable / `true` for standard, or
   * - a partial `VoiceGateConfig` to fine-tune the raw thresholds.
   */
  noiseGate?: VoiceGateSetting
  /**
   * Client-side voice activity detection (Silero VAD) — provider-agnostic. The
   * gate streams ONLY a real, near-field ("clear & frontal") voice to the
   * provider, so background noise and distant chatter never trigger it, while the
   * user can always barge in over the bot with a clear voice. Silero loads lazily
   * at call time; on any failure it degrades to the near-field energy gate.
   * - omit / `'standard'` → on, balanced thresholds (recommended)
   * - `'low'` | `'high'` → sensitivity preset
   * - a partial `VadGateConfig` → fine-tune raw thresholds
   * - `false` → disable VAD (near-field energy gate only)
   */
  vad?: false | VadGateSetting
  /** Override the Silero model/runtime asset base URL (strict CSP / self-host). */
  vadAssetBaseUrl?: string
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
  /**
   * Fired when the SERVER ends the call (voice_call_ended), e.g. a recruiting
   * interview the agent finalized. `reason` carries the backend reason
   * (e.g. 'interview_completed'). Lets a host (voice-first room) react.
   */
  onCallEnded?: (reason?: string) => void
}

type CallState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking'

interface VoiceEntry {
  role: 'user' | 'bot'
  text: string
  /** Interactive quiz buttons — rendered as clickable options */
  quizButtons?: { id: string; label: string }[]
  /**
   * When true, a following `voice_model_transcript` starts a NEW bubble instead of
   * being appended onto this one. Set for tool renders (quiz, content cards) and
   * system notices (agent switch) so the agent's spoken line never gets glued to
   * the tool output ("todo pegado").
   */
  standalone?: boolean
}

/**
 * Active-agent avatar identity carried by `voice_ready` (every call start) and
 * `voice_agent_switched` (live transfer). Mirrors the backend VoiceSessionConfig.agentAvatar
 * and the connection_ack avatar fields, so the overlay can show the ACTIVE agent's avatar
 * independently of the (possibly stale) connect-time props.
 */
interface VoiceAgentAvatar {
  avatars?: EmotionAvatarMap | null
  logoUrl?: string | null
  avatar3dUrl?: string | null
}

const DEFAULT_EMOTION_EMOJIS: Record<string, string> = {
  happy: '😊',
  wink: '😉',
  thinking: '🤔',
  sad: '😢',
  excited: '🤩',
  love: '❤️',
  laugh: '😄',
  surprised: '😲',
  angry: '😠',
  confused: '😕',
  sorry: '😔',
  default: '💬',
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
const INACTIVITY_WARNING_SECONDS = 90 // Warn at 1:30 of silence
// After a call ends, wait briefly for the backend to persist the FINAL voice turn (async),
// then pull the authoritative transcript (request_history) so the chat reflects the call.
const HISTORY_REFRESH_DELAY_MS = 1500

// The AudioWorklet processor source for PCM capture at 16kHz is built by
// buildVoiceProcessorCode() (see ../voice/audioEnhancement). It applies a
// VAD-safe, continuous-stream downward-expander gate: every 100ms frame is
// STILL posted (so Gemini Live's server-side VAD keeps detecting speech
// onset/offset), but background ambience/chatter that leaks in during the
// user's pauses is attenuated toward a low floor instead of being streamed at
// full level — isolating the speaker in front of the device.

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
  voiceGate: VoiceGateConfig
  vad: false | VadGateConfig
  vadAssetBaseUrl?: string
}

function resolveVoiceConfig(
  cfg?: VoiceOverlayConfig,
  primaryColor = '#10b981'
): Required_VoiceOverlayConfig {
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
    emotionEmojis: {
      ...DEFAULT_EMOTION_EMOJIS,
      ...(cfg?.emotionEmojis as Record<string, string> | undefined),
    },
    statusLabels: {
      ...DEFAULT_STATUS_LABELS,
      ...(cfg?.statusLabels as Record<CallState, string> | undefined),
    },
    orbSize: cfg?.orbSize ?? 128,
    speakingScale: cfg?.speakingScale ?? 1.08,
    thinkingScale: cfg?.thinkingScale ?? 0.95,
    avatar3dUrl: cfg?.avatar3dUrl,
    voiceGate: resolveVoiceGateConfig(cfg?.noiseGate),
    vad: cfg?.vad === false ? false : resolveVadGateConfig(cfg?.vad),
    vadAssetBaseUrl: cfg?.vadAssetBaseUrl,
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
    logger.warn('[Avatar3D] Three.js failed, falling back to 2D orb:', error.message)
    this.props.onError()
  }
  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

function AvatarOrb({
  avatars,
  logoUrl,
  avatar3dUrl,
  emotion,
  callState,
  audioLevel,
  config,
}: AvatarOrbProps) {
  const hasAvatars = avatars && Object.keys(avatars).length > 0
  const hasLogo = !!logoUrl
  const [avatar3dFailed, setAvatar3dFailed] = useState(false)

  // ── ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS ──
  // Resolve avatar URL from emotion — same logic as Launcher
  const avatarUrl = useMemo(() => {
    if (!hasAvatars && !hasLogo) return null
    if (hasAvatars) {
      const emotionKey = (emotion || 'default') as keyof EmotionAvatarMap
      return avatars![emotionKey] || avatars!.default || logoUrl || null
    }
    return logoUrl || null
  }, [hasAvatars, hasLogo, avatars, emotion, logoUrl])

  const isActive = callState === 'listening' || callState === 'speaking'
  const glowColor =
    callState === 'speaking'
      ? config.speakingColor
      : callState === 'thinking'
        ? config.thinkingColor
        : callState === 'listening'
          ? config.listeningColor
          : '#ffffff20'

  const scale =
    callState === 'speaking'
      ? config.speakingScale
      : callState === 'thinking'
        ? config.thinkingScale
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
            color={
              callState === 'speaking'
                ? config.speakingColor
                : callState === 'thinking'
                  ? config.thinkingColor
                  : config.listeningColor
            }
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
          {isActive &&
            [0, 1, 2].map(i => (
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
                  transform: `rotate(${i * 120}deg) translateX(${(orbPx + 48) / 2}px)`,
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
          'transition-all duration-500 ease-out'
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
            callState === 'thinking' && 'opacity-80'
          )}
          style={{
            boxShadow:
              callState === 'listening'
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
function WaveformBars({
  isActive,
  audioLevel,
  color,
}: {
  isActive: boolean
  audioLevel: number
  color: string
}) {
  return (
    <div className="flex items-center gap-[3px] h-10">
      {Array.from({ length: 12 }).map((_, i) => {
        const center = 5.5
        const dist = Math.abs(i - center) / center
        const h = isActive
          ? Math.max(4, audioLevel * 40 * (1 - dist * 0.5) * (0.5 + Math.sin(i * 0.8) * 0.5))
          : 4
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-100"
            style={{
              width: '3px',
              height: `${h}px`,
              backgroundColor: color,
              opacity: isActive ? 0.7 - dist * 0.3 : 0.2,
            }}
          />
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
  onCallEnded,
}: VoiceCallOverlayProps) {
  // Resolve all config defaults once
  const cfg = useMemo(
    () => resolveVoiceConfig(voiceConfig, primaryColor),
    [voiceConfig, primaryColor]
  )

  // Keep the screen awake for the whole time the call overlay is open — the user
  // is watching the screen (avatar, quiz options, transcript) without touching it,
  // so the device must not dim/blank as it normally would.
  useWakeLock(isOpen)

  const [callState, setCallState] = useState<CallState>('idle')
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null)
  const [conversation, setConversation] = useState<VoiceEntry[]>([])
  const [showTextInput, setShowTextInput] = useState(false)
  const [textInputValue, setTextInputValue] = useState('')
  const [timeoutWarning, setTimeoutWarning] = useState(false)
  /** Display name of the agent after an in-call transfer (transfer_to_department in voice) */
  const [switchedAgentName, setSwitchedAgentName] = useState<string | null>(null)
  // ── Active-agent avatar identity (hardening) ──
  // Seeded from the connect-time props (connection_ack), but OVERRIDDEN by the avatar the server
  // sends in voice_ready / voice_agent_switched so the orb always reflects the ACTIVE agent —
  // even after a mid-session switch + re-call without a page reload. `avatarOverridden` flips on
  // the first server-provided identity; until then the (correct, on first connect) props win.
  const [overrideAvatars, setOverrideAvatars] = useState<EmotionAvatarMap | undefined>(undefined)
  const [overrideLogoUrl, setOverrideLogoUrl] = useState<string | undefined>(undefined)
  const [overrideAvatar3dUrl, setOverrideAvatar3dUrl] = useState<string | undefined>(undefined)
  const [avatarOverridden, setAvatarOverridden] = useState(false)

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

  // ── Client-side VAD (Silero) — provider-agnostic speech gate ──
  // The pure speech/noise + barge-in policy lives in VadGate; the detector lazily
  // loads Silero and feeds per-frame probabilities into latestSpeechProbRef.
  const vadGateRef = useRef<VadGate | null>(null)
  const speechDetectorRef = useRef<ISpeechDetector | null>(null)
  // 1 = "assume speech": BEFORE Silero loads (or if it never loads / goes stale)
  // the gate degrades to a pure near-field energy gate instead of muting the user.
  const latestSpeechProbRef = useRef(1)
  const lastVadFrameAtRef = useRef(0)

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
          setCallState(prev => (prev === 'speaking' ? 'listening' : prev))
        }
      }

      // Advance cursor by chunk duration (samples / sampleRate)
      nextPlayTimeRef.current += float32Data.length / OUTPUT_SAMPLE_RATE
    }
  }, [])

  // Stop + clear ALL bot playback immediately. Shared by the provider-driven
  // interrupt (voice_interrupted) and client-side barge-in: when VadGate detects
  // a clear, frontal voice over the bot we cut playback locally for instant
  // feedback instead of waiting for the provider round-trip.
  const flushPlayback = useCallback(() => {
    activeSourcesRef.current.forEach(s => {
      try {
        s.stop()
      } catch {
        /* already stopped */
      }
    })
    activeSourcesRef.current = []
    audioQueueRef.current.length = 0
    nextPlayTimeRef.current = 0
    isPlayingRef.current = false
    setCallState('listening')
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
    voiceUserTranscriptCorrected?: (d: any) => void
    voiceModelTranscript?: (d: any) => void
    voiceModelThinking?: () => void
    voiceToolVisual?: (d: any) => void
    voiceCustomEvent?: (d: any) => void
    voiceAgentSwitched?: (d: any) => void
    voiceCallEnded?: (d: any) => void
  }>({})

  const setupSocketListeners = useCallback(() => {
    const socket = getSocket?.()
    if (!socket || socketListenersRef.current) return

    // Apply the ACTIVE agent's avatar identity sent by the server. Replaces ALL three avatar
    // fields together (the payload is the full identity for the active agent) and flips
    // avatarOverridden so the effective avatar stops reading the (stale) connect-time props.
    const applyAgentAvatar = (payload?: VoiceAgentAvatar | null) => {
      if (!payload) return
      setOverrideAvatars(payload.avatars || undefined)
      setOverrideLogoUrl(payload.logoUrl || undefined)
      setOverrideAvatar3dUrl(payload.avatar3dUrl || undefined)
      setAvatarOverridden(true)
    }

    // voice_ready fires on every call start carrying the ACTIVE agent's identity. On a resume the
    // call starts already on the active agent (no agent_switched fires), so this is what keeps the
    // orb on the active agent instead of the connect-time entry agent.
    const onVoiceReady = (data?: { agentName?: string; agentAvatar?: VoiceAgentAvatar }) => {
      setCallState('listening')
      applyAgentAvatar(data?.agentAvatar)
    }

    // Live agent switch (transfer_to_department in voice): the backend re-composed the
    // session with a new agent — reflect it (header pill + transcript continuity cue).
    const onVoiceAgentSwitched = (data: {
      agentId?: string
      agentName?: string
      voice?: string
      agentAvatar?: VoiceAgentAvatar
    }) => {
      resetInactivityTimer()
      const name = (data?.agentName || '').toString().trim()
      setSwitchedAgentName(name || 'Nuevo agente')
      applyAgentAvatar(data?.agentAvatar)
      setConversation(prev => [
        ...prev,
        {
          role: 'bot',
          text: name ? `🔄 Continuás con ${name}.` : '🔄 Te derivé con el área correspondiente.',
          standalone: true,
        },
      ])
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
      // Barge-in confirmed by the provider — stop playback.
      flushPlayback()
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
        setTimeout(() => setCurrentEmotion(prev => (prev === data.emotion ? null : prev)), 4000)
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
          const needsSpace =
            existing.length > 0 && !existing.endsWith(' ') && !data.text.startsWith(' ')
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: existing + (needsSpace ? ' ' : '') + data.text,
          }
          return updated
        }
        return [...prev, { role: 'user', text: data.text }]
      })
    }

    // Final consolidated user transcript — replaces the streaming fragments with clean text.
    // NOTE: we deliberately do NOT dismiss a pinned quiz here. The student may be thinking out
    // loud (or there's background noise); clearing on the raw transcript gave them no time to
    // answer. The quiz is dismissed only when the bot actually responds (see onVoiceModelTranscript)
    // or when the user taps an option (answerVoiceQuiz).
    const onVoiceUserTranscriptFinal = (data: { text: string }) => {
      if (!data?.text) return
      setConversation(prev => {
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

    // Async correction from Gemini Flash — swaps dirty transcript with cleaned version
    const onVoiceUserTranscriptCorrected = (data: { text: string; original: string }) => {
      if (!data?.text) return
      setConversation(prev => {
        const updated = [...prev]
        // Find the entry matching the original dirty text and replace it
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'user' && updated[i].text === data.original) {
            updated[i] = { ...updated[i], text: data.text }
            return updated
          }
        }
        // Fallback: replace last user message if no exact match
        const lastUserIdx = updated.map(e => e.role).lastIndexOf('user')
        if (lastUserIdx >= 0) {
          updated[lastUserIdx] = { ...updated[lastUserIdx], text: data.text }
          return updated
        }
        return prev
      })
    }

    const onVoiceModelTranscript = (data: { text: string }) => {
      if (!data?.text) return
      resetInactivityTimer() // Agent is responding
      setConversation(prev => {
        const last = prev[prev.length - 1]
        const isContinuation = !!last && last.role === 'bot' && !last.standalone
        // When the bot STARTS a new spoken turn AFTER the student has responded to a pinned quiz
        // (i.e. a user turn exists after the quiz), the quiz turn is over → dismiss the dock now.
        // This replaces the old "clear on raw transcript" behavior that gave no time to think.
        let base = prev
        if (!isContinuation) {
          let quizIdx = -1
          for (let i = prev.length - 1; i >= 0; i--) {
            if (prev[i].quizButtons && prev[i].quizButtons!.length > 0) {
              quizIdx = i
              break
            }
          }
          if (quizIdx >= 0 && prev.slice(quizIdx + 1).some(e => e.role === 'user')) {
            base = prev.map((e, i) => (i === quizIdx ? { ...e, quizButtons: undefined } : e))
          }
        }
        const lastBase = base[base.length - 1]
        // Append to the active spoken bubble — but NEVER onto a tool render or system
        // notice (standalone), so the agent's transcript stays in its own bubble.
        if (lastBase && lastBase.role === 'bot' && !lastBase.standalone) {
          const updated = [...base]
          const existing = lastBase.text
          // Add space between fragments if neither ends/starts with one
          const needsSpace =
            existing.length > 0 && !existing.endsWith(' ') && !data.text.startsWith(' ')
          updated[updated.length - 1] = {
            ...lastBase,
            text: existing + (needsSpace ? ' ' : '') + data.text,
          }
          return updated
        }
        return [...base, { role: 'bot', text: data.text }]
      })
    }

    const onVoiceModelThinking = () => {
      setCallState('thinking')
      resetInactivityTimer() // Agent is processing
    }

    // Handle visual tool results — render content in the conversation
    const onVoiceToolVisual = (data: { tool: string; items: any[] }) => {
      if (!data?.items?.length) return
      resetInactivityTimer()

      // ─── Present Quiz ───
      // Rendered from the structured `quiz_question` custom_event (see onVoiceCustomEvent),
      // which carries explicit buttons. Skip the visual-card path to avoid double-rendering
      // and fragile markdown parsing.
      if (data.tool === 'present_quiz') return

      // ─── Generic show_content (from voice virtual tools) ───
      if (data.tool === 'show_content') {
        const content = data.items
          .map((item: any) => {
            if (item.type === 'link') return `[${item.label || item.url}](${item.url})`
            if (item.type === 'image') return `![${item.label || ''}](${item.url})`
            return item.label || ''
          })
          .filter(Boolean)
          .join('\n')
        if (content) {
          setConversation(prev => [...prev, { role: 'bot', text: content, standalone: true }])
        }
        return
      }

      // ─── Domain-specific tool visual handlers ───
      const cardText = data.items
        .map((item: any) => {
          if (data.tool === 'search_accommodations') {
            const opt = item.options?.[0]
            const price = opt ? `${opt.totalPrice} ${opt.currency}` : ''
            const features = (item.features || []).slice(0, 3).join(' • ')
            const cover = item.cover ? `![${item.title}](${item.cover})` : ''
            const link = opt?.link ? `[Ver detalles](${opt.link})` : ''
            return `${cover}\n**${item.index}. ${item.title}**\n📍 ${item.location} ${item.rating ? `⭐ ${item.rating}` : ''}\n💰 ${price}\n${features}\n${link}`
          }
          if (data.tool === 'get_accommodation_details') {
            const images = (item.images || [])
              .slice(0, 4)
              .map((url: string) => `![](${url})`)
              .join('\n')
            const specs = item.specs
              ? Object.entries(item.specs)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' • ')
              : ''
            const rooms = (item.rooms || []).map((r: any) => `• ${r.name}: ${r.price}`).join('\n')
            const rules = item.rules
              ? `🕐 Check-in: ${item.rules.checkIn || '-'} | Check-out: ${item.rules.checkOut || '-'} | Mascotas: ${item.rules.pets || '-'}`
              : ''
            const link = item.seeMoreLink ? `[Ver más detalles](${item.seeMoreLink})` : ''
            return `${images}\n**${item.title || item.name}**\n${item.description || ''}\n${specs}\n${rooms}\n${rules}\n${link}`
          }

          // ─── Structured items from extractVisualData (card, link, image) ───
          if (item.type === 'card' && item.content) return item.content
          if (item.type === 'link' && item.url) return `🔗 [${item.label || item.url}](${item.url})`
          if (item.type === 'image' && item.url) return `![${item.label || ''}](${item.url})`

          // ─── Generic fallback for unknown tool results ───
          if (item.systemInstruction && typeof item.systemInstruction === 'string') {
            return item.systemInstruction
          }
          const urlField =
            item.signupUrl ||
            item.url ||
            item.link ||
            item.redirectUrl ||
            item.actionPayload?.signupUrl ||
            item.actionPayload?.url
          if (urlField) {
            const label = item.label || item.title || data.tool.replace(/_/g, ' ')
            return `🔗 [${label}](${urlField})`
          }
          if (item.status === 'error') return item.error || 'Error al ejecutar la acción'
          return ''
        })
        .filter(Boolean)
        .join('\n\n---\n\n')

      if (cardText) {
        setConversation(prev => [...prev, { role: 'bot', text: cardText, standalone: true }])
      }
    }

    // Structured client events (quiz buttons, etc.) — same canonical `quiz_question`
    // event used in text mode, carrying explicit buttons (no markdown parsing).
    const onVoiceCustomEvent = (evt: any) => {
      if (evt?.eventName === 'quiz_question' && evt?.data) {
        const { question, buttons } = evt.data as {
          question: string
          buttons: { id: string; label: string }[]
        }
        if (question && buttons?.length) {
          resetInactivityTimer()
          setConversation(prev => [
            ...prev,
            { role: 'bot', text: `📝 ${question}`, quizButtons: buttons, standalone: true },
          ])
        }
      }

      // ─── Próxima clase (suggest_next_class) ───
      // Ms. Ellis proposes the next class. The hero page renders the actionable card (with the
      // "Activar recordatorio" button) from the same event, but during a fullscreen voice call
      // that card is hidden behind the overlay — so we ALSO show a "Próxima clase" card here so
      // the student sees the proposal in-call. Reminder activation happens on the hero card once
      // the call closes (it requires a notification-permission gesture that suits a calmer moment).
      if (evt?.eventName === 'suggest_next_class' && evt?.data) {
        const { scheduledAt, title, body } = evt.data as {
          scheduledAt?: string
          title?: string
          body?: string
        }
        if (typeof scheduledAt === 'string' && scheduledAt.trim() !== '') {
          const when = new Date(scheduledAt)
          const whenLabel = Number.isNaN(when.getTime())
            ? scheduledAt
            : new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(when)
          const lines = [`📅 **Próxima clase** — ${whenLabel}`]
          if (typeof title === 'string' && title.trim() !== '') lines.push(`**${title.trim()}**`)
          if (typeof body === 'string' && body.trim() !== '') lines.push(body.trim())
          resetInactivityTimer()
          setConversation(prev => [...prev, { role: 'bot', text: lines.join('\n\n'), standalone: true }])
        }
      }
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
      voiceUserTranscriptCorrected: onVoiceUserTranscriptCorrected,
      voiceModelTranscript: onVoiceModelTranscript,
      voiceModelThinking: onVoiceModelThinking,
      voiceToolVisual: onVoiceToolVisual,
      voiceCustomEvent: onVoiceCustomEvent,
      voiceAgentSwitched: onVoiceAgentSwitched,
    }

    socket.on('voice_ready', onVoiceReady)
    socket.on('voice_audio_chunk', onVoiceAudioChunk)
    socket.on('voice_interrupted', onVoiceInterrupted)
    socket.on('voice_turn_complete', onVoiceTurnComplete)
    socket.on('voice_error', onVoiceError)
    socket.on('voice_emotion', onVoiceEmotion)
    socket.on('voice_user_transcript', onVoiceUserTranscript)
    socket.on('voice_user_transcript_final', onVoiceUserTranscriptFinal)
    socket.on('voice_user_transcript_corrected', onVoiceUserTranscriptCorrected)
    socket.on('voice_model_transcript', onVoiceModelTranscript)
    socket.on('voice_model_thinking', onVoiceModelThinking)
    socket.on('voice_tool_visual', onVoiceToolVisual)
    socket.on('custom_event', onVoiceCustomEvent)
    socket.on('voice_agent_switched', onVoiceAgentSwitched)
    socket.on('voice_timeout', onVoiceTimeout)

    // Server-initiated call end (e.g., interview finalized / farewell auto-hangup)
    const onVoiceCallEnded = (data: { reason?: string }) => {
      // Notify the host immediately with the backend reason so a voice-first room
      // can decide its completion UI before the overlay auto-closes.
      onCallEnded?.(data?.reason)
      setConversation(prev => [...prev, { role: 'bot', text: '📞 Llamada finalizada.' }])
      // Pull the authoritative transcript from the server (it persisted the turns) so the
      // main chat reflects this call — replaces the old local dump that piled up / duplicated.
      const endedSocket = getSocket?.()
      if (endedSocket?.connected) {
        setTimeout(() => {
          try {
            endedSocket.emit('request_history')
          } catch {
            /* noop */
          }
        }, HISTORY_REFRESH_DELAY_MS)
      }
      // Auto-close overlay after a brief delay
      setTimeout(() => {
        onClose()
      }, 2500)
    }
    socket.on('voice_call_ended', onVoiceCallEnded)
    voiceListenersRef.current.voiceCallEnded = onVoiceCallEnded

    socketListenersRef.current = true
  }, [getSocket, scheduleChunks, flushPlayback])

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
    if (l.voiceUserTranscriptFinal)
      socket.off('voice_user_transcript_final', l.voiceUserTranscriptFinal)
    if (l.voiceUserTranscriptCorrected)
      socket.off('voice_user_transcript_corrected', l.voiceUserTranscriptCorrected)
    if (l.voiceModelTranscript) socket.off('voice_model_transcript', l.voiceModelTranscript)
    if (l.voiceModelThinking) socket.off('voice_model_thinking', l.voiceModelThinking)
    if (l.voiceToolVisual) socket.off('voice_tool_visual', l.voiceToolVisual)
    if (l.voiceCustomEvent) socket.off('custom_event', l.voiceCustomEvent)
    if (l.voiceAgentSwitched) socket.off('voice_agent_switched', l.voiceAgentSwitched)
    if (l.voiceCallEnded) socket.off('voice_call_ended', l.voiceCallEnded)
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
      audio: ENHANCED_AUDIO_CONSTRAINTS,
    })
    streamRef.current = stream

    // ── Client-side VAD: build the pure gate, then lazily load Silero. ──
    // The gate runs on every captured frame (see worklet handler below) and
    // decides what reaches the provider; Silero only supplies the probability.
    const vadEnabled = cfg.vad !== false
    vadGateRef.current = new VadGate(vadEnabled ? (cfg.vad as VadGateConfig) : { energyOnly: true })
    latestSpeechProbRef.current = 1
    lastVadFrameAtRef.current = 0
    if (vadEnabled) {
      // Fire-and-forget: the call works immediately on the energy gate and
      // upgrades to full speech detection the moment Silero is ready. Shares the
      // capture stream so the VAD analyses exactly what we transmit.
      void createSpeechDetector({
        stream,
        assetBaseUrl: cfg.vadAssetBaseUrl,
        onFrame: ({ speechProb }) => {
          latestSpeechProbRef.current = speechProb
          lastVadFrameAtRef.current = performance.now()
        },
      })
        .then(detector => {
          if (!detector) return
          if (!streamRef.current) {
            // Call already ended while the model was loading.
            detector.destroy()
            return
          }
          speechDetectorRef.current = detector
          return detector.start()
        })
        .catch(() => {
          /* energy-gate fallback already active */
        })
    }

    const ctx = new AudioContext({ sampleRate: INPUT_SAMPLE_RATE })
    audioCtxRef.current = ctx
    // Resume mic AudioContext — required by some browsers
    if (ctx.state === 'suspended') await ctx.resume()
    const source = ctx.createMediaStreamSource(stream)

    // Enhancement chain: highpass → lowpass → compressor
    const enhanced = createEnhancementChain(ctx, source)

    // Analyser for visualization (fed from enhanced signal)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    enhanced.connect(analyser)
    analyserRef.current = analyser

    // Create processor URL
    if (!processorUrlRef.current) {
      const blob = new Blob([buildVoiceProcessorCode(cfg.voiceGate)], {
        type: 'application/javascript',
      })
      processorUrlRef.current = URL.createObjectURL(blob)
    }

    await ctx.audioWorklet.addModule(processorUrlRef.current)
    const workletNode = new AudioWorkletNode(ctx, 'voice-pcm-processor')
    workletNodeRef.current = workletNode

    // Gate + send PCM chunks to Socket.IO. Each ~100ms frame carries its PCM and
    // its near-field RMS; VadGate combines that RMS with the latest Silero
    // probability (or 1 = energy-only when Silero is absent/stale) and whether the
    // bot is speaking, then decides whether this frame reaches the provider.
    const VAD_STALE_MS = 600
    workletNode.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; rms: number }>) => {
      const gate = vadGateRef.current
      if (!gate) return
      const vadFresh = performance.now() - lastVadFrameAtRef.current < VAD_STALE_MS
      // Ground-truth "bot is audibly speaking" from the audio CLOCK, not just the isPlaying
      // flag — that flag only clears on a source's onended, which can fail to fire (suspended
      // AudioContext, stalled source) and get stuck true, silencing the user forever.
      const playbackCtx = playbackCtxRef.current
      const botSpeaking = resolveBotSpeaking({
        isPlaying: isPlayingRef.current,
        contextRunning: playbackCtx?.state === 'running',
        nextPlayTime: nextPlayTimeRef.current,
        currentTime: playbackCtx?.currentTime ?? 0,
      })
      // Echo safety: without a fresh real-VAD signal, stay half-duplex over the bot
      // (silent frame) so the bot's own audio leaking into the mic can't self-interrupt.
      const { frame, confirmedSpeech } = resolveVadInput({
        botSpeaking,
        vadFresh,
        speechProb: latestSpeechProbRef.current,
        rms: e.data.rms,
      })
      const { shouldStream: gateShouldStream, event } = gate.process(frame)
      // Clear, frontal voice over the bot → cut playback locally for instant feedback.
      // (barge_in only fires with a fresh real-VAD signal, so echo won't trip it.)
      if (event === 'barge_in') flushPlayback()
      // While the bot is idle (the user's turn) defer to the server-side VAD and stream every
      // frame — the client energy gate is unreliable across mics/gains and was silencing real
      // users. While the bot speaks the gate stays authoritative (echo / greeting protection).
      const shouldStream = resolveShouldStream({ gateShouldStream, botSpeaking })
      if (shouldStream && socket.connected && !isMuted) {
        // The backend greeting-gate drops UNMARKED mic audio during the greeting. Mark a
        // streamed frame as speech when Silero confirms it OR — in the energy-only fallback
        // (Silero/ONNX CDN unreachable) — because the energy gate already deemed it
        // near-field speech. This keeps the user audible without depending on the VAD CDN.
        const speech = resolveSpeechFlag({ confirmedSpeech, vadFresh })
        socket.emit('voice_audio_chunk', { data: arrayBufferToBase64(e.data.pcm), speech })
      }
    }

    enhanced.connect(workletNode)

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
  }, [getSocket, isMuted, cfg.voiceGate, cfg.vad, cfg.vadAssetBaseUrl, flushPlayback])

  const stopMicCapture = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current)
    speechDetectorRef.current?.destroy()
    speechDetectorRef.current = null
    vadGateRef.current = null
    latestSpeechProbRef.current = 1
    lastVadFrameAtRef.current = 0
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
    // Fresh call: drop any prior override so we re-seed from props until voice_ready arrives.
    setOverrideAvatars(undefined)
    setOverrideLogoUrl(undefined)
    setOverrideAvatar3dUrl(undefined)
    setAvatarOverridden(false)
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

    // Tell backend to create Gemini Live session. `language` is intentionally NOT sent:
    // live-voice language is prompt-driven (agent config) and the backend dropped the
    // threaded language param (BE-P2-4), so it was dead. `voice` is only a fallback for
    // agents without a configured voice — the agent's configured voice is authoritative.
    socket.emit('voice_start', { voice: 'Kore' })

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
    activeSourcesRef.current.forEach(s => {
      try {
        s.stop()
      } catch {
        /* already stopped */
      }
    })
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

    // Notify backend the call ended, then pull the authoritative transcript once the backend
    // has persisted the final turn. The chat history now comes from the SERVER (request_history
    // → chat_history); we no longer dump the local transcript here — that's what caused the
    // piled-up / duplicated messages (same turns re-added with different ids).
    const socket = getSocket?.()
    if (socket?.connected) {
      socket.emit('voice_stop')
      setTimeout(() => {
        try {
          socket.emit('request_history')
        } catch {
          /* noop */
        }
      }, HISTORY_REFRESH_DELAY_MS)
    }

    // Cleanup
    removeSocketListeners()
    setCallState('idle')
    setAudioLevel(0)
    setDuration(0)
    setIsMuted(false)
    setConversation([])
    setTimeoutWarning(false)
    setSwitchedAgentName(null)
    setOverrideAvatars(undefined)
    setOverrideLogoUrl(undefined)
    setOverrideAvatar3dUrl(undefined)
    setAvatarOverridden(false)

    onClose()
  }, [getSocket, stopMicCapture, removeSocketListeners, onClose])

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
  const stateColor =
    callState === 'speaking'
      ? cfg.speakingColor
      : callState === 'thinking'
        ? cfg.thinkingColor
        : callState === 'listening'
          ? cfg.listeningColor
          : primaryColor

  // The orb shows the ACTIVE agent: server-provided identity (voice_ready / agent switch) wins
  // over the connect-time props, which go stale after a mid-session switch + re-call w/o reload.
  const effectiveAvatars = avatarOverridden ? overrideAvatars : avatars
  const effectiveLogoUrl = avatarOverridden ? overrideLogoUrl : logoUrl
  const effectiveAvatar3dUrl =
    (avatarOverridden ? overrideAvatar3dUrl : avatar3dUrl) || cfg.avatar3dUrl

  // Active (unanswered) quiz — pinned in a dock above the controls so the question + options
  // never scroll away while the bot keeps talking. Resolved on tap, or when the user answers
  // by voice (the final transcript clears the buttons — see onVoiceUserTranscriptFinal).
  let activeQuizIndex = -1
  for (let qi = conversation.length - 1; qi >= 0; qi--) {
    if (conversation[qi].quizButtons && conversation[qi].quizButtons!.length > 0) {
      activeQuizIndex = qi
      break
    }
  }
  const activeQuiz = activeQuizIndex >= 0 ? conversation[activeQuizIndex] : null

  const answerVoiceQuiz = (entryIndex: number, btn: { id: string; label: string }) => {
    const sock = getSocket?.()
    if (sock?.connected) {
      sock.emit('voice_text_input', { text: `Answer: ${btn.label}` })
    }
    // Remove the buttons from this entry (resolved) + show the chosen label as a user turn.
    setConversation(prev => {
      const updated = prev.map((e, idx) =>
        idx === entryIndex ? { ...e, quizButtons: undefined } : e
      )
      return [...updated, { role: 'user' as const, text: btn.label }]
    })
  }

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
          <span
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '13px',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
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
          {switchedAgentName && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 10px',
                borderRadius: '20px',
                background: `${primaryColor}22`,
                border: `1px solid ${primaryColor}44`,
                color: '#fff',
                fontWeight: 600,
              }}
            >
              🔄 {switchedAgentName}
            </span>
          )}
          <span
            style={{
              fontSize: '13px',
              fontFamily: 'ui-monospace, monospace',
              color: 'rgba(255,255,255,0.4)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {formatDuration(duration)}
          </span>
          {timeoutWarning &&
            (() => {
              const remaining = INACTIVITY_TIMEOUT_SECONDS - inactivitySecondsRef.current
              const isUrgent = remaining <= 15
              return (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: isUrgent ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)',
                    color: isUrgent ? '#ef4444' : '#f59e0b',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    animation: isUrgent ? 'pulse 1s ease-in-out infinite' : 'none',
                  }}
                >
                  ⏸ Inactivo — {remaining > 0 ? remaining : 0}s
                </span>
              )
            })()}
        </div>
      </div>

      {/* Badge — only if explicitly enabled */}
      {cfg.showBadge && cfg.badgeText && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
          <span
            style={{
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${primaryColor}, ${cfg.thinkingColor})`,
              color: 'white',
            }}
          >
            {cfg.badgeText}
          </span>
        </div>
      )}

      {/* Main content — Avatar STICKY on top + scrollable conversation below */}
      {/* Avatar — fixed/sticky, always visible above scroll */}
      <div className="relative shrink-0 flex justify-center" style={{ padding: '16px 20px 8px' }}>
        <AvatarOrb
          avatars={effectiveAvatars}
          logoUrl={effectiveLogoUrl}
          avatar3dUrl={effectiveAvatar3dUrl}
          emotion={currentEmotion}
          callState={callState}
          audioLevel={audioLevel}
          config={cfg}
        />
      </div>

      {/* Scrollable conversation area */}
      <div className="relative flex-1 min-h-0 overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex flex-col gap-4 w-full">
          {conversation.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {conversation.map((entry, i) => {
                // The active quiz lives in the pinned dock below — skip it here so it isn't shown twice.
                if (i === activeQuizIndex) return null
                return (
                <div
                  key={i}
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius:
                      entry.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    fontSize: '13.5px',
                    lineHeight: 1.5,
                    color: 'white',
                    marginLeft: entry.role === 'user' ? 'auto' : '0',
                    marginRight: entry.role === 'user' ? '0' : 'auto',
                    backgroundColor:
                      entry.role === 'user' ? 'rgba(255,255,255,0.08)' : `${primaryColor}25`,
                    backdropFilter: 'blur(8px)',
                    border:
                      entry.role === 'user'
                        ? '1px solid rgba(255,255,255,0.08)'
                        : `1px solid ${primaryColor}20`,
                  }}
                >
                  <div
                    className="prose prose-sm prose-invert max-w-none break-words leading-relaxed"
                    style={{ fontSize: '13.5px' }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[[rehypeSanitize, voiceSanitizeSchema]]}
                      components={{
                        p: ({ children }) => <p style={{ margin: '0 0 4px' }}>{children}</p>,
                        a: ({ href, children }) => {
                          if (!href) return null
                          const textContent = String(children).toLowerCase()
                          const isCTA =
                            textContent.includes('reservar') ||
                            textContent.includes('ver') ||
                            textContent.includes('pagar')
                          const isGoogleMaps =
                            href.includes('maps.google') ||
                            href.includes('goo.gl') ||
                            href.includes('google.com/maps')

                          if (isGoogleMaps) {
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '8px 12px',
                                  margin: '6px 0',
                                  borderRadius: '10px',
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  color: primaryColor,
                                  textDecoration: 'none',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                }}
                              >
                                📍 Ver ubicación
                              </a>
                            )
                          }

                          if (isCTA) {
                            return (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '6px',
                                  padding: '8px 16px',
                                  margin: '6px 0',
                                  borderRadius: '10px',
                                  background: primaryColor,
                                  color: 'white',
                                  textDecoration: 'none',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  letterSpacing: '0.05em',
                                  textTransform: 'uppercase' as const,
                                  width: '100%',
                                  textAlign: 'center' as const,
                                }}
                              >
                                {children} →
                              </a>
                            )
                          }

                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: primaryColor,
                                textDecoration: 'underline',
                                fontWeight: 600,
                              }}
                            >
                              {children}
                            </a>
                          )
                        },
                        strong: ({ children }) => (
                          <strong style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em style={{ color: 'rgba(255,255,255,0.8)' }}>{children}</em>
                        ),
                        ul: ({ children }) => (
                          <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ol>
                        ),
                        li: ({ children }) => <li style={{ marginBottom: '2px' }}>{children}</li>,
                        hr: () => (
                          <hr
                            style={{
                              border: 'none',
                              borderTop: '1px solid rgba(255,255,255,0.1)',
                              margin: '8px 0',
                            }}
                          />
                        ),
                        img: ({ src, alt }) => (
                          <img
                            src={src}
                            alt={alt || ''}
                            style={{ maxWidth: '100%', borderRadius: '8px', margin: '6px 0' }}
                          />
                        ),
                        code: ({ children }) => (
                          <code
                            style={{
                              background: 'rgba(255,255,255,0.1)',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontSize: '12px',
                            }}
                          >
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {entry.text}
                    </ReactMarkdown>
                  </div>
                </div>
                )
              })}
              <div ref={conversationEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Pinned quiz dock — keeps the question + options on screen (above the controls) so they
          never scroll away while the bot keeps talking, until the user answers (tap or voice). */}
      {activeQuiz && activeQuiz.quizButtons && activeQuiz.quizButtons.length > 0 && (
        <div data-testid="voice-quiz-dock" style={{ flexShrink: 0, padding: '0 20px 10px' }}>
          <div
            style={{
              borderRadius: '18px',
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${primaryColor}55`,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 6px 24px rgba(0,0,0,0.35)',
              maxHeight: '42vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                lineHeight: 1.4,
                marginBottom: '12px',
              }}
            >
              {activeQuiz.text}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeQuiz.quizButtons.map((btn, optIdx) => (
                <button
                  key={btn.id}
                  onClick={() => answerVoiceQuiz(activeQuizIndex, btn)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left' as const,
                    boxShadow: `0 4px 14px ${primaryColor}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                    transition: 'all 150ms ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = `0 8px 22px ${primaryColor}77, inset 0 1px 0 rgba(255,255,255,0.3)`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = `0 4px 14px ${primaryColor}55, inset 0 1px 0 rgba(255,255,255,0.25)`
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      color: primaryColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                    }}
                  >
                    {optIdx + 1}
                  </span>
                  <span style={{ flex: 1 }}>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status pill */}
      <div style={{ textAlign: 'center', paddingBottom: '12px' }}>
        <span
          style={{
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
          }}
        >
          {isMuted ? (
            <>
              <MicOff style={{ width: '12px', height: '12px' }} /> Micrófono silenciado
            </>
          ) : callState === 'thinking' ? (
            'Procesando...'
          ) : callState === 'speaking' ? (
            <>
              <Volume2 style={{ width: '12px', height: '12px' }} /> Respuesta de voz
            </>
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
          {isMuted ? (
            <MicOff style={{ width: '22px', height: '22px' }} />
          ) : (
            <Mic style={{ width: '22px', height: '22px' }} />
          )}
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
            backgroundColor:
              callState === 'speaking' ? `${cfg.listeningColor}15` : 'rgba(255,255,255,0.08)',
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px 20px',
          }}
        >
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
