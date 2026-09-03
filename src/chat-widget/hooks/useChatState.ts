/**
 * @package @botuyo/chat-widget
 * Hook de estado global con persistencia de historial y fix de renderizado inmediato.
 */

import React, { useReducer, useCallback, useEffect, useState } from 'react'
import type { ChatState, ChatAction, ChatMessage, ToolProposalCardStatus } from '../types'
import { logger } from '../utils/logger'
import { getChatStorage } from '../utils/storage'

function getStorageKey(apiKey: string, agentId: string = 'default') {
  return `botuyo_chat_v1_${apiKey}_${agentId}`
}

const initialState: ChatState = {
  isOpen: false,
  isConnected: false,
  isTyping: false,
  messages: [],
  error: null,
  sessionId: null,
}

/** Time window within which the same sender+content is treated as ONE logical message. */
const SIG_WINDOW_MS = 60000

const tsOf = (m: ChatMessage): number => {
  const t = new Date(m.timestamp as unknown as string).getTime()
  return Number.isFinite(t) ? t : 0
}

/** Signature for collapsing the same TEXT turn that arrived under different ids (optimistic vs server echo). */
const sigOf = (m: ChatMessage): string => {
  const c = (m as { content?: string }).content
  return `${m.sender}|${typeof c === 'string' ? c.trim() : ''}`
}

/**
 * Canonicalize the message list so ORDER never depends on id coordination:
 *   1. sort by timestamp (chronological — the source of truth for order),
 *   2. dedupe by id,
 *   3. collapse duplicate TEXT turns (same sender+content within SIG_WINDOW_MS) that arrived under
 *      different ids — preferring the server's real id over the optimistic `msg-*` one.
 * This is what stops the "pile-up / out-of-order" when the cache expires and history re-merges.
 */
function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  const sorted = [...messages].sort((a, b) => tsOf(a) - tsOf(b))
  const seenIds = new Set<string>()
  const out: ChatMessage[] = []
  for (const m of sorted) {
    if (m.id) {
      if (seenIds.has(m.id)) continue
      seenIds.add(m.id)
    }
    // Signature dedup ONLY for non-empty text (never collapse distinct images/buttons/proposals).
    const isText = m.type === 'text' && !!(m as { content?: string }).content?.trim()
    if (isText) {
      const idx = out.findIndex(
        x => x.type === 'text' && sigOf(x) === sigOf(m) && Math.abs(tsOf(x) - tsOf(m)) < SIG_WINDOW_MS
      )
      if (idx >= 0) {
        const existingOptimistic = !!out[idx].id?.startsWith('msg-')
        const incomingOptimistic = !!m.id?.startsWith('msg-')
        // Only collapse an OPTIMISTIC turn against its real server echo — never two real messages
        // (that would drop a legitimate repeated message like the user saying "sí" twice).
        if (existingOptimistic !== incomingOptimistic) {
          if (existingOptimistic) out[idx] = m // keep the server's real id
          continue
        }
      }
    }
    out.push(m)
  }
  return out
}

/** Back-compat alias — same canonicalization used everywhere the list is rebuilt. */
const dedupeById = normalizeMessages

function chatReducer(
  state: ChatState,
  action: ChatAction | { type: 'RESTORE_SESSION'; payload: Partial<ChatState> }
): ChatState {
  switch (action.type) {
    case 'TOGGLE_WINDOW':
      return { ...state, isOpen: !state.isOpen }

    case 'OPEN_WINDOW':
      return { ...state, isOpen: true }

    case 'CLOSE_WINDOW':
      return { ...state, isOpen: false }

    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload }

    case 'SET_TYPING':
      return { ...state, isTyping: action.payload }

    case 'ADD_MESSAGE': {
      // Exact id already present → no-op (no re-render).
      if (state.messages.some(m => m.id === action.payload.id)) {
        return state
      }
      // Insert + canonicalize (timestamp order + id/signature dedup).
      const merged = normalizeMessages([...state.messages, action.payload])
      // If nothing actually changed (same ids in the same order), skip the render. Note we compare
      // the id SEQUENCE, not just length: a server echo can REPLACE an optimistic id without
      // changing the count, and that swap must go through.
      const unchanged =
        merged.length === state.messages.length && merged.every((m, i) => m.id === state.messages[i].id)
      if (unchanged) {
        return state
      }
      const isBot = action.payload.sender === 'bot'
      return {
        ...state,
        messages: merged,
        // Si el mensaje es del bot, apagamos typing. Si es del usuario, mantenemos el actual.
        isTyping: isBot ? false : state.isTyping,
      }
    }

    case 'SET_MESSAGES':
      return { ...state, messages: normalizeMessages(action.payload) }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload }

    case 'ANSWER_QUIZ': {
      const { messageId, buttonId } = action.payload
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === messageId && m.type === 'buttons'
            ? { ...m, answered: true, ...(buttonId ? { selectedId: buttonId } : {}) }
            : m
        ),
      }
    }

    case 'RESOLVE_PROPOSAL': {
      const { proposalId, status } = action.payload
      return {
        ...state,
        messages: state.messages.map(m =>
          m.type === 'tool_proposal' && m.proposalId === proposalId ? { ...m, status } : m
        ),
      }
    }

    case 'CLEAR_CHAT':
      return { ...initialState, isOpen: state.isOpen }

    case 'RESTORE_SESSION':
      return {
        ...state,
        ...action.payload,
        messages: action.payload.messages
          ? dedupeById(action.payload.messages)
          : state.messages,
        isConnected: false,
        isTyping: false,
        error: null,
      }

    default:
      return state
  }
}

export function useChatState(apiKey: string, agentId: string = 'default') {
  const [state, dispatch] = useReducer(chatReducer, initialState)
  const [isHydrated, setIsHydrated] = useState(false)
  const STORAGE_KEY = React.useMemo(() => getStorageKey(apiKey, agentId), [apiKey, agentId])
  const chatStorage = React.useMemo(() => getChatStorage(apiKey, agentId), [apiKey, agentId])

  // 1. HIDRATACIÓN (Carga inicial)
  useEffect(() => {
    if (typeof window === 'undefined' || isHydrated) return

    const hydrateFromStorage = async () => {
      try {
        // Migrar desde localStorage si existe
        await chatStorage.migrateFromLocalStorage(apiKey, agentId)

        // Cargar mensajes desde IndexedDB
        const messages = await chatStorage.getMessages(100)
        const metadata = await chatStorage.getMetadata()

        if (messages.length > 0 || metadata) {
          const parsed = {
            messages: messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp),
            })),
            sessionId: metadata?.sessionId || null,
            isOpen: metadata?.isOpen || false,
          }
          dispatch({ type: 'RESTORE_SESSION', payload: parsed })
        }
      } catch (e) {
        logger.warn('Chat: Error rehydrating from IndexedDB', e)
        // Fallback a localStorage
        try {
          const saved = localStorage.getItem(STORAGE_KEY)
          if (saved) {
            const parsed = JSON.parse(saved)
            if (parsed.messages) {
              parsed.messages = parsed.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              }))
            }
            dispatch({ type: 'RESTORE_SESSION', payload: parsed })
          }
        } catch (fallbackError) {
          logger.error('Chat: Fallback rehydration failed', fallbackError)
        }
      } finally {
        setIsHydrated(true)
      }
    }

    hydrateFromStorage()
  }, [isHydrated])

  // 2. PERSISTENCIA (Auto-save)
  useEffect(() => {
    if (!isHydrated) return

    const timer = setTimeout(async () => {
      try {
        // Guardar mensajes en IndexedDB
        await chatStorage.saveMessages(state.messages)

        // Guardar metadata
        await chatStorage.setMetadata({
          isOpen: state.isOpen,
          sessionId: state.sessionId,
        })
      } catch (e) {
        logger.error('Chat Persistence Error:', e)
        // Fallback a localStorage
        try {
          const dataToSave = {
            isOpen: state.isOpen,
            messages: state.messages,
            sessionId: state.sessionId,
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
        } catch (fallbackError) {
          logger.error('Chat: Fallback persistence failed', fallbackError)
        }
      }
    }, 500) // Debounce para no saturar IndexedDB

    return () => clearTimeout(timer)
  }, [state.isOpen, state.messages, state.sessionId, isHydrated])

  // Acciones Memorizadas
  const addMessage = useCallback((msg: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: msg })
  }, [])

  // Resto de acciones...
  const toggleWindow = useCallback(() => dispatch({ type: 'TOGGLE_WINDOW' }), [])
  const openWindow = useCallback(() => dispatch({ type: 'OPEN_WINDOW' }), [])
  const closeWindow = useCallback(() => dispatch({ type: 'CLOSE_WINDOW' }), [])
  const setConnected = useCallback(
    (val: boolean) => dispatch({ type: 'SET_CONNECTED', payload: val }),
    []
  )
  const setTyping = useCallback(
    (val: boolean) => dispatch({ type: 'SET_TYPING', payload: val }),
    []
  )
  const setMessages = useCallback(
    (msgs: ChatMessage[]) => dispatch({ type: 'SET_MESSAGES', payload: msgs }),
    []
  )
  const setError = useCallback(
    (err: string | null) => dispatch({ type: 'SET_ERROR', payload: err }),
    []
  )
  const setSessionId = useCallback(
    (id: string) => dispatch({ type: 'SET_SESSION_ID', payload: id }),
    []
  )
  const clearChat = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    dispatch({ type: 'CLEAR_CHAT' })
  }, [])

  const clearMessages = useCallback(() => {
    dispatch({ type: 'SET_MESSAGES', payload: [] })
  }, [])

  const answerQuiz = useCallback(
    (messageId: string, buttonId?: string) =>
      dispatch({ type: 'ANSWER_QUIZ', payload: { messageId, buttonId } }),
    []
  )

  const resolveProposal = useCallback(
    (proposalId: string, status: ToolProposalCardStatus) =>
      dispatch({ type: 'RESOLVE_PROPOSAL', payload: { proposalId, status } }),
    []
  )

  return {
    state,
    isHydrated,
    actions: {
      toggleWindow,
      openWindow,
      closeWindow,
      setConnected,
      setTyping,
      addMessage,
      setMessages,
      setError,
      setSessionId,
      clearChat,
      clearMessages,
      answerQuiz,
      resolveProposal,
    },
  }
}
