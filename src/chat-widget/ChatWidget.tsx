'use client'

import { useCallback, useState, useRef, useMemo } from 'react'
import type {
  ChatWidgetProps,
  ChatMessage,
  TextMessage,
  ImageMessage,
  AudioMessage,
  LocationMessage,
  PageContext,
  BubbleStyles,
} from './types'
import { useChatState } from './hooks/useChatState'
import { useChatSocket } from './hooks/useChatSocket'
import { useSEOMetadata } from './hooks/useSEOMetadata'
import { BotEmotion, Launcher } from './components/Launcher'
import { ChatWindow } from './components/ChatWindow'
import { cn } from '@/lib/utils'
import { useIsMobile } from './hooks/useIsMobile'
import { mergeThemeWithDefaults } from './utils/theme'

// Helper utilitario
const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

const DEFAULT_WIDGET_STYLES: BubbleStyles = {
  radius: {
    bubble: 'rounded-2xl',
    image: 'rounded-xl',
    button: 'rounded-xl',
    card: 'rounded-2xl',
  },
  bot: {
    bg: 'bg-muted/50 dark:bg-muted/20',
    text: 'text-foreground',
    border: 'border-border/50',
  },
  user: {
    text: 'text-primary-foreground',
  },
}

export function ChatWidget(props: ChatWidgetProps) {
  const {
    apiKey,
    apiBaseUrl,
    pageContext,
    includeSEOMetadata = false,
    theme,
    userContext,
    onLogin,
    onNavigate,
    onEvent,
    onStateChange,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const isMobile = useIsMobile() // Detectamos si es mobile

  const mergedStyles = useMemo<BubbleStyles>(
    () => ({
      radius: {
        ...DEFAULT_WIDGET_STYLES.radius,
        ...theme?.bubbleStyles?.radius,
      },
      bot: { ...DEFAULT_WIDGET_STYLES.bot, ...theme?.bubbleStyles?.bot },
      user: { ...DEFAULT_WIDGET_STYLES.user, ...theme?.bubbleStyles?.user },
      launcher: { ...theme?.bubbleStyles?.launcher },
      mapCard: { ...theme?.bubbleStyles?.mapCard },
    }),
    [theme?.bubbleStyles]
  )

  const { state, actions } = useChatState()
  const seoMetadata = useSEOMetadata(includeSEOMetadata)

  const enrichedPageContext = useMemo<PageContext | undefined>(() => {
    if (!seoMetadata) return pageContext
    return { ...(pageContext || {}), seo: { ...(seoMetadata || {}) } }
  }, [pageContext, seoMetadata])

  const socket = useChatSocket({
    apiKey,
    apiBaseUrl,
    pageContext: enrichedPageContext,
    userContext,
    onMessage: useCallback(
      (message: ChatMessage) => {
        actions.addMessage(message)
        if (!state.isOpen && message.sender === 'bot') {
          setUnreadCount((prev) => prev + 1)
        }
      },
      [actions, state.isOpen]
    ),
    onConnected: useCallback(
      (sessionId: string, config?: any) => {
        actions.setConnected(true)
        actions.setSessionId(sessionId)
        if (config && onEvent) onEvent('backend_config', config)
      },
      [actions, onEvent]
    ),
    onDisconnected: useCallback(() => actions.setConnected(false), [actions]),
    onTyping: useCallback(
      (isTyping: boolean) => actions.setTyping(isTyping),
      [actions]
    ),
    onError: useCallback((error: string) => actions.setError(error), [actions]),
    onLogin,
    onNavigate,
    onEvent,
  })

  const handleToggle = useCallback(() => {
    console.log('[ChatWidget] handleToggle called, current isOpen:', state.isOpen)
    if (!state.isOpen) {
      actions.openWindow()
      setUnreadCount(0)
      onStateChange?.(true)
      console.log('[ChatWidget] Opening window')
    } else {
      actions.closeWindow()
      onStateChange?.(false)
      console.log('[ChatWidget] Closing window')
    }
  }, [state.isOpen, actions, onStateChange])

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])

  const currentBotEmotion = useMemo<BotEmotion>(() => {
    if (state.isTyping) return 'thinking'
    const lastBotMessage = [...state.messages]
      .reverse()
      .find((m) => m.sender === 'bot' && m.type === 'text')
    return lastBotMessage?.type === 'text' && lastBotMessage.emotion
      ? (lastBotMessage.emotion as BotEmotion)
      : 'default'
  }, [state.isTyping, state.messages])

  // --- THEME: Fusionar tema del usuario con valores por defecto robustos ---
  const mergedTheme = useMemo(() => mergeThemeWithDefaults(theme), [theme])

  // --- FIX: Estilos Dinámicos para Mobile vs Desktop ---
  const containerStyle: React.CSSProperties = {
    '--chat-primary': mergedTheme.primaryColor,
    '--background': mergedTheme.cssVariables.background,
    '--foreground': mergedTheme.cssVariables.foreground,
    '--card': mergedTheme.cssVariables.card,
    '--card-foreground': mergedTheme.cssVariables.cardForeground,
    '--primary': mergedTheme.cssVariables.primary,
    '--primary-foreground': mergedTheme.cssVariables.primaryForeground,
    '--muted': mergedTheme.cssVariables.muted,
    '--muted-foreground': mergedTheme.cssVariables.mutedForeground,
    '--border': mergedTheme.cssVariables.border,
    '--destructive': mergedTheme.cssVariables.destructive,
    '--radius': mergedTheme.cssVariables.radius,
    zIndex: state.isOpen ? 2147483647 : 9999, // Z-index máximo al abrirse
    position: 'fixed',
    // En mobile, si está abierto, usamos inset-0 para asegurar cobertura
    top: isMobile && state.isOpen ? 0 : 'auto',
    left:
      isMobile && state.isOpen
        ? 0
        : theme?.position === 'bottom-left'
        ? '24px'
        : 'auto',
    right:
      isMobile && state.isOpen
        ? 0
        : theme?.position === 'bottom-right' || !theme?.position
        ? '24px'
        : 'auto',
    bottom: isMobile && state.isOpen ? 0 : '100px',
    width: isMobile && state.isOpen ? '100%' : 'auto',
    height: isMobile && state.isOpen ? '100%' : 'auto',
  } as React.CSSProperties

  return (
    <div
      ref={containerRef}
      id="paseolibre-chat-widget"
      className={cn(
        'paseolibre-chat-widget flex flex-col',
        !isMobile &&
          (theme?.position === 'bottom-left' ? 'items-start' : 'items-end')
      )}
      style={{
        ...containerStyle,
        pointerEvents: 'auto',
        // Forzar estilos visuales para demo
        backgroundColor: 'transparent',
      }}
    >
      {/* VENTANA DE CHAT */}
      <div
        className={cn(
          'transition-all duration-500 ease-in-out origin-bottom',
          state.isOpen
            ? 'opacity-100 scale-100 h-full w-full translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none translate-y-full h-0 w-0'
        )}
        style={{ pointerEvents: state.isOpen ? 'auto' : 'none' }}
        onMouseDown={stopPropagation}
        onTouchStart={stopPropagation}
      >
        <ChatWindow
          isOpen={state.isOpen}
          isConnected={socket.isConnected}
          isTyping={state.isTyping}
          messages={state.messages}
          onClose={() => actions.closeWindow()}
          onSendMessage={(content) => {
            // Agregar mensaje del usuario inmediatamente al estado (optimistic update)
            const userMessage: ChatMessage = {
              id: `temp-${Date.now()}-${Math.random()}`,
              type: 'text',
              sender: 'user',
              timestamp: new Date(),
              content: content,
            }
            actions.addMessage(userMessage)
            
            // Enviar al servidor
            socket.sendMessage(content, 'text')
          }}
          onSendAttachment={async (f, t) => {
            // Optimistic update: agregar mensaje del usuario inmediatamente
            let userMessage: ChatMessage
            
            if (t === 'audio') {
              userMessage = {
                id: `temp-${Date.now()}-${Math.random()}`,
                type: 'audio',
                sender: 'user',
                timestamp: new Date(),
                content: URL.createObjectURL(f), // Preview local del audio
              } satisfies AudioMessage
            } else if (t === 'image') {
              userMessage = {
                id: `temp-${Date.now()}-${Math.random()}`,
                type: 'image',
                sender: 'user',
                timestamp: new Date(),
                imageUrl: URL.createObjectURL(f), // Preview local de la imagen
              } satisfies ImageMessage
            } else {
              // 'file' → convertir a mensaje de texto con el nombre del archivo
              userMessage = {
                id: `temp-${Date.now()}-${Math.random()}`,
                type: 'text',
                sender: 'user',
                timestamp: new Date(),
                content: `📎 ${f.name}`, // Mostrar nombre del archivo
              } satisfies TextMessage
            }
            
            actions.addMessage(userMessage)
            
            // Enviar al servidor
            const b64 = await toBase64(f)
            socket.sendMessage(b64, t)
          }}
          onSendLocation={(l) => {
            // Optimistic update: agregar mensaje de ubicación inmediatamente
            const userMessage: ChatMessage = {
              id: `temp-${Date.now()}-${Math.random()}`,
              type: 'location',
              sender: 'user',
              timestamp: new Date(),
              latitude: l.latitude,
              longitude: l.longitude,
              name: 'Mi ubicación',
            } satisfies LocationMessage
            
            actions.addMessage(userMessage)
            
            // Enviar al servidor
            socket.sendMessage(JSON.stringify(l), 'location')
          }}
          botName={theme?.botName}
          logoUrl={theme?.logoUrl}
          welcomeMessage={theme?.welcomeMessage}
          inputPlaceholder={theme?.inputPlaceholder}
          primaryColor={theme?.primaryColor}
          position={theme?.position}
          bubbleStyles={mergedStyles}
          avatars={theme?.avatars}
        />
      </div>

      {/* LANZADOR (LAUNCHER) */}
      <div
        className={cn(
          state.isOpen ? 'hidden' : 'block',
          !isMobile && 'mt-4'
        )}
        style={{ pointerEvents: 'auto' }}
        onMouseDown={stopPropagation}
        onTouchStart={stopPropagation}
      >
        <Launcher
          isOpen={state.isOpen}
          onClick={handleToggle}
          unreadCount={unreadCount}
          position={theme?.position || 'bottom-right'}
          primaryColor={theme?.primaryColor}
          logoUrl={theme?.logoUrl}
          starterPrompt={theme?.starterPrompt}
          avatars={theme?.avatars}
          emotion={currentBotEmotion}
          styles={mergedStyles}
          promptPersistence={theme?.promptPersistence}
          avatarScale={theme?.avatarScale}
        />
      </div>
    </div>
  )
}
