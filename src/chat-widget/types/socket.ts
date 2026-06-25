/**
 * @package @botuyo/chat-widget
 * Tipos de eventos Socket.IO del protocolo Backend
 */

import { z } from 'zod'
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

  /**
   * Confirmar una propuesta de herramienta pendiente (tool approval). El servidor
   * RE-VALIDA (tool conocido, ownerOnly vs rol, no expirada) y ejecuta con los args
   * almacenados. El cliente sólo envía el `proposalId` (nunca los args).
   */
  tool_confirm: (data: ToolConfirmPayload) => void

  /** Rechazar una propuesta de herramienta pendiente; el servidor reanuda la conversación. */
  tool_reject: (data: ToolConfirmPayload) => void
}

/** C2S payload for `tool_confirm` / `tool_reject` — only the opaque proposal id travels. */
export interface ToolConfirmPayload {
  proposalId: string
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
    avatar3dUrl?: string
    avatarAnimations?: Record<string, string>
    voiceEnabled?: boolean
    isHidden?: boolean
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

/**
 * Payload of the `agent_switched` custom event — emitted by the backend when a
 * `switch_variant` (intra-family) or `transfer_to_department` (inter-agent) tool
 * runs successfully. Lets the widget reflect the now-active agent/variant in its
 * header (name + avatar) and show a system bubble. All fields are optional:
 * `switch_variant` may omit `name`/`avatarUrl` when no variantsMeta exists, and
 * `transfer_to_department` omits `variantKey`/`avatarUrl`.
 */
export interface AgentSwitchedData {
  /** Connect-time/resolved agent id of the now-active agent (informational). */
  agentId?: string
  /** Display name of the now-active agent/variant (e.g. "Ms. Ellis"). */
  name?: string
  /** Short variant/department label (e.g. "A2", "Ventas"). */
  label?: string
  /** Avatar/logo URL of the now-active agent/variant. */
  avatarUrl?: string
  /** The variant key when the switch came from `switch_variant`. */
  variantKey?: string
}

// ========== Tool Approval (Authenticated Agents · OC-WD-01) ==========

/**
 * Schema for an incoming `tool_proposal` payload — delivered through the existing
 * `custom_event` envelope (eventName: `tool_proposal`). The backend emits it when an
 * agent wants to run a mutating tool that needs human confirmation. `safeParse` DROPS
 * malformed payloads before they reach the UI (RULE 8: validate bot messages).
 *
 * The client never trusts/echoes `args`: on confirm it sends ONLY `proposalId` and the
 * server re-derives args from its persisted proposal. `args` here is informational.
 */
export const ToolProposalSchema = z.object({
  proposalId: z.string().min(1),
  tool: z.string().min(1),
  title: z.string().optional(),
  summary: z.string().optional(),
  args: z.record(z.string(), z.unknown()).optional(),
  ownerOnly: z.boolean().optional(),
})

/** Validated payload of a `tool_proposal` custom event. */
export type ToolProposalData = z.infer<typeof ToolProposalSchema>

/** Terminal state of a proposal (set on confirm/cancel, or server-driven expiry). */
export type ToolProposalStatus = 'confirmed' | 'cancelled' | 'expired'

/**
 * Schema for `tool_proposal_resolved` / `tool_proposal_expired` custom events — lets the
 * widget mark an in-flight proposal card as resolved (e.g. when it expires server-side).
 */
export const ToolProposalResolvedSchema = z.object({
  proposalId: z.string().min(1),
  status: z.enum(['confirmed', 'cancelled', 'expired']).optional(),
})

/** Validated payload of a `tool_proposal_resolved` / `tool_proposal_expired` custom event. */
export type ToolProposalResolvedData = z.infer<typeof ToolProposalResolvedSchema>

// ========== Auth Payload (Handshake) ==========
export interface SocketAuthPayload {
  /** API Key del tenant */
  apiKey: string

  /** Device ID del guest (persistido en localStorage) */
  deviceId: string

  /** Optional agent flow ID to connect to a specific agent */
  agentId?: string

  /** Token JWT opcional si el usuario ya está autenticado */
  token?: string

  /** Metadata adicional */
  metadata?: Record<string, any>
}
