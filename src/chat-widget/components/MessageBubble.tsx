'use client'

import { useMemo } from 'react'
import { useTranslations } from '@/chat-widget/i18n'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'
import { CheckCheck, MapPin, ExternalLink, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPrimaryColor, getSolidStyles } from '../utils/theme'
import type {
  ChatMessage,
  BubbleStyles,
  TextMessage,
  AudioMessage,
  ImageMessage,
  LocationMessage,
} from '../types'
import type { EmotionAvatarMap } from './Launcher'
import { AudioPlayer } from './AudioPlayer'
import { Gallery } from './Gallery'

export interface MessageBubbleProps {
  message: ChatMessage
  primaryColor?: string
  botAvatar?: string
  botName?: string
  styles?: BubbleStyles
  avatars?: EmotionAvatarMap
  isFirst?: boolean
  isLast?: boolean
}

export function MessageBubble({
  message,
  primaryColor,
  botAvatar,
  botName = 'Mar',
  avatars,
  isFirst = true,
  isLast = true,
}: MessageBubbleProps) {
  const t = useTranslations('extracted')
  const isUser = message.sender === 'user'
  const isSystem = message.type === 'system' || message.sender === 'system'
  const isBot = !isUser && !isSystem

  const brandColor = getPrimaryColor({ primaryColor })
  const solidStyles = useMemo(() => getSolidStyles(), [])

  // --- AVATAR LOGIC ---
  const currentAvatar = useMemo(() => {
    if (isUser) return null
    if (message.type === 'text') {
      const textMsg = message as TextMessage
      if (
        textMsg.emotion &&
        avatars?.[textMsg.emotion as keyof EmotionAvatarMap]
      ) {
        return avatars[textMsg.emotion as keyof EmotionAvatarMap]
      }
    }
    return botAvatar
  }, [message, avatars, botAvatar, isUser])

  const formatTime = (date: Date | string) => {
    const dateObj = new Date(date)
    return isNaN(dateObj.getTime())
      ? ''
      : dateObj.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
  }

  // --- RENDERERS FOR MARKDOWN ---
  const RenderLink = ({ href, children }: any) => {
    if (!href) return null
    const textContent = String(children).toLowerCase()
    const isCTA =
      textContent.includes('reservar') ||
      textContent.includes('ver') ||
      textContent.includes('pagar')
    const isGoogleMaps = href.includes('maps.google') || href.includes('goo.gl')

    if (isGoogleMaps) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block my-2 no-underline group"
        >
          <span className="flex items-center gap-3 p-3 border rounded-xl shadow-sm group-hover:border-primary/30 transition-all" style={{ backgroundColor: solidStyles.card, borderColor: solidStyles.border }}>
            <span
              className="flex-shrink-0 p-2 rounded-full"
              style={{ backgroundColor: `${brandColor}1a`, color: brandColor }}
            >
              <MapPin size={16} strokeWidth={2.5} />
            </span>
            <span className="flex flex-col min-w-0 flex-1 text-[11px] font-bold text-foreground leading-tight uppercase tracking-tight">
              {t('ver_ubicacion')}</span>
            <ExternalLink
              size={12}
              className="text-muted-foreground/40 group-hover:text-primary"
            />
          </span>
        </a>
      )
    }

    if (isCTA) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 mt-2 text-[11px] font-black w-full sm:w-auto rounded-xl shadow-md uppercase tracking-widest transition-transform active:scale-95 text-white"
          style={{ backgroundColor: brandColor }}
        >
          {children} <ArrowRight size={14} />
        </a>
      )
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold underline decoration-primary/30 hover:decoration-primary transition-all"
        style={{ color: isUser ? 'inherit' : brandColor }}
      >
        {children}
      </a>
    )
  }

  const RenderImage = ({ src, alt }: any) => {
    if (!src) return null
    return <Gallery images={[{ src, alt }]} radius="rounded-xl" />
  }

  // --- CONTENT SWITCHER ---
  const renderContent = () => {
    switch (message.type) {
      case 'audio':
        return (
          <AudioPlayer
            url={(message as AudioMessage).content}
            isBot={isBot}
            primaryColor={primaryColor}
          />
        )

      case 'image': {
        const imgMsg = message as ImageMessage
        return (
          <Gallery
            images={[
              {
                src: imgMsg.imageUrl || (imgMsg as any).content,
                alt: imgMsg.altText || 'Imagen',
              },
            ]}
            radius="rounded-xl"
          />
        )
      }

      case 'location': {
        const locMsg = message as LocationMessage
        return (
          <RenderLink
            href={`https://www.google.com/maps/search/?api=1&query=${locMsg.latitude},${locMsg.longitude}`}
          >
            Ver ubicación
          </RenderLink>
        )
      }

      default:
        return (
          <div
            className={cn(
              'prose prose-sm max-w-none break-words leading-relaxed dark:prose-invert',
              isUser
                ? 'text-primary-foreground prose-p:text-white'
                : 'text-foreground'
            )}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: RenderLink,
                img: RenderImage,
                p: ({ children }) => (
                  <p className="mb-0 last:mb-0">{children}</p>
                ),
              }}
            >
              {(message as TextMessage).content || ''}
            </ReactMarkdown>
          </div>
        )
    }
  }

  if (isSystem) {
    return (
      <div className="flex justify-center my-4 animate-in fade-in zoom-in-95 w-full">
        <span 
          className="px-3 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest"
          style={{
            backgroundColor: solidStyles.muted,
            borderColor: solidStyles.border,
            color: solidStyles.mutedForeground,
          }}
        >
          {(message as TextMessage).content}
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        'flex w-full mb-0.5 group',
        isUser ? 'justify-end' : 'justify-start gap-3',
        isFirst && 'mt-3',
        isLast && 'mb-3'
      )}
    >
      {/* AVATAR BOT */}
      {!isUser && (
        <div className="w-9 shrink-0 flex flex-col justify-end pb-1">
          {isLast ? (
            <div 
              className="h-9 w-9 rounded-full overflow-hidden border shadow-sm"
              style={{
                borderColor: solidStyles.border,
                backgroundColor: solidStyles.background,
              }}
            >
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={botName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="h-full w-full flex items-center justify-center text-white text-[10px] font-black uppercase"
                  style={{ backgroundColor: brandColor }}
                >
                  {botName.charAt(0)}
                </div>
              )}
            </div>
          ) : (
            <div className="w-9" />
          )}
        </div>
      )}

      {/* BURBUJA */}
      <div
        className={cn(
          'max-w-[85%] p-3 px-4 shadow-sm transition-all duration-300 relative',
          isUser
            ? 'text-primary-foreground'
            : 'border',
          // Bordes inteligentes
          isUser
            ? cn(
                'rounded-[18px]',
                isFirst && 'rounded-tr-[4px]',
                !isLast && 'rounded-br-[4px]',
                !isFirst && !isLast && 'rounded-r-[4px]'
              )
            : cn(
                'rounded-[18px]',
                isFirst && 'rounded-tl-[4px]',
                !isLast && 'rounded-bl-[4px]',
                !isFirst && !isLast && 'rounded-l-[4px]'
              )
        )}
        style={
          isUser
            ? {
                backgroundColor: brandColor,
                boxShadow: isLast ? `0 8px 20px -6px ${brandColor}33` : 'none',
              }
            : {
                backgroundColor: solidStyles.card,
                borderColor: `${solidStyles.border}99`,
                color: solidStyles.foreground,
              }
        }
      >
        {renderContent()}

        {/* FOOTER */}
        {isLast && (
          <div
            className={cn(
              'flex items-center gap-1 mt-1.5 opacity-50 select-none text-[9px]',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <span className="font-bold tabular-nums uppercase tracking-tighter">
              {formatTime(message.timestamp)}
            </span>
            {isUser && <CheckCheck className="h-2.5 w-2.5" />}
          </div>
        )}
      </div>
    </motion.div>
  )
}
