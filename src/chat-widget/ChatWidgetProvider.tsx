/**
 * @package @paseolibre/chat-widget
 * ChatWidgetProvider - React Context Provider para el widget
 * 
 * Este provider permite usar el widget de chat como un componente React estándar
 * con acceso a su estado y métodos a través de hooks.
 */

/* eslint-disable react-refresh/only-export-components */
// Este archivo exporta tanto el componente Provider como el hook useChatWidget

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { ChatWidget } from './ChatWidget'
import type { ChatWidgetProps } from './types'
import { logger } from './utils/logger'

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
}

// ========== Provider Component ==========

/**
 * Provider que envuelve tu aplicación para dar acceso al Chat Widget
 * 
 * @example
 * ```tsx
 * import { ChatWidgetProvider } from '@paseolibre/chat-widget'
 * 
 * function App() {
 *   return (
 *     <ChatWidgetProvider
 *       apiKey="tu-api-key"
 *       apiBaseUrl="https://api.paseolibre.com"
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
  }, [onStateChange])

  const close = useCallback(() => {
    setIsOpen(false)
    onStateChange?.(false)
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
  const handleEvent = useCallback((eventName: string, data: any) => {
    if (eventName === 'message:received' && !isOpen) {
      setUnreadCount(prev => prev + 1)
    }
    widgetProps.onEvent?.(eventName, data)
  }, [isOpen, widgetProps])

  return (
    <ChatWidgetContext.Provider value={contextValue}>
      {children}
      <ChatWidget
        {...widgetProps}
        onStateChange={(newIsOpen) => {
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
