/**
 * Configuración de Tema Paseolibre
 * 
 * Este tema está configurado para coincidir exactamente con el sistema de diseño
 * del proyecto principal de Paseolibre (Next.js + Tailwind CSS)
 */

import { ChatTheme } from './src/chat-widget/types'

/**
 * Tema Light Mode (por defecto)
 * Coincide con :root de globals.css
 */
export const PASEOLIBRE_LIGHT_THEME: ChatTheme = {
  primaryColor: 'hsl(210, 100%, 50%)', // brand-blue-medium
  botName: 'Asistente Paseolibre',
  logoUrl: '/logo-paseolibre.png',
  position: 'bottom-right',
  welcomeMessage: '¡Hola! ¿Cómo puedo ayudarte hoy?',
  inputPlaceholder: 'Escribe tu mensaje aquí...',
  
  cssVariables: {
    // Sistema de colores base (Light)
    background: '0 0% 100%',              // Blanco puro
    foreground: '210 20% 12%',            // Texto oscuro
    card: '0 0% 100%',                    // Cards blancas
    cardForeground: '210 20% 12%',        // Texto en cards
    
    // Colores de marca (Brand Blue)
    primary: '210 100% 50%',              // --brand-blue-medium
    primaryForeground: '0 0% 100%',       // Blanco sobre azul
    
    // Colores secundarios
    muted: '210 20% 96%',                 // --secondary (fondo atenuado)
    mutedForeground: '210 10% 45%',       // --muted-foreground
    
    // Bordes y destructivos
    border: '210 20% 90%',                // --border
    destructive: '0 84% 60%',             // --destructive (rojo)
    
    // Border radius
    radius: '0.75rem',                    // --radius (12px)
  }
}

/**
 * Tema Dark Mode
 * Coincide con .dark de globals.css
 */
export const PASEOLIBRE_DARK_THEME: ChatTheme = {
  ...PASEOLIBRE_LIGHT_THEME,
  
  cssVariables: {
    // Sistema de colores base (Dark)
    background: '220 40% 3%',             // Fondo muy oscuro
    foreground: '210 20% 98%',            // Texto casi blanco
    card: '220 40% 5%',                   // Cards oscuras
    cardForeground: '210 20% 98%',        // Texto en cards claro
    
    // Colores de marca (mismo azul)
    primary: '210 100% 50%',              // --brand-blue-medium
    primaryForeground: '0 0% 100%',       // Blanco
    
    // Colores secundarios
    muted: '220 30% 10%',                 // Fondo atenuado oscuro
    mutedForeground: '210 10% 65%',       // Texto atenuado claro
    
    // Bordes y destructivos
    border: '220 30% 12%',                // Bordes oscuros
    destructive: '0 84% 60%',             // Rojo (mismo que light)
    
    // Border radius
    radius: '0.75rem',                    // --radius (12px)
  }
}

/**
 * Hook para detectar y aplicar tema automáticamente
 * según el modo del sitio principal
 * 
 * NOTA: Este código requiere React importado.
 * Si usas este hook, agrega: import { useState, useEffect } from 'react'
 */
export function usePaseolibreTheme() {
  // Descomenta cuando uses en un proyecto React:
  /*
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Detectar tema actual
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark')
      setIsDark(isDarkMode)
    }

    // Check inicial
    checkDarkMode()

    // Observar cambios en la clase .dark
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [])

  return isDark ? PASEOLIBRE_DARK_THEME : PASEOLIBRE_LIGHT_THEME
  */
  
  // Placeholder para TypeScript
  return PASEOLIBRE_LIGHT_THEME
}

/**
 * Tema con colores de marca específicos
 * Usando las variables --brand-blue-* directamente
 */
export const PASEOLIBRE_BRAND_VARIANTS = {
  light: {
    ...PASEOLIBRE_LIGHT_THEME,
    primaryColor: 'hsl(204, 70%, 63%)', // brand-blue-light
    cssVariables: {
      ...PASEOLIBRE_LIGHT_THEME.cssVariables,
      primary: '204 70% 63%',
    }
  },
  medium: PASEOLIBRE_LIGHT_THEME, // Ya usa brand-blue-medium
  dark: {
    ...PASEOLIBRE_LIGHT_THEME,
    primaryColor: 'hsl(210, 80%, 45%)', // brand-blue-dark
    cssVariables: {
      ...PASEOLIBRE_LIGHT_THEME.cssVariables,
      primary: '210 80% 45%',
    }
  },
  darker: {
    ...PASEOLIBRE_LIGHT_THEME,
    primaryColor: 'hsl(210, 95%, 35%)', // brand-blue-darker
    cssVariables: {
      ...PASEOLIBRE_LIGHT_THEME.cssVariables,
      primary: '210 95% 35%',
    }
  },
}

/**
 * Ejemplo de uso en Next.js App
 * 
 * NOTA: Este es código de ejemplo comentado.
 * Para usar, crea un componente .tsx con este código:
 */
export const ExampleUsageCode = `
import { usePaseolibreTheme } from './theme.paseolibre.config'

export const ChatExample = () => {
  const theme = usePaseolibreTheme()

  return (
    <ChatWidget
      apiKey={process.env.NEXT_PUBLIC_CHAT_API_KEY!}
      apiBaseUrl={process.env.NEXT_PUBLIC_CHAT_API_URL!}
      theme={theme}
      pageContext={{
        pageTitle: document.title,
        pageUrl: window.location.href,
      }}
      userContext={{
        metadata: {
          site: 'paseolibre',
          version: '2.0',
        }
      }}
    />
  )
}
`

/**
 * Estilos CSS adicionales para integración perfecta
 * Agregar en globals.css del proyecto principal
 */
export const CUSTOM_STYLES = `
/* Chat Widget - Integración con sistema de diseño Paseolibre */

/* Launcher con sombra del sistema */
.paseo-chat-launcher {
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.08) !important;
  transition: all 0.3s ease-out !important;
}

.paseo-chat-launcher:hover {
  transform: translateY(-2px) scale(1.05) !important;
  box-shadow: 0 0 20px -5px hsl(var(--brand-blue-medium) / 0.3) !important;
}

/* Ventana de chat con glassmorphism */
.paseo-chat-window {
  border-radius: var(--radius) !important;
  box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid hsl(var(--border)) !important;
  backdrop-filter: blur(12px) !important;
}

/* Header del chat con glass effect */
.paseo-chat-header {
  background: hsl(var(--background) / 0.8) !important;
  backdrop-filter: blur(12px) !important;
  border-bottom: 1px solid hsl(var(--border) / 0.5) !important;
}

/* Mensajes del bot con gradiente de marca */
.paseo-chat-message-bot {
  background: linear-gradient(
    135deg,
    hsl(var(--brand-blue-light)) 0%,
    hsl(var(--brand-blue-medium)) 50%,
    hsl(var(--brand-blue-dark)) 100%
  ) !important;
  color: white !important;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05) !important;
}

/* Mensajes del usuario */
.paseo-chat-message-user {
  background: hsl(var(--muted)) !important;
  color: hsl(var(--foreground)) !important;
  border: 1px solid hsl(var(--border)) !important;
}

/* Input con estilos del sistema */
.paseo-chat-input {
  background: hsl(var(--background)) !important;
  border: 1px solid hsl(var(--border)) !important;
  border-radius: calc(var(--radius) - 4px) !important;
  transition: all 0.3s ease !important;
}

.paseo-chat-input:focus {
  border-color: hsl(var(--primary)) !important;
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.2) !important;
  outline: none !important;
}

/* Botones con colores de marca */
.paseo-chat-button-primary {
  background: hsl(var(--primary)) !important;
  color: hsl(var(--primary-foreground)) !important;
  border-radius: calc(var(--radius) - 4px) !important;
  font-weight: 600 !important;
  transition: all 0.3s ease !important;
}

.paseo-chat-button-primary:hover {
  background: hsl(var(--brand-blue-dark)) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 8px -2px hsl(var(--primary) / 0.3) !important;
}

/* Modo oscuro */
.dark .paseo-chat-window {
  background: hsl(var(--card) / 0.95) !important;
  border-color: hsl(var(--border)) !important;
}

.dark .paseo-chat-message-bot {
  background: linear-gradient(
    135deg,
    hsl(210 100% 40%) 0%,
    hsl(210 100% 30%) 50%,
    hsl(210 100% 20%) 100%
  ) !important;
}

/* Scrollbar personalizado */
.paseo-chat-messages::-webkit-scrollbar {
  width: 6px;
}

.paseo-chat-messages::-webkit-scrollbar-track {
  background: hsl(var(--muted));
}

.paseo-chat-messages::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

.paseo-chat-messages::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--primary));
}

/* Animaciones coordinadas con el sitio */
.paseo-chat-message {
  animation: fade-in-up 0.3s ease-out;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Typing indicator con animación del sistema */
.paseo-chat-typing {
  animation: pulse-subtle 2s ease-in-out infinite;
}

@keyframes pulse-subtle {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.2;
  }
}
`
