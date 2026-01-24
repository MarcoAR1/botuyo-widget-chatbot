/**
 * @package @paseolibre/chat-widget
 * Centralized logger with DEBUG flag for production builds
 * 
 * Principio: Single Responsibility - solo gestionar logging
 */

interface Logger {
  log: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
  debug: (message: string, ...args: any[]) => void
  info: (message: string, ...args: any[]) => void
}

/**
 * Determina si el modo DEBUG está activo
 * - En desarrollo: siempre activo
 * - En producción: solo si window.DEBUG = true
 */
function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  
  // Modo desarrollo (verificar modo DEV de Vite)
  const isDev = typeof import.meta !== 'undefined' && 
    (import.meta as any).env?.DEV === true
  
  if (isDev) return true
  
  // Producción: verificar flag global
  return !!(window as any).DEBUG
}

/**
 * Logger centralizado con control de DEBUG
 * 
 * Uso:
 * - import { logger } from '@/chat-widget/utils/logger'
 * - logger.log('[Component]', 'mensaje')
 * - logger.error('[Error]', error)
 * 
 * Habilitar en producción:
 * - window.DEBUG = true (en consola del navegador)
 */
export const logger: Logger = {
  log: (message: string, ...args: any[]) => {
    if (isDebugEnabled()) {
      console.log(`[PaseoLibre] ${message}`, ...args)
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDebugEnabled()) {
      console.warn(`[PaseoLibre] ${message}`, ...args)
    }
  },
  
  error: (message: string, ...args: any[]) => {
    // Errores siempre se muestran
    console.error(`[PaseoLibre] ${message}`, ...args)
  },
  
  debug: (message: string, ...args: any[]) => {
    if (isDebugEnabled()) {
      console.debug(`[PaseoLibre] ${message}`, ...args)
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (isDebugEnabled()) {
      console.info(`[PaseoLibre] ${message}`, ...args)
    }
  },
}

/**
 * Alternativa silenciosa para testing
 */
export const silentLogger: Logger = {
  log: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  info: () => {},
}
