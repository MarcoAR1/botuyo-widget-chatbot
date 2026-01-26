/**
 * @package @botuyo/chat-widget
 * Hook para rate limiting y protección contra spam
 */

import { useRef, useCallback } from 'react'

export interface UseRateLimitOptions {
  maxMessages: number
  windowMs: number
}

export function useRateLimit(maxMessages = 10, windowMs = 60000) {
  const timestamps = useRef<number[]>([])

  const isAllowed = useCallback(() => {
    const now = Date.now()

    // Eliminar timestamps fuera de la ventana de tiempo
    timestamps.current = timestamps.current.filter(
      (timestamp) => now - timestamp < windowMs
    )

    // Verificar si se excedió el límite
    if (timestamps.current.length >= maxMessages) {
      return false
    }

    // Registrar nuevo timestamp
    timestamps.current.push(now)
    return true
  }, [maxMessages, windowMs])

  const getRemainingAttempts = useCallback(() => {
    const now = Date.now()
    timestamps.current = timestamps.current.filter(
      (timestamp) => now - timestamp < windowMs
    )
    return Math.max(0, maxMessages - timestamps.current.length)
  }, [maxMessages, windowMs])

  const getTimeUntilReset = useCallback(() => {
    if (timestamps.current.length === 0) return 0
    
    const now = Date.now()
    const oldestTimestamp = timestamps.current[0]
    const timeRemaining = windowMs - (now - oldestTimestamp)
    
    return Math.max(0, timeRemaining)
  }, [windowMs])

  const reset = useCallback(() => {
    timestamps.current = []
  }, [])

  return {
    isAllowed,
    getRemainingAttempts,
    getTimeUntilReset,
    reset,
  }
}
