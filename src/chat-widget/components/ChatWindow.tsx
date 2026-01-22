'use client'

import { useEffect, useMemo } from 'react'
import { useTranslations } from '@/chat-widget/i18n'
import { X, ShieldCheck, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BubbleStyles, ChatMessage } from '../types'
import { MessageList } from './MessageList'
import { InputArea } from './InputArea'
import { getPrimaryColor, getSolidStyles } from '../utils/theme'
import { useIsMobile } from '../hooks/useIsMobile'
import { useDynamicHeight } from '../hooks/useDynamicHeight'
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
  onClose: () => void
  onSendMessage: (message: string) => void
  position?: 'bottom-right' | 'bottom-left'
  bubbleStyles?: BubbleStyles
  avatars?: EmotionAvatarMap
  onSendAttachment?: (file: File, type: 'image' | 'audio' | 'file') => void
  onSendLocation?: (location: { latitude: number; longitude: number }) => void
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
  onClose,
  onSendMessage,
  bubbleStyles,
  avatars,
  onSendAttachment,
  onSendLocation,
}: ChatWindowProps) {
  const t = useTranslations()
  const isMobile = useIsMobile()
  const themePrimary = getPrimaryColor({ primaryColor })
  const dynamicHeightStyles = useDynamicHeight({ isOpen })
  
  // Generar estilos sólidos desde las variables CSS
  const solidStyles = useMemo(() => getSolidStyles(), [])

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'text-foreground z-[9999]',

        // 💻 DESKTOP: ANCHO Y ALTO CONTROLADO CON MARGEN DEL TECHO
        !isMobile && [
          'fixed bottom-6 right-6',
          'w-[350px] min-w-[350px] max-w-[350px]',
          'rounded-[32px] border shadow-soft-2xl',
          'animate-in fade-in zoom-in-95 slide-in-from-bottom-10',
        ],

        // 📱 MOBILE: Full pantalla ajustada al viewport real
        isMobile && ['fixed inset-0 w-full']
      )}
      style={{
        ...dynamicHeightStyles,
        // 🎨 ESTILOS SÓLIDOS APLICADOS DESDE TEMA
        backgroundColor: solidStyles.background,
        borderColor: solidStyles.border,
        color: solidStyles.foreground,
      }}
    >
      {/* --- HEADER --- */}
      <header 
        className="relative shrink-0 p-4 border-b z-20"
        style={{
          backgroundColor: `${solidStyles.background}e6`, // 90% opacity
          borderColor: solidStyles.border,
          backdropFilter: 'blur(24px)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-2xl overflow-hidden bg-primary/10 border-2 border-background shadow-soft-sm">
                <img
                  src={logoUrl || '/avatar/mar_happy.webp'}
                  alt={botName}
                  className="h-full w-full object-cover"
                />
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
                <span className="font-black text-xs uppercase tracking-tight text-foreground">
                  {botName}
                </span>
                <ShieldCheck className="h-3 w-3 text-primary fill-primary/10" />
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="flex h-1 w-1 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                  {isConnected ? t('online') : t('offline')}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
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
          backgroundColor: solidStyles.muted,
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
        style={{
          paddingBottom: isMobile
            ? 'max(0.75rem, env(safe-area-inset-bottom))'
            : '0.75rem',
          backgroundColor: solidStyles.background,
        }}
      >
        <InputArea
          isConnected={isConnected}
          placeholder={inputPlaceholder}
          primaryColor={themePrimary}
          onSendMessage={onSendMessage}
          onSendAttachment={onSendAttachment}
          onSendLocation={onSendLocation}
        />

        <div className="flex items-center justify-center gap-1 mt-2 pb-0.5 opacity-25 select-none">
          <Heart className="h-2 w-2 text-primary fill-primary" />
          <span className="text-[7px] font-bold uppercase tracking-[0.2em]">
            {t('con_amor_paseo_libre')}</span>
        </div>
      </footer>
    </div>
  )
}
