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

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ChatWidget } from './ChatWidget'
import type { ChatWidgetProps } from './types'
import { logger } from './utils/logger'
import { LanguageProvider, type SupportedLocale } from './i18n'

// Import the full widget CSS as inline string (same as standalone.tsx)
import cssContent from '../../styles.css?inline'

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

// ========== Shadow DOM Host Component ==========

/**
 * Creates a Shadow DOM container in document.body, injects widget CSS,
 * and renders children inside via React Portal.
 */
function ShadowDOMHost({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const shadowRef = useRef<ShadowRoot | null>(null)
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return

    // Create outer container (anchor in document.body — no layout impact)
    const container = document.createElement('div')
    container.id = 'botuyo-chat-widget-root'
    // No position/sizing so it doesn't create a containing block
    // that breaks position:fixed on child elements
    document.body.appendChild(container)
    containerRef.current = container

    // Attach Shadow DOM for CSS isolation
    const shadow = container.attachShadow({ mode: 'open' })
    shadowRef.current = shadow

    // Inject CSS into shadow root (not <head>)
    // Replace :root with :host so CSS variables inherit inside Shadow DOM
    const style = document.createElement('style')
    style.textContent = cssContent.replace(/:root/g, ':host')
    shadow.appendChild(style)

    // Create mount point for React inside shadow root
    const mount = document.createElement('div')
    mount.id = 'botuyo-chat-widget-root'
    shadow.appendChild(mount)
    mountRef.current = mount

    setReady(true)
    logger.debug('ChatWidgetProvider: Shadow DOM initialized')

    return () => {
      container.remove()
      containerRef.current = null
      shadowRef.current = null
      mountRef.current = null
    }
  }, [])

  if (!ready || !mountRef.current) return null

  // Portal renders React children inside Shadow DOM while preserving React context
  return createPortal(children, mountRef.current)
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
    <LanguageProvider defaultLocale={defaultLocale}>
      <ChatWidgetContext.Provider value={contextValue}>
        {children}
        {/* ChatWidget renders inside Shadow DOM via portal — CSS isolated */}
        <ShadowDOMHost>
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
        </ShadowDOMHost>
      </ChatWidgetContext.Provider>
    </LanguageProvider>
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

