/**
 * @package @botuyo/chat-widget
 * Live Call Overlay Component
 *
 * Full-screen overlay displayed during an active live call.
 */

'use client'

import { cn } from '@/lib/utils'
import { Phone, PhoneOff, Mic, Volume2, Loader2 } from 'lucide-react'
import type { LiveCallOverlayProps } from '../types'
import { WaveformVisualizer } from './WaveformVisualizer'

/**
 * Format seconds to MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * State label mapping
 */
const stateLabels = {
  idle: '',
  calling: 'Conectando...',
  ready: 'Listo para hablar',
  listening: 'Escuchando...',
  thinking: 'Procesando...',
  speaking: 'Bot hablando...',
}

/**
 * Full-screen overlay for active live calls
 */
export function LiveCallOverlay({
  isOpen,
  state,
  callDuration,
  transcription,
  botResponse,
  onEndCall,
}: LiveCallOverlayProps) {
  if (!isOpen) return null

  const isListening = state === 'listening'
  const isSpeaking = state === 'speaking'
  const isThinking = state === 'thinking'
  const isCalling = state === 'calling'

  return (
    <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-green-500" />
          <span className="font-medium">Llamada en vivo</span>
        </div>
        <span className="text-sm font-mono text-muted-foreground">
          {formatDuration(callDuration)}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* State indicator */}
        <div className="flex flex-col items-center gap-4">
          {/* Icon based on state */}
          <div
            className={cn(
              'h-20 w-20 rounded-full flex items-center justify-center',
              'transition-all duration-300',
              isListening && 'bg-red-500/20 animate-pulse',
              isSpeaking && 'bg-blue-500/20',
              isThinking && 'bg-amber-500/20',
              isCalling && 'bg-gray-500/20',
              state === 'ready' && 'bg-green-500/20'
            )}
          >
            {isCalling && <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />}
            {state === 'ready' && <Mic className="h-10 w-10 text-green-500" />}
            {isListening && <Mic className="h-10 w-10 text-red-500 animate-pulse" />}
            {isThinking && <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />}
            {isSpeaking && <Volume2 className="h-10 w-10 text-blue-500" />}
          </div>

          {/* State label */}
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {stateLabels[state] || ''}
          </p>
        </div>

        {/* Waveform visualization */}
        {(isListening || isSpeaking) && (
          <WaveformVisualizer
            isActive={isListening || isSpeaking}
            barCount={7}
            color={isListening ? '#ef4444' : '#3b82f6'}
            className="h-16"
          />
        )}

        {/* Transcription display */}
        {transcription && (
          <div className="max-w-sm text-center p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground mb-1">Tú dijiste:</p>
            <p className="text-lg">"{transcription}"</p>
          </div>
        )}

        {/* Bot response display */}
        {botResponse && isSpeaking && (
          <div className="max-w-sm text-center p-4 rounded-lg bg-primary/10">
            <p className="text-sm text-muted-foreground mb-1">Bot respondió:</p>
            <p className="text-lg font-medium">{botResponse}</p>
          </div>
        )}
      </div>

      {/* Footer with end call button */}
      <div className="p-6 flex justify-center">
        <button
          type="button"
          onClick={onEndCall}
          className={cn(
            'h-14 w-14 rounded-full flex items-center justify-center',
            'bg-red-500 hover:bg-red-600 text-white',
            'shadow-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
          )}
          aria-label="Colgar llamada"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
