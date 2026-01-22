/**
 * @package @paseolibre/chat-widget
 * Entry Point - Exporta el componente principal, Provider y tipos
 */

// ========== Componentes ==========
export { ChatWidget } from './ChatWidget'
export { ChatWidgetProvider, useChatWidget } from './ChatWidgetProvider'
export type { ChatWidgetContextValue } from './ChatWidgetProvider'

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

// ========== Default Export ==========
export { ChatWidgetProvider as default } from './ChatWidgetProvider'
