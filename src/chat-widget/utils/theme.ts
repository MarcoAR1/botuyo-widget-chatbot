/**
 * @package @paseolibre/chat-widget
 * Sistema de Temas y CSS Variables
 * 
 * Este módulo centraliza toda la gestión de temas del widget.
 * Exporta temas predefinidos, utilidades y constantes.
 */

import { ChatTheme } from '../types'

/**
 * ===================================
 * CSS VARIABLES (HSL Format)
 * ===================================
 */

export interface CSSVariables {
  background: string           // Fondo principal
  foreground: string          // Texto principal
  card: string                // Fondo de tarjetas
  cardForeground: string      // Texto en tarjetas
  primary: string             // Color primario
  primaryForeground: string   // Texto sobre primario
  muted: string               // Fondos atenuados
  mutedForeground: string     // Texto atenuado
  border: string              // Bordes
  destructive: string         // Color de error
  radius: string              // Radio de bordes
}

/**
 * Valores CSS por defecto (Light Mode - Paseo Libre)
 */
export const DEFAULT_CSS_VARIABLES: CSSVariables = {
  background: '0 0% 100%',           // Blanco
  foreground: '240 10% 3.9%',        // Negro azulado
  card: '0 0% 100%',                 // Blanco
  cardForeground: '240 10% 3.9%',    // Negro azulado
  primary: '160 84% 39%',            // Verde Paseo Libre
  primaryForeground: '0 0% 100%',    // Blanco
  muted: '240 4.8% 95.9%',           // Gris claro
  mutedForeground: '240 3.8% 46.1%', // Gris oscuro
  border: '240 5.9% 90%',            // Gris borde
  destructive: '0 84.2% 60.2%',      // Rojo
  radius: '0.5rem',                  // 8px
}

/**
 * Valores CSS para Dark Mode
 */
export const DARK_CSS_VARIABLES: CSSVariables = {
  background: '240 10% 3.9%',        // Fondo oscuro
  foreground: '0 0% 98%',            // Texto claro
  card: '240 10% 10%',               // Tarjetas oscuras
  cardForeground: '0 0% 98%',        // Texto claro
  primary: '160 84% 39%',            // Verde Paseo Libre
  primaryForeground: '0 0% 100%',    // Blanco
  muted: '240 3.7% 15.9%',           // Gris oscuro
  mutedForeground: '240 5% 64.9%',   // Gris claro
  border: '240 3.7% 15.9%',          // Bordes oscuros
  destructive: '0 63% 31%',          // Rojo oscuro
  radius: '0.5rem',                  // 8px
}

/**
 * ===================================
 * TEMAS PREDEFINIDOS
 * ===================================
 */

/**
 * Tema por defecto de Paseo Libre (Light)
 */
export const PASEO_LIBRE_THEME: Required<Omit<ChatTheme, 'avatars' | 'emotion' | 'starterPrompt' | 'launcherBorderRadius' | 'borderRadius' | 'bubbleStyles' | 'promptPersistence' | 'avatarScale'>> = {
  primaryColor: 'hsl(160, 84%, 39%)',
  botName: 'Asistente',
  logoUrl: '',
  position: 'bottom-right',
  welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
  inputPlaceholder: 'Escribe un mensaje...',
  cssVariables: DEFAULT_CSS_VARIABLES,
}

/**
 * Tema oscuro de Paseo Libre
 */
export const PASEO_LIBRE_DARK_THEME: Required<Omit<ChatTheme, 'avatars' | 'emotion' | 'starterPrompt' | 'launcherBorderRadius' | 'borderRadius' | 'bubbleStyles' | 'promptPersistence' | 'avatarScale'>> = {
  primaryColor: 'hsl(160, 84%, 39%)',
  botName: 'Asistente',
  logoUrl: '',
  position: 'bottom-right',
  welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
  inputPlaceholder: 'Escribe un mensaje...',
  cssVariables: DARK_CSS_VARIABLES,
}

/**
 * Tema corporativo azul
 */
export const CORPORATE_BLUE_THEME: Required<Omit<ChatTheme, 'avatars' | 'emotion' | 'starterPrompt' | 'launcherBorderRadius' | 'borderRadius' | 'bubbleStyles' | 'promptPersistence' | 'avatarScale'>> = {
  primaryColor: 'hsl(221, 83%, 53%)',
  botName: 'Asistente Corporativo',
  logoUrl: '',
  position: 'bottom-right',
  welcomeMessage: '¡Hola! ¿Cómo puedo ayudarte?',
  inputPlaceholder: 'Escribe tu consulta...',
  cssVariables: {
    background: '0 0% 100%',
    foreground: '222 47% 11%',
    card: '0 0% 98%',
    cardForeground: '222 47% 11%',
    primary: '221 83% 53%',
    primaryForeground: '0 0% 100%',
    muted: '210 40% 96%',
    mutedForeground: '215 16% 47%',
    border: '214 32% 91%',
    destructive: '0 84% 60%',
    radius: '0.375rem',
  },
}

/**
 * Tema minimalista (Gris/Negro)
 */
export const MINIMALIST_THEME: Required<Omit<ChatTheme, 'avatars' | 'emotion' | 'starterPrompt' | 'launcherBorderRadius' | 'borderRadius' | 'bubbleStyles' | 'promptPersistence' | 'avatarScale'>> = {
  primaryColor: 'hsl(0, 0%, 9%)',
  botName: 'Asistente',
  logoUrl: '',
  position: 'bottom-right',
  welcomeMessage: 'Hola',
  inputPlaceholder: 'Mensaje...',
  cssVariables: {
    background: '0 0% 100%',
    foreground: '0 0% 9%',
    card: '0 0% 97%',
    cardForeground: '0 0% 9%',
    primary: '0 0% 9%',
    primaryForeground: '0 0% 100%',
    muted: '0 0% 96%',
    mutedForeground: '0 0% 45%',
    border: '0 0% 90%',
    destructive: '0 84% 60%',
    radius: '1rem',
  },
}

/**
 * ===================================
 * UTILIDADES
 * ===================================
 */

/**
 * Fusiona el tema del usuario con los valores por defecto
 */
export function mergeThemeWithDefaults(
  userTheme?: Partial<ChatTheme>
): Required<Omit<ChatTheme, 'avatars' | 'emotion' | 'starterPrompt' | 'launcherBorderRadius' | 'borderRadius' | 'bubbleStyles' | 'promptPersistence' | 'avatarScale'>> {
  return {
    primaryColor: userTheme?.primaryColor || PASEO_LIBRE_THEME.primaryColor,
    botName: userTheme?.botName || PASEO_LIBRE_THEME.botName,
    logoUrl: userTheme?.logoUrl || PASEO_LIBRE_THEME.logoUrl,
    position: userTheme?.position || PASEO_LIBRE_THEME.position,
    welcomeMessage: userTheme?.welcomeMessage || PASEO_LIBRE_THEME.welcomeMessage,
    inputPlaceholder: userTheme?.inputPlaceholder || PASEO_LIBRE_THEME.inputPlaceholder,
    cssVariables: {
      ...DEFAULT_CSS_VARIABLES,
      ...(userTheme?.cssVariables || {}),
    },
  }
}

/**
 * Obtiene el color primario con fallback
 */
export function getPrimaryColor(options: { primaryColor?: string }): string {
  return options.primaryColor || 'hsl(160, 84%, 39%)'
}

/**
 * Convierte variables CSS a un objeto de estilos inline
 */
export function cssVariablesToInlineStyles(variables: Partial<CSSVariables>): Record<string, string> {
  const merged = { ...DEFAULT_CSS_VARIABLES, ...variables }
  return {
    '--background': merged.background,
    '--foreground': merged.foreground,
    '--card': merged.card,
    '--card-foreground': merged.cardForeground,
    '--primary': merged.primary,
    '--primary-foreground': merged.primaryForeground,
    '--muted': merged.muted,
    '--muted-foreground': merged.mutedForeground,
    '--border': merged.border,
    '--destructive': merged.destructive,
    '--radius': merged.radius,
  }
}

/**
 * Genera estilos de color sólidos desde variables CSS
 */
export function getSolidStyles(variables?: Partial<CSSVariables>) {
  const vars = { ...DEFAULT_CSS_VARIABLES, ...variables }
  return {
    background: `hsl(${vars.background})`,
    foreground: `hsl(${vars.foreground})`,
    card: `hsl(${vars.card})`,
    cardForeground: `hsl(${vars.cardForeground})`,
    primary: `hsl(${vars.primary})`,
    primaryForeground: `hsl(${vars.primaryForeground})`,
    muted: `hsl(${vars.muted})`,
    mutedForeground: `hsl(${vars.mutedForeground})`,
    border: `hsl(${vars.border})`,
    destructive: `hsl(${vars.destructive})`,
  }
}

/**
 * Retorna el tema completo con fallbacks aplicados
 */
export function getMergedTheme(theme: ChatTheme = {}): ChatTheme {
  return theme
}
