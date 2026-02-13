'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import type { ChatWidgetProps } from './types'
import { Launcher } from './components/Launcher'
import { ChatWindow } from './components/ChatWindow'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PremiumConfigProvider } from './contexts/AnimationContext'
import { cn } from '@/lib/utils'
import { useIsMobile } from './hooks/useIsMobile'
import { useWidgetTheme } from './hooks/useWidgetTheme'
import { useChatWidget } from './hooks/useChatWidget'
import { useDarkMode } from './hooks/useDarkMode'

// Premium animations
import './styles/premium-animations.css'

export function ChatWidget(props: ChatWidgetProps) {
  const {
    apiKey,
    apiBaseUrl,
    agentId,
    pageContext,
    includeSEOMetadata = false,
    theme,
    mediaConfig,
    userContext,
    onLogin,
    onNavigate,
    onEvent,
    onStateChange,
  } = props

  // Refs y estado local
  const containerRef = useRef<HTMLDivElement>(null!)
  const isMobile = useIsMobile()

  // Dark mode detection - auto-applies 'dark' class to widget
  useDarkMode(containerRef)

  // Estado para tema recibido del socket
  const [socketTheme, setSocketTheme] = useState<ChatWidgetProps['theme'] | undefined>()

  // Merge de temas: proyecto (theme) > socket (socketTheme) > default
  const { mergedTheme, mergedStyles, getContainerStyle } = useWidgetTheme(theme, socketTheme)

  const {
    state,
    actions,
    unreadCount,
    currentBotEmotion,
    isConnected,
    handleToggle,
    handleSendText,
    handleSendAttachment,
    handleSendLocation,
    getSocket,
  } = useChatWidget({
    apiKey,
    apiBaseUrl,
    agentId,
    pageContext,
    includeSEOMetadata,
    theme,
    mediaConfig,
    userContext,
    onLogin,
    onNavigate,
    onEvent,
    onStateChange,
    onThemeUpdate: setSocketTheme, // Callback para recibir tema del socket
  })

  // Voice transcript persistence — creates ChatMessage objects from voice entries
  const handleAddVoiceMessage = useCallback(
    (msg: { sender: 'user' | 'bot'; content: string }) => {
      actions.addMessage({
        id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'text',
        sender: msg.sender,
        timestamp: new Date(),
        content: msg.content,
      })
    },
    [actions]
  )

  // Helpers
  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])

  const containerStyle = getContainerStyle(state.isOpen, isMobile, theme?.position)

  // Aplicar CSS variables al widget
  const cssVariablesStyle = useMemo(() => {
    if (!mergedTheme.cssVariables) return {}

    const vars: Record<string, string> = {}
    const cssVars = mergedTheme.cssVariables

    if (cssVars.background) vars['--background'] = cssVars.background
    if (cssVars.foreground) vars['--foreground'] = cssVars.foreground
    if (cssVars.card) vars['--card'] = cssVars.card
    if (cssVars.cardForeground) vars['--card-foreground'] = cssVars.cardForeground
    if (cssVars.primary) vars['--primary'] = cssVars.primary
    if (cssVars.primaryForeground) vars['--primary-foreground'] = cssVars.primaryForeground
    if (cssVars.muted) vars['--muted'] = cssVars.muted
    if (cssVars.mutedForeground) vars['--muted-foreground'] = cssVars.mutedForeground
    if (cssVars.border) vars['--border'] = cssVars.border
    if (cssVars.destructive) vars['--destructive'] = cssVars.destructive
    if (cssVars.radius) vars['--radius'] = cssVars.radius
    if (cssVars.spacing1) vars['--spacing-1'] = cssVars.spacing1
    if (cssVars.spacing2) vars['--spacing-2'] = cssVars.spacing2
    if (cssVars.spacing3) vars['--spacing-3'] = cssVars.spacing3
    if (cssVars.spacing4) vars['--spacing-4'] = cssVars.spacing4
    if (cssVars.spacing5) vars['--spacing-5'] = cssVars.spacing5
    if (cssVars.spacing6) vars['--spacing-6'] = cssVars.spacing6
    if (cssVars.spacing8) vars['--spacing-8'] = cssVars.spacing8

    return vars
  }, [mergedTheme.cssVariables])

  return (
    <PremiumConfigProvider
      animations={theme?.animations}
      effects={theme?.effects}
    >
      <div
        ref={containerRef}
        id="botuyo-chat-widget"
        className={cn(
          'botuyo-chat-widget flex flex-col',
          !isMobile && (theme?.position === 'bottom-left' ? 'items-start' : 'items-end')
        )}
        style={{
          ...containerStyle,
          ...cssVariablesStyle,
          pointerEvents: 'auto',
          backgroundColor: 'transparent',
        }}
        data-animations-disabled={theme?.animations?.enabled === false ? 'true' : undefined}
        data-effects-glassmorphism={theme?.effects?.glassmorphism === false ? 'false' : undefined}
        data-effects-shadows={theme?.effects?.softShadows === false ? 'false' : undefined}
      >
        {/* VENTANA DE CHAT */}
        <div
          className={cn(
            // Smooth spring-like animation originating from launcher position
            'transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            // Mobile: origin from bottom-right where launcher is
            isMobile 
              ? (theme?.position === 'bottom-left' ? 'origin-bottom-left' : 'origin-bottom-right')
              : 'origin-bottom',
            state.isOpen
              ? 'opacity-100 scale-100 h-full w-full translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-[0.85] pointer-events-none translate-y-8 h-0 w-0'
          )}
          style={{ pointerEvents: state.isOpen ? 'auto' : 'none' }}
          onMouseDown={stopPropagation}
          onTouchStart={stopPropagation}
        >
          <ErrorBoundary>
            <ChatWindow
              isOpen={state.isOpen}
              isConnected={isConnected}
              isTyping={state.isTyping}
              messages={state.messages}
              onClose={() => actions.closeWindow()}
              onSendMessage={handleSendText}
              onSendAttachment={handleSendAttachment}
              onSendLocation={handleSendLocation}
              botName={mergedTheme.botName}
              logoUrl={mergedTheme.logoUrl}
              welcomeMessage={mergedTheme.welcomeMessage}
              inputPlaceholder={theme?.inputPlaceholder}
              primaryColor={mergedTheme.primaryColor}
              position={theme?.position}
              bubbleStyles={mergedStyles}
              avatars={theme?.avatars}
              mediaConfig={mediaConfig}
              theme={mergedTheme}
              getSocket={getSocket}
              onAddVoiceMessage={handleAddVoiceMessage}
            />
          </ErrorBoundary>
        </div>

        {/* LANZADOR (LAUNCHER) */}
        <div
          className={cn(state.isOpen ? 'hidden' : 'block', !isMobile && 'mt-4')}
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
            showPromptAvatar={theme?.showPromptAvatar}
          />
        </div>
      </div>
    </PremiumConfigProvider>
  )
}
