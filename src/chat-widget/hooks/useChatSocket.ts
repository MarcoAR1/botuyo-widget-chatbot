/**
 * @package @botuyo/chat-widget
 * Hook optimizado para producción con soporte extendido de medios.
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { z } from 'zod'
import { io, Socket } from 'socket.io-client'
// Importamos los tipos base
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  BotMessagePayload,
  AuthSuccessPayload,
  AgentSwitchedData,
  ToolProposalStatus,
} from '../types/socket'
import { ToolProposalSchema, ToolProposalResolvedSchema } from '../types/socket'
import type {
  ChatMessage,
  ChatWidgetProps,
  PageContext,
  ButtonsMessage,
  ImageMessage,
  ToolProposalMessage,
} from '../types'
import { getOrCreateDeviceId } from '../utils/deviceId'
import { logger } from '../utils/logger'
import { throttle } from '../utils/performance'

// Zod schema defined at module level for stable reference
const BotMessageSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['text', 'image', 'audio', 'location', 'system']).default('text'),
  content: z.string().optional(),
  imageUrl: z.string().url().optional(),
  audioUrl: z.string().optional(), // Can be a full URL or internal API path
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timestamp: z.string().optional(),
  sender: z.enum(['bot', 'user', 'system']).optional(),
  emotion: z.any().optional(),
  sources: z.array(z.string()).optional(),
})

type BotMessage = z.infer<typeof BotMessageSchema>

// Zod schema for the `agent_switched` custom event — mirrors AgentSwitchedData.
// All fields optional (the backend omits some depending on switch_variant vs.
// transfer_to_department); safeParse drops malformed payloads.
const AgentSwitchedSchema = z.object({
  agentId: z.string().optional(),
  name: z.string().optional(),
  label: z.string().optional(),
  avatarUrl: z.string().optional(),
  variantKey: z.string().optional(),
})
// Zod schema for the `show_image` custom event emitted by the backend ShowImageTool.
// `imageUrl` is required and must be a valid URL; safeParse drops malformed payloads so a
// broken/spoofed image never reaches the chat.
const ShowImageSchema = z.object({
  imageUrl: z.string().url(),
  caption: z.string().optional(),
  alt: z.string().optional(),
  attribution: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  license: z.string().optional(),
})


export interface UseChatSocketOptions {
  apiKey: string
  apiBaseUrl: string
  agentId?: string
  pageContext?: PageContext
  userContext?: ChatWidgetProps['userContext']
  onMessage: (message: ChatMessage) => void
  onHistoryLoaded?: (messages: ChatMessage[]) => void
  onConnected: (sessionId: string, config?: any) => void
  onDisconnected: () => void
  onTyping: (isTyping: boolean) => void
  onError: (error: string) => void
  onLogin?: ChatWidgetProps['onLogin']
  onNavigate?: ChatWidgetProps['onNavigate']
  onEvent?: ChatWidgetProps['onEvent']
  onThemeUpdate?: (theme: any) => void // Callback para recibir tema del servidor
  /** Callback when a quiz button is clicked — sends as user message */
  onQuizAnswer?: (question: string, answer: string) => void
  /** Callback when the backend switches the active agent/variant (header + system bubble) */
  onAgentSwitched?: (data: AgentSwitchedData) => void
  /** Resolve a (fresh) user JWT for the handshake (authenticated agents); refreshed on auth errors. */
  getUserToken?: ChatWidgetProps['getUserToken']
  /** Fired when the server rejects/expires the user token so the host can prompt re-auth. */
  onAuthRequired?: ChatWidgetProps['onAuthRequired']
  /** A pending tool proposal was resolved server-side (confirmed/cancelled) or expired. */
  onToolProposalResolved?: (proposalId: string, status: ToolProposalStatus) => void
  /**
   * Returns true while a live voice call is in progress. During a call the VoiceCallOverlay
   * renders + resolves quizzes itself (answered by voice / dock tap), so the SAME `quiz_question`
   * event must NOT also be materialized as a persistent main-chat buttons card — otherwise it
   * lingers unanswered in the transcript after the call ends. Read via the handlers ref so it
   * always reflects the latest call state without re-subscribing the socket.
   */
  isVoiceCallActive?: () => boolean
}

/** Connect-error reasons that mean "the user token is missing/expired/invalid" → re-auth. */
const AUTH_ERROR_PATTERN = /USER_IDENTITY_REQUIRED|AUTH_EXPIRED|AUTH_INVALID|AUTH_REQUIRED|unauthorized/i

export function useChatSocket(options: UseChatSocketOptions) {
  const { apiKey, apiBaseUrl, agentId, pageContext, userContext } = options

  const handlersRef = useRef(options)
  useEffect(() => {
    handlersRef.current = options
  }, [options])

  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const deviceIdRef = useRef<string>(getOrCreateDeviceId())
  const pageContextRef = useRef<PageContext | undefined>(pageContext)

  useEffect(() => {
    pageContextRef.current = pageContext
  }, [pageContext])

  const sanitizeIncomingMessage = useCallback(
    (raw: unknown): ChatMessage => {
      const data = BotMessageSchema.safeParse(raw)
      const baseId =
        data.success && data.data.id
          ? data.data.id
          : `msg-${Math.random().toString(36).slice(2, 11)}`
      const baseSender = data.success && data.data.sender ? data.data.sender : 'bot'
      const ts = data.success && data.data.timestamp ? new Date(data.data.timestamp) : new Date()
      const safe: BotMessage = data.success ? data.data : { type: 'text' }

      switch (safe.type) {
        case 'image':
          return {
            id: baseId,
            type: 'image',
            sender: baseSender,
            timestamp: ts,
            imageUrl: safe.imageUrl || safe.content || '',
            altText: 'Imagen enviada',
          }
        case 'audio': {
          // Construct secure API URL for audio playback
          // Internal audioUrl paths → full API URL via apiBaseUrl
          const rawAudioUrl = safe.audioUrl || ''
          const isFullUrl = rawAudioUrl.startsWith('http://') || rawAudioUrl.startsWith('https://')
          const audioSrc = isFullUrl
            ? rawAudioUrl
            : rawAudioUrl
              ? `${apiBaseUrl}/api/voice/audio/${baseId}` // Use messageId-based secure endpoint
              : safe.content || ''
          return {
            id: baseId,
            type: 'audio',
            sender: baseSender,
            timestamp: ts,
            content: audioSrc,
            text: safe.content || undefined, // Preserve transcript text
          }
        }
        case 'location':
          return {
            id: baseId,
            type: 'location',
            sender: baseSender,
            timestamp: ts,
            latitude: Number(safe.latitude || 0),
            longitude: Number(safe.longitude || 0),
            name: safe.content || 'Ubicación compartida',
          }
        case 'system':
          return {
            id: baseId,
            type: 'system',
            sender: 'system',
            timestamp: ts,
            content: String(safe.content || ''),
          }
        default:
          return {
            id: baseId,
            type: 'text',
            sender: baseSender,
            timestamp: ts,
            content: String(safe.content || 'Sin contenido'),
            emotion: safe.emotion,
            ...(safe.sources?.length ? { sources: safe.sources } : {}),
          }
      }
    },
    [] // No dependencies - BotMessageSchema is now at module level
  )

  const connect = useCallback(() => {
    if (!apiKey || !apiBaseUrl) return
    if (socketRef.current?.connected) return
    setIsConnecting(true)

    // Build + wire the socket with a resolved handshake `token`. Extracted so the token can be
    // supplied synchronously (anonymous / pre-supplied `userContext.token` — UNCHANGED behavior)
    // OR resolved asynchronously via `getUserToken()` (authenticated agents) before the `/webchat`
    // handshake — same route, no reconnection-to-a-different-namespace logic.
    const buildSocket = (token: string | undefined) => {
      const socket = io(`${apiBaseUrl}/webchat`, {
        // Namespace is specified in URL, path stays default '/socket.io'
        auth: {
          apiKey,
          deviceId: deviceIdRef.current,
          agentId,
          token,
          metadata: userContext?.metadata,
        },
        transports: ['websocket', 'polling'], // Allow fallback to polling
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        extraHeaders: {
          'bypass-tunnel-reminder': 'true',
          'X-Tunnel-Skip-Anti-Phishing-Page': 'true',
        },
      }) as Socket<ServerToClientEvents, ClientToServerEvents>

      socket.on('connect', () => {
        setIsConnecting(false)
        setIsConnected(true)
        // Call onConnected immediately with a temporary sessionId
        // This ensures the widget shows as connected even if server doesn't send connection_ack
        handlersRef.current.onConnected(`temp-${Date.now()}`, undefined)
      })

      socket.on('disconnect', _reason => {
        setIsConnecting(false)
        setIsConnected(false)
        handlersRef.current.onDisconnected()
      })

      socket.on('connect_error', error => {
        setIsConnecting(false)
        // Authenticated agents: a missing/expired/invalid user token surfaces as a connect_error.
        // Notify the host (so it can prompt sign-in) and refresh the token so Socket.IO's own
        // auto-reconnect retries with a fresh credential (we never manually reconnect — RULE 6).
        const reason = String(
          (error as { data?: { code?: string } | string })?.data instanceof Object
            ? (error as { data?: { code?: string } })?.data?.code
            : ((error as { data?: string })?.data ?? error?.message ?? '')
        )
        if (AUTH_ERROR_PATTERN.test(reason) || AUTH_ERROR_PATTERN.test(error?.message ?? '')) {
          handlersRef.current.onAuthRequired?.()
          const refresh = handlersRef.current.getUserToken
          if (refresh) {
            refresh()
              .then(fresh => {
                if (socketRef.current) {
                  ;(socketRef.current as unknown as { auth: Record<string, unknown> }).auth = {
                    apiKey,
                    deviceId: deviceIdRef.current,
                    agentId,
                    token: fresh,
                    metadata: userContext?.metadata,
                  }
                }
              })
              .catch(e => logger.error('[useChatSocket] Token refresh failed:', e))
          }
        }
        handlersRef.current.onError(`Error de conexión: ${error.message}`)
      })

      socket.on('connection_ack', data => {
        handlersRef.current.onConnected(data.sessionId, data.config)
      })

      socket.on('bot_message', (data: BotMessagePayload) => {
        try {
          handlersRef.current.onMessage(sanitizeIncomingMessage(data))
        } catch (e) {
          logger.error('ChatSocket Error processing bot_message:', e)
        }
      })

      socket.on('chat_history', data => {
        if (data.messages && Array.isArray(data.messages)) {
          // Use batch handler if available, otherwise fallback to individual messages
          if (handlersRef.current.onHistoryLoaded) {
            const sanitizedMessages = data.messages
              .map(msg => {
                try {
                  return sanitizeIncomingMessage(msg)
                } catch (e) {
                  logger.debug('Error processing history message:', e)
                  return null
                }
              })
              .filter((m): m is ChatMessage => m !== null)
            handlersRef.current.onHistoryLoaded(sanitizedMessages)
          } else {
            data.messages.forEach(msg => {
              try {
                handlersRef.current.onMessage(sanitizeIncomingMessage(msg))
              } catch (e) {
                logger.debug('Error processing history message:', e)
              }
            })
          }
        }
        if (handlersRef.current.onEvent) handlersRef.current.onEvent('history_loaded', data)
      })

      socket.on('bot_typing', isTyping => handlersRef.current.onTyping(isTyping))

      // ── Form Bridge: bidirectional page ↔ agent communication ──────────
      // Forward agent commands to the parent page
      const forwardToPage = (data: any) => {
        try { window.parent.postMessage(data, '*') } catch (_e) { window.postMessage(data, '*') }
      }
      socket.on('onboarding:command' as any, (data: any) => forwardToPage(data))
      socket.on('form:command' as any, (data: any) => forwardToPage(data))
      // Agent requests current form state — ask page to broadcast it
      socket.on('request_form_state' as any, () => {
        forwardToPage({ type: 'botuyo-request-form-state' })
      })
      socket.on('auth_success', (data: AuthSuccessPayload) => {
        if (handlersRef.current.onLogin) handlersRef.current.onLogin(data)
        // Si el servidor envía un tema, notificarlo
        if (data.theme && handlersRef.current.onThemeUpdate) {
          handlersRef.current.onThemeUpdate(data.theme)
        }
      })

      // ── Custom Events: interactive buttons + dashboard updates ──────────
      socket.on('custom_event' as any, (evt: any) => {
        // Forward ALL custom events to the host page for external listeners
        forwardToPage({ type: 'botuyo-custom-event', ...evt })

        // During a live voice call the VoiceCallOverlay owns the quiz (renders + resolves it),
        // so skip materializing a persistent main-chat card here — otherwise it lingers
        // unanswered in the transcript after the call ends. The event was already forwarded to
        // the host page above, so external listeners still receive it.
        if (evt?.eventName === 'quiz_question' && evt?.data && !handlersRef.current.isVoiceCallActive?.()) {
          const { question, buttons } = evt.data as { question: string; buttons: Array<{ id: string; label: string }> }
          if (question && buttons?.length) {
            const quizMsg: ButtonsMessage = {
              id: `quiz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: 'buttons',
              sender: 'bot',
              timestamp: new Date(),
              content: question,
              buttons
            }
            handlersRef.current.onMessage(quizMsg)
          }
        }

        // Rich content — the agent shows a REAL openly-licensed image (e.g. vocabulary) via the
        // show_image tool. Render it as an ImageMessage with caption + attribution. During a live
        // voice call the VoiceCallOverlay already renders it (show_content visual), so skip the
        // main-chat card to avoid a duplicate (the event was forwarded to the host page above).
        if (evt?.eventName === 'show_image' && evt?.data && !handlersRef.current.isVoiceCallActive?.()) {
          const parsed = ShowImageSchema.safeParse(evt.data)
          if (parsed.success) {
            const d = parsed.data
            const imgMsg: ImageMessage = {
              id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              type: 'image',
              sender: 'bot',
              timestamp: new Date(),
              imageUrl: d.imageUrl,
              altText: d.alt || d.caption || 'Imagen',
              ...(d.caption ? { caption: d.caption } : {}),
              ...(d.attribution ? { attribution: d.attribution } : {}),
              ...(d.sourceUrl ? { sourceUrl: d.sourceUrl } : {}),
            }
            handlersRef.current.onMessage(imgMsg)
          } else {
            logger.debug('ChatSocket: dropped malformed show_image payload')
          }
        }

        // Active agent/variant changed (switch_variant or transfer_to_department) →
        // let the widget update its header (name/avatar) + show a system bubble.
        if (evt?.eventName === 'agent_switched' && evt?.data) {
          const parsed = AgentSwitchedSchema.safeParse(evt.data)
          if (parsed.success) {
            handlersRef.current.onAgentSwitched?.(parsed.data)
          } else {
            logger.debug('ChatSocket: dropped malformed agent_switched payload')
          }
        }

        // Tool approval (authenticated agents): the agent proposes a mutating tool call that the
        // user must confirm. Surface it as an inline ToolProposalCard message (Zod-validated;
        // malformed payloads are dropped — RULE 8). The id is derived from the proposalId so a
        // duplicate emit (e.g. reconnect) de-dupes via ADD_MESSAGE.
        if (evt?.eventName === 'tool_proposal' && evt?.data) {
          const parsed = ToolProposalSchema.safeParse(evt.data)
          if (parsed.success) {
            const p = parsed.data
            const proposalMsg: ToolProposalMessage = {
              id: `proposal-${p.proposalId}`,
              type: 'tool_proposal',
              sender: 'bot',
              timestamp: new Date(),
              proposalId: p.proposalId,
              toolName: p.tool,
              title: p.title,
              summary: p.summary,
              ownerOnly: p.ownerOnly,
              status: 'pending',
            }
            handlersRef.current.onMessage(proposalMsg)
          } else {
            logger.debug('ChatSocket: dropped malformed tool_proposal payload')
          }
        }

        // A proposal was resolved server-side (confirmed/cancelled) or expired → update its card.
        if (
          (evt?.eventName === 'tool_proposal_resolved' || evt?.eventName === 'tool_proposal_expired') &&
          evt?.data
        ) {
          const parsed = ToolProposalResolvedSchema.safeParse(evt.data)
          if (parsed.success) {
            const status: ToolProposalStatus =
              evt.eventName === 'tool_proposal_expired' ? 'expired' : (parsed.data.status ?? 'confirmed')
            handlersRef.current.onToolProposalResolved?.(parsed.data.proposalId, status)
          } else {
            logger.debug('ChatSocket: dropped malformed tool_proposal_resolved payload')
          }
        }
      })

      // ── Form State Relay: page → backend ──────────────────────
      // Listen for form state broadcasts from the host page and relay to backend
      const formStateHandler = (event: MessageEvent) => {
        const { type } = event.data || {}
        if (type === 'botuyo-onboarding-state' || type === 'botuyo-form-state') {
          socket.emit('form_state' as any, event.data)
        }
      }
      window.addEventListener('message', formStateHandler)

      socketRef.current = socket

      // Cleanup form state listener when socket reconnects
      const prevCleanup = () => window.removeEventListener('message', formStateHandler)
      ;(socket as any).__formCleanup = prevCleanup
    }

    // Authenticated agents resolve a fresh token before connecting; everyone else connects
    // synchronously with the (optional) pre-supplied `userContext.token` — unchanged behavior.
    const getUserToken = handlersRef.current.getUserToken
    if (getUserToken) {
      getUserToken()
        .then(token => buildSocket(token))
        .catch(err => {
          logger.error('[useChatSocket] getUserToken failed:', err)
          handlersRef.current.onAuthRequired?.()
          buildSocket(userContext?.token)
        })
    } else {
      buildSocket(userContext?.token)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Deliberately minimal deps to prevent reconnection loops
  }, [apiKey, apiBaseUrl])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [])

  // Store connect in ref to avoid re-running effect
  const connectRef = useRef(connect)
  connectRef.current = connect

  useEffect(() => {
    connectRef.current()
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only run on mount
  }, [])

  // Cola offline para mensajes salientes
  const outboundQueueRef = useRef<
    {
      content: string
      type: 'text' | 'image' | 'audio' | 'file' | 'location'
      metadata: Record<string, unknown>
    }[]
  >([])

  // Cola de reintentos con backoff exponencial
  const retryQueueRef = useRef<
    {
      id: string
      payload: any
      attempts: number
      maxAttempts: number
      nextRetryAt: number
    }[]
  >([])

  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const flushQueue = useCallback(() => {
    if (!socketRef.current?.connected) return
    while (outboundQueueRef.current.length > 0) {
      const item = outboundQueueRef.current.shift()!
      socketRef.current.emit('user_message', item)
    }
  }, [])

  useEffect(() => {
    if (isConnected) flushQueue()
  }, [isConnected, flushQueue])

  // Sistema de reintentos con exponential backoff
  useEffect(() => {
    if (!isConnected) return

    const retryInterval = setInterval(() => {
      const now = Date.now()

      retryQueueRef.current = retryQueueRef.current.filter(item => {
        // Aún no es tiempo de reintentar
        if (now < item.nextRetryAt) return true

        // Máximo de intentos alcanzado
        if (item.attempts >= item.maxAttempts) {
          handlersRef.current.onEvent?.('message_failed', {
            id: item.id,
            payload: item.payload,
          })
          logger.error('Message failed after max retries:', item.id)
          return false
        }

        // Reintentar envío
        if (socketRef.current?.connected) {
          socketRef.current.emit('user_message', item.payload, (ack: any) => {
            if (ack?.success) {
              handlersRef.current.onEvent?.('message_sent', { id: item.id })
            }
          })

          // Actualizar para próximo intento (exponential backoff: 1s, 2s, 4s)
          item.attempts++
          item.nextRetryAt = now + Math.pow(2, item.attempts) * 1000

          return item.attempts < item.maxAttempts
        }

        return true
      })
    }, 500)

    return () => clearInterval(retryInterval)
  }, [isConnected])

  /**
   * Envío de mensaje con reintentos automáticos y garantía de entrega
   */
  const sendMessage = useCallback(
    (
      content: string,
      type: 'text' | 'image' | 'audio' | 'location' | 'file' = 'text',
      caption?: string
    ) => {
      const messageId = generateMessageId()
      const trimmedCaption = caption?.trim()
      const metadata = {
        ...pageContextRef.current,
        currentUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        sentAt: new Date().toISOString(),
        deviceId: deviceIdRef.current,
        // Text typed alongside an attachment (image/file) — travels with it so the model gets both.
        ...(trimmedCaption ? { caption: trimmedCaption } : {}),
      }

      const payload = {
        id: messageId,
        content: content.trim(),
        type,
        metadata,
      }

      if (!socketRef.current?.connected) {
        // Encolar y notificar
        outboundQueueRef.current.push(payload)
        handlersRef.current.onEvent?.('queued_message', { id: messageId, payload })
        return messageId
      }

      // Enviar con acknowledgment para detectar fallos
      socketRef.current.emit('user_message', payload, (ack: any) => {
        if (ack?.success === false || !ack) {
          // Encolar para retry si falla
          retryQueueRef.current.push({
            id: messageId,
            payload,
            attempts: 0,
            maxAttempts: 3,
            nextRetryAt: Date.now() + 1000, // Primera reintento en 1s
          })
          handlersRef.current.onEvent?.('message_retry_queued', { id: messageId })
        } else {
          handlersRef.current.onEvent?.('message_sent', { id: messageId })
        }
      })

      return messageId
    },
    [generateMessageId]
  )

  const sendTypingThrottled = useMemo(
    () =>
      throttle((isTyping: boolean) => {
        socketRef.current?.emit('typing', isTyping)
      }, 250),
    []
  )

  return {
    isConnected,
    isConnecting,
    sendMessage,
    sendTyping: sendTypingThrottled,
    getSocket: useCallback(() => socketRef.current, []),
    requestHistory: useCallback(() => {
      socketRef.current?.emit('request_history')
    }, []),
    reconnect: connect,
    disconnect,
    /** Confirm a pending tool proposal — server re-validates + executes with its STORED args. */
    confirmProposal: useCallback((proposalId: string) => {
      socketRef.current?.emit('tool_confirm', { proposalId })
    }, []),
    /** Reject a pending tool proposal — server injects a rejection result + resumes. */
    rejectProposal: useCallback((proposalId: string) => {
      socketRef.current?.emit('tool_reject', { proposalId })
    }, []),
  }
}
