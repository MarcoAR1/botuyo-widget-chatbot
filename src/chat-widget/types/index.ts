/**
 * @package @botuyo/chat-widget
 * Tipos principales del Chat Widget
 */

import { BotEmotion, EmotionAvatarMap, PromptStrategy } from '../components/Launcher'
import type { VoiceGateSetting } from '../voice/audioEnhancement'

/**
 * Configuración de funcionalidades multimedia
 */
export interface MediaConfig {
  /** Habilitar envío de imágenes (default: true) */
  enableImages?: boolean
  /** Habilitar grabación y envío de audio (default: true) */
  enableAudio?: boolean
  /** Habilitar voice chat en tiempo real - Enterprise (default: false) */
  enableVoice?: boolean
  /** Habilitar envío de archivos (default: true) */
  enableFiles?: boolean
  /** Habilitar compartir ubicación (default: true) */
  enableLocation?: boolean
  /** Tipos de archivos permitidos (default: todos) */
  allowedFileTypes?: string[]
  /** Tamaño máximo de archivo en MB (default: 10) */
  maxFileSizeMB?: number
}

/**
 * Animation configuration - all toggleable
 * Control every aspect of widget animations
 */
export interface AnimationConfig {
  /** Enable all animations (master toggle, default: true) */
  enabled?: boolean
  /** Message entry animation style */
  messageEntry?: 'slide' | 'fade' | 'scale' | 'spring' | 'none'
  /** Typing indicator animation style */
  typingIndicator?: 'dots' | 'wave' | 'pulse' | 'none'
  /** Enable button micro-interactions (hover, press effects) */
  buttonEffects?: boolean
  /** Enable smooth scroll in message list */
  smoothScroll?: boolean
  /** Animation duration multiplier (0.5 = faster, 2 = slower, default: 1) */
  speedMultiplier?: number
  /** Stagger delay between sequential message animations in ms (default: 50) */
  staggerDelay?: number
  /** Enable chat window entry/exit animations */
  windowTransitions?: boolean
  /** Enable launcher pulse animation */
  launcherPulse?: boolean
}

/**
 * Visual effects configuration
 * Premium visual enhancements - all toggleable
 */
export interface EffectsConfig {
  /** Enable glassmorphism blur effect on headers (default: true) */
  glassmorphism?: boolean
  /** Enable gradient backgrounds (default: true) */
  gradients?: boolean
  /** Enable soft shadow effects (default: true) */
  softShadows?: boolean
  /** Enable glow effects on hover/focus (default: true) */
  glowEffects?: boolean
  /** Enable particle/confetti effects on actions (default: false) */
  particles?: boolean
  /** Enable UI sound effects (default: false) */
  soundEffects?: boolean
  /** Enable haptic feedback on mobile (default: true) */
  hapticFeedback?: boolean
  /** Enable shimmer loading effect (default: true) */
  shimmerLoading?: boolean
  /** Enable hover lift effect on cards (default: true) */
  hoverLift?: boolean
}

/**
 * Voice chat configuration (Enterprise tier)
 * Received from /api/widget/config endpoint
 */
export interface VoiceConfig {
  /** If false, voice feature is disabled for this tenant */
  enabled: boolean
  /** Preferred language for STT/TTS (e.g., 'es-AR', 'en-US') */
  language?: string
  /** Voice ID for TTS (default or custom cloned voice) */
  voiceId?: string
  /** Maximum recording duration in seconds (default: 60) */
  maxDurationSeconds?: number
  /** WebSocket endpoint override (optional) */
  wsEndpoint?: string
}

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

  /** URL base del backend (Gateway). Defaults to 'https://api.botuyo.com' */
  apiBaseUrl?: string

  /** Optional agent flow ID — connects to a specific agent for this tenant */
  agentId?: string

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

  // ========== Configuración de Funcionalidades ==========
  /** Configuración de funcionalidades multimedia (imágenes, audio, archivos, ubicación) */
  mediaConfig?: MediaConfig

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

  // ========== Playground / Embedded Mode ==========
  /** Start with the chat window already open (default: false) */
  initialOpen?: boolean

  /** Hide the floating launcher button entirely (default: false) */
  hideLauncher?: boolean

  /**
   * Voice-first (kiosk-style) mode. When true the widget renders ONLY a
   * fullscreen voice-call experience that auto-starts the call as soon as the
   * socket connects — no launcher, no text chat window. Used by the recruiting
   * interview room. The host is notified via `onEvent`:
   *   - `onEvent('voice_call_ended', { reason })` when the SERVER ends the call
   *     (e.g. reason 'interview_completed' once the agent finalizes).
   *   - `onEvent('voice_first_ended', {})` when the call overlay closes for any
   *     reason (server end, candidate hangup, inactivity).
   * Default: false.
   */
  voiceFirst?: boolean
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
  /** Nombre del bot que aparece en el header */
  botName?: string

  /** URL del avatar/logo del bot */
  logoUrl?: string

  avatars?: EmotionAvatarMap
  /** URL to a .vrm/.glb 3D model for voice call avatar */
  avatar3dUrl?: string
  /**
   * Background-noise gate sensitivity for live voice calls — isolates the
   * speaker in front of the device. `'off' | 'low' | 'standard' | 'high'`
   * (default 'standard'), `true`/`false`, or a partial config for fine control.
   */
  voiceNoiseGate?: VoiceGateSetting
  /** Posición del launcher */
  position?: 'bottom-right' | 'bottom-left'

  /** Mensaje de bienvenida personalizado */
  welcomeMessage?: string

  /** Placeholder del input */
  inputPlaceholder?: string

  /* Aparece fuera del chat cuando está cerrado. Ej: "¿Necesitas ayuda?" */
  starterPrompt?: string

  bubbleStyles?: BubbleStyles

  promptPersistence?: PromptStrategy // Estrategia del globo

  avatarScale?: number // Zoom del avatar (ej: 1.2 para 20% más grande)

  /** Muestra un mini avatar en el prompt bubble (default: false) */
  showPromptAvatar?: boolean

  /** Idioma por defecto del widget */
  defaultLocale?: 'es' | 'en' | 'pt' | 'fr'

  /** Oculta el widget completamente (usado para agentes en modo borrador) */
  isHidden?: boolean

  /** Variables CSS personalizadas para design system */
  cssVariables?: {
    /** Color de fondo principal (formato HSL sin hsl(), ej: "0 0% 100%") */
    background?: string
    /** Color de texto principal (formato HSL sin hsl(), ej: "240 10% 3.9%") */
    foreground?: string
    /** Color de fondo de tarjetas (formato HSL sin hsl(), ej: "0 0% 100%") */
    card?: string
    /** Color de texto en tarjetas (formato HSL sin hsl(), ej: "240 10% 3.9%") */
    cardForeground?: string
    /** Color primario (formato HSL sin hsl(), ej: "160 84% 39%") */
    primary?: string
    /** Color de texto sobre fondo primario (formato HSL sin hsl(), ej: "0 0% 100%") */
    primaryForeground?: string
    /** Color de fondo silenciado (formato HSL sin hsl(), ej: "240 4.8% 95.9%") */
    muted?: string
    /** Color de texto silenciado (formato HSL sin hsl(), ej: "240 3.8% 46.1%") */
    mutedForeground?: string
    /** Color de bordes (formato HSL sin hsl(), ej: "240 5.9% 90%") */
    border?: string
    /** Color destructivo/error (formato HSL sin hsl(), ej: "0 84.2% 60.2%") */
    destructive?: string
    /** Border radius base para componentes internos (ej: "0.5rem") */
    radius?: string

    // ── Layout del widget (reemplaza los campos top-level) ──────────────────
    /** Border radius de la ventana del chat (ej: "24px", "1.5rem") */
    windowBorderRadius?: string
    /** Border radius del botón launcher (ej: "50%", "24px") */
    launcherBorderRadius?: string
    /** Altura de la ventana en desktop (ej: "700px", "80vh") */
    windowHeight?: string
    /** Distancia desde el borde inferior (ej: "24px") */
    windowBottom?: string


    // Design System - Spacing
    /** Spacing 1 - Extra small (ej: "0.25rem") */
    spacing1?: string
    /** Spacing 2 - Small (ej: "0.5rem") */
    spacing2?: string
    /** Spacing 3 - Medium small (ej: "0.75rem") */
    spacing3?: string
    /** Spacing 4 - Medium (ej: "1rem") */
    spacing4?: string
    /** Spacing 5 - Default padding (ej: "0.75rem") */
    spacing5?: string
    /** Spacing 6 - Large (ej: "1.5rem") */
    spacing6?: string
    /** Spacing 7 - Large (ej: "1.75rem") */
    spacing7?: string
    /** Spacing 8 - Extra large (ej: "2rem") */
    spacing8?: string
  }

  /** Dark mode CSS variable overrides. Same keys as cssVariables.
   *  primary/primaryForeground are preserved from light mode —
   *  only override surface colors (background, card, muted, border, etc.) */
  darkCssVariables?: {
    background?: string
    foreground?: string
    card?: string
    cardForeground?: string
    primary?: string
    primaryForeground?: string
    muted?: string
    mutedForeground?: string
    border?: string
    destructive?: string
  }

  /** Text shown in the widget header bar (overrides botName in header) */
  headerText?: string

  /** Animation configuration - control all widget animations */
  animations?: AnimationConfig

  /** Visual effects configuration - premium visual enhancements */
  effects?: EffectsConfig
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
export type MessageType = 'text' | 'image' | 'location' | 'system' | 'audio' | 'location' | 'file' | 'buttons'

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
  sources?: string[]
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
  content: string // URL or Base64 of the audio
  text?: string // Optional transcript text (shown below the audio player)
}

export interface FileMessage extends BaseMessage {
  type: 'file'
  fileUrl: string
  fileName: string
  fileSize?: number
  mimeType?: string
}

export interface QuizButton {
  id: string
  label: string
}

export interface ButtonsMessage extends BaseMessage {
  type: 'buttons'
  content: string // Question text
  buttons: QuizButton[]
  /** Track which button was clicked (set on click, undefined initially) */
  selectedId?: string
}

export type ChatMessage =
  | TextMessage
  | ImageMessage
  | LocationMessage
  | SystemMessage
  | AudioMessage
  | FileMessage
  | ButtonsMessage

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
