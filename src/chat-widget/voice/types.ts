/**
 * @package @botuyo/chat-widget
 * Voice Module Types
 *
 * Types for Live Call (real-time voice conversation) and Voice Notes (async).
 */

// ============================================================================
// LIVE CALL TYPES (Real-time voice conversation)
// ============================================================================

/**
 * Live Call state machine states
 */
export type LiveCallState =
  | 'idle' // Show "Start Call" button
  | 'calling' // Connecting, show spinner
  | 'ready' // Bot finished greeting, user can speak
  | 'listening' // User is speaking, show waveform
  | 'thinking' // Processing user input
  | 'speaking' // Bot is talking

/**
 * Live Call client → server messages
 */
export interface LiveCallAuthMessage {
  type: 'auth'
  tenantId: string
  sessionId: string
  conversationId?: string
}

export interface LiveCallStartMessage {
  type: 'start_call'
}

export interface LiveCallEndMessage {
  type: 'end_call'
}

export type LiveCallClientMessage = LiveCallAuthMessage | LiveCallStartMessage | LiveCallEndMessage

/**
 * Live Call server → client messages
 */
export interface LiveCallStartedMessage {
  type: 'call_started'
  greeting?: string
}

export interface LiveCallListeningMessage {
  type: 'listening'
}

export interface LiveCallTranscriptionMessage {
  type: 'transcription'
  text: string
}

export interface LiveCallSpeakingMessage {
  type: 'speaking'
}

export interface LiveCallResponseTextMessage {
  type: 'response_text'
  text: string
}

export interface LiveCallDoneMessage {
  type: 'done'
}

export interface LiveCallErrorMessage {
  type: 'error'
  code: LiveCallErrorCode
  message: string
}

export type LiveCallErrorCode =
  | 'voice_disabled'
  | 'quota_exceeded'
  | 'connection_error'
  | 'microphone_denied'
  | 'browser_unsupported'

export type LiveCallServerMessage =
  | LiveCallStartedMessage
  | LiveCallListeningMessage
  | LiveCallTranscriptionMessage
  | LiveCallSpeakingMessage
  | LiveCallResponseTextMessage
  | LiveCallDoneMessage
  | LiveCallErrorMessage

/**
 * Live Call hook options
 */
export interface UseLiveCallOptions {
  apiBaseUrl: string
  tenantId: string
  sessionId: string
  conversationId?: string
  wsEndpoint?: string
  onStateChange?: (state: LiveCallState) => void
  onTranscription?: (text: string) => void
  onBotResponse?: (text: string) => void
  onError?: (error: LiveCallErrorMessage) => void
}

/**
 * Live Call hook return type
 */
export interface UseLiveCallReturn {
  state: LiveCallState
  isSupported: boolean
  callDuration: number
  startCall: () => Promise<void>
  endCall: () => void
}

// ============================================================================
// VOICE NOTES TYPES (Async voice messages - like WhatsApp)
// ============================================================================

/**
 * Voice Notes state (simpler, async flow)
 * @deprecated Use LiveCallState for real-time calls
 */
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking'

/**
 * Voice Notes server → client messages
 * @deprecated Use LiveCallServerMessage for real-time calls
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
 * @deprecated Use UseLiveCallOptions for real-time calls
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
 * @deprecated Use UseLiveCallReturn for real-time calls
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
 * Call button props (for Live Call)
 */
export interface CallButtonProps {
  state: LiveCallState
  isSupported: boolean
  callDuration?: number
  primaryColor?: string
  onStartCall: () => void
  onEndCall: () => void
  disabled?: boolean
}

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
 * Live call overlay props
 */
export interface LiveCallOverlayProps {
  isOpen: boolean
  state: LiveCallState
  callDuration: number
  transcription?: string
  botResponse?: string
  onEndCall: () => void
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
