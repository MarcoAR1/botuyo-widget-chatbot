'use client'

import { useState, useEffect, useCallback } from 'react'
import { useIsMobile } from './useIsMobile'

interface DynamicHeightOptions {
  isOpen: boolean
  headerHeight?: number
  marginTop?: number
  height?: string // Altura personalizada (ej: '600px', '80vh')
  bottom?: string // Distancia desde bottom (ej: '24px', '1.5rem')
}

const DESKTOP_MAX_HEIGHT = 700
const DESKTOP_MIN_HEIGHT = 500
const DESKTOP_MARGIN_TOP = 64 // 4rem
const DEFAULT_BOTTOM = '24px'

export function useDynamicHeight({ isOpen, height, bottom }: DynamicHeightOptions) {
  const isMobile = useIsMobile()
  const [dynamicHeight, setDynamicHeight] = useState<React.CSSProperties>({})

  const calculateHeight = useCallback(() => {
    if (isMobile) {
      // En móvil, dejamos que el viewport nativo y "fixed inset-0" acomoden el widget naturalmente.
      // Modificar window.visualViewport.offsetTop dinámicamente puede causar un "brinco" (double-bounce)
      // cuando el OS (iOS o Android) ya está intentando ajustar el layout al abrir el teclado.
      const updateMobileHeight = () => {
        if (window.visualViewport) {
          setDynamicHeight({
            height: `${window.visualViewport.height}px`,
            // Quitamos 'top' y 'bottom' fijos calculados, porque usamos 'inset-0' en la clase css
            // y permitimos que el navegador use el comportamiento por defecto de teclado.
          })
        } else {
          setDynamicHeight({
            height: '100dvh', // Usa dvh para soportar las barras de navegación
          })
        }
      }

      updateMobileHeight()
      window.visualViewport?.addEventListener('resize', updateMobileHeight)
      window.visualViewport?.addEventListener('scroll', updateMobileHeight)

      return () => {
        window.visualViewport?.removeEventListener('resize', updateMobileHeight)
        window.visualViewport?.removeEventListener('scroll', updateMobileHeight)
      }
    } else {
      // En desktop, usar altura personalizada o calcular dinámicamente
      // Solo usamos bottom - el widget crece hacia arriba
      const bottomPx = parseFloat(bottom || DEFAULT_BOTTOM) || 24
      // Calcular la altura máxima disponible desde bottom hasta el margen superior
      const maxAvailableHeight = window.innerHeight - DESKTOP_MARGIN_TOP - bottomPx
      
      if (height) {
        // Si hay altura personalizada, usarla pero limitar al máximo disponible
        const heightValue = parseFloat(height) || DESKTOP_MAX_HEIGHT
        const clampedHeight = Math.min(heightValue, maxAvailableHeight)
        
        setDynamicHeight({
          height: `${clampedHeight}px`,
          maxHeight: `${maxAvailableHeight}px`,
          bottom: bottom || DEFAULT_BOTTOM,
        })
      } else {
        // Calcular altura disponible dinámicamente
        const calculatedHeight = Math.min(
          DESKTOP_MAX_HEIGHT,
          Math.max(DESKTOP_MIN_HEIGHT, maxAvailableHeight)
        )

        setDynamicHeight({
          height: `${calculatedHeight}px`,
          maxHeight: `${maxAvailableHeight}px`,
          bottom: bottom || DEFAULT_BOTTOM,
        })
      }
    }
  }, [isMobile, height, bottom])

  useEffect(() => {
    if (!isOpen) return

    const cleanup = calculateHeight()

    window.addEventListener('resize', calculateHeight)

    return () => {
      window.removeEventListener('resize', calculateHeight)
      if (cleanup) cleanup()
    }
  }, [isOpen, calculateHeight])

  return dynamicHeight
}
