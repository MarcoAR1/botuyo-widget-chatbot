/**
 * @package @paseolibre/chat-widget
 * Hook optimizado para producción con soporte extendido de medios.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
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

export interface UseChatSocketOptions {
  apiKey: string
  apiBaseUrl: string
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
}

export function useChatSocket(options: UseChatSocketOptions) {
  const { apiKey, apiBaseUrl, pageContext, userContext } = options

  const handlersRef = useRef(options)
  useEffect(() => {
    handlersRef.current = options
  }, [options])

  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const deviceIdRef = useRef<string>(getOrCreateDeviceId())
  const pageContextRef = useRef<PageContext | undefined>(pageContext)

  useEffect(() => {
    pageContextRef.current = pageContext
  }, [pageContext])

  const sanitizeIncomingMessage = useCallback((data: any): ChatMessage => {
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date()
    const id = data.id || `msg-${Math.random().toString(36).substr(2, 9)}`
    const sender = data.sender || 'bot'

    switch (data.type) {
      case 'image':
        return {
          id,
          type: 'image',
          sender,
          timestamp,
          imageUrl: data.imageUrl || data.content || '',
          altText: 'Imagen enviada por Mar',
        }
      case 'audio':
        return {
          id,
          type: 'audio' as any,
          sender,
          timestamp,
          content: data.audioUrl || data.content || '',
        }
      case 'location':
        return {
          id,
          type: 'location',
          sender,
          timestamp,
          latitude: Number(data.latitude) || 0,
          longitude: Number(data.longitude) || 0,
          name: data.content || 'Ubicación compartida',
        }
      default:
        return {
          id,
          type: 'text',
          sender,
          timestamp,
          content: String(data.content || 'Sin contenido'),
          emotion: data.emotion,
        }
    }
  }, [])

  const connect = useCallback(() => {
    if (!apiKey || !apiBaseUrl) return
    if (socketRef.current?.connected) return
    setIsConnecting(true)

    const socket = io(apiBaseUrl, {
      auth: {
        apiKey,
        deviceId: deviceIdRef.current,
        token: userContext?.token,
        metadata: userContext?.metadata,
      },
      transports: ['websocket'],
      reconnection: true,
      extraHeaders: {
        'bypass-tunnel-reminder': 'true',
        'X-Tunnel-Skip-Anti-Phishing-Page': 'true',
      },
    }) as Socket<ServerToClientEvents, ClientToServerEvents>

    socket.on('connect', () => {
      setIsConnecting(false)
      setIsConnected(true)
    })

    socket.on('disconnect', (_reason) => {
      setIsConnecting(false)
      setIsConnected(false)
      handlersRef.current.onDisconnected()
    })

    socket.on('connect_error', (error) => {
      setIsConnecting(false)
      handlersRef.current.onError(`Error de conexión: ${error.message}`)
    })

    socket.on('connection_ack', (data) => {
      handlersRef.current.onConnected(data.sessionId, data.config)
    })

    socket.on('bot_message', (data: BotMessagePayload) => {
      try {
        handlersRef.current.onMessage(sanitizeIncomingMessage(data))
      } catch (e) {
        console.error('[ChatSocket] Error:', e)
      }
    })

    socket.on('chat_history', (data) => {
      if (data.messages && Array.isArray(data.messages)) {
        data.messages.forEach((msg) => {
          try {
            handlersRef.current.onMessage(sanitizeIncomingMessage(msg))
          } catch (e) {}
        })
      }
      if (handlersRef.current.onEvent)
        handlersRef.current.onEvent('history_loaded', data)
    })

    socket.on('bot_typing', (isTyping) =>
      handlersRef.current.onTyping(isTyping)
    )
    socket.on('auth_success', (data: AuthSuccessPayload) => {
      if (handlersRef.current.onLogin) handlersRef.current.onLogin(data)
    })

    socketRef.current = socket
  }, [apiKey, apiBaseUrl, userContext?.token, sanitizeIncomingMessage])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  /**
   * 🔥 SOLUCIÓN AL ERROR DE ASIGNACIÓN:
   * Usamos "as any" en el emit para permitir tipos que el socket aún no conoce formalmente,
   * o actualiza ClientToServerEvents en tu archivo types/socket.ts
   */
  const sendMessage = useCallback(
    (
      content: string,
      type: 'text' | 'image' | 'audio' | 'location' | 'file' = 'text'
    ) => {
      if (!socketRef.current?.connected) {
        handlersRef.current.onError('Sin conexión activa.')
        return false
      }

      const metadata = {
        ...pageContextRef.current,
        currentUrl:
          typeof window !== 'undefined' ? window.location.href : undefined,
        sentAt: new Date().toISOString(),
        deviceId: deviceIdRef.current,
      }

      // El cast "as any" rompe la restricción del compilador pero permite el envío
      socketRef.current.emit('user_message', {
        content: content.trim(),
        type: type as any,
        metadata,
      })

      return true
    },
    []
  )

  return {
    isConnected,
    isConnecting,
    sendMessage,
    sendTyping: useCallback((isTyping: boolean) => {
      socketRef.current?.emit('typing', isTyping)
    }, []),
    requestHistory: useCallback(() => {
      socketRef.current?.emit('request_history')
    }, []),
    reconnect: connect,
    disconnect,
  }
}
