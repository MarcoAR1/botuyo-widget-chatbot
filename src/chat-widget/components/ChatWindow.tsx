'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from '@/chat-widget/i18n'
import { X, ShieldCheck, Heart } from './Icons'
import { cn } from '@/lib/utils'
import type { BubbleStyles, ChatMessage, MediaConfig } from '../types'
import { MessageList } from './MessageList'
import { InputArea } from './InputArea'
import { getPrimaryColor } from '../utils/theme'
import { useIsMobile } from '../hooks/useIsMobile'
import { useDynamicHeight } from '../hooks/useDynamicHeight'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { EmotionAvatarMap } from './Launcher'

export interface ChatWindowProps {
  isOpen: boolean
  isConnected: boolean
  isTyping: boolean
  messages: ChatMessage[]
  botName?: string
  logoUrl?: string
  welcomeMessage?: string
  inputPlaceholder?: string
  primaryColor?: string
  borderRadius?: string
  mediaConfig?: MediaConfig
  onClose: () => void
  onSendMessage: (message: string) => void
  position?: 'bottom-right' | 'bottom-left'
  bubbleStyles?: BubbleStyles
  avatars?: EmotionAvatarMap
  onSendAttachment?: (file: File, type: 'image' | 'audio' | 'file') => void
  onSendLocation?: (location: { latitude: number; longitude: number }) => void
  theme?: import('../types').ChatTheme
}

export function ChatWindow({
  isOpen,
  isConnected,
  isTyping,
  messages,
  botName = 'Mar',
  logoUrl,
  welcomeMessage,
  inputPlaceholder,
  primaryColor,
  mediaConfig,
  onClose,
  onSendMessage,
  bubbleStyles,
  avatars,
  onSendAttachment,
  onSendLocation,
  theme,
}: ChatWindowProps) {
  const [logoError, setLogoError] = useState(false)
  const { t } = useTranslations()
  const isMobile = useIsMobile()
  const themePrimary = getPrimaryColor({ primaryColor })
  const dynamicHeightStyles = useDynamicHeight({
    isOpen,
    height: theme?.height,
    bottom: theme?.bottom,
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
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isOpen, isMobile])

  if (!isOpen) return null

  const desktopBottom = theme?.bottom || '24px'
  const isBottomLeft = theme?.position === 'bottom-left'

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-window-title"
      aria-describedby="chat-window-description"
      tabIndex={-1}
      className={cn(
        'flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'text-foreground z-[9999]',

        // 💻 DESKTOP: ANCHO Y ALTO CONTROLADO CON MARGEN DEL TECHO
        !isMobile && [
          'fixed',
          isBottomLeft ? 'left-6' : 'right-6',
          'w-[350px] min-w-[350px] max-w-[350px]',
          'rounded-[32px] border shadow-soft-2xl',
          'animate-in fade-in zoom-in-95',
          isBottomLeft ? 'slide-in-from-bottom-10' : 'slide-in-from-bottom-10',
        ],

        // 📱 MOBILE: Full pantalla ajustada al viewport real
        isMobile && ['fixed inset-0 w-full']
      )}
      style={{
        ...dynamicHeightStyles,
        // Aplicar bottom personalizado solo en desktop
        ...(!isMobile && { bottom: desktopBottom }),
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
              <div className="h-10 w-10 rounded-2xl overflow-hidden bg-primary/10 border-2 border-background shadow-soft-sm">
                {logoError ? (
                  <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    src={logoUrl || '/avatar/mar_happy.webp'}
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

          <button
            onClick={onClose}
            aria-label={t('cerrar_chat')}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted text-foreground transition-all active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* --- CHAT CONTENT --- */}
      <main
        className="flex-1 min-h-0 relative flex flex-col"
        style={{
          padding: 'var(--spacing-5)',
          backgroundColor: 'hsl(var(--muted))',
        }}
      >
        <MessageList
          messages={messages}
          isTyping={isTyping}
          welcomeMessage={welcomeMessage}
          primaryColor={primaryColor}
          logoUrl={logoUrl}
          botName={botName}
          bubbleStyles={bubbleStyles}
          avatars={avatars}
        />
        <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background/10 to-transparent pointer-events-none" />
      </main>

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
    </div>
  )
}
