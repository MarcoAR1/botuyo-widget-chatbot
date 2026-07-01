/**
 * @package @botuyo/chat-widget
 * Voice Module Types
 *
 * Types for Voice Notes (async voice messages). The realtime call path lives in
 * components/VoiceCallOverlay.tsx over socket.io (see types/socket.ts).
 */

// ============================================================================
// VOICE NOTES TYPES (Async voice messages - like WhatsApp)
// ============================================================================

/**
 * Voice Notes state (simpler, async flow)
 */
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

/**
 * Voice Notes server → client messages
 */
export interface VoiceTranscriptionPartial {
  type: 'transcription_partial'
  text: string
}

export interface VoiceTranscriptionFinal {
  type: 'transcription_final'
  text: string
}

export interface VoiceResponseStart {
  type: 'response_start'
}

export interface VoiceResponseText {
  type: 'response_text'
  text: string
}

export interface VoiceResponseEnd {
  type: 'response_end'
}

export interface VoiceErrorMessage {
  type: 'error'
  code: string
  message: string
}

export type VoiceServerMessage =
  | VoiceTranscriptionPartial
  | VoiceTranscriptionFinal
  | VoiceResponseStart
  | VoiceResponseText
  | VoiceResponseEnd
  | VoiceErrorMessage

/**
 * Voice Notes hook options
 */
export interface UseVoiceChatOptions {
  apiBaseUrl: string
  tenantId: string
  sessionId: string
  conversationId?: string
  config?: VoiceConfig
  onTranscription?: (text: string, isFinal: boolean) => void
  onBotResponse?: (text: string) => void
  onBotAudioPlayed?: () => void
  onStateChange?: (state: VoiceState) => void
  onError?: (error: VoiceErrorMessage) => void
}

/**
 * Voice Notes hook return type
 */
export interface UseVoiceChatReturn {
  state: VoiceState
  isConnected: boolean
  isSupported: boolean
  partialTranscription: string
  recordingDuration: number
  startRecording: () => Promise<void>
  stopRecording: () => void
  cancelRecording: () => void
  stopPlayback: () => void
  connect: () => void
  disconnect: () => void
}

// ============================================================================
// SHARED TYPES
// ============================================================================

/**
 * Voice configuration from tenant settings
 */
export interface VoiceConfig {
  enabled?: boolean
  language?: string
  voiceId?: string
  maxDurationSeconds?: number
  wsEndpoint?: string
}

/**
 * Audio format configuration
 */
export const VOICE_AUDIO_CONFIG = {
  input: {
    sampleRate: 16000, // 16kHz
    bitDepth: 16, // 16-bit PCM
    channels: 1, // Mono
    chunkSize: 320, // ~20ms at 16kHz for low latency
  },
  output: {
    sampleRate: 24000, // 24kHz
    bitDepth: 16,
    channels: 1,
  },
} as const

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Voice button props (for Voice Notes - legacy)
 */
export interface VoiceButtonProps {
  state: VoiceState
  isSupported: boolean
  primaryColor?: string
  onPress: () => void
  onRelease: () => void
  onCancel: () => void
  disabled?: boolean
}

/**
 * Waveform visualizer props
 */
export interface WaveformVisualizerProps {
  isActive: boolean
  className?: string
  barCount?: number
  color?: string
}

/**
 * Voice chat overlay props (legacy)
 */
export interface VoiceChatOverlayProps {
  isOpen: boolean
  state: VoiceState
  partialTranscription: string
  finalTranscription?: string
  botResponse?: string
  recordingDuration: number
  maxDuration?: number
  onClose: () => void
  onCancel: () => void
}
