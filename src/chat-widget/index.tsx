/**
 * @package @botuyo/chat-widget
 * Entry Point - Exporta el componente principal, Provider y tipos
 */

/* eslint-disable react-refresh/only-export-components */
// Este archivo es un punto de entrada que debe exportar componentes, hooks y tipos

// ========== Componentes ==========
export { ChatWidget } from './ChatWidget'
export { ChatWidgetProvider, useChatWidget } from './ChatWidgetProvider'
export type { ChatWidgetContextValue } from './ChatWidgetProvider'

export { Avatar3DPreview } from './components/Avatar3DPreview'

// ========== Tipos ==========
export type {
  ChatWidgetProps,
  ChatTheme,
  UserContext,
  ChatMessage,
  TextMessage,
  ImageMessage,
  AudioMessage,
  LocationMessage,
  PageContext,
  BubbleStyles,
  AuthenticatedUser,
} from './types'

export type { ChatWidgetProviderProps } from './ChatWidgetProvider'

// ========== Voice noise-gate config ==========
export type {
  VoiceGateSetting,
  VoiceGateSensitivity,
  VoiceGateConfig,
} from './voice/audioEnhancement'
export { VOICE_GATE_PRESETS } from './voice/audioEnhancement'

// ========== Default Export ==========
export { ChatWidgetProvider as default } from './ChatWidgetProvider'
