/**
 * @package @botuyo/chat-widget
 * ChatWidgetProvider - React Context Provider para el widget
 *
 * Uses Shadow DOM for CSS isolation (same mechanism as standalone.tsx)
 * while preserving React Context via createPortal.
 *
 * This gives us:
 * - Full CSS isolation (Shadow DOM) — identical to standalone
 * - React Context API (useChatWidget) — open/close/sendMessage/etc.
 * - No CSS conflicts with host page
 */

/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ChatWidget } from './ChatWidget'
import { logger } from './utils/logger'
import type { ChatWidgetProps } from './types'
import { type SupportedLocale } from './i18n'

// ========== Context Types ==========

export interface ChatWidgetContextValue {
  /** Si el widget está abierto o cerrado */
  isOpen: boolean
  /** Abrir el widget */
  open: () => void
  /** Cerrar el widget */
  close: () => void
  /** Toggle abrir/cerrar */
  toggle: () => void
  /** Enviar un mensaje programáticamente */
  sendMessage: (text: string) => void
  /** Limpiar el historial de chat */
  clearMessages: () => void
  /** Número de mensajes no leídos */
  unreadCount: number
}

// Internal reference to sendMessage callback from ChatWidget
let _internalSendMessage: ((text: string) => void) | null = null
let _internalClearMessages: (() => void) | null = null

export function _setInternalSendMessage(fn: ((text: string) => void) | null) {
  _internalSendMessage = fn
}

export function _setInternalClearMessages(fn: (() => void) | null) {
  _internalClearMessages = fn
}

const ChatWidgetContext = createContext<ChatWidgetContextValue | null>(null)

// ========== Provider Props ==========

export interface ChatWidgetProviderProps extends ChatWidgetProps {
  /** Children que tendrán acceso al contexto del chat */
  children?: ReactNode
  /** Configuración inicial del estado del widget */
  initialState?: {
    /** Si el widget debe iniciar abierto */
    isOpen?: boolean
  }
  /** Idioma inicial del widget (es, en, pt, fr). Si no se especifica, se detecta automáticamente */
  defaultLocale?: SupportedLocale
}

// ========== Provider Component ==========

/**
 * Provider que envuelve tu aplicación para dar acceso al Chat Widget.
 * Usa Shadow DOM para aislamiento CSS (idéntico al standalone).
 *
 * @example
 * ```tsx
 * import { ChatWidgetProvider } from '@botuyo/chat-widget'
 *
 * function App() {
 *   return (
 *     <ChatWidgetProvider
 *       apiKey="tu-api-key"
 *       apiBaseUrl="https://api.botuyo.com"
 *       theme={{ primaryColor: '#10b981' }}
 *     >
 *       <YourApp />
 *     </ChatWidgetProvider>
 *   )
 * }
 * ```
 */
export function ChatWidgetProvider({
  children,
  defaultLocale,
  initialState,
  onStateChange,
  ...widgetProps
}: ChatWidgetProviderProps) {
  const [isOpen, setIsOpen] = useState(initialState?.isOpen ?? false)
  const [unreadCount, setUnreadCount] = useState(0)

  const open = useCallback(() => {
    setIsOpen(true)
    setUnreadCount(0)
    onStateChange?.(true)
    window.dispatchEvent(new CustomEvent('botuyo-chat:open'))
  }, [onStateChange])

  const close = useCallback(() => {
    setIsOpen(false)
    onStateChange?.(false)
    window.dispatchEvent(new CustomEvent('botuyo-chat:close'))
  }, [onStateChange])

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev
      if (newState) {
        setUnreadCount(0)
      }
      onStateChange?.(newState)
      return newState
    })
    window.dispatchEvent(new CustomEvent('botuyo-chat:toggle'))
  }, [onStateChange])

  const sendMessage = useCallback((text: string) => {
    if (_internalSendMessage) {
      _internalSendMessage(text)
      logger.debug('ChatWidgetProvider sendMessage:', text)
    } else {
      logger.warn('sendMessage called but no handler registered')
    }
  }, [])

  const clearMessages = useCallback(() => {
    if (_internalClearMessages) {
      _internalClearMessages()
      logger.debug('ChatWidgetProvider clearMessages called')
    } else {
      logger.warn('clearMessages called but no handler registered')
    }
  }, [])

  const contextValue: ChatWidgetContextValue = {
    isOpen,
    open,
    close,
    toggle,
    sendMessage,
    clearMessages,
    unreadCount,
  }

  // Handler para actualizar el unread count
  const handleEvent = useCallback(
    (eventName: string, data: any) => {
      if (eventName === 'message:received' && !isOpen) {
        setUnreadCount(prev => prev + 1)
      }
      widgetProps.onEvent?.(eventName, data)
    },
    [isOpen, widgetProps]
  )

  return (
    <ChatWidgetContext.Provider value={contextValue}>
      {children}
      <ChatWidget
        {...widgetProps}
        onStateChange={newIsOpen => {
          setIsOpen(newIsOpen)
          if (newIsOpen) {
            setUnreadCount(0)
          }
          onStateChange?.(newIsOpen)
        }}
        onEvent={handleEvent}
      />
    </ChatWidgetContext.Provider>
  )
}

// ========== Hook para acceder al contexto ==========

/**
 * Hook para acceder al contexto del Chat Widget
 *
 * @throws Error si se usa fuera del ChatWidgetProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const chat = useChatWidget()
 *
 *   return (
 *     <button onClick={chat.open}>
 *       Abrir Chat {chat.unreadCount > 0 && `(${chat.unreadCount})`}
 *     </button>
 *   )
 * }
 * ```
 */
export function useChatWidget(): ChatWidgetContextValue {
  const context = useContext(ChatWidgetContext)

  if (!context) {
    throw new Error(
      'useChatWidget must be used within a ChatWidgetProvider. ' +
        'Wrap your app with <ChatWidgetProvider>...</ChatWidgetProvider>'
    )
  }

  return context
}

// ========== Exports ==========

export default ChatWidgetProvider

