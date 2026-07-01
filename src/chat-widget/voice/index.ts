/**
 * @package @botuyo/chat-widget
 * Voice Module Barrel Export
 */

// Types
export type {
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
export { useVoiceChat } from './useVoiceChat'
export { useVoiceState } from './useVoiceState'

// Components
export { VoiceButton, VoiceChatOverlay, WaveformVisualizer } from './components'
