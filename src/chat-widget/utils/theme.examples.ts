/**
 * Ejemplo de uso del Sistema de Temas
 *
 * Este archivo demuestra cómo usar los temas predefinidos,
 * crear temas personalizados y aplicarlos al widget.
 */

import {
  // Temas predefinidos
  DEFAULT_THEME,
  // PASEO_LIBRE_DARK_THEME,
  // CORPORATE_BLUE_THEME,
  // MINIMALIST_THEME,

  // Constantes de variables CSS
  DEFAULT_CSS_VARIABLES,

  // Utilidades
  mergeThemeWithDefaults,
  getSolidStyles,
  cssVariablesToInlineStyles,
} from './themes'

// ===================================
// 1. USAR TEMA PREDEFINIDO
// ===================================

// Tema por defecto de BotUyo (Light)
const defaultTheme = DEFAULT_THEME
/*
{
  primaryColor: 'hsl(160, 84%, 39%)',
  botName: 'Asistente',
  welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
  cssVariables: {
    background: '0 0% 100%',
    foreground: '240 10% 3.9%',
    primary: '160 84% 39%',
    ...
  }
}
*/

// Tema oscuro
// const darkTheme = PASEO_LIBRE_DARK_THEME

// Tema corporativo azul
// const corporateTheme = CORPORATE_BLUE_THEME

// Tema minimalista
// const minimalistTheme = MINIMALIST_THEME

// ===================================
// 2. CREAR TEMA PERSONALIZADO
// ===================================

// Tema personalizado simple (solo color primario)
const customSimpleTheme = {
  primaryColor: 'hsl(280, 100%, 50%)', // Morado
  botName: 'Mi Bot',
  cssVariables: {
    primary: '280 100% 50%', // Morado
    // El resto usa valores por defecto
  },
}

// Tema personalizado completo
const customFullTheme = {
  primaryColor: 'hsl(340, 82%, 52%)',
  botName: 'Asistente Rosa',
  logoUrl: 'https://example.com/logo.png',
  position: 'bottom-left' as const,
  welcomeMessage: '¡Bienvenido! ¿Cómo te puedo ayudar?',
  inputPlaceholder: 'Escribe aquí...',
  cssVariables: {
    background: '330 100% 98%', // Rosa muy claro
    foreground: '340 90% 10%', // Rosa oscuro
    card: '0 0% 100%',
    cardForeground: '340 90% 10%',
    primary: '340 82% 52%', // Rosa vibrante
    primaryForeground: '0 0% 100%',
    muted: '330 40% 95%',
    mutedForeground: '340 10% 40%',
    border: '330 30% 90%',
    destructive: '0 84% 60%',
    radius: '1.5rem',
  },
}

// ===================================
// 3. FUSIONAR CON VALORES POR DEFECTO
// ===================================

// Si el usuario no proporciona todas las variables,
// fusionarlas automáticamente con los valores por defecto
const userTheme = {
  primaryColor: 'hsl(220, 90%, 56%)',
  botName: 'Mi Asistente',
  cssVariables: {
    primary: '220 90% 56%', // Solo cambia el color primario
    // El resto se fusiona con DEFAULT_CSS_VARIABLES
  },
}

export const mergedTheme = mergeThemeWithDefaults(userTheme)
// Ahora mergedTheme tiene TODOS los valores necesarios

// ===================================
// 4. GENERAR ESTILOS SÓLIDOS
// ===================================

// Convertir variables CSS a valores HSL concretos
const solidStyles = getSolidStyles(DEFAULT_CSS_VARIABLES)
/*
{
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(240, 10%, 3.9%)',
  primary: 'hsl(160, 84%, 39%)',
  ...
}
*/

// Usar en estilos inline
export const myComponent = {
  backgroundColor: solidStyles.background,
  color: solidStyles.foreground,
  borderColor: solidStyles.border,
}

// ===================================
// 5. CONVERTIR A VARIABLES CSS INLINE
// ===================================

// Generar objeto de variables CSS para aplicar con style={{}}
const cssVars = cssVariablesToInlineStyles(DEFAULT_CSS_VARIABLES)
/*
{
  '--background': '0 0% 100%',
  '--foreground': '240 10% 3.9%',
  '--primary': '160 84% 39%',
  ...
}
*/

// Aplicar en un componente
export const containerStyle = {
  ...cssVars,
  backgroundColor: 'hsl(var(--background))',
}

// ===================================
// 6. MODO OSCURO DINÁMICO
// ===================================

import { useState, useEffect } from 'react'

function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Detectar preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return isDark
}

// Uso en componente
export function MyApp() {
  const isDark = useDarkMode()

  // Selección de tema según modo oscuro
  // const theme = isDark ? PASEO_LIBRE_DARK_THEME : PASEO_LIBRE_THEME

  return isDark // Demo: retorna el estado para evitar warning

  // Uso:
  // <ChatWidget
  //   apiKey="..."
  //   apiBaseUrl="..."
  //   theme={theme}
  // />
}

// ===================================
// 7. EXTENDER UN TEMA EXISTENTE
// ===================================

// Tomar un tema existente y modificarlo
// const extendedTheme = {
//   ...CORPORATE_BLUE_THEME,
//   botName: 'Asistente Corporativo Pro',
//   welcomeMessage: 'Bienvenido a nuestro sistema',
//   cssVariables: {
//     ...CORPORATE_BLUE_THEME.cssVariables,
//     radius: '1rem', // Cambiar solo el radio de bordes
//   }
// }

// ===================================
// 8. TEMA CON TONALIDADES DEL MISMO COLOR
// ===================================

// Crear variaciones de un color base
// const brandColor = '221 83% 53%' // Azul base

// const monochromeTheme = {
//   primaryColor: `hsl(${brandColor})`,
//   cssVariables: {
//     background: '0 0% 100%',
//     foreground: '221 83% 10%',        // Azul muy oscuro
//     card: '221 20% 98%',              // Azul casi blanco
//     cardForeground: '221 40% 20%',    // Azul oscuro
//     primary: brandColor,               // Azul base
//     primaryForeground: '0 0% 100%',
//     muted: '221 20% 95%',             // Azul muy claro
//     mutedForeground: '221 20% 40%',   // Azul grisáceo
//     border: '221 20% 90%',            // Azul pálido
//     destructive: '0 84% 60%',         // Rojo (contraste)
//     radius: '0.5rem',
//   }
// }

// ===================================
// 9. TEMA DE MARCA ESPECÍFICA
// ===================================

// Ejemplo: Tema de WhatsApp
// const whatsAppTheme = {
//   primaryColor: 'hsl(142, 70%, 49%)',
//   botName: 'WhatsApp Bot',
//   cssVariables: {
//     background: '0 0% 100%',
//     foreground: '0 0% 0%',
//     card: '142 20% 95%',
//     cardForeground: '0 0% 0%',
//     primary: '142 70% 49%',           // Verde WhatsApp
//     primaryForeground: '0 0% 100%',
//     muted: '0 0% 96%',
//     mutedForeground: '0 0% 40%',
//     border: '0 0% 90%',
//     destructive: '0 84% 60%',
//     radius: '0.5rem',
//   }
// }

// Ejemplo: Tema de Slack
// const slackTheme = {
//   primaryColor: 'hsl(211, 100%, 50%)',
//   botName: 'Slack Bot',
//   cssVariables: {
//     background: '0 0% 100%',
//     foreground: '0 0% 13%',
//     card: '0 0% 98%',
//     cardForeground: '0 0% 13%',
//     primary: '211 100% 50%',          // Azul Slack
//     primaryForeground: '0 0% 100%',
//     muted: '211 15% 95%',
//     mutedForeground: '0 0% 40%',
//     border: '211 10% 88%',
//     destructive: '0 84% 60%',
//     radius: '0.25rem',
//   }
// }

// ===================================
// 10. EXPORTAR PARA USO
// ===================================

export {
  // Temas predefinidos listos para usar
  defaultTheme,
  // darkTheme,
  // corporateTheme,
  // minimalistTheme,

  // Temas personalizados
  customSimpleTheme,
  customFullTheme,
  // extendedTheme,
}
