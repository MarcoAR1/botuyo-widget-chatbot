/**
 * @package @paseolibre/chat-widget
 * Utilidades para theming y CSS Variables
 * 
 * Orden de prioridad:
 * 1. theme.primaryColor (forzado desde props)
 * 2. CSS Variables globales de la app (--primary, --secondary, etc.)
 * 3. Negro (#000000) como fallback final
 */

import { ChatTheme } from '../types'

/**
 * Valores por defecto - usa las variables CSS globales de la app
 */
export const DEFAULT_THEME: Required<Omit<ChatTheme, 'avatars' | 'emotion' | "starterPrompt" | "launcherBorderRadius" | "borderRadius" | "bubbleStyles" | "promptPersistence" | "avatarScale">> = {
  primaryColor: '', // Vacío para usar CSS variables
  botName: 'Asistente',
  logoUrl: '',
  position: 'bottom-right',
  welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
  inputPlaceholder: 'Escribe un mensaje...',
}

/**
 * Obtiene el color primario con fallbacks en cascada:
 * 1. theme.primaryColor (si se especifica)
 * 2. hsl(var(--primary)) (variables CSS globales)
 * 3. #000000 (negro como último fallback)
 */
export function getPrimaryColor(theme?: ChatTheme): string {
  if (theme?.primaryColor) {
    return theme.primaryColor
  }
  
  // Usar las variables CSS globales de la app
  // Esto se resolverá en runtime y usará --primary definido en globals.css
  return 'hsl(var(--primary))'
}

/**
 * Obtiene el color secundario con fallbacks
 */
export function getSecondaryColor(theme?: ChatTheme): string {
  // Por ahora usamos el mismo que primary, pero se puede extender
  if (theme?.primaryColor) {
    return theme.primaryColor
  }
  
  return 'hsl(var(--secondary))'
}

/**
 * Obtiene el color accent con fallbacks
 */
export function getAccentColor(theme?: ChatTheme): string {
  if (theme?.primaryColor) {
    return theme.primaryColor
  }
  
  return 'hsl(var(--accent))'
}

/**
 * Obtiene el color con opacidad
 * Soporta tanto hex como hsl()
 */
export function getColorWithOpacity(color: string, opacity: number): string {
  // Si es hsl() de CSS variable, agregar opacity
  if (color.startsWith('hsl(var(')) {
    return color.replace(')', ` / ${opacity})`)
  }
  
  // Si es hex, convertir a rgba
  if (color.startsWith('#')) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  
  // Si ya tiene formato rgb/rgba/hsl, retornar como está
  return color
}

/**
 * Aplica el tema mediante CSS Variables en el contenedor raíz
 * Esto permite customizar sin tocar el CSS hardcodeado
 */
export function applyThemeToElement(
  element: HTMLElement,
  theme: ChatTheme = {}
): void {
  const primaryColor = getPrimaryColor(theme)
  const secondaryColor = getSecondaryColor(theme)
  const accentColor = getAccentColor(theme)
  
  // Inyectar CSS Variables personalizadas para el widget
  element.style.setProperty('--chat-primary-color', primaryColor)
  element.style.setProperty('--chat-secondary-color', secondaryColor)
  element.style.setProperty('--chat-accent-color', accentColor)
}

/**
 * Retorna el tema completo con fallbacks aplicados
 */
export function getMergedTheme(theme: ChatTheme = {}): Required<Omit<ChatTheme, 'avatars' | 'emotion' | "starterPrompt" | "launcherBorderRadius" | "borderRadius" | "bubbleStyles" | "promptPersistence" | "avatarScale">> {
  return { ...DEFAULT_THEME, ...theme }
}
