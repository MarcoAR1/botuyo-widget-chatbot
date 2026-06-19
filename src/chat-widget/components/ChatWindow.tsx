'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from '@/chat-widget/i18n'
import { X, ShieldCheck, Heart, Phone } from './Icons'
import { cn } from '@/lib/utils'
import type { BubbleStyles, ButtonsMessage, ChatMessage, MediaConfig } from '../types'
import { MessageList } from './MessageList'
import { InputArea } from './InputArea'
import { SuggestedQuestions } from './SuggestedQuestions'
import { QuizDock } from './QuizDock'
import { getPrimaryColor } from '../utils/theme'
import { useIsMobile } from '../hooks/useIsMobile'
import { useDynamicHeight } from '../hooks/useDynamicHeight'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { EmotionAvatarMap } from './Launcher'
import { DEFAULT_AVATAR_URL } from '../utils/defaultAssets'
import { VoiceCallOverlay, type VoiceOverlayConfig } from './VoiceCallOverlay'

export interface ChatWindowProps {
  isOpen: boolean
  isConnected: boolean
  isTyping: boolean
  messages: ChatMessage[]
  botName?: string
  logoUrl?: string
  welcomeMessage?: string
  inputPlaceholder?: string
  mediaConfig?: MediaConfig
  onClose: () => void
  onSendMessage: (message: string) => void
  position?: 'bottom-right' | 'bottom-left'
  bubbleStyles?: BubbleStyles
  avatars?: EmotionAvatarMap
  onSendAttachment?: (file: File, type: 'image' | 'audio' | 'file') => void
  onSendLocation?: (location: { latitude: number; longitude: number }) => void
  getSocket?: () => any
  /** URL to a .vrm/.glb 3D model for voice call avatar */
  avatar3dUrl?: string
  /** Voice call overlay configuration (e.g. background-noise gate sensitivity) */
  voiceConfig?: VoiceOverlayConfig
  theme?: import('../types').ChatTheme
  /** Pre-chat suggested questions (shown before first user message) */
  suggestedQuestions?: string[]
  /** The active (unanswered) quiz to pin in a dock above the input (null/undefined = none). */
  activeQuiz?: ButtonsMessage | null
  /** Called when the user answers the pinned quiz (taps an option). */
  onQuizAnswer?: (message: ButtonsMessage, label: string, buttonId: string) => void
}

export function ChatWindow({
  isOpen,
  isConnected,
  isTyping,
  messages,
  botName = 'BotUyo',
  logoUrl,
  welcomeMessage,
  inputPlaceholder,
  mediaConfig,
  onClose,
  onSendMessage,
  bubbleStyles,
  avatars,
  onSendAttachment,
  onSendLocation,
  getSocket,
  avatar3dUrl,
  voiceConfig,
  theme,
  suggestedQuestions,
  activeQuiz,
  onQuizAnswer,
}: ChatWindowProps) {
  const [logoError, setLogoError] = useState(false)
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false)
  const [showCallConfirm, setShowCallConfirm] = useState(false)
  const { t } = useTranslations()
  const isMobile = useIsMobile()
  const themePrimary = getPrimaryColor({ cssVariables: theme?.cssVariables })
  const dynamicHeightStyles = useDynamicHeight({
    isOpen,
    height: theme?.cssVariables?.windowHeight,
    bottom: theme?.cssVariables?.windowBottom,
  })

  // Focus trap para accesibilidad
  const dialogRef = useFocusTrap({
    enabled: isOpen,
    onEscape: onClose,
  })

  useEffect(() => {
    if (!isOpen) return

    if (isMobile) {
      document.body.style.overflow = 'hidden'
      // Remove position: fixed because iOS shifts the entire layout viewport
      // when the virtual keyboard opens, causing the widget to double-bounce/shoot upwards.
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, isMobile])

  if (!isOpen) return null

  const isBottomLeft = theme?.position === 'bottom-left'
  // While a quiz is active it lives ONLY in the pinned dock — drop it from the inline
  // transcript so the question isn't shown twice. Once answered it is no longer active
  // and reappears inline as history (with the chosen option highlighted).
  const inlineMessages = activeQuiz ? messages.filter(m => m.id !== activeQuiz.id) : messages

  return (
    <>
      {/* Descripción oculta para lectores de pantalla */}
      <div id="chat-dialog-description" className="sr-only">
        {t('accessibility.dialogDescription', { botName: botName ?? 'BotUyo' })}
      </div>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-window-title"
        aria-describedby="chat-dialog-description"
        tabIndex={-1}
        className={cn(
          'flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'text-foreground z-[9999]',

          // 💻 DESKTOP: fixed positioning + animation classes only
          !isMobile && [
            'fixed',
            isBottomLeft ? 'left-6' : 'right-6',
            'border',
            'animate-in fade-in zoom-in-95',
            isBottomLeft ? 'slide-in-from-bottom-10' : 'slide-in-from-bottom-10',
          ],

          // 📱 MOBILE: Full pantalla ajustada al viewport real
          isMobile && ['fixed inset-0 w-full']
        )}
        style={{
          // useDynamicHeight already calculates height, maxHeight, and bottom correctly
          ...dynamicHeightStyles,
          // 💻 DESKTOP: inline layout (Provider-safe — no Tailwind arbitrary classes needed)
          ...(!isMobile ? {
            width: '350px',
            minWidth: '350px',
            maxWidth: '350px',
            borderRadius: '32px',
            boxShadow: '0 25px 65px -5px rgba(0, 0, 0, 0.15), 0 8px 20px -8px rgba(0, 0, 0, 0.1)',
          } : {}),
          // 🎨 CSS VARIABLES - Los temas se aplican automáticamente
          backgroundColor: 'hsl(var(--background))',
          borderColor: 'hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        }}
      >
        {/* --- HEADER --- */}
        <header
          className="relative shrink-0 border-b z-20"
          style={{
            padding: 'var(--spacing-5)',
            backgroundColor: 'hsl(var(--background) / 0.9)',
            borderColor: 'hsl(var(--border))',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 border-2 border-background shadow-soft-sm">
                  {logoError ? (
                    <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={logoUrl || DEFAULT_AVATAR_URL}
                      alt={botName}
                      className="h-full w-full object-cover"
                      onError={() => setLogoError(true)}
                    />
                  )}
                </div>
                <div
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background',
                    isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  )}
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span
                    id="chat-window-title"
                    className="font-black text-xs uppercase tracking-tight text-foreground"
                  >
                    {botName}
                  </span>
                  <ShieldCheck className="h-3 w-3 text-primary fill-primary/10" />
                </div>
                <div id="chat-window-description" className="flex items-center gap-1.5 mt-0.5">
                  <span className="flex h-1 w-1 rounded-full bg-emerald-500" />
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                    {isConnected ? t('online') : t('offline')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Voice Call Button - shows only when enableVoice is true in mediaConfig (premium) */}
              {mediaConfig?.enableVoice && (
                <div className="relative">
                  <button
                    onClick={() => setShowCallConfirm(!showCallConfirm)}
                    aria-label="Iniciar llamada de voz"
                    title="Llamar"
                    className="h-8 w-8 flex items-center justify-center rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <Phone className="h-4 w-4" aria-hidden="true" />
                  </button>

                  {/* Mini confirmation modal */}
                  {showCallConfirm && (
                    <div
                      className="absolute top-full right-0 mt-2 rounded-2xl border shadow-soft-2xl animate-in fade-in zoom-in-95 duration-200 z-50"
                      style={{
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        padding: 'var(--spacing-4)',
                        minWidth: '180px',
                      }}
                    >
                      <p
                        className="text-xs font-bold text-center"
                        style={{ color: 'hsl(var(--foreground))', marginBottom: 'var(--spacing-3)' }}
                      >
                        {t('call_confirm') || '¿Iniciar llamada de voz?'}
                      </p>
                      <div className="flex items-center justify-center" style={{ gap: 'var(--spacing-2)' }}>
                        <button
                          onClick={() => setShowCallConfirm(false)}
                          className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                          style={{
                            padding: '0 var(--spacing-4)',
                            backgroundColor: 'hsl(var(--muted))',
                            color: 'hsl(var(--muted-foreground))',
                          }}
                        >
                          {t('cancel') || 'Cancelar'}
                        </button>
                        <button
                          onClick={() => {
                            setShowCallConfirm(false)
                            setShowVoiceOverlay(true)
                          }}
                          className="h-8 rounded-xl text-[10px] font-black uppercase tracking-wider text-white transition-all active:scale-95 shadow-md"
                          style={{
                            padding: '0 var(--spacing-4)',
                            backgroundColor: '#10b981',
                          }}
                        >
                          {t('call') || 'Llamar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                aria-label={t('accessibility.closeChat')}
                title="Esc"
                className="h-8 w-8 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted text-foreground transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        {/* --- CHAT CONTENT --- */}
        <main
          role="region"
          aria-label={t('accessibility.chatMessages')}
          className="flex-1 min-h-0 relative flex flex-col"
          style={{
            padding: 'var(--spacing-5)',
            backgroundColor: 'hsl(var(--muted))',
          }}
        >
          <MessageList
            messages={inlineMessages}
            isTyping={isTyping}
            welcomeMessage={welcomeMessage}
            primaryColor={themePrimary}
            logoUrl={logoUrl}
            botName={botName}
            bubbleStyles={bubbleStyles}
            avatars={avatars}
            onButtonClick={(label) => onSendMessage(`Answer: ${label}`)}
          />
          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background/10 to-transparent pointer-events-none" />
        </main>

        {/* --- PINNED QUIZ DOCK (stays on screen until the user answers) --- */}
        {activeQuiz && (
          <QuizDock
            quiz={activeQuiz}
            primaryColor={themePrimary}
            onAnswer={(label, buttonId) => onQuizAnswer?.(activeQuiz, label, buttonId)}
          />
        )}

        {/* --- SUGGESTED QUESTIONS (before first user message) --- */}
        {suggestedQuestions && suggestedQuestions.length > 0 && !messages.some(m => m.sender === 'user') && (
          <SuggestedQuestions
            questions={suggestedQuestions}
            onSelect={onSendMessage}
          />
        )}

        {/* --- FOOTER --- */}
        <footer
          className="border-t"
          style={{
            paddingTop: 'var(--spacing-5)',
            paddingLeft: 'var(--spacing-5)',
            paddingRight: 'var(--spacing-5)',
            paddingBottom: isMobile
              ? 'max(var(--spacing-3), env(safe-area-inset-bottom))'
              : 'var(--spacing-3)',
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
          }}
        >
          <InputArea
            isConnected={isConnected}
            placeholder={inputPlaceholder}
            primaryColor={themePrimary}
            mediaConfig={mediaConfig}
            onSendMessage={onSendMessage}
            onSendAttachment={onSendAttachment}
            onSendLocation={onSendLocation}
            onVoiceCall={mediaConfig?.enableVoice ? () => setShowVoiceOverlay(true) : undefined}
          />

          <div
            className="flex items-center justify-center gap-1 opacity-25 select-none"
            style={{
              marginTop: 'var(--spacing-2)',
              paddingBottom: 'var(--spacing-1)',
            }}
          >
            <Heart className="h-2 w-2 text-primary fill-primary" />
            <span className="text-[7px] font-bold uppercase tracking-[0.2em]">
              {t('con_amor_paseo_libre')}
            </span>
          </div>
        </footer>

        {/* Voice Call Overlay */}
        <VoiceCallOverlay 
          isOpen={showVoiceOverlay} 
          onClose={() => setShowVoiceOverlay(false)}
          primaryColor={themePrimary}
          avatars={avatars}
          logoUrl={logoUrl}
          avatar3dUrl={avatar3dUrl}
          voiceConfig={voiceConfig}
          getSocket={getSocket}
        />
      </div>
    </>
  )
}
