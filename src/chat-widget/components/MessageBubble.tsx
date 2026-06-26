'use client'

import { useMemo, useState, lazy, Suspense, memo } from 'react'
import { useTranslations } from '@/chat-widget/i18n'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { CheckCheck, MapPin, ExternalLink, ArrowRight, FileIcon, Download } from './Icons'
import { cn } from '@/lib/utils'
import { getPrimaryColor } from '../utils/theme'
import { useMessageEntryClass } from '../contexts/AnimationContext'
import type {
  ChatMessage,
  BubbleStyles,
  TextMessage,
  AudioMessage,
  ImageMessage,
  LocationMessage,
  FileMessage,
  ButtonsMessage,
  ToolProposalMessage,
} from '../types'
import type { EmotionAvatarMap } from './Launcher'
import { SourcesCitation } from './SourcesCitation'
import { ToolProposalCard } from './ToolProposalCard'

// Lazy load componentes pesados
const AudioPlayer = lazy(() => import('./AudioPlayer').then(m => ({ default: m.AudioPlayer })))
const Gallery = lazy(() => import('./Gallery').then(m => ({ default: m.Gallery })))

export interface MessageBubbleProps {
  message: ChatMessage
  primaryColor?: string
  botAvatar?: string
  botName?: string
  styles?: BubbleStyles
  avatars?: EmotionAvatarMap
  isFirst?: boolean
  isLast?: boolean
  index?: number // For stagger animation
  /** Callback when a quiz/interactive button is clicked */
  onButtonClick?: (buttonLabel: string, message: ChatMessage) => void
  /** Callback when the user confirms/cancels an inline tool-approval proposal card. */
  onProposalAction?: (proposalId: string, action: 'confirm' | 'reject') => void
}

interface MessageButtonsProps {
  message: ButtonsMessage
  brandColor: string
  onButtonClick?: (buttonLabel: string, message: ChatMessage) => void
}

/**
 * Quiz/interactive answer buttons. Extracted from MessageBubble so its selection
 * state (useState) lives at a component's top level (React rules-of-hooks).
 */
function MessageButtons({ message, brandColor, onButtonClick }: MessageButtonsProps) {
  const [clickedId, setClickedId] = useState<string | null>(message.selectedId || null)

  const handleButtonClick = (btn: { id: string; label: string }) => {
    if (clickedId) return // Already answered
    setClickedId(btn.id)
    onButtonClick?.(btn.label, message)
  }

  return (
    <div className="space-y-3">
      {/* Question text */}
      <div
        className={cn(
          'prose prose-sm max-w-none break-words leading-relaxed dark:prose-invert text-foreground'
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            [
              rehypeSanitize,
              {
                tagNames: ['p', 'strong', 'em', 'br', 'span'],
                attributes: {},
              },
            ],
          ]}
          components={{
            p: ({ children }) => <p className="mb-0 last:mb-0">{children}</p>,
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      {/* Answer buttons */}
      <div className="flex flex-col gap-2">
        {message.buttons.map((btn, btnIdx) => {
          const isClicked = clickedId === btn.id
          const isDisabled = clickedId !== null && !isClicked

          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => handleButtonClick(btn)}
              disabled={clickedId !== null}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold',
                'transition-all duration-200 cursor-pointer',
                isClicked
                  ? 'scale-[0.98] ring-2 shadow-md'
                  : isDisabled
                    ? 'opacity-40 cursor-default'
                    : 'hover:scale-[1.02] hover:shadow-md active:scale-[0.97]'
              )}
              style={{
                backgroundColor: isClicked ? `${brandColor}15` : 'hsl(var(--muted) / 0.5)',
                borderColor: isClicked ? brandColor : 'hsl(var(--border))',
                color: isClicked ? brandColor : 'hsl(var(--foreground))',
                ...(isClicked ? { ringColor: brandColor } : {}),
              }}
            >
              <span className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-black shrink-0"
                  style={{
                    backgroundColor: isClicked ? brandColor : 'hsl(var(--muted))',
                    color: isClicked ? 'white' : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {String.fromCharCode(65 + btnIdx)}
                </span>
                <span>{btn.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const MessageBubble = memo(
  function MessageBubble({
    message,
    primaryColor,
    botAvatar,
    botName = 'BotUyo',
    avatars,
    isFirst = true,
    isLast = true,
    index = 0,
    onButtonClick,
    onProposalAction,
  }: MessageBubbleProps) {
    const { t } = useTranslations('extracted')
    const isUser = message.sender === 'user'
    const isSystem = message.type === 'system' || message.sender === 'system'
    const isBot = !isUser && !isSystem

    const brandColor = getPrimaryColor({ primaryColor })
    
    // Premium animation hooks
    const messageEntryClass = useMessageEntryClass()
    // Note: usePremiumEffects available for future enhancements (hover lift, haptics, etc.)

    // --- AVATAR LOGIC ---
    const currentAvatar = useMemo(() => {
      if (isUser) return null
      if (message.type === 'text') {
        const textMsg = message as TextMessage
        if (textMsg.emotion && avatars?.[textMsg.emotion as keyof EmotionAvatarMap]) {
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
      const isEmail = String(href).startsWith('mailto:')
      const isTel = String(href).startsWith('tel:')
      const isCTA =
        !isEmail &&
        !isTel &&
        (textContent.includes('reservar') ||
          textContent.includes('ver') ||
          textContent.includes('pagar'))
      const isGoogleMaps = href.includes('maps.google') || href.includes('goo.gl') || href.includes('google.com/maps')

      // Detect if link is same-domain (internal navigation)
      let isSameDomain = false
      try {
        const linkUrl = new URL(href, window.location.origin)
        isSameDomain = linkUrl.hostname === window.location.hostname
      } catch { /* invalid URL, treat as external */ }

      const handleClick = isSameDomain
        ? (e: React.MouseEvent) => { e.preventDefault(); window.location.href = href }
        : undefined

      const linkTarget = isSameDomain ? undefined : '_blank'
      const linkRel = isSameDomain ? undefined : 'noopener noreferrer'

      if (isGoogleMaps) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block my-2 no-underline group"
          >
            <span
              className="flex items-center gap-3 p-3 border rounded-xl shadow-sm group-hover:border-primary/30 transition-all"
              style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
            >
              <span
                className="flex-shrink-0 p-2 rounded-full"
                style={{ backgroundColor: `${brandColor}1a`, color: brandColor }}
              >
                <MapPin size={16} strokeWidth={2.5} />
              </span>
              <span className="flex flex-col min-w-0 flex-1 text-[11px] font-bold text-foreground leading-tight uppercase tracking-tight">
                {t('ver_ubicacion')}
              </span>
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
            target={linkTarget}
            rel={linkRel}
            onClick={handleClick}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 mt-2 mx-1 text-[11px] font-black w-[calc(100%-0.5rem)] sm:w-auto rounded-xl shadow-md uppercase tracking-widest transition-transform active:scale-95 text-white"
            style={{ backgroundColor: brandColor }}
          >
            {children} <ArrowRight size={14} />
          </a>
        )
      }

      return (
        <a
          href={href}
          target={linkTarget}
          rel={linkRel}
          onClick={handleClick}
          className="font-bold underline decoration-primary/30 hover:decoration-primary transition-all break-words"
          style={{ color: isUser ? 'inherit' : brandColor }}
        >
          {children}
        </a>
      )
    }

    const RenderImage = ({ src, alt }: any) => {
      if (!src) return null
      return (
        <Suspense
          fallback={
            <div className="my-3 animate-pulse">
              <div className="w-full h-48 bg-muted rounded-xl" />
            </div>
          }
        >
          <Gallery images={[{ src, alt }]} radius="rounded-xl" />
        </Suspense>
      )
    }

    // --- CONTENT SWITCHER ---
    const renderContent = () => {
      switch (message.type) {
        case 'audio':
          return (
            <Suspense
              fallback={
                <div className="flex items-center gap-3 py-1 min-w-[200px] animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1">
                    <div className="h-1 w-full bg-muted rounded-full" />
                  </div>
                </div>
              }
            >
              <div>
                <AudioPlayer
                  url={(message as AudioMessage).content}
                  isBot={isBot}
                  primaryColor={primaryColor}
                />
                {(message as AudioMessage).text && (
                  <p
                    style={{
                      fontSize: '0.8rem',
                      opacity: 0.7,
                      marginTop: '4px',
                      fontStyle: 'italic',
                      lineHeight: 1.3,
                    }}
                  >
                    {(message as AudioMessage).text}
                  </p>
                )}
              </div>
            </Suspense>
          )

        case 'image': {
          const imgMsg = message as ImageMessage
          return (
            <Suspense
              fallback={
                <div className="my-3 animate-pulse">
                  <div className="w-full h-48 bg-muted rounded-xl" />
                </div>
              }
            >
              <Gallery
                images={[
                  {
                    src: imgMsg.imageUrl || (imgMsg as any).content,
                    alt: imgMsg.altText || 'Imagen',
                  },
                ]}
                radius="rounded-xl"
              />
            </Suspense>
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

        case 'file': {
          const fileMsg = message as FileMessage
          const fileExtension = fileMsg.fileName?.split('.').pop()?.toLowerCase() || ''
          const fileSize = fileMsg.fileSize
            ? `${(fileMsg.fileSize / 1024 / 1024).toFixed(2)} MB`
            : ''

          return (
            <a
              href={fileMsg.fileUrl}
              download={fileMsg.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 border rounded-xl transition-all hover:scale-[1.02] group"
              style={{
                backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : 'hsl(var(--muted))',
                borderColor: isUser ? 'rgba(255,255,255,0.2)' : 'hsl(var(--border))',
              }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                style={{
                  backgroundColor: isUser ? 'rgba(255,255,255,0.2)' : `${brandColor}1a`,
                  color: isUser ? 'white' : brandColor,
                }}
              >
                <FileIcon size={20} strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{fileMsg.fileName}</p>
                {fileSize && (
                  <p className="text-xs opacity-60 mt-0.5">
                    {fileExtension?.toUpperCase()} • {fileSize}
                  </p>
                )}
              </div>
              <Download
                size={18}
                className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
              />
            </a>
          )
        }

        case 'buttons': {
          const btnMsg = message as ButtonsMessage
          return (
            <MessageButtons
              message={btnMsg}
              brandColor={brandColor}
              onButtonClick={onButtonClick}
            />
          )
        }

        default: {
          const textContent = (message as TextMessage).content || ''

          // Extract consecutive image blocks (---\n![Foto](url)\n![Foto](url)\n---) 
          // and standalone consecutive ![...](url) lines into a Gallery batch
          const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
          const allImages: Array<{ src: string; alt: string }> = []
          let match: RegExpExecArray | null
          while ((match = imageRegex.exec(textContent)) !== null) {
            allImages.push({ src: match[2], alt: match[1] || 'Foto' })
          }

          // Remove image markdown from text to avoid double-rendering
          const textWithoutImages = allImages.length > 1
            ? textContent.replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/---\s*\n?\s*---/g, '').trim()
            : textContent

          return (
            <>
              {/* Grouped gallery for multiple images */}
              {allImages.length > 1 && (
                <Suspense
                  fallback={
                    <div className="my-3 animate-pulse">
                      <div className="w-full h-48 bg-muted rounded-xl" />
                    </div>
                  }
                >
                  <Gallery images={allImages} radius="rounded-xl" />
                </Suspense>
              )}

              {/* Remaining text content */}
              {textWithoutImages && (
                <div
                  className={cn(
                    'prose prose-sm max-w-none break-words leading-relaxed dark:prose-invert',
                    isUser ? 'text-primary-foreground prose-p:text-white' : 'text-foreground'
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[
                      [
                        rehypeSanitize,
                        {
                          tagNames: ['p', 'a', 'img', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'span'],
                          attributes: {
                            a: ['href', 'target', 'rel'],
                            img: ['src', 'alt'],
                            span: ['className'],
                          },
                          protocols: {
                            a: { href: ['http', 'https', 'mailto', 'tel'] },
                            img: { src: ['http', 'https', 'data'] },
                          },
                        },
                      ],
                    ]}
                    components={{
                      a: RenderLink,
                      img: RenderImage,
                      p: ({ children }) => <p className="mb-0 last:mb-0">{children}</p>,
                    }}
                  >
                    {textWithoutImages}
                  </ReactMarkdown>
                </div>
              )}
            </>
          )
        }
      }
    }

    // Inline tool-approval card (authenticated agents) — rendered full-width, not as a chat bubble.
    if (message.type === 'tool_proposal') {
      return (
        <ToolProposalCard
          message={message as ToolProposalMessage}
          primaryColor={primaryColor}
          onConfirm={proposalId => onProposalAction?.(proposalId, 'confirm')}
          onCancel={proposalId => onProposalAction?.(proposalId, 'reject')}
        />
      )
    }

    if (isSystem) {
      return (
        <div className="flex justify-center my-4 animate-in fade-in zoom-in-95 w-full">
          <span
            className="px-3 py-1 border rounded-full text-[9px] font-black uppercase tracking-widest"
            style={{
              backgroundColor: 'hsl(var(--muted))',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            {(message as TextMessage).content}
          </span>
        </div>
      )
    }

    return (
      <div
        className={cn(
          'flex w-full mb-0.5 group',
          messageEntryClass, // Configurable animation
          isUser ? 'justify-end' : 'justify-start gap-3',
          isFirst && 'mt-3',
          isLast && 'mb-3'
        )}
        style={{
          animationDelay: `${index * 50}ms`,
        }}
      >
        {/* AVATAR BOT */}
        {!isUser && (
          <div className="w-9 shrink-0 flex flex-col justify-end pb-1">
            {isLast ? (
              <div
                className="h-9 w-9 rounded-full overflow-hidden border shadow-sm"
                style={{
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                }}
              >
                {currentAvatar ? (
                  <img src={currentAvatar} alt={botName} className="h-full w-full object-cover" />
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
            'max-w-[85%] shadow-sm transition-all duration-300 relative',
            isUser ? 'text-primary-foreground' : 'border',
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
                  padding: 'var(--spacing-4) var(--spacing-5)',
                  backgroundColor: brandColor,
                  boxShadow: isLast ? `0 8px 20px -6px ${brandColor}33` : 'none',
                }
              : {
                  padding: 'var(--spacing-4) var(--spacing-5)',
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border) / 0.6)',
                  color: 'hsl(var(--foreground))',
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

        {/* RAG Source Citations — non-invasive chips below bot messages */}
        {isBot && isLast && message.type === 'text' && (message as TextMessage).sources && (
          <SourcesCitation sources={(message as TextMessage).sources!} />
        )}
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparator: solo re-render si cambió algo relevante
    if (prevProps.message.id !== nextProps.message.id) return false
    if (prevProps.message.timestamp !== nextProps.message.timestamp) return false
    // Tool-approval cards mutate their status in place (server resolve/expire) — re-render on change.
    if (
      (prevProps.message as ToolProposalMessage).status !==
      (nextProps.message as ToolProposalMessage).status
    )
      return false
    if (prevProps.primaryColor !== nextProps.primaryColor) return false
    if (prevProps.botAvatar !== nextProps.botAvatar) return false
    if (prevProps.botName !== nextProps.botName) return false
    if (prevProps.isFirst !== nextProps.isFirst) return false
    if (prevProps.isLast !== nextProps.isLast) return false

    // Comparar styles profundamente si existe
    if (JSON.stringify(prevProps.styles) !== JSON.stringify(nextProps.styles)) return false

    return true // No re-renderizar
  }
)
