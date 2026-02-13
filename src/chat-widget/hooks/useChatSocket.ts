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
} from '../types/socket'
import type { ChatMessage, ChatWidgetProps, PageContext } from '../types'
import { getOrCreateDeviceId } from '../utils/deviceId'
import { logger } from '../utils/logger'
import { throttle } from '../utils/performance'

// Zod schema defined at module level for stable reference
const BotMessageSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['text', 'image', 'audio', 'location', 'system']).default('text'),
  content: z.string().optional(),
  imageUrl: z.string().url().optional(),
  audioUrl: z.string().url().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  timestamp: z.string().optional(),
  sender: z.enum(['bot', 'user', 'system']).optional(),
  emotion: z.any().optional(),
})

export interface UseChatSocketOptions {
  apiKey: string
  apiBaseUrl: string
  agentId?: string
  pageContext?: PageContext
  userContext?: ChatWidgetProps['userContext']
  onMessage: (message: ChatMessage) => void
  onConnected: (sessionId: string, config?: any) => void
  onDisconnected: () => void
  onTyping: (isTyping: boolean) => void
  onError: (error: string) => void
  onLogin?: ChatWidgetProps['onLogin']
  onNavigate?: ChatWidgetProps['onNavigate']
  onEvent?: ChatWidgetProps['onEvent']
  onThemeUpdate?: (theme: any) => void // Callback para recibir tema del servidor
}

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
      const safe = data.success ? data.data : { type: 'text' as const }

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
        case 'audio':
          return {
            id: baseId,
            type: 'audio',
            sender: baseSender,
            timestamp: ts,
            content: safe.audioUrl || safe.content || '',
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
            content: String((safe as any).content || 'Sin contenido'),
            emotion: (safe as any).emotion,
          }
      }
    },
    [] // No dependencies - BotMessageSchema is now at module level
  )

  const connect = useCallback(() => {
    if (!apiKey || !apiBaseUrl) return
    if (socketRef.current?.connected) return
    setIsConnecting(true)

    const socket = io(`${apiBaseUrl}/webchat`, {
      // Namespace is specified in URL, path stays default '/socket.io'
      auth: {
        apiKey,
        deviceId: deviceIdRef.current,
        agentId,
        token: userContext?.token,
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
        data.messages.forEach(msg => {
          try {
            handlersRef.current.onMessage(sanitizeIncomingMessage(msg))
          } catch (e) {
            logger.debug('Error processing history message:', e)
          }
        })
      }
      if (handlersRef.current.onEvent) handlersRef.current.onEvent('history_loaded', data)
    })

    socket.on('bot_typing', isTyping => handlersRef.current.onTyping(isTyping))
    socket.on('auth_success', (data: AuthSuccessPayload) => {
      if (handlersRef.current.onLogin) handlersRef.current.onLogin(data)
      // Si el servidor envía un tema, notificarlo
      if (data.theme && handlersRef.current.onThemeUpdate) {
        handlersRef.current.onThemeUpdate(data.theme)
      }
    })

    socketRef.current = socket
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
    (content: string, type: 'text' | 'image' | 'audio' | 'location' | 'file' = 'text') => {
      const messageId = generateMessageId()
      const metadata = {
        ...pageContextRef.current,
        currentUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        sentAt: new Date().toISOString(),
        deviceId: deviceIdRef.current,
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
  }
}
