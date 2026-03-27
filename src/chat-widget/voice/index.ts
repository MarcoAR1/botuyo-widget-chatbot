/**
 * @package @botuyo/chat-widget
 * Voice Module Barrel Export
 */

// Types
export type {
  // Live Call types
  LiveCallState,
  LiveCallClientMessage,
  LiveCallServerMessage,
  LiveCallErrorCode,
  LiveCallErrorMessage,
  UseLiveCallOptions,
  UseLiveCallReturn,
  CallButtonProps,
  LiveCallOverlayProps,
  // Voice Notes types (legacy)
  VoiceState,
  VoiceServerMessage,
  UseVoiceChatOptions,
  UseVoiceChatReturn,
  VoiceConfig,
  VoiceButtonProps,
  VoiceChatOverlayProps,
  WaveformVisualizerProps,
} from './types'

export { VOICE_AUDIO_CONFIG } from './types'

// Audio Enhancement
export {
  ENHANCED_AUDIO_CONSTRAINTS,
  NOISE_GATE_THRESHOLD,
  NOISE_GATE_HOLD_FRAMES,
  ENHANCEMENT_CONFIG,
  createEnhancementChain,
} from './audioEnhancement'

// Hooks
export { useLiveCall } from './useLiveCall'
export { useVoiceChat } from './useVoiceChat'
export { useVoiceState } from './useVoiceState'

// Components
export {
  CallButton,
  LiveCallOverlay,
  VoiceButton,
  VoiceChatOverlay,
  WaveformVisualizer,
} from './components'
