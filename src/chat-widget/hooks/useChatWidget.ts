import { useCallback, useState, useRef, useMemo, useEffect } from 'react'
import type {
  ChatWidgetProps,
  ChatMessage,
  TextMessage,
  ImageMessage,
  AudioMessage,
  LocationMessage,
  PageContext,
} from '../types'
import { useChatState } from './useChatState'
import { useChatSocket } from './useChatSocket'
import { useSEOMetadata } from './useSEOMetadata'
import { useNotifications } from './useNotifications'
import { useAnalytics } from './useAnalytics'
import { useRateLimit } from './useRateLimit'
import { useTranslations } from '../i18n'
import { BotEmotion } from '../components/Launcher'
import { logger } from '../utils/logger'
import { _setInternalSendMessage, _setInternalClearMessages } from '../ChatWidgetProvider'

// Helper utilitario
const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })

interface UseChatWidgetOptions {
  apiKey: string
  apiBaseUrl: string
  pageContext?: PageContext
  includeSEOMetadata?: boolean
  theme?: ChatWidgetProps['theme']
  mediaConfig?: ChatWidgetProps['mediaConfig']
  userContext?: ChatWidgetProps['userContext']
  onLogin?: ChatWidgetProps['onLogin']
  onNavigate?: ChatWidgetProps['onNavigate']
  onEvent?: ChatWidgetProps['onEvent']
  onStateChange?: ChatWidgetProps['onStateChange']
  onThemeUpdate?: (theme: any) => void // Callback para tema del socket
}

/**
 * Hook principal que maneja toda la lógica del widget de chat
 * Incluye: estado, socket, mensajes, analytics, notificaciones, rate limiting
 */
export function useChatWidget(options: UseChatWidgetOptions) {
  const {
    apiKey,
    apiBaseUrl,
    pageContext,
    includeSEOMetadata = false,
    theme,
    // mediaConfig, // No se usa actualmente
    userContext,
    onLogin,
    onNavigate,
    onEvent,
    onStateChange,
    onThemeUpdate,
  } = options

  const [unreadCount, setUnreadCount] = useState(0)
  const lastMessageTimeRef = useRef<number>(0)
  const { t } = useTranslations()

  // Inicializar analytics
  const analytics = useAnalytics(apiBaseUrl, apiKey, true)

  // Inicializar notificaciones
  const notifications = useNotifications({
    enabled: true,
    soundEnabled: true,
    desktopEnabled: true,
    botName: theme?.botName || 'Asistente',
    logoUrl: theme?.logoUrl,
  })

  // Rate limiting (10 mensajes por minuto)
  const rateLimit = useRateLimit(10, 60000)

  const { state, actions } = useChatState()
  const seoMetadata = useSEOMetadata(includeSEOMetadata)

  const enrichedPageContext = useMemo<PageContext | undefined>(() => {
    if (!seoMetadata) return pageContext
    return { ...(pageContext || {}), seo: { ...(seoMetadata || {}) } }
  }, [pageContext, seoMetadata])

  const socket = useChatSocket({
    apiKey,
    apiBaseUrl,
    pageContext: enrichedPageContext,
    userContext,
    onMessage: useCallback(
      (message: ChatMessage) => {
        const now = Date.now()
        const latency =
          lastMessageTimeRef.current > 0 ? now - lastMessageTimeRef.current : undefined
        lastMessageTimeRef.current = now

        actions.addMessage(message)

        // Analytics: mensaje recibido
        analytics.trackMessageReceived(message.type, latency)

        if (!state.isOpen && message.sender === 'bot') {
          setUnreadCount(prev => prev + 1)

          // Notificaciones: solo si el chat está cerrado
          notifications.notifyWithSound(message)
        }
      },
      [actions, state.isOpen, analytics, notifications]
    ),
    onConnected: useCallback(
      (sessionId: string, config?: any) => {
        actions.setConnected(true)
        actions.setSessionId(sessionId)
        analytics.trackConnectionStatus(true)
        if (config && onEvent) onEvent('backend_config', config)
      },
      [actions, onEvent, analytics]
    ),
    onDisconnected: useCallback(() => {
      actions.setConnected(false)
      analytics.trackConnectionStatus(false)
    }, [actions, analytics]),
    onTyping: useCallback((isTyping: boolean) => actions.setTyping(isTyping), [actions]),
    onError: useCallback(
      (error: string) => {
        actions.setError(error)
        analytics.trackError(error)
      },
      [actions, analytics]
    ),
    onLogin,
    onNavigate,
    onEvent,
    onThemeUpdate, // Pasar callback de tema al socket
  })

  const handleToggle = useCallback(() => {
    logger.debug('ChatWidget handleToggle called, current isOpen:', state.isOpen)
    if (!state.isOpen) {
      actions.openWindow()
      setUnreadCount(0)
      analytics.trackOpen()
      onStateChange?.(true)
      logger.debug('ChatWidget Opening window')
    } else {
      actions.closeWindow()
      analytics.trackClose()
      onStateChange?.(false)
      logger.debug('ChatWidget Closing window')
    }
  }, [state.isOpen, actions, onStateChange, analytics])

  const handleSendText = useCallback(
    (text: string) => {
      // Rate limiting: verificar si podemos enviar
      if (!rateLimit.isAllowed()) {
        const remaining = rateLimit.getTimeUntilReset()
        const seconds = Math.ceil(remaining / 1000)
        actions.setError(t('rate_limit_exceeded') + ` Espera ${seconds}s.`)
        return
      }

      // Optimistic update: agregar mensaje del usuario inmediatamente
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}-${Math.random()}`,
        type: 'text',
        sender: 'user',
        timestamp: new Date(),
        content: text,
      }
      actions.addMessage(userMessage)

      // Analytics: mensaje enviado
      analytics.trackMessageSent('text')

      // Enviar al servidor
      socket.sendMessage(text, 'text')
    },
    [actions, socket, rateLimit, analytics, t]
  )

  const handleSendAttachment = useCallback(
    async (file: File, type: 'image' | 'audio' | 'file') => {
      // Optimistic update: agregar mensaje del usuario inmediatamente
      let userMessage: ChatMessage

      if (type === 'audio') {
        userMessage = {
          id: `temp-${Date.now()}-${Math.random()}`,
          type: 'audio',
          sender: 'user',
          timestamp: new Date(),
          content: URL.createObjectURL(file), // Preview local del audio
        } satisfies AudioMessage
      } else if (type === 'image') {
        userMessage = {
          id: `temp-${Date.now()}-${Math.random()}`,
          type: 'image',
          sender: 'user',
          timestamp: new Date(),
          imageUrl: URL.createObjectURL(file), // Preview local de la imagen
        } satisfies ImageMessage
      } else {
        // 'file' → convertir a mensaje de texto con el nombre del archivo
        userMessage = {
          id: `temp-${Date.now()}-${Math.random()}`,
          type: 'text',
          sender: 'user',
          timestamp: new Date(),
          content: `📎 ${file.name}`, // Mostrar nombre del archivo
        } satisfies TextMessage
      }

      actions.addMessage(userMessage)

      // Enviar al servidor
      const b64 = await toBase64(file)
      socket.sendMessage(b64, type)
    },
    [actions, socket]
  )

  const handleSendLocation = useCallback(
    (location: { latitude: number; longitude: number }) => {
      // Optimistic update: agregar mensaje de ubicación inmediatamente
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}-${Math.random()}`,
        type: 'location',
        sender: 'user',
        timestamp: new Date(),
        latitude: location.latitude,
        longitude: location.longitude,
        name: 'Mi ubicación',
      } satisfies LocationMessage

      actions.addMessage(userMessage)

      // Enviar al servidor
      socket.sendMessage(JSON.stringify(location), 'location')
    },
    [actions, socket]
  )

  // Register sendMessage handler for ChatWidgetProvider
  useEffect(() => {
    _setInternalSendMessage(handleSendText)
    return () => _setInternalSendMessage(null)
  }, [handleSendText])

  // Register clearMessages handler for ChatWidgetProvider
  const handleClearMessages = useCallback(() => {
    actions.clearMessages()
    logger.info('Chat history cleared')
  }, [actions])

  useEffect(() => {
    _setInternalClearMessages(handleClearMessages)
    return () => _setInternalClearMessages(null)
  }, [handleClearMessages])

  // Calcular la emoción actual del bot
  const currentBotEmotion = useMemo<BotEmotion>(() => {
    if (state.isTyping) return 'thinking'
    const lastBotMessage = [...state.messages]
      .reverse()
      .find(m => m.sender === 'bot' && m.type === 'text')
    return lastBotMessage?.type === 'text' && lastBotMessage.emotion
      ? (lastBotMessage.emotion as BotEmotion)
      : 'default'
  }, [state.isTyping, state.messages])

  return {
    // Estado
    state,
    actions,
    unreadCount,
    currentBotEmotion,
    isConnected: socket.isConnected,

    // Handlers
    handleToggle,
    handleSendText,
    handleSendAttachment,
    handleSendLocation,
  }
}
