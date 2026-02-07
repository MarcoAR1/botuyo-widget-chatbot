'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from '@/chat-widget/i18n'
import { MessageCircle, X } from './Icons'
import { cn } from '@/lib/utils'
import { getPrimaryColor } from '../utils/theme'
import { useAnimations, usePremiumEffects } from '../contexts/AnimationContext'
import type { BubbleStyles } from '../types'
import { logger } from '../utils/logger'
import { DEFAULT_AVATAR_URL } from '../utils/defaultAssets'

export type BotEmotion =
  | 'default'
  | 'writing'
  | 'thinking'
  | 'confused'
  | 'sorry'
  | 'happy'
  | 'angry'
  | 'love'
  | 'wink'
export type EmotionAvatarMap = Partial<Record<BotEmotion, string>>
export type PromptStrategy = 'always' | 'session' | 'forever'

interface LauncherProps {
  isOpen: boolean
  onClick: () => void
  unreadCount?: number
  primaryColor?: string
  logoUrl?: string
  starterPrompt?: string
  position?: 'bottom-right' | 'bottom-left'
  emotion?: BotEmotion
  avatars?: EmotionAvatarMap
  styles?: BubbleStyles
  promptPersistence?: PromptStrategy
  avatarScale?: number
  showPromptAvatar?: boolean
}

export function Launcher({
  isOpen,
  onClick,
  unreadCount = 0,
  primaryColor,
  logoUrl,
  starterPrompt,
  position = 'bottom-right',
  emotion = 'default',
  avatars = {},
  styles,
  promptPersistence = 'session',
  avatarScale = 1.0,
  showPromptAvatar = false,
}: LauncherProps) {
  const { t } = useTranslations('extracted')
  const themeColor = getPrimaryColor({ primaryColor })
  const customLauncherStyle = styles?.launcher?.bg
  
  // Premium animation hooks
  const animations = useAnimations()
  const { triggerHaptic, getGlowClass } = usePremiumEffects()
  
  // Use context-based pulse setting, fallback to styles prop
  const showPulse = animations.launcherPulse && (styles?.launcher?.pulse !== false)

  const [isPromptVisible, setIsPromptVisible] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)
  const [imageError, setImageError] = useState(false)

  const isRight = position === 'bottom-right'
  const STORAGE_KEY = 'chat_launcher_prompt_state'

  const currentImageSrc = useMemo(
    () => avatars[emotion] || avatars.default || logoUrl || DEFAULT_AVATAR_URL,
    [emotion, avatars, logoUrl]
  )

  // Reset error state when image changes
  useEffect(() => {
    setImageError(false)
  }, [currentImageSrc])

  // 1. PRE-CARGA (Performance)
  useEffect(() => {
    const images = Object.values(avatars).filter((url): url is string => !!url)
    if (logoUrl) images.push(logoUrl)
    images.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [avatars, logoUrl])

  // 2. PERSISTENCIA
  useEffect(() => {
    if (promptPersistence === 'forever') {
      if (localStorage.getItem(STORAGE_KEY) === 'dismissed') setHasDismissed(true)
    }
  }, [promptPersistence])

  // Función para cerrar el prompt
  const handleClosePrompt = useCallback(() => {
    setIsFadingOut(true)
    setTimeout(() => setIsPromptVisible(false), 500)
    if (promptPersistence !== 'always') {
      setHasDismissed(true)
      if (promptPersistence === 'forever') localStorage.setItem(STORAGE_KEY, 'dismissed')
    }
  }, [promptPersistence])

  // 3. CICLO VISUAL
  useEffect(() => {
    const effectiveDismissed = promptPersistence === 'always' ? false : hasDismissed
    if (effectiveDismissed || !starterPrompt || isOpen) {
      setIsPromptVisible(false)
      return
    }

    const showTimer = setTimeout(() => {
      setIsPromptVisible(true)
      setIsFadingOut(false)
    }, 2000)

    const hideTimer = setTimeout(() => handleClosePrompt(), 12000)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [starterPrompt, isOpen, hasDismissed, promptPersistence, handleClosePrompt])

  const handleMainAction = () => {
    logger.debug('Launcher handleMainAction called, isOpen:', isOpen)
    triggerHaptic() // Haptic feedback on click
    setHasDismissed(true)
    if (promptPersistence === 'forever') localStorage.setItem(STORAGE_KEY, 'dismissed')
    onClick()
  }

  return (
    <div
      className={cn(
        'flex items-center w-fit transition-all duration-500',
        isRight ? 'flex-row ml-auto' : 'flex-row-reverse mr-auto'
      )}
    >
      {/* --- PROMPT BUBBLE (Intercom-style chat message) --- */}
      <div
        className={cn(
          'transition-all duration-700 ease-in-out flex items-end',
          isPromptVisible
            ? cn('opacity-100 translate-x-0 w-auto max-w-[350px]', isRight ? 'mr-5' : 'ml-5')
            : cn('opacity-0 w-0 max-w-0 overflow-hidden pointer-events-none', isRight ? 'translate-x-4' : '-translate-x-4')
        )}
      >
        <div
          className={cn(
            'relative flex items-center gap-2.5 cursor-pointer',
            isFadingOut && 'opacity-0 scale-95 transition-all duration-300',
            !isPromptVisible && 'hidden'
          )}
          onClick={handleMainAction}
          style={{ width: 'max-content' }}
        >
          {/* Mini avatar (optional — hidden by default) */}
          {showPromptAvatar && (
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: themeColor || 'hsl(160,84%,39%)',
                boxShadow: `0 2px 8px ${themeColor || 'hsl(160,84%,39%)'}44`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {currentImageSrc && !imageError ? (
                <img
                  src={currentImageSrc}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <MessageCircle
                  style={{
                    width: '18px',
                    height: '18px',
                    color: 'white',
                    fill: 'white',
                  }}
                />
              )}
            </div>
          )}

          {/* Message bubble — transparent background */}
          <div
            style={{
              position: 'relative',
              maxWidth: '280px',
              padding: '10px 16px',
              borderRadius: '18px',
              backgroundColor: 'hsl(var(--background) / 0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: 'hsl(var(--foreground))',
              boxShadow: '0 4px 20px -4px rgba(0,0,0,0.12), 0 0 0 1px hsl(var(--border) / 0.6)',
            }}
          >
            <span
              style={{
                display: 'block',
                fontSize: '13.5px',
                fontWeight: 600,
                lineHeight: 1.4,
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
              }}
            >
              {starterPrompt}
            </span>
          </div>

          {/* Close button — floating top-right */}
          <button
            onClick={e => {
              e.stopPropagation()
              handleClosePrompt()
            }}
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'hsl(var(--muted-foreground))',
              padding: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--destructive))'
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.borderColor = 'hsl(var(--destructive))'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'hsl(var(--background))'
              e.currentTarget.style.color = 'hsl(var(--muted-foreground))'
              e.currentTarget.style.borderColor = 'hsl(var(--border))'
            }}
            aria-label="Cerrar"
          >
            <X className="h-3 w-3" style={{ strokeWidth: 2.5 }} />
          </button>
        </div>
      </div>

      {/* --- BOTÓN LANZADOR --- */}
      <div className="relative flex items-center justify-center shrink-0">
        {!isOpen && showPulse && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-20"
              style={{ backgroundColor: themeColor }}
            />
          </span>
        )}

        <button
          type="button"
          onClick={handleMainAction}
          className={cn(
            'relative z-10 h-14 w-14 sm:h-16 sm:w-16',
            'flex items-center justify-center text-white transition-all duration-500',
            'hover:scale-110 active:scale-95 shadow-soft-xl cursor-pointer',
            !isOpen && 'hover:rotate-6',
            !isOpen && animations.enabled && 'animate-glow-pulse', // Premium glow when enabled
            styles?.radius?.button || 'rounded-full',
            customLauncherStyle,
            getGlowClass()
          )}
          style={{
            backgroundColor: themeColor || 'hsl(160, 84%, 39%)',
            '--primary-glow': `${themeColor}66`,
          } as React.CSSProperties}
          aria-label={isOpen ? 'Cerrar chat' : 'Abrir chat'}
        >
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden rounded-inherit">
            <div
              className={cn(
                'absolute inset-0 transition-all duration-500 flex items-center justify-center',
                isOpen ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'
              )}
            >
              {currentImageSrc && !imageError ? (
                <img
                  src={currentImageSrc}
                  alt={t('assistant')}
                  className="w-full h-full object-cover"
                  style={{ transform: `scale(${avatarScale})` }}
                  onError={() => setImageError(true)}
                  key={currentImageSrc}
                />
              ) : (
                <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 fill-current" />
              )}
            </div>

            <div
              className={cn(
                'absolute inset-0 transition-all duration-500 flex items-center justify-center bg-black/5 dark:bg-white/10',
                isOpen ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'
              )}
            >
              <X className="h-7 w-7 sm:h-8 sm:w-8 stroke-[2.5]" />
            </div>
          </div>

          {!isOpen && unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 z-20 flex h-6 w-6 items-center justify-center bg-destructive text-destructive-foreground rounded-full border-2 border-background text-[10px] font-black shadow-soft-md tabular-nums">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
