/**
 * @package @paseolibre/chat-widget
 * Hook para notificaciones desktop y sonoras
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage } from '../types'
import { logger } from '../utils/logger'

export interface UseNotificationsOptions {
  enabled?: boolean
  soundEnabled?: boolean
  desktopEnabled?: boolean
  botName?: string
  logoUrl?: string
}

export function useNotifications({
  enabled = true,
  soundEnabled = true,
  desktopEnabled = true,
  botName = 'Asistente',
  logoUrl = '/avatar/mar_default.webp',
}: UseNotificationsOptions = {}) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Inicializar audio element
  useEffect(() => {
    if (soundEnabled && typeof window !== 'undefined') {
      audioRef.current = new Audio('/notification.mp3')
      audioRef.current.volume = 0.3
    }
  }, [soundEnabled])

  // Verificar permiso al montar
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    setPermission(Notification.permission)
  }, [])

  // Solicitar permiso para notificaciones
  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      logger.warn('Notifications API not available')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      logger.info('Notification permission:', result)
      return result === 'granted'
    } catch (error) {
      logger.error('Error requesting notification permission:', error)
      return false
    }
  }, [])

  // Mostrar notificación desktop
  const notify = useCallback(
    (message: ChatMessage) => {
      if (!enabled || !desktopEnabled) return
      if (permission !== 'granted') return
      if (typeof document !== 'undefined' && document.hasFocus()) return // No molestar si está activo

      try {
        const title = `Nuevo mensaje de ${botName}`
        
        // Extraer contenido según tipo de mensaje
        let body = 'Mensaje recibido'
        if (message.type === 'text' && 'content' in message) {
          body = message.content?.slice(0, 100) || 'Mensaje recibido'
        } else if (message.type === 'image') {
          body = '📷 Imagen'
        } else if (message.type === 'audio') {
          body = '🎵 Audio'
        } else if (message.type === 'location') {
          body = '📍 Ubicación'
        }
        
        const notification = new Notification(title, {
          body,
          icon: logoUrl,
          tag: 'chat-message',
          requireInteraction: false,
          silent: false,
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        // Auto-cerrar después de 5s
        setTimeout(() => notification.close(), 5000)
      } catch (error) {
        logger.error('Error showing notification:', error)
      }
    },
    [enabled, desktopEnabled, permission, botName, logoUrl]
  )

  // Reproducir sonido
  const playSound = useCallback(() => {
    if (!enabled || !soundEnabled) return
    if (typeof document !== 'undefined' && document.hasFocus()) return

    try {
      audioRef.current?.play().catch((error) => {
        // Ignorar errores de autoplay (navegador puede bloquear)
        logger.debug('Audio playback blocked:', error)
      })
    } catch (error) {
      logger.error('Error playing sound:', error)
    }
  }, [enabled, soundEnabled])

  // Método combinado: notificación + sonido
  const notifyWithSound = useCallback(
    (message: ChatMessage) => {
      notify(message)
      playSound()
    },
    [notify, playSound]
  )

  return {
    permission,
    requestPermission,
    notify,
    playSound,
    notifyWithSound,
  }
}
