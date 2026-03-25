'use client'

import React, { useRef, useEffect, useState, memo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { BubbleStyles, ChatMessage } from '../types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { getPrimaryColor } from '../utils/theme'
import type { EmotionAvatarMap } from './Launcher'
import { formatRelative, differenceInMinutes } from '../utils/dateUtils'

// Umbral para activar virtualización (mejora rendimiento con >100 mensajes)
const VIRTUALIZATION_THRESHOLD = 100

export interface MessageListProps {
  messages: ChatMessage[]
  isTyping: boolean
  welcomeMessage?: string
  primaryColor?: string
  logoUrl?: string
  botName?: string
  bubbleStyles?: BubbleStyles
  avatars?: EmotionAvatarMap
}

export const MessageList = memo(
  function MessageList({
    messages,
    isTyping,
    welcomeMessage = '¡Hola! ¿En qué puedo ayudarte?',
    primaryColor,
    logoUrl,
    botName = 'BotUyo',
    bubbleStyles,
    avatars,
  }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isReady, setIsReady] = useState(false)
    const [logoError, setLogoError] = useState(false)
    const bgColor = getPrimaryColor({ primaryColor })

    // Virtualización activada solo si hay muchos mensajes
    const shouldVirtualize = messages.length > VIRTUALIZATION_THRESHOLD

    // Configuración del virtualizador
    const virtualizer = useVirtualizer({
      count: messages.length,
      getScrollElement: () => containerRef.current,
      estimateSize: () => 80, // Altura estimada por mensaje
      overscan: 5, // Pre-renderizar 5 items extra
      enabled: shouldVirtualize,
    })

    // Hidratación segura para Next.js
    useEffect(() => {
      setIsReady(true)
    }, [])

    /**
     * 📜 LÓGICA DE SCROLL INTELIGENTE
     * Se dispara cuando cambian los mensajes o el bot está escribiendo.
     */
    useEffect(() => {
      if (isReady && (messages.length > 0 || isTyping)) {
        const timer = setTimeout(() => {
          if (shouldVirtualize) {
            // Con virtualización: scroll al último índice
            virtualizer.scrollToIndex(messages.length - 1, {
              align: 'end',
              behavior: messages.length <= 1 ? 'auto' : 'smooth',
            })
          } else {
            // Sin virtualización: scroll tradicional
            messagesEndRef.current?.scrollIntoView({
              behavior: messages.length <= 1 ? 'auto' : 'smooth',
              block: 'end',
            })
          }
        }, 100)
        return () => clearTimeout(timer)
      }
    }, [messages.length, isTyping, isReady, shouldVirtualize, virtualizer])

    /**
     * 📅 FORMATEO DE SEPARADORES DE FECHA
     */
    const getSeparatorLabel = (date: any) => {
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      return formatRelative(d)
    }

    if (!isReady) return <div className="flex-1 bg-background" />

    // Renderizado con virtualización para listas grandes
    if (shouldVirtualize) {
      return (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto scroll-smooth scrollbar-none"
          style={{ padding: 'var(--spacing-5)', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const message = messages[virtualRow.index]
              const index = virtualRow.index
              const prev = messages[index - 1]
              const next = messages[index + 1]

              const showDateSeparator =
                prev &&
                differenceInMinutes(new Date(message.timestamp), new Date(prev.timestamp)) > 15

              const isSameAsPrev =
                prev &&
                prev.sender === message.sender &&
                differenceInMinutes(new Date(message.timestamp), new Date(prev.timestamp)) < 5 &&
                !showDateSeparator

              const isSameAsNext =
                next &&
                next.sender === message.sender &&
                differenceInMinutes(new Date(next.timestamp), new Date(message.timestamp)) < 5

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {showDateSeparator && (
                    <div className="flex justify-center my-8 animate-in fade-in zoom-in-95">
                      <span className="px-4 py-1.5 bg-muted/40 backdrop-blur-md rounded-full text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border border-border/50 shadow-sm">
                        {getSeparatorLabel(message.timestamp)}
                      </span>
                    </div>
                  )}

                  <MessageBubble
                    message={message}
                    primaryColor={primaryColor}
                    botAvatar={logoUrl}
                    botName={botName}
                    styles={bubbleStyles}
                    avatars={avatars}
                    isFirst={!isSameAsPrev}
                    isLast={!isSameAsNext}
                  />
                </div>
              )
            })}
          </div>
          {isTyping && (
            <div className="flex items-end gap-3 mt-4 mb-2 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="w-8 h-8 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center shrink-0 shadow-soft-sm">
                <div className="flex gap-[2px]">
                  <span className="w-1 h-1 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 bg-primary/50 rounded-full animate-bounce" />
                </div>
              </div>
              <TypingIndicator />
            </div>
          )}
        </div>
      )
    }

    // Renderizado tradicional para listas pequeñas
    return (
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto scroll-smooth p-4 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        <div className="min-h-full flex flex-col justify-end">
          {/* === ESTADO VACÍO / BIENVENIDA PREMIUM === */}
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-1000">
              <div className="relative h-24 w-24 mb-6">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse blur-2xl" />
                <div className="relative h-full w-full rounded-[28px] border-2 border-primary/20 overflow-hidden shadow-soft-2xl transition-transform hover:scale-105 duration-500">
                  {logoError ? (
                    <div
                      className="h-full w-full flex items-center justify-center text-3xl"
                      style={{ backgroundColor: bgColor }}
                    >
                      👋
                    </div>
                  ) : logoUrl ? (
                    <img
                      src={logoUrl}
                      className="object-cover h-full w-full"
                      alt={botName}
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div
                      className="h-full w-full flex items-center justify-center text-3xl"
                      style={{ backgroundColor: bgColor }}
                    >
                      👋
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-black text-xl text-foreground uppercase tracking-tighter italic">
                  {botName}
                </h3>
                <p className="text-[12px] font-bold text-muted-foreground italic px-10 leading-relaxed opacity-60">
                  "{welcomeMessage}"
                </p>
              </div>
            </div>
          )}

          {/* === LISTADO DE MENSAJES CON ESTRATEGIA DE ACUMULACIÓN === */}
          <div className="flex flex-col" style={{ gap: 'var(--spacing-3)' }}>
            {messages.map((message, index) => {
              const prev = messages[index - 1]
              const next = messages[index + 1]

              // 1. Mostrar separador si pasaron más de 15 min desde el anterior
              const showDateSeparator =
                prev &&
                differenceInMinutes(new Date(message.timestamp), new Date(prev.timestamp)) > 15

              // 2. Lógica para pegar mensajes (Mismo autor + ventana < 5 min)
              const isSameAsPrev =
                prev &&
                prev.sender === message.sender &&
                differenceInMinutes(new Date(message.timestamp), new Date(prev.timestamp)) < 5 &&
                !showDateSeparator

              const isSameAsNext =
                next &&
                next.sender === message.sender &&
                differenceInMinutes(new Date(next.timestamp), new Date(message.timestamp)) < 5

              return (
                <React.Fragment key={message.id || `msg-${index}`}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-8 animate-in fade-in zoom-in-95">
                      <span className="px-4 py-1.5 bg-muted/40 backdrop-blur-md rounded-full text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border border-border/50 shadow-sm">
                        {getSeparatorLabel(message.timestamp)}
                      </span>
                    </div>
                  )}

                  <MessageBubble
                    message={message}
                    primaryColor={primaryColor}
                    botAvatar={logoUrl}
                    botName={botName}
                    styles={bubbleStyles}
                    avatars={avatars}
                    // Props de acumulación para MessageBubble
                    isFirst={!isSameAsPrev}
                    isLast={!isSameAsNext}
                  />
                </React.Fragment>
              )
            })}
          </div>

          {/* INDICADOR DE ESCRITURA (AVATAR + ONDAS) */}
          {isTyping && (
            <div className="flex items-end gap-3 mt-4 mb-2 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="w-8 h-8 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center shrink-0 shadow-soft-sm">
                <div className="flex gap-[2px]">
                  <span className="w-1 h-1 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1 h-1 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1 h-1 bg-primary/50 rounded-full animate-bounce" />
                </div>
              </div>
              <TypingIndicator />
            </div>
          )}

          {/* Scroll anchor — MUST be after typing indicator so auto-scroll includes the dots */}
          <div ref={messagesEndRef} className="h-6 shrink-0" />
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Custom comparator: reducir re-renders innecesarios
    if (prevProps.messages.length !== nextProps.messages.length) return false
    if (prevProps.isTyping !== nextProps.isTyping) return false
    if (prevProps.primaryColor !== nextProps.primaryColor) return false
    if (prevProps.botName !== nextProps.botName) return false
    if (prevProps.logoUrl !== nextProps.logoUrl) return false

    // Comparar último mensaje por ID para detectar cambios
    const prevLast = prevProps.messages[prevProps.messages.length - 1]
    const nextLast = nextProps.messages[nextProps.messages.length - 1]
    if (prevLast?.id !== nextLast?.id) return false

    return true // No re-renderizar
  }
)
