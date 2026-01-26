/**
 * Type definitions for @botuyo/chat-widget-standalone
 * TypeScript definitions for CDN and NPM usage
 */

declare module '@botuyo/chat-widget-standalone' {
  // ========== Main Export ==========
  const BotUyoChat: BotUyoChatWidget
  // @ts-expect-error - Default export for CDN compatibility
  export default BotUyoChat

  // ========== Widget Class ==========
  export class BotUyoChatWidget {
    /**
     * Initialize the chat widget
     * @param config - Widget configuration
     * @returns Widget instance for chaining
     */
    init(config: StandaloneConfig): this

    /**
     * Update widget configuration
     * @param config - Partial configuration to update
     */
    update(config: Partial<StandaloneConfig>): void

    /**
     * Open the chat window
     */
    open(): void

    /**
     * Close the chat window
     */
    close(): void

    /**
     * Toggle the chat window
     */
    toggle(): void

    /**
     * Send a message programmatically
     * @param message - Message text to send
     */
    sendMessage(message: string): void

    /**
     * Clear chat history
     */
    clearChat(): void

    /**
     * Destroy the widget and remove from DOM
     */
    destroy(): void

    /**
     * Get current widget state
     */
    getState(): WidgetState
  }

  // ========== Configuration Types ==========
  export interface StandaloneConfig {
    // Required
    apiKey: string
    apiBaseUrl: string

    // Theme (optional)
    theme?: ChatTheme

    // User Context (optional)
    userContext?: UserContext

    // Page Context (optional)
    pageContext?: PageContext

    // SEO (optional)
    includeSEOMetadata?: boolean

    // Callbacks (optional)
    onNavigate?: (url: string) => void
    onLogin?: (userData: AuthenticatedUser) => void
    onEvent?: (eventName: string, data: any) => void
    onStateChange?: (isOpen: boolean) => void
  }

  export interface ChatTheme {
    primaryColor?: string
    botName?: string
    logoUrl?: string
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
    welcomeMessage?: string
    inputPlaceholder?: string
    borderRadius?: string
    launcherBorderRadius?: string
    starterPrompt?: string
    bubbleStyles?: BubbleStyles
    avatarScale?: number
  }

  export interface BubbleStyles {
    radius?: {
      bubble?: string
      image?: string
      button?: string
      card?: string
    }
    bot?: {
      bg?: string
      text?: string
      border?: string
    }
    user?: {
      text?: string
    }
    launcher?: {
      bg?: string
      pulse?: boolean
    }
    mapCard?: {
      iconBg?: string
      iconColor?: string
    }
  }

  export interface UserContext {
    token?: string
    metadata?: Record<string, any>
  }

  export interface PageContext {
    page?: string
    id?: string | number
    url?: string
    title?: string
    // @ts-expect-error - Allow dynamic properties for metadata extensibility
    [key: string]: any
  }

  export interface AuthenticatedUser {
    user: {
      id: string
      email?: string
      name?: string
      token?: string
      [key: string]: any
    }
    token: string
  }

  export interface WidgetState {
    isOpen: boolean
    isConnected: boolean
    unreadCount: number
  }

  // ========== Message Types ==========
  // @ts-expect-error - String union type for message types
  export type MessageType = 'text' | 'image' | 'location' | 'system' | 'audio' | 'file'
  // @ts-expect-error - String union type for message senders
  export type MessageSender = 'user' | 'bot' | 'system'

  export interface BaseMessage {
    id: string
    type: MessageType
    sender: MessageSender
    timestamp: Date
  }

  export interface TextMessage extends BaseMessage {
    type: 'text'
    content: string
  }

  export interface ImageMessage extends BaseMessage {
    type: 'image'
    imageUrl: string
    altText?: string
  }

  export interface LocationMessage extends BaseMessage {
    type: 'location'
    latitude: number
    longitude: number
    name?: string
  }

  export interface SystemMessage extends BaseMessage {
    type: 'system'
    sender: 'system'
    content: string
  }

  export interface AudioMessage extends BaseMessage {
    type: 'audio'
    content: string
  }

  // @ts-expect-error - Union type for all message variants
  export type ChatMessage =
    | TextMessage
    | ImageMessage
    | LocationMessage
    | SystemMessage
    | AudioMessage
}

// ========== Global Window Declaration (for CDN usage) ==========
// @ts-expect-error - Extend global window object for CDN script access
declare global {
  interface Window {
    BotUyoChat: import('@botuyo/chat-widget-standalone').BotUyoChatWidget
  }
}
