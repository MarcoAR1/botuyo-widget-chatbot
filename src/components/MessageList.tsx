'use client'

import React, { useRef, useEffect, useState } from 'react'
import type { BubbleStyles, ChatMessage } from '../types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { getPrimaryColor } from '../utils/theme'
import type { EmotionAvatarMap } from './Launcher'
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'

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

export function MessageList({
  messages,
  isTyping,
  welcomeMessage = '¡Hola! ¿En qué puedo ayudarte?',
  primaryColor,
  logoUrl,
  botName = 'Mar',
  bubbleStyles,
  avatars,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const bgColor = getPrimaryColor({ primaryColor })

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
        messagesEndRef.current?.scrollIntoView({
          behavior: messages.length <= 1 ? 'auto' : 'smooth',
          block: 'end',
        })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [messages.length, isTyping, isReady])

  /**
   * 📅 FORMATEO DE SEPARADORES DE FECHA
   */
  const getSeparatorLabel = (date: any) => {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    if (isToday(d)) return `Hoy, ${format(d, 'HH:mm')}`
    if (isYesterday(d)) return `Ayer, ${format(d, 'HH:mm')}`
    return format(d, "d 'de' MMMM, HH:mm", { locale: es })
  }

  if (!isReady) return <div className="flex-1 bg-background" />

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scroll-smooth p-4 bg-background/50 scrollbar-none"
    >
      <div className="min-h-full flex flex-col justify-end">
        {/* === ESTADO VACÍO / BIENVENIDA PREMIUM === */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative h-24 w-24 mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse blur-2xl" />
              <div className="relative h-full w-full rounded-[28px] border-2 border-primary/20 overflow-hidden bg-card shadow-soft-2xl transition-transform hover:scale-105 duration-500">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    className="object-cover h-full w-full"
                    alt={botName}
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
        <div className="flex flex-col space-y-1">
          {messages.map((message, index) => {
            const prev = messages[index - 1]
            const next = messages[index + 1]

            // 1. Mostrar separador si pasaron más de 15 min desde el anterior
            const showDateSeparator =
              prev &&
              differenceInMinutes(
                new Date(message.timestamp),
                new Date(prev.timestamp)
              ) > 15

            // 2. Lógica para pegar mensajes (Mismo autor + ventana < 5 min)
            const isSameAsPrev =
              prev &&
              prev.sender === message.sender &&
              differenceInMinutes(
                new Date(message.timestamp),
                new Date(prev.timestamp)
              ) < 5 &&
              !showDateSeparator

            const isSameAsNext =
              next &&
              next.sender === message.sender &&
              differenceInMinutes(
                new Date(next.timestamp),
                new Date(message.timestamp)
              ) < 5

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

        {/* Espaciador final para evitar que el input tape el último mensaje */}
        <div ref={messagesEndRef} className="h-6 shrink-0" />
        {/* INDICADOR DE ESCRITURA (AVATAR + ONDAS) */}
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
