/**
 * BotUyo Chat Widget - React Component Entry
 * 
 * Clean entry point for npm package consumers (React/Next.js).
 * No CSS injection, no DOM manipulation, no global window objects.
 * Uses relative paths (not @/ aliases) so it works from any bundler context.
 */

// React components
export { ChatWidget } from './src/chat-widget/ChatWidget'
export { ChatWidgetProvider, useChatWidget } from './src/chat-widget/ChatWidgetProvider'

// i18n
export { LanguageProvider, useLanguage } from './src/chat-widget/i18n/LanguageContext'

// Types
export type { 
  ChatWidgetProps, 
  ChatTheme, 
  UserContext, 
  ChatMessage, 
  TextMessage, 
  ImageMessage, 
  AudioMessage, 
  LocationMessage, 
  PageContext 
} from './src/chat-widget/types'

export type { ChatWidgetContextValue, ChatWidgetProviderProps } from './src/chat-widget/ChatWidgetProvider'
