/**
 * @package @botuyo/chat-widget
 * Hook para analytics y telemetría
 */

import { useRef, useEffect, useCallback } from 'react'
import { logger } from '../utils/logger'

export interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp: number
}

class ChatAnalytics {
  private queue: AnalyticsEvent[] = []
  private endpoint: string
  private apiKey: string
  private flushInterval: NodeJS.Timeout | null = null
  private readonly MAX_QUEUE_SIZE = 100
  private readonly FLUSH_INTERVAL_MS = 30000 // 30s
  private readonly BATCH_SIZE = 10

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint
    this.apiKey = apiKey
    this.startAutoFlush()
  }

  private startAutoFlush() {
    this.flushInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this.flush()
      }
    }, this.FLUSH_INTERVAL_MS)
  }

  // Track eventos clave
  trackOpen() {
    this.track('chat_opened')
  }

  trackClose() {
    this.track('chat_closed')
  }

  trackMessageSent(type: 'text' | 'image' | 'audio' | 'location' | 'file') {
    this.track('message_sent', { type })
  }

  trackMessageReceived(type: string, latency?: number) {
    this.track('message_received', { type, latency })
  }

  trackError(error: string, context?: any) {
    this.track('error', { error, context })
  }

  trackConnectionStatus(isConnected: boolean) {
    this.track('connection_status', { isConnected })
  }

  trackFeatureUsed(feature: string) {
    this.track('feature_used', { feature })
  }

  trackTypingStarted() {
    this.track('typing_started')
  }

  trackAttachmentSent(type: string, size: number) {
    this.track('attachment_sent', { type, size })
  }

  private track(event: string, properties?: Record<string, any>) {
    this.queue.push({
      event,
      properties: {
        ...properties,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
      timestamp: Date.now(),
    })

    // Auto-flush si alcanzamos el tamaño del batch
    if (this.queue.length >= this.BATCH_SIZE) {
      this.flush()
    }

    // Limitar tamaño de cola para evitar memory leaks
    if (this.queue.length > this.MAX_QUEUE_SIZE) {
      this.queue = this.queue.slice(-this.MAX_QUEUE_SIZE)
      logger.warn('Analytics queue overflow, dropping old events')
    }
  }

  async flush() {
    if (this.queue.length === 0) return

    const batch = [...this.queue]
    this.queue = []

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ events: batch }),
        // Usar keepalive para garantizar envío al cerrar pestaña
        keepalive: true,
      })

      logger.debug(`Analytics: Flushed ${batch.length} events`)
    } catch (error) {
      logger.error('Analytics flush failed:', error)

      // Re-encolar solo si no excedemos el límite
      if (this.queue.length + batch.length <= this.MAX_QUEUE_SIZE) {
        this.queue.unshift(...batch)
      }
    }
  }

  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush() // Flush final
  }
}

export function useAnalytics(apiBaseUrl: string, apiKey: string, enabled = true) {
  const analyticsRef = useRef<ChatAnalytics | null>(null)

  useEffect(() => {
    if (!enabled || !apiBaseUrl || !apiKey) return

    const endpoint = `${apiBaseUrl}/analytics`
    analyticsRef.current = new ChatAnalytics(endpoint, apiKey)

    // Flush al cerrar pestaña
    const handleUnload = () => analyticsRef.current?.flush()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        analyticsRef.current?.flush()
      }
    }

    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      analyticsRef.current?.destroy()
    }
  }, [apiBaseUrl, apiKey, enabled])

  const trackOpen = useCallback(() => {
    analyticsRef.current?.trackOpen()
  }, [])

  const trackClose = useCallback(() => {
    analyticsRef.current?.trackClose()
  }, [])

  const trackMessageSent = useCallback((type: 'text' | 'image' | 'audio' | 'location' | 'file') => {
    analyticsRef.current?.trackMessageSent(type)
  }, [])

  const trackMessageReceived = useCallback((type: string, latency?: number) => {
    analyticsRef.current?.trackMessageReceived(type, latency)
  }, [])

  const trackError = useCallback((error: string, context?: any) => {
    analyticsRef.current?.trackError(error, context)
  }, [])

  const trackConnectionStatus = useCallback((isConnected: boolean) => {
    analyticsRef.current?.trackConnectionStatus(isConnected)
  }, [])

  const trackFeatureUsed = useCallback((feature: string) => {
    analyticsRef.current?.trackFeatureUsed(feature)
  }, [])

  return {
    trackOpen,
    trackClose,
    trackMessageSent,
    trackMessageReceived,
    trackError,
    trackConnectionStatus,
    trackFeatureUsed,
  }
}
