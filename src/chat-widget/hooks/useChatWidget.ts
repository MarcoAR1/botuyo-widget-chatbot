import { useCallback, useState, useRef, useMemo, useEffect } from 'react'
import type {
  ChatWidgetProps,
  ChatMessage,
  TextMessage,
  ImageMessage,
  AudioMessage,
  LocationMessage,
  ButtonsMessage,
  PageContext,
  ToolProposalCardStatus,
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
import { composeAgentLabel } from '../utils/agentLabel'
import { mergeServerHistory } from '../utils/mergeServerHistory'
import { getActiveQuiz } from '../utils/activeQuiz'
import type { AgentSwitchedData } from '../types/socket'
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
  agentId?: string
  pageContext?: PageContext
  includeSEOMetadata?: boolean
  theme?: ChatWidgetProps['theme']
  mediaConfig?: ChatWidgetProps['mediaConfig']
  userContext?: ChatWidgetProps['userContext']
  onLogin?: ChatWidgetProps['onLogin']
  onNavigate?: ChatWidgetProps['onNavigate']
  onEvent?: ChatWidgetProps['onEvent']
  onStateChange?: ChatWidgetProps['onStateChange']
  getUserToken?: ChatWidgetProps['getUserToken']
  onAuthRequired?: ChatWidgetProps['onAuthRequired']
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
    agentId,
    pageContext,
    includeSEOMetadata = false,
    theme,
    // mediaConfig, // No se usa actualmente
    userContext,
    onLogin,
    onNavigate,
    onEvent,
    onStateChange,
    getUserToken,
    onAuthRequired,
    onThemeUpdate,
  } = options

  const [unreadCount, setUnreadCount] = useState(0)
  const lastMessageTimeRef = useRef<number>(0)
  // True while the voice-call overlay is open. Mutated via setVoiceCallActive (no re-render) and
  // read by useChatSocket so quiz_question events during a call are NOT duplicated as persistent
  // main-chat cards (the overlay owns the quiz). See useChatSocket.isVoiceCallActive.
  const voiceCallActiveRef = useRef(false)
  const { t } = useTranslations()

  // Inicializar analytics
  const analytics = useAnalytics(apiBaseUrl, apiKey, true)

  // Inicializar notificaciones
  const notifications = useNotifications({
    enabled: true,
    soundEnabled: true,
    desktopEnabled: true,
    botName: theme?.botName || 'BotUyo',
    logoUrl: theme?.logoUrl,
  })

  // Rate limiting (10 mensajes por minuto)
  const rateLimit = useRateLimit(10, 60000)

  const { state, actions } = useChatState(apiKey, agentId)
  const seoMetadata = useSEOMetadata(includeSEOMetadata)

  const enrichedPageContext = useMemo<PageContext | undefined>(() => {
    if (!seoMetadata) return pageContext
    return { ...(pageContext || {}), seo: { ...(seoMetadata || {}) } }
  }, [pageContext, seoMetadata])

  const socket = useChatSocket({
    apiKey,
    apiBaseUrl,
    agentId,
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
        // Apply backend agent config as socket theme
        if (config && onThemeUpdate) {
          onThemeUpdate(config)
        }
        if (config && onEvent) onEvent('backend_config', config)
      },
      [actions, onEvent, onThemeUpdate, analytics]
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
    onAgentSwitched: useCallback(
      (data: AgentSwitchedData) => {
        const label = composeAgentLabel(data.name, data.label)
        // 1. Reflect the now-active agent/variant in the header (name + avatar).
        //    onThemeUpdate is the socketTheme state setter → merge, keep other config.
        if (onThemeUpdate) {
          onThemeUpdate((prev: any) => ({
            ...(prev || {}),
            ...(label ? { botName: label } : {}),
            ...(data.avatarUrl ? { logoUrl: data.avatarUrl } : {}),
          }))
        }
        // 2. Announce the switch with a system bubble in the transcript.
        if (label) {
          actions.addMessage({
            id: `agent-switched-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type: 'system',
            sender: 'system',
            timestamp: new Date(),
            content: t('agent_switched', { name: label }),
          })
        }
      },
      [onThemeUpdate, actions, t]
    ),
    onHistoryLoaded: useCallback(
      (historyMessages: ChatMessage[]) => {
        // SERVER-AUTHORITATIVE: the backend `chat_history` is the source of truth (text +
        // persisted voice turns). Replace the local list with it, preserving only genuine
        // in-flight local messages. This removes the duplication/pile-up that came from the
        // old client-side voice dump (same turns, different ids). localStorage stays as the
        // fast-paint cache and is reconciled here on every chat_history.
        if (historyMessages.length === 0) return
        actions.setMessages(mergeServerHistory(state.messages, historyMessages))
      },
      [state.messages, actions]
    ),
    // Authenticated agents: supply/refresh the user token in the handshake + prompt re-auth.
    getUserToken,
    onAuthRequired,
    // A tool proposal resolved server-side (confirmed/cancelled) or expired → update its card.
    onToolProposalResolved: useCallback(
      (proposalId: string, status: ToolProposalCardStatus) => actions.resolveProposal(proposalId, status),
      [actions]
    ),
    // Read the latest voice-call state on every quiz_question (see voiceCallActiveRef).
    isVoiceCallActive: useCallback(() => voiceCallActiveRef.current, []),
  })

  // Set by ChatWindow when the voice-call overlay opens/closes. A ref (not state) so toggling it
  // never re-renders the widget — it only gates quiz duplication inside useChatSocket.
  const setVoiceCallActive = useCallback((active: boolean) => {
    voiceCallActiveRef.current = active
  }, [])

  // Active (unanswered) quiz — pinned in a dock above the input so the question + options
  // never scroll away while the bot keeps talking. Resolved (answered/dismissed) quizzes
  // are filed back into the transcript as history.
  const activeQuiz = useMemo(() => getActiveQuiz(state.messages), [state.messages])
  const activeQuizRef = useRef<ButtonsMessage | null>(activeQuiz)
  useEffect(() => {
    activeQuizRef.current = activeQuiz
  }, [activeQuiz])

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

      // If the user typed instead of tapping while a quiz was pinned, dismiss it
      // (they moved on) so the dock clears and the quiz files into history.
      if (activeQuizRef.current) actions.answerQuiz(activeQuizRef.current.id)
    },
    [actions, socket, rateLimit, analytics, t]
  )

  // Answer the pinned quiz: mark it answered (highlighting the chosen option) and send the
  // answer to the backend. No optimistic user bubble — the highlighted quiz is the record.
  const handleQuizAnswer = useCallback(
    (message: ButtonsMessage, label: string, buttonId: string) => {
      actions.answerQuiz(message.id, buttonId)
      socket.sendMessage(`Answer: ${label}`, 'text')
      analytics.trackMessageSent('text')
    },
    [actions, socket, analytics]
  )

  // Tool approval: confirm/cancel a pending proposal. Optimistically mark the card resolved
  // (instant feedback) and emit to the backend, which re-validates + executes with STORED args.
  const handleConfirmProposal = useCallback(
    (proposalId: string) => {
      actions.resolveProposal(proposalId, 'confirmed')
      socket.confirmProposal(proposalId)
    },
    [actions, socket]
  )

  const handleCancelProposal = useCallback(
    (proposalId: string) => {
      actions.resolveProposal(proposalId, 'cancelled')
      socket.rejectProposal(proposalId)
    },
    [actions, socket]
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

  // Listen for custom events from Standalone API
  useEffect(() => {
    const handleOpen = () => {
      if (!state.isOpen) actions.openWindow()
    }

    const handleClose = () => {
      if (state.isOpen) actions.closeWindow()
    }

    const handleToggleEvent = () => {
      if (state.isOpen) actions.closeWindow()
      else actions.openWindow()
    }

    const handleSendMessageEvent = (e: CustomEvent<{ message: string }>) => {
      if (e.detail?.message) {
        handleSendText(e.detail.message)
      }
    }

    // Programmatic voice call (chat.startCall() / BotUyoChat.startCall()): open the
    // window — ChatWindow opens the voice overlay (auto-starting the call) once connected.
    const handleStartCall = () => {
      if (!state.isOpen) actions.openWindow()
    }

    window.addEventListener('botuyo-chat:open', handleOpen)
    window.addEventListener('botuyo-chat:close', handleClose)
    window.addEventListener('botuyo-chat:toggle', handleToggleEvent)
    window.addEventListener('botuyo-chat:start-call', handleStartCall)
    window.addEventListener('botuyo-chat:send-message', handleSendMessageEvent as EventListener)

    return () => {
      window.removeEventListener('botuyo-chat:open', handleOpen)
      window.removeEventListener('botuyo-chat:close', handleClose)
      window.removeEventListener('botuyo-chat:toggle', handleToggleEvent)
      window.removeEventListener('botuyo-chat:start-call', handleStartCall)
      window.removeEventListener('botuyo-chat:send-message', handleSendMessageEvent as EventListener)
    }
  }, [state.isOpen, actions, handleSendText])

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
    getSocket: socket.getSocket,
    activeQuiz,

    // Handlers
    handleToggle,
    handleSendText,
    handleSendAttachment,
    handleSendLocation,
    handleQuizAnswer,
    handleConfirmProposal,
    handleCancelProposal,
    setVoiceCallActive,
  }
}
