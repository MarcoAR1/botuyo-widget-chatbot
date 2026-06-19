/**
 * @package @botuyo/chat-widget
 * useWakeLock — keeps the device screen awake while `active` is true.
 *
 * Uses the Screen Wake Lock API (https://developer.mozilla.org/docs/Web/API/Screen_Wake_Lock_API).
 * During a voice call the user is looking at the screen but not touching it, so the
 * OS would normally dim/blank the display. A screen wake lock prevents that.
 *
 * The OS auto-releases the lock whenever the page becomes hidden (tab switch, screen
 * off), so we re-acquire it on `visibilitychange` while still active. Gracefully
 * no-ops on browsers without support (older Safari / iOS < 16.4, Firefox).
 */

import { useEffect, useRef } from 'react'
import { logger } from '../utils/logger'

interface WakeLockSentinelLike {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

interface WakeLockLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>
}

function getWakeLock(): WakeLockLike | null {
  if (typeof navigator === 'undefined') return null
  const wl = (navigator as unknown as { wakeLock?: WakeLockLike }).wakeLock
  return wl ?? null
}

/**
 * Keep the screen awake while `active`.
 * @param active - true while the lock should be held (e.g. an ongoing voice call)
 */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null)

  useEffect(() => {
    const wakeLock = getWakeLock()
    if (!active || !wakeLock) return

    let cancelled = false

    const request = async () => {
      // Avoid double-acquiring while a live lock is already held
      if (sentinelRef.current && !sentinelRef.current.released) return
      try {
        const sentinel = await wakeLock.request('screen')
        if (cancelled) {
          void sentinel.release()
          return
        }
        sentinelRef.current = sentinel
        // The system can release the lock on its own (page hidden); clear our
        // ref so the visibilitychange handler knows to re-acquire it.
        sentinel.addEventListener('release', () => {
          if (sentinelRef.current === sentinel) sentinelRef.current = null
        })
      } catch (err) {
        // Permission denied / not visible / not allowed — non-fatal
        logger.warn('[useWakeLock] Could not acquire screen wake lock', err)
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      if (sentinel && !sentinel.released) {
        sentinel.release().catch(() => {})
      }
    }
  }, [active])
}
