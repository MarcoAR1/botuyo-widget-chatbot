/**
 * @package @botuyo/chat-widget
 * Call Button Component
 *
 * Button to start/end live voice calls.
 */

'use client'

import { useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Phone, PhoneOff, Loader2 } from 'lucide-react'
import type { CallButtonProps } from '../types'

/**
 * Format seconds to MM:SS
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Call button for starting/ending live voice calls
 */
export function CallButton({
  state,
  isSupported,
  callDuration = 0,
  primaryColor,
  onStartCall,
  onEndCall,
  disabled = false,
}: CallButtonProps) {
  const handleClick = useCallback(() => {
    if (state === 'idle') {
      onStartCall()
    } else {
      onEndCall()
    }
  }, [state, onStartCall, onEndCall])

  // Don't render if not supported
  if (!isSupported) {
    return null
  }

  const isIdle = state === 'idle'
  const isCalling = state === 'calling'
  const isInCall = !isIdle && !isCalling

  return (
    <div className="flex items-center gap-2">
      {/* Call duration display */}
      {isInCall && (
        <span className="text-sm font-mono text-muted-foreground animate-pulse">
          🔴 {formatDuration(callDuration)}
        </span>
      )}

      {/* Call button */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isCalling}
        className={cn(
          'h-10 px-4 rounded-full flex items-center justify-center gap-2',
          'transition-all duration-200 shrink-0',
          'shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
          'font-medium text-sm',
          isInCall && 'bg-red-500 hover:bg-red-600 text-white',
          isCalling && 'animate-pulse cursor-wait',
          (disabled || isCalling) && 'opacity-50 cursor-not-allowed'
        )}
        style={
          {
            backgroundColor: isIdle ? primaryColor || 'hsl(var(--primary))' : undefined,
            color: isIdle ? 'white' : undefined,
            '--tw-ring-color': primaryColor || 'hsl(var(--primary))',
          } as React.CSSProperties
        }
        aria-label={isIdle ? 'Start voice call' : isCalling ? 'Connecting...' : 'End call'}
      >
        {isCalling ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </>
        ) : isIdle ? (
          <>
            <Phone className="h-4 w-4" />
            <span>Start Call</span>
          </>
        ) : (
          <>
            <PhoneOff className="h-4 w-4" />
            <span>End Call</span>
          </>
        )}
      </button>
    </div>
  )
}
