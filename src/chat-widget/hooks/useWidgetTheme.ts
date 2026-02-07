import { useMemo } from 'react'
import type { ChatTheme, BubbleStyles } from '../types'
import { mergeThemeWithDefaults } from '../utils/theme'
import { useHighContrast } from './useHighContrast'

const DEFAULT_WIDGET_STYLES: BubbleStyles = {
  radius: {
    bubble: 'rounded-2xl',
    image: 'rounded-xl',
    button: 'rounded-xl',
    card: 'rounded-2xl',
  },
  bot: {
    bg: 'bg-muted/50 dark:bg-muted/20',
    text: 'text-foreground',
    border: 'border-border/50',
  },
  user: {
    text: 'text-primary-foreground',
  },
}

/**
 * Hook para gestionar el tema del widget
 * Maneja el merge de temas con prioridades: proyecto > socket > default
 * También gestiona alto contraste y estilos de burbujas
 */
export function useWidgetTheme(projectTheme?: ChatTheme, socketTheme?: ChatTheme) {
  const isHighContrast = useHighContrast()

  // Fusionar temas con prioridades: proyecto > socket > default
  const mergedTheme = useMemo(() => {
    const baseTheme = mergeThemeWithDefaults(projectTheme, socketTheme)

    // Alto contraste: sobreescribir colores para WCAG AAA (7:1)
    if (isHighContrast) {
      return {
        ...baseTheme,
        primaryColor: '#000000',
        cssVariables: {
          ...baseTheme.cssVariables,
          background: '#FFFFFF',
          foreground: '#000000',
          card: '#FFFFFF',
          cardForeground: '#000000',
          primary: '#000000',
          primaryForeground: '#FFFFFF',
          muted: '#F5F5F5',
          mutedForeground: '#000000',
          border: '#000000',
        },
      }
    }

    return baseTheme
  }, [projectTheme, socketTheme, isHighContrast])

  // Fusionar estilos de burbujas (solo del proyecto, no del socket)
  const mergedStyles = useMemo<BubbleStyles>(
    () => ({
      radius: {
        ...DEFAULT_WIDGET_STYLES.radius,
        ...projectTheme?.bubbleStyles?.radius,
      },
      bot: { ...DEFAULT_WIDGET_STYLES.bot, ...projectTheme?.bubbleStyles?.bot },
      user: { ...DEFAULT_WIDGET_STYLES.user, ...projectTheme?.bubbleStyles?.user },
      launcher: { ...projectTheme?.bubbleStyles?.launcher },
      mapCard: { ...projectTheme?.bubbleStyles?.mapCard },
    }),
    [projectTheme?.bubbleStyles]
  )

  // Estilos para el container del widget
  const getContainerStyle = (
    isOpen: boolean,
    isMobile: boolean,
    position?: 'bottom-left' | 'bottom-right'
  ): React.CSSProperties => {
    return {
      // Las CSS variables ya se aplican en el root container desde standalone.tsx
      // Solo necesitamos la variable de primaryColor para compatibilidad
      '--chat-primary': mergedTheme.primaryColor,
      zIndex: isOpen ? 2147483647 : 9999,
      position: 'fixed',
      top: isMobile && isOpen ? 0 : 'auto',
      left: isMobile && isOpen ? 0 : position === 'bottom-left' ? '24px' : 'auto',
      right: isMobile && isOpen ? 0 : position === 'bottom-right' || !position ? '24px' : 'auto',
      bottom: isMobile && isOpen ? 0 : '24px',
      width: isMobile && isOpen ? '100%' : 'auto',
      height: isMobile && isOpen ? '100%' : 'auto',
    } as React.CSSProperties
  }

  return {
    mergedTheme,
    mergedStyles,
    getContainerStyle,
  }
}
