/**
 * @package @botuyo/chat-widget
 * Voice Button Component
 *
 * Microphone button for initiating voice chat.
 * Supports press-and-hold or tap interactions.
 */

'use client'

import { useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import type { VoiceButtonProps } from '../types'

/**
 * Voice recording button with visual feedback
 */
export function VoiceButton({
  state,
  isSupported,
  primaryColor,
  onPress,
  onRelease,
  onCancel,
  disabled = false,
}: VoiceButtonProps) {
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isLongPressRef = useRef(false)

  // Handle press start (mouse/touch down)
  const handlePressStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      if (disabled || state !== 'idle') return

      isLongPressRef.current = false

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        isLongPressRef.current = true
      }, 200)

      onPress()
    },
    [disabled, state, onPress]
  )

  // Handle press end (mouse/touch up)
  const handlePressEnd = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
        longPressTimerRef.current = null
      }

      if (state === 'listening') {
        onRelease()
      }
    },
    [state, onRelease]
  )

  // Handle press cancel (mouse leave, etc.)
  const handlePressCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (state === 'listening') {
      onCancel()
    }
  }, [state, onCancel])

  // Prevent context menu on long press (mobile)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  // Don't render if not supported
  if (!isSupported) {
    return null
  }

  const isActive = state === 'listening'
  const isProcessing = state === 'processing'
  const isSpeaking = state === 'speaking'
  const isDisabled = disabled || isSpeaking

  return (
    <button
      type="button"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressCancel}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressCancel}
      onContextMenu={handleContextMenu}
      disabled={isDisabled}
      className={cn(
        'h-10 w-10 rounded-full flex items-center justify-center',
        'transition-all duration-200 shrink-0',
        'shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
        isActive && 'scale-110 shadow-lg',
        isProcessing && 'animate-pulse',
        isDisabled && 'opacity-50 cursor-not-allowed'
      )}
      style={
        {
          backgroundColor: isActive
            ? '#ef4444' // Red when recording
            : primaryColor || 'hsl(var(--primary))',
          '--tw-ring-color': primaryColor || 'hsl(var(--primary))',
        } as React.CSSProperties
      }
      aria-label={
        isActive
          ? 'Release to send voice message'
          : isProcessing
            ? 'Processing voice...'
            : isSpeaking
              ? 'Bot is speaking'
              : 'Hold to record voice message'
      }
      aria-pressed={isActive}
    >
      {isProcessing ? (
        <Loader2 className="h-5 w-5 text-white animate-spin" />
      ) : isSpeaking ? (
        <MicOff className="h-5 w-5 text-white" />
      ) : (
        <Mic className={cn('h-5 w-5 text-white transition-transform', isActive && 'scale-110')} />
      )}
    </button>
  )
}
