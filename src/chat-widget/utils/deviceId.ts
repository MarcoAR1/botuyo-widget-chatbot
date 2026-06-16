/**
 * @package @botuyo/chat-widget
 * Utilidad para gestionar el Device ID persistente
 */

import { logger } from './logger'

const DEVICE_ID_KEY = 'chat_device_id'

/**
 * Genera un UUID v4 criptográficamente seguro.
 *
 * El device ID identifica al usuario anónimo (auth del socket), por lo que su
 * unicidad es crítica: dos usuarios con el mismo ID compartirían identidad.
 * Por eso priorizamos la Web Crypto API y solo usamos Math.random() como
 * último recurso en entornos sin crypto.
 *
 * 1. `crypto.randomUUID()` — nativo, ideal (navegadores modernos / contexto seguro)
 * 2. `crypto.getRandomValues()` — bytes seguros → UUID v4 manual (RFC 4122)
 * 3. `Math.random()` — fallback de compatibilidad (no cripto-seguro)
 */
function generateUUID(): string {
  const cryptoObj: Crypto | undefined =
    typeof globalThis !== 'undefined' ? globalThis.crypto : undefined

  // 1. API nativa
  if (typeof cryptoObj?.randomUUID === 'function') {
    return cryptoObj.randomUUID()
  }

  // 2. Bytes aleatorios criptográficos → UUID v4 (RFC 4122)
  if (typeof cryptoObj?.getRandomValues === 'function') {
    const bytes = cryptoObj.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40 // versión 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80 // variante 10xx
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'))
    return (
      hex.slice(0, 4).join('') +
      '-' +
      hex.slice(4, 6).join('') +
      '-' +
      hex.slice(6, 8).join('') +
      '-' +
      hex.slice(8, 10).join('') +
      '-' +
      hex.slice(10, 16).join('')
    )
  }

  // 3. Último recurso (entornos sin Web Crypto API)
  logger.warn('[deviceId] Web Crypto API unavailable, falling back to Math.random()')
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
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
