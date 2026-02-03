/**
 * @package @botuyo/chat-widget
 * Voice State Machine Hook
 *
 * Manages the voice chat state machine with transitions and recording timer.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { VoiceState } from './types'

interface UseVoiceStateOptions {
  /** Maximum recording duration in seconds */
  maxDuration?: number
  /** Callback when max duration is reached */
  onMaxDurationReached?: () => void
  /** Callback when state changes */
  onStateChange?: (state: VoiceState) => void
}

interface UseVoiceStateReturn {
  /** Current voice state */
  state: VoiceState
  /** Recording duration in seconds */
  recordingDuration: number
  /** Transition to a new state */
  transition: (newState: VoiceState) => void
  /** Reset to idle state */
  reset: () => void
}

/**
 * Hook for managing voice chat state machine
 *
 * Valid transitions:
 * - idle → listening
 * - listening → processing
 * - processing → speaking
 * - speaking → idle
 * - any → idle (reset/cancel)
 */
export function useVoiceState(options: UseVoiceStateOptions = {}): UseVoiceStateReturn {
  const { maxDuration = 60, onMaxDurationReached, onStateChange } = options

  const [state, setState] = useState<VoiceState>('idle')
  const [recordingDuration, setRecordingDuration] = useState(0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const onStateChangeRef = useRef(onStateChange)
  const onMaxDurationRef = useRef(onMaxDurationReached)

  // Keep refs up to date
  useEffect(() => {
    onStateChangeRef.current = onStateChange
  }, [onStateChange])

  useEffect(() => {
    onMaxDurationRef.current = onMaxDurationReached
  }, [onMaxDurationReached])

  // Start/stop recording timer based on state
  useEffect(() => {
    if (state === 'listening') {
      // Start timer
      setRecordingDuration(0)
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const next = prev + 1
          if (next >= maxDuration) {
            onMaxDurationRef.current?.()
          }
          return next
        })
      }, 1000)
    } else {
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      if (state === 'idle') {
        setRecordingDuration(0)
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [state, maxDuration])

  const transition = useCallback(
    (newState: VoiceState) => {
      // Validate transitions
      const validTransitions: Record<VoiceState, VoiceState[]> = {
        idle: ['listening'],
        listening: ['processing', 'idle'],
        processing: ['speaking', 'idle'],
        speaking: ['idle'],
      }

      if (validTransitions[state].includes(newState) || newState === 'idle') {
        setState(newState)
        onStateChangeRef.current?.(newState)
      } else {
        console.warn(`Invalid voice state transition: ${state} → ${newState}`)
      }
    },
    [state]
  )

  const reset = useCallback(() => {
    setState('idle')
    setRecordingDuration(0)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    onStateChangeRef.current?.('idle')
  }, [])

  return {
    state,
    recordingDuration,
    transition,
    reset,
  }
}
