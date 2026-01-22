'use client'

import { useState, useEffect, useCallback } from 'react'
import { useIsMobile } from './useIsMobile'

interface DynamicHeightOptions {
  isOpen: boolean
  headerHeight?: number
  marginTop?: number
}

const DESKTOP_MAX_HEIGHT = 700
const DESKTOP_MIN_HEIGHT = 500
const DESKTOP_MARGIN_TOP = 64 // 4rem

export function useDynamicHeight({ isOpen }: DynamicHeightOptions) {
  const isMobile = useIsMobile()
  const [dynamicHeight, setDynamicHeight] = useState<React.CSSProperties>({})

  const calculateHeight = useCallback(() => {
    if (isMobile) {
      // En móvil, usamos el visual viewport para ajustarnos al teclado
      const updateMobileHeight = () => {
        if (window.visualViewport) {
          setDynamicHeight({
            height: `${window.visualViewport.height}px`,
            width: '100%',
            top: `${window.visualViewport.offsetTop}px`,
            left: '0px',
            bottom: 'auto',
            right: 'auto',
            transform: 'none',
          })
        } else {
          // Fallback para navegadores sin visualViewport
          setDynamicHeight({
            height: '100dvh',
            width: '100%',
            top: '0px',
            left: '0px',
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
      // En desktop, calculamos la altura disponible
      const availableHeight = window.innerHeight - DESKTOP_MARGIN_TOP
      const height = Math.min(DESKTOP_MAX_HEIGHT, Math.max(DESKTOP_MIN_HEIGHT, availableHeight))
      
      setDynamicHeight({
        height: `${height}px`,
        maxHeight: `${availableHeight}px`,
      })
    }
  }, [isMobile])

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
