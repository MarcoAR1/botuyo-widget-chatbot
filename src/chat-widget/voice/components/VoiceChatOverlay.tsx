/**
 * @package @botuyo/chat-widget
 * Voice Chat Overlay Component
 *
 * Full-screen overlay for voice chat interaction with visual feedback.
 */

'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { X, Mic, Loader2, Volume2 } from 'lucide-react'
import type { VoiceChatOverlayProps } from '../types'
import { WaveformVisualizer } from './WaveformVisualizer'

/**
 * Format seconds to MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Full-screen overlay for voice chat interaction
 */
export function VoiceChatOverlay({
  isOpen,
  state,
  partialTranscription,
  finalTranscription,
  botResponse,
  recordingDuration,
  maxDuration = 60,
  onClose,
  onCancel,
}: VoiceChatOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible) return null

  const isRecording = state === 'listening'
  const isProcessing = state === 'processing'
  const isSpeaking = state === 'speaking'
  const timeWarning = recordingDuration > maxDuration - 10

  return (
    <div
      className={cn(
        'absolute inset-0 z-50 flex flex-col',
        'transition-all duration-300 ease-out',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      style={{
        backgroundColor: 'hsl(var(--background) / 0.95)',
        backdropFilter: 'blur(8px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Voice chat"
    >
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className={cn(
            'p-2 rounded-full transition-colors',
            'bg-muted/50 hover:bg-muted',
            'focus:outline-none focus:ring-2 focus:ring-primary'
          )}
          aria-label="Close voice chat"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {/* State indicator icon */}
        <div
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center',
            'transition-all duration-300',
            isRecording && 'bg-red-500/10 animate-pulse',
            isProcessing && 'bg-primary/10',
            isSpeaking && 'bg-green-500/10'
          )}
        >
          {isRecording && <Mic className="h-12 w-12 text-red-500" />}
          {isProcessing && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
          {isSpeaking && <Volume2 className="h-12 w-12 text-green-500 animate-pulse" />}
        </div>

        {/* State label */}
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {isRecording && '🎤 Escuchando...'}
            {isProcessing && '⏳ Procesando...'}
            {isSpeaking && '🔊 Hablando...'}
          </p>
        </div>

        {/* Recording visualizer */}
        {isRecording && (
          <div className="flex flex-col items-center gap-4">
            <WaveformVisualizer isActive barCount={7} color="#ef4444" />

            {/* Duration display */}
            <div
              className={cn(
                'text-2xl font-mono font-bold tabular-nums',
                timeWarning ? 'text-red-500' : 'text-foreground'
              )}
            >
              {formatDuration(recordingDuration)}
              <span className="text-sm text-muted-foreground ml-2">
                / {formatDuration(maxDuration)}
              </span>
            </div>

            {/* Cancel hint */}
            <p className="text-xs text-muted-foreground">
              Suelta para enviar · Toca{' '}
              <button onClick={onCancel} className="text-red-500 hover:underline focus:underline">
                aquí
              </button>{' '}
              para cancelar
            </p>
          </div>
        )}

        {/* Transcription display */}
        {(partialTranscription || finalTranscription) && (
          <div
            className={cn(
              'max-w-sm text-center px-4 py-3 rounded-xl',
              'bg-muted/50 border border-border',
              'animate-in fade-in slide-in-from-bottom-2 duration-300'
            )}
          >
            <p
              className={cn(
                'text-base',
                partialTranscription && !finalTranscription ? 'italic text-muted-foreground' : ''
              )}
            >
              "{finalTranscription || partialTranscription}"
            </p>
          </div>
        )}

        {/* Bot response */}
        {botResponse && isSpeaking && (
          <div
            className={cn(
              'max-w-sm text-center px-4 py-3 rounded-xl',
              'bg-primary/10 border border-primary/20',
              'animate-in fade-in slide-in-from-bottom-2 duration-300'
            )}
          >
            <p className="text-base font-medium">{botResponse}</p>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="p-4 text-center">
        <p className="text-xs text-muted-foreground">
          {isRecording
            ? 'Habla claramente hacia el micrófono'
            : isSpeaking
              ? 'Escuchando respuesta...'
              : 'Procesando tu mensaje...'}
        </p>
      </div>
    </div>
  )
}
