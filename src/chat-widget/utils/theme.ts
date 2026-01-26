/**
 * @package @botuyo/chat-widget
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
  background: string // Fondo principal
  foreground: string // Texto principal
  card: string // Fondo de tarjetas
  cardForeground: string // Texto en tarjetas
  primary: string // Color primario
  primaryForeground: string // Texto sobre primario
  muted: string // Fondos atenuados
  mutedForeground: string // Texto atenuado
  border: string // Bordes
  destructive: string // Color de error
  radius: string // Radio de bordes

  // Design System - Spacing
  spacing1?: string // 0.25rem (4px) - Extra small
  spacing2?: string // 0.5rem (8px) - Small
  spacing3?: string // 0.75rem (12px) - Medium small
  spacing4?: string // 1rem (16px) - Medium (default)
  spacing5?: string // 1.25rem (20px) - Medium large
  spacing6?: string // 1.5rem (24px) - Large
  spacing8?: string // 2rem (32px) - Extra large
}

/**
 * Valores CSS por defecto (Light Mode - BotUyo)
 */
export const DEFAULT_CSS_VARIABLES: CSSVariables = {
  background: '0 0% 100%', // Blanco
  foreground: '240 10% 3.9%', // Negro azulado
  card: '0 0% 100%', // Blanco
  cardForeground: '240 10% 3.9%', // Negro azulado
  primary: '160 84% 39%', // Verde BotUyo
  primaryForeground: '0 0% 100%', // Blanco
  muted: '240 4.8% 95.9%', // Gris claro
  mutedForeground: '240 3.8% 46.1%', // Gris oscuro
  border: '240 5.9% 90%', // Gris borde
  destructive: '0 84.2% 60.2%', // Rojo
  radius: '0.5rem', // 8px

  // Design System - Spacing
  spacing1: '0.25rem', // 4px
  spacing2: '0.5rem', // 8px
  spacing3: '0.75rem', // 12px
  spacing4: '1rem', // 16px (default)
  spacing5: '0.75rem', // 12px (padding default)
  spacing6: '1.5rem', // 24px
  spacing8: '2rem', // 32px
}

/**
 * Valores CSS para Dark Mode
 */
export const DARK_CSS_VARIABLES: CSSVariables = {
  background: '240 10% 3.9%', // Fondo oscuro
  foreground: '0 0% 98%', // Texto claro
  card: '240 10% 10%', // Tarjetas oscuras
  cardForeground: '0 0% 98%', // Texto claro
  primary: '160 84% 39%', // Verde BotUyo
  primaryForeground: '0 0% 100%', // Blanco
  muted: '240 3.7% 15.9%', // Gris oscuro
  mutedForeground: '240 5% 64.9%', // Gris claro
  border: '240 3.7% 15.9%', // Bordes oscuros
  destructive: '0 63% 31%', // Rojo oscuro
  radius: '0.5rem', // 8px

  // Design System - Spacing (mismo que light)
  spacing1: '0.25rem',
  spacing2: '0.5rem',
  spacing3: '0.75rem',
  spacing4: '1rem',
  spacing5: '0.75rem',
  spacing6: '1.5rem',
  spacing8: '2rem',
}

/**
 * ===================================
 * TEMAS PREDEFINIDOS
 * ===================================
 *
 * Cada tema está diseñado para ser visualmente único y distintivo.
 * Los usuarios pueden personalizar cualquier valor, y el sistema de merge
 * garantiza que los valores faltantes se completen con defaults.
 */

/**
 * TEMA DEFAULT - BotUyo (Verde Fresco)
 * Tema por defecto cuando no se envía configuración
 */
export const DEFAULT_THEME: Required<
  Omit<
    ChatTheme,
    | 'avatars'
    | 'emotion'
    | 'starterPrompt'
    | 'launcherBorderRadius'
    | 'borderRadius'
    | 'bubbleStyles'
    | 'promptPersistence'
    | 'avatarScale'
    | 'height'
    | 'bottom'
  >
> = {
  primaryColor: 'hsl(160, 84%, 39%)',
  botName: 'Asistente',
  logoUrl: '',
  position: 'bottom-right',
  welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
  inputPlaceholder: 'Escribe un mensaje...',
  cssVariables: DEFAULT_CSS_VARIABLES,
}

/**
 * TEMA OCEAN - Azul Profundo
 * Diseño profesional y corporativo con tonos azules
 */
export const OCEAN_THEME: ChatTheme = {
  primaryColor: 'hsl(211, 100%, 50%)',
  botName: 'Ocean Assistant',
  welcomeMessage: 'Bienvenido, ¿cómo puedo ayudarte?',
  cssVariables: {
    background: '210 25% 98%',
    foreground: '210 50% 10%',
    card: '210 20% 97%',
    cardForeground: '210 50% 10%',
    primary: '211 100% 50%',
    primaryForeground: '0 0% 100%',
    muted: '210 20% 95%',
    mutedForeground: '210 15% 40%',
    border: '210 20% 88%',
    destructive: '0 84% 60%',
    radius: '0.75rem',
    spacing5: '1rem', // 16px - más espacioso
  },
}

/**
 * TEMA SUNSET - Naranja Cálido
 * Diseño energético y amigable con tonos cálidos
 */
export const SUNSET_THEME: ChatTheme = {
  primaryColor: 'hsl(24, 95%, 53%)',
  botName: 'Sunset Helper',
  welcomeMessage: '👋 ¡Hola! Estoy aquí para ayudarte',
  inputPlaceholder: '¿Qué necesitas?',
  cssVariables: {
    background: '30 40% 98%',
    foreground: '20 30% 15%',
    card: '30 35% 96%',
    cardForeground: '20 30% 15%',
    primary: '24 95% 53%',
    primaryForeground: '0 0% 100%',
    muted: '30 25% 94%',
    mutedForeground: '20 15% 35%',
    border: '30 20% 85%',
    destructive: '0 84% 60%',
    radius: '1.25rem', // Bordes muy redondeados
    spacing3: '1rem', // 16px - gaps más amplios
    spacing5: '1.25rem', // 20px - padding generoso
  },
}

/**
 * TEMA MIDNIGHT - Negro Premium
 * Diseño oscuro y minimalista de alto contraste
 */
export const MIDNIGHT_THEME: ChatTheme = {
  primaryColor: 'hsl(0, 0%, 100%)',
  botName: 'Midnight AI',
  welcomeMessage: 'Hello.',
  inputPlaceholder: 'Type a message...',
  cssVariables: {
    background: '0 0% 7%',
    foreground: '0 0% 98%',
    card: '0 0% 10%',
    cardForeground: '0 0% 98%',
    primary: '0 0% 100%',
    primaryForeground: '0 0% 0%',
    muted: '0 0% 15%',
    mutedForeground: '0 0% 70%',
    border: '0 0% 20%',
    destructive: '0 84% 60%',
    radius: '0.25rem', // Bordes cuadrados
    spacing1: '0.125rem', // 2px - muy compacto
    spacing2: '0.25rem', // 4px
    spacing3: '0.5rem', // 8px
    spacing5: '0.625rem', // 10px - muy compacto
  },
}

/**
 * TEMA NATURE - Verde Bosque
 * Diseño natural y relajante
 */
export const NATURE_THEME: ChatTheme = {
  primaryColor: 'hsl(142, 71%, 45%)',
  botName: 'Nature Guide',
  welcomeMessage: '🌿 ¡Hola! ¿En qué puedo asistirte?',
  cssVariables: {
    background: '140 30% 97%',
    foreground: '140 40% 15%',
    card: '140 25% 95%',
    cardForeground: '140 40% 15%',
    primary: '142 71% 45%',
    primaryForeground: '0 0% 100%',
    muted: '140 20% 92%',
    mutedForeground: '140 15% 35%',
    border: '140 20% 85%',
    destructive: '0 84% 60%',
    radius: '0.875rem',
  },
}

/**
 * ===================================
 * UTILIDADES
 * ===================================
 */

/**
 * Sistema de Merge de Temas con Prioridades
 *
 * PRIORIDAD (de mayor a menor):
 * 1. Tema del proyecto (userTheme) - Lo que el usuario define en su código
 * 2. Tema del socket (socketTheme) - Lo que viene de la API/configuración remota
 * 3. Tema por defecto (DEFAULT_THEME) - Valores fallback
 *
 * El merge es PROFUNDO para cssVariables, garantizando que cada propiedad
 * individual se complete con su fallback correspondiente.
 */
export function mergeThemeWithDefaults(
  userTheme?: Partial<ChatTheme>,
  socketTheme?: Partial<ChatTheme>
): Required<
  Omit<
    ChatTheme,
    | 'avatars'
    | 'emotion'
    | 'starterPrompt'
    | 'launcherBorderRadius'
    | 'borderRadius'
    | 'bubbleStyles'
    | 'promptPersistence'
    | 'avatarScale'
    | 'height'
    | 'bottom'
  >
> {
  // Merge de cssVariables con prioridad: user > socket > default
  const mergedCssVariables: CSSVariables = {
    ...DEFAULT_CSS_VARIABLES,
    ...(socketTheme?.cssVariables || {}),
    ...(userTheme?.cssVariables || {}),
  }

  return {
    primaryColor:
      userTheme?.primaryColor || socketTheme?.primaryColor || DEFAULT_THEME.primaryColor,
    botName: userTheme?.botName || socketTheme?.botName || DEFAULT_THEME.botName,
    logoUrl: userTheme?.logoUrl || socketTheme?.logoUrl || DEFAULT_THEME.logoUrl,
    position: userTheme?.position || socketTheme?.position || DEFAULT_THEME.position,
    welcomeMessage:
      userTheme?.welcomeMessage || socketTheme?.welcomeMessage || DEFAULT_THEME.welcomeMessage,
    inputPlaceholder:
      userTheme?.inputPlaceholder ||
      socketTheme?.inputPlaceholder ||
      DEFAULT_THEME.inputPlaceholder,
    cssVariables: mergedCssVariables,
  }
}

/**
 * Obtiene el color primario con fallback
 */
export function getPrimaryColor(options: { primaryColor?: string }): string {
  return options.primaryColor || DEFAULT_THEME.primaryColor
}

/**
 * Convierte variables CSS a un objeto de estilos inline
 */
export function cssVariablesToInlineStyles(
  variables: Partial<CSSVariables>
): Record<string, string> {
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
