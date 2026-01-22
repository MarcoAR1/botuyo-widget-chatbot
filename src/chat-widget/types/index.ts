/**
 * @package @paseolibre/chat-widget
 * Tipos principales del Chat Widget
 */

import {
  BotEmotion,
  EmotionAvatarMap,
  PromptStrategy,
} from '../components/Launcher'

/**
 * Contexto de página que se envía con cada mensaje
 * El padre puede pasar información sobre qué está viendo el usuario
 * IMPORTANTE: Esto NO debe causar reconexiones del socket
 */
export interface PageContext {
  page?: string
  id?: string | number
  url?: string
  title?: string
  [key: string]: any // Permite campos custom
}

export interface ChatWidgetProps {
  // ========== Configuración Técnica ==========
  /** Public API Key del tenant/cliente */
  apiKey: string

  /** URL base del backend (Gateway) */
  apiBaseUrl: string

  // ========== Contexto Vivo (Reactivo) ==========
  /**
   * Contexto de la página actual que se inyecta en cada mensaje
   * ⚠️ IMPORTANTE: Usa useRef internamente para evitar reconexiones del socket
   * Ejemplo: { page: 'Room', id: 123, price: 100 }
   */
  pageContext?: PageContext

  /**
   * Incluir metadata SEO automáticamente en el contexto
   * Si es true, captura: title, description, keywords, og:*, twitter:*, structured data
   * Default: false
   */
  includeSEOMetadata?: boolean

  // ========== Configuración Visual (White-Labeling) ==========
  theme?: ChatTheme

  // ========== Identidad del Usuario (Opcional) ==========
  /** Context del usuario si ya está autenticado en la app host */
  userContext?: UserContext

  // ========== Callbacks / Bridge hacia App Padre ==========
  /** Se ejecuta cuando el bot completa un login/autenticación */
  onLogin?: (userData: AuthenticatedUser) => void

  /** El bot solicita navegación a una ruta específica */
  onNavigate?: (url: string) => void

  /** Eventos genéricos del widget */
  onEvent?: (eventName: string, data: any) => void

  /** Callback cuando el widget cambia de estado (abierto/cerrado) */
  onStateChange?: (isOpen: boolean) => void
}

export interface BubbleStyles {
  radius?: {
    bubble?: string // Ej: "rounded-2xl", "rounded-none"
    image?: string // Ej: "rounded-lg"
    button?: string // Ej: "rounded-full"
    card?: string // Ej: "rounded-xl"
  }
  bot?: {
    bg?: string // Ej: "bg-gray-100", "bg-blue-50"
    text?: string // Ej: "text-gray-800"
    border?: string // Ej: "border-gray-200"
  }
  user?: {
    text?: string // Ej: "text-white"
    // El bg del usuario suele ser el primaryColor, pero podrías dejarlo overridear aquí si quisieras
  }
  mapCard?: {
    iconBg?: string // Ej: "bg-red-100"
    iconColor?: string // Ej: "text-red-600"
  }
  launcher?: {
    bg?: string // Clase CSS para el fondo del botón flotante
    pulse?: boolean
  }
}

export interface ChatTheme {
  /** Color primario (botón, burbujas del usuario) */
  primaryColor?: string

  /** Nombre del bot que aparece en el header */
  botName?: string

  /** URL del avatar/logo del bot */
  logoUrl?: string

  avatars?: EmotionAvatarMap
  /** Posición del launcher */
  position?: 'bottom-right' | 'bottom-left'

  /** Mensaje de bienvenida personalizado */
  welcomeMessage?: string

  /** Placeholder del input */
  inputPlaceholder?: string

  /** Border radius del chat window (CSS value, ej: '24px', '1.5rem') */
  borderRadius?: string

  /** Border radius del launcher button (CSS value, ej: '50%', '24px') */
  launcherBorderRadius?: string

  /* Aparece fuera del chat cuando está cerrado. Ej: "¿Necesitas ayuda?" */
  starterPrompt?: string

  bubbleStyles?: BubbleStyles

  promptPersistence?: PromptStrategy // Estrategia del globo

  avatarScale?: number // Zoom del avatar (ej: 1.2 para 20% más grande)
}

export interface UserContext {
  /** JWT token para autenticar al usuario real */
  token?: string

  /** Metadata adicional del usuario */
  metadata?: Record<string, any>
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

// ========== Tipos de Mensajes ==========
export type MessageType =
  | 'text'
  | 'image'
  | 'location'
  | 'system'
  | 'audio'
  | 'location'
  | 'file'

// 🔥 CORRECCIÓN 1: Agregamos 'system' a los senders permitidos
export type MessageSender = 'user' | 'bot' | 'system'

export interface BaseMessage {
  id: string
  type: MessageType
  sender: MessageSender // Usamos el tipo ampliado
  timestamp: Date
}

export interface TextMessage extends BaseMessage {
  type: 'text'
  content: string
  emotion?: BotEmotion
}

export interface ImageMessage extends BaseMessage {
  type: 'image'
  imageUrl: string
  altText?: string
  // ⚠️ NOTA: Aquí NO hay 'content', por eso TS se quejaba
}

export interface LocationMessage extends BaseMessage {
  type: 'location'
  latitude: number
  longitude: number
  name?: string
  // ⚠️ NOTA: Aquí tampoco hay 'content'
}

export interface SystemMessage extends BaseMessage {
  type: 'system'
  sender: 'system' // Forzamos a que si es system, el sender sea system
  content: string
}

export interface AudioMessage extends BaseMessage {
  type: 'audio'
  content: string // URL o Base64 del audio
}

export type ChatMessage =
  | TextMessage
  | ImageMessage
  | LocationMessage
  | SystemMessage
  | AudioMessage

// ========== Estado del Widget ==========
export interface ChatState {
  isOpen: boolean
  isConnected: boolean
  isTyping: boolean
  messages: ChatMessage[]
  error: string | null
  sessionId: string | null
}

export type ChatAction =
  | { type: 'TOGGLE_WINDOW' }
  | { type: 'OPEN_WINDOW' }
  | { type: 'CLOSE_WINDOW' }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'CLEAR_CHAT' }
