/**
 * @package @botuyo/chat-widget
 * Utilidad para gestionar el Device ID persistente
 */

import { logger } from './logger'

const DEVICE_ID_KEY = 'chat_device_id'

/**
 * Genera un UUID v4 simple sin dependencias externas
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Obtiene el Device ID existente o genera uno nuevo
 * Crítico: Esto permite mantener la sesión de chat tras refrescar la página
 */
export function getOrCreateDeviceId(): string {
  try {
    // Intentar obtener el device_id existente
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    
    if (existing) {
      return existing
    }
    
    // Si no existe, generar uno nuevo y persistirlo
    const newDeviceId = generateUUID()
    localStorage.setItem(DEVICE_ID_KEY, newDeviceId)
    
    return newDeviceId
  } catch {
    // Fallback si localStorage no está disponible (ej: modo privado)
    logger.warn('localStorage not available, using session-only device ID')
    return generateUUID()
  }
}

/**
 * Limpia el Device ID (útil para testing o logout completo)
 */
export function clearDeviceId(): void {
  try {
    localStorage.removeItem(DEVICE_ID_KEY)
  } catch {
    logger.warn('Could not clear device ID')
  }
}

/**
 * Obtiene el Device ID sin crearlo (retorna null si no existe)
 */
export function getDeviceId(): string | null {
  try {
    return localStorage.getItem(DEVICE_ID_KEY)
  } catch {
    return null
  }
}
