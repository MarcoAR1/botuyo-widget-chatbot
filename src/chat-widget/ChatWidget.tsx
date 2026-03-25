'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChatWidgetProps } from './types'
import { Launcher } from './components/Launcher'
import { ChatWindow } from './components/ChatWindow'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PremiumConfigProvider } from './contexts/AnimationContext'
import { LanguageProvider } from './i18n/LanguageContext'
import { cn } from '@/lib/utils'
import { useIsMobile } from './hooks/useIsMobile'
import { useWidgetTheme } from './hooks/useWidgetTheme'
import { useChatWidget } from './hooks/useChatWidget'
import { useDarkMode } from './hooks/useDarkMode'
import { DARK_CSS_VARIABLES, getPrimaryColor } from './utils/theme'

// Premium animations
import './styles/premium-animations.css'

// Full widget CSS — injected into <head> when used in bare React component mode.
// standalone.tsx + ChatWidgetProvider inject this into Shadow DOM instead (no <head> pollution).
// Selectors are scoped to #botuyo-chat-widget-root so they don't leak into the host page.
import widgetCssContent from '../../styles.css?inline'

const WIDGET_CSS_ID = 'botuyo-widget-css'

function injectWidgetCSSIfNeeded(containerNode: HTMLElement | null) {
  // If we're mounted inside a Shadow DOM, skip — CSS is already injected there
  if (containerNode?.getRootNode() instanceof ShadowRoot) return
  // Inject once per document
  if (document.getElementById(WIDGET_CSS_ID)) return
  const style = document.createElement('style')
  style.id = WIDGET_CSS_ID
  // In <head> mode we target :root for CSS variables (not :host which is Shadow DOM only)
  style.textContent = widgetCssContent
  document.head.appendChild(style)
}

export function ChatWidgetInner(props: ChatWidgetProps) {
  const {
    apiKey,
    apiBaseUrl = 'https://api.botuyo.com',
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

  // Inject CSS when used as a bare React component (no Shadow DOM)
  useEffect(() => {
    injectWidgetCSSIfNeeded(containerRef.current)
  }, [])
  const isMobile = useIsMobile()

  // Dark mode detection - auto-applies 'dark' class to widget
  const isDarkMode = useDarkMode(containerRef)

  // Estado para tema recibido del socket
  const [socketTheme, setSocketTheme] = useState<ChatWidgetProps['theme'] | undefined>()

  // Merge de temas: proyecto (theme) > socket (socketTheme) > default
  const { mergedTheme, mergedStyles, getContainerStyle } = useWidgetTheme(theme, socketTheme)

  // Emite un solo console log si el agente esta en estado borrador (isHidden provisto por config web socket)
  useEffect(() => {
    if (mergedTheme.isHidden) {
      console.warn(
        '[BotUyo] ⚠️ El agente (o Flow) de IA asociado a esta API Key se encuentra pausado o en estado "boceto" (draft). ' +
        'El widget no se mostrará hasta que lo publiques dentro de la plataforma BotUyo.'
      )
    }
  }, [mergedTheme.isHidden])

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
    (msg: { sender: 'user' | 'bot'; content: string; timestamp?: Date }) => {
      actions.addMessage({
        id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'text',
        sender: msg.sender,
        timestamp: msg.timestamp || new Date(),
        content: msg.content,
      })
    },
    [actions]
  )

  // Voice: merge socketTheme.voiceEnabled into mediaConfig so backend controls the voice toggle
  const effectiveMediaConfig = useMemo(() => {
    const base = { ...(mediaConfig || {}) }
    // Backend sends voiceEnabled via connection_ack → socketTheme (dynamic obj, not typed)
    const socketConfig = socketTheme as any
    if (socketConfig?.voiceEnabled != null) {
      base.enableVoice = socketConfig.voiceEnabled
    }
    return base
  }, [mediaConfig, socketTheme])

  // Helpers
  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])

  const containerStyle = getContainerStyle(state.isOpen, isMobile, theme?.position)

  // Aplicar CSS variables al widget — swap to dark values when isDarkMode
  // Always inject defaults so Provider mode (no Shadow DOM / no styles.css) is self-contained
  const cssVariablesStyle = useMemo(() => {
    // Hardcoded defaults (same as styles.css :root) — ensures widget works without external CSS
    const defaults: Record<string, string> = {
      '--background': '0 0% 100%',
      '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--primary': '160 84% 39%',
      '--primary-foreground': '0 0% 100%',
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      '--border': '240 5.9% 90%',
      '--destructive': '0 84.2% 60.2%',
      '--radius': '0.5rem',
      '--window-border-radius': '24px',
      '--launcher-border-radius': '50%',
      '--window-height': '700px',
      '--window-bottom': '24px',
      '--spacing-1': '0.25rem',
      '--spacing-2': '0.5rem',
      '--spacing-3': '0.75rem',
      '--spacing-4': '1rem',
      '--spacing-5': '0.75rem',
      '--spacing-6': '1.5rem',
      '--spacing-7': '1.75rem',
      '--spacing-8': '2rem',
    }

    if (!mergedTheme.cssVariables) return defaults

    // Start with the merged light theme
    let cssVars: Record<string, string | undefined> = { ...mergedTheme.cssVariables }

    // Overlay dark CSS variables when dark mode is active
    if (isDarkMode) {
      // Priority: user theme darkCssVariables > socketTheme.darkCssVariables > DARK_CSS_VARIABLES (defaults)
      const socketDarkVars = (socketTheme as any)?.darkCssVariables || {}
      const userDarkVars = theme?.darkCssVariables || {}
      cssVars = {
        ...cssVars,
        ...DARK_CSS_VARIABLES,
        ...socketDarkVars,
        ...userDarkVars,
      }
    }

    // Overlay theme values onto defaults
    const vars: Record<string, string> = { ...defaults }

    // Color variables (kebab-case to match styles.css)
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

    // Layout variables
    if (cssVars.windowBorderRadius) vars['--window-border-radius'] = cssVars.windowBorderRadius
    if (cssVars.launcherBorderRadius) vars['--launcher-border-radius'] = cssVars.launcherBorderRadius
    if (cssVars.windowHeight) vars['--window-height'] = cssVars.windowHeight
    if (cssVars.windowBottom) vars['--window-bottom'] = cssVars.windowBottom

    // Spacing variables (kebab-case)
    if (cssVars.spacing1) vars['--spacing-1'] = cssVars.spacing1
    if (cssVars.spacing2) vars['--spacing-2'] = cssVars.spacing2
    if (cssVars.spacing3) vars['--spacing-3'] = cssVars.spacing3
    if (cssVars.spacing4) vars['--spacing-4'] = cssVars.spacing4
    if (cssVars.spacing5) vars['--spacing-5'] = cssVars.spacing5
    if (cssVars.spacing6) vars['--spacing-6'] = cssVars.spacing6
    if (cssVars.spacing7) vars['--spacing-7'] = cssVars.spacing7
    if (cssVars.spacing8) vars['--spacing-8'] = cssVars.spacing8

    return vars
  }, [mergedTheme.cssVariables, isDarkMode, socketTheme, theme?.darkCssVariables])

  if (mergedTheme.isHidden) return null

  // Don't render until socket has delivered the agent config (prevents flash)
  if (!socketTheme) return null

  return (
      <div
        ref={containerRef}
        id="botuyo-chat-widget-root"
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
              inputPlaceholder={theme?.inputPlaceholder || (socketTheme as any)?.inputPlaceholder}
              
              position={theme?.position}
              bubbleStyles={mergedStyles}
              avatars={theme?.avatars || (socketTheme as any)?.avatars || (socketTheme as any)?.avatarAnimations || {}}
              mediaConfig={effectiveMediaConfig}
              theme={mergedTheme}
              avatar3dUrl={theme?.avatar3dUrl}
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
            primaryColor={getPrimaryColor(mergedTheme)}
            logoUrl={mergedTheme.logoUrl}
            starterPrompt={theme?.starterPrompt || (socketTheme as any)?.starterPrompt}
            avatars={theme?.avatars || (socketTheme as any)?.avatars || (socketTheme as any)?.avatarAnimations || {}}
            emotion={currentBotEmotion}
            styles={mergedStyles}
            promptPersistence={theme?.promptPersistence}
            avatarScale={theme?.avatarScale ?? (socketTheme as any)?.avatarScale}
            showPromptAvatar={theme?.showPromptAvatar ?? (socketTheme as any)?.showPromptAvatar}
          />
        </div>
      </div>
  )
}

export function ChatWidget(props: ChatWidgetProps) {
  return (
    <LanguageProvider defaultLocale={props.theme?.defaultLocale}>
      <PremiumConfigProvider
        animations={props.theme?.animations}
        effects={props.theme?.effects}
      >
        <ChatWidgetInner {...props} />
      </PremiumConfigProvider>
    </LanguageProvider>
  )
}
