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
      // ⚡ FIX CRÍTICO: Creamos un nuevo array de mensajes y forzamos el render
      // Evitar duplicados: si el mensaje ya existe (mismo ID), no lo agregamos
      const messageExists = state.messages.some(m => m.id === action.payload.id)
      if (messageExists) {
        return state
      }

      // Content-based dedup fallback: si el ID es random (msg-*), verificar
      // que no haya un mensaje reciente idéntico (mismo content + sender en últimos 30s)
      if (action.payload.id.startsWith('msg-') && action.payload.type === 'text') {
        const now = new Date().getTime()
        const recentDuplicateExists = state.messages
          .slice(-10)
          .some(m =>
            m.type === 'text' &&
            m.sender === action.payload.sender &&
            'content' in m && 'content' in action.payload &&
            m.content === (action.payload as any).content &&
            Math.abs(now - new Date(m.timestamp).getTime()) < 30000
          )
        if (recentDuplicateExists) {
          return state
        }
      }

      const newMessages = [...state.messages, action.payload]
      const isBot = action.payload.sender === 'bot'

      return {
        ...state,
        messages: newMessages,
        // Si el mensaje es del bot, apagamos typing. Si es del usuario, mantenemos el actual.
        isTyping: isBot ? false : state.isTyping,
      }
    }

    case 'SET_MESSAGES':
      return { ...state, messages: [...action.payload] }

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
