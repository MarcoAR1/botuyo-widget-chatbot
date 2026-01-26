/**
 * @package @botuyo/chat-widget
 * Tipos de eventos Socket.IO del protocolo Backend
 */

import { BotEmotion } from '../components/Launcher'

// ========== Eventos Cliente → Servidor ==========
export interface ClientToServerEvents {
  /** Enviar mensaje del usuario con confirmación opcional */
  user_message: (data: UserMessagePayload, callback?: (ack: { success: boolean }) => void) => void

  /** Solicitar historial de chat */
  request_history: () => void

  /** Notificar que el usuario está escribiendo */
  typing: (isTyping: boolean) => void

  /** Desconexión manual */
  disconnect_session: () => void
}

export interface UserMessagePayload {
  content: string
  type: 'text' | 'image' | 'audio' | 'file' | 'location'
  metadata?: Record<string, any>
}

// ========== Eventos Servidor → Cliente ==========
export interface ServerToClientEvents {
  /** Mensaje del bot */
  bot_message: (data: BotMessagePayload) => void

  /** Confirmación de conexión con configuración del backend */
  connection_ack: (data: ConnectionAckPayload) => void

  /** Bot está escribiendo */
  bot_typing: (isTyping: boolean) => void

  /** Autenticación exitosa */
  auth_success: (data: AuthSuccessPayload) => void

  /** Error del servidor */
  error: (data: ErrorPayload) => void

  /** Historial de mensajes */
  chat_history: (data: ChatHistoryPayload) => void

  /** Evento de navegación (bot solicita cambio de ruta) */
  navigate: (url: string) => void

  /** Evento genérico custom */
  custom_event: (data: CustomEventPayload) => void
}

export interface BotMessagePayload {
  id: string
  type: 'text' | 'image' | 'audio' | 'location' | 'system'
  content?: string
  imageUrl?: string
  audioUrl?: string
  latitude?: number
  longitude?: number
  timestamp: string
  metadata?: Record<string, any>
  emotion?: BotEmotion
}

export interface ConnectionAckPayload {
  sessionId: string
  deviceId: string

  /** Configuración que el backend puede sobrescribir */
  config?: {
    botName?: string
    logoUrl?: string
    primaryColor?: string
    welcomeMessage?: string
  }

  /** Si el usuario ya tenía sesión previa */
  hasHistory?: boolean
}

export interface AuthSuccessPayload {
  token: string
  user: {
    id: string
    email?: string
    name?: string
    token?: string
    [key: string]: any
  }
  message?: string
  theme?: import('./index').ChatTheme // Tema personalizado desde el servidor
}

export interface ErrorPayload {
  code: string
  message: string
  details?: any
}

export interface ChatHistoryPayload {
  messages: BotMessagePayload[]
  hasMore: boolean
}

export interface CustomEventPayload {
  eventName: string
  data: any
}

// ========== Auth Payload (Handshake) ==========
export interface SocketAuthPayload {
  /** API Key del tenant */
  apiKey: string

  /** Device ID del guest (persistido en localStorage) */
  deviceId: string

  /** Token JWT opcional si el usuario ya está autenticado */
  token?: string

  /** Metadata adicional */
  metadata?: Record<string, any>
}
