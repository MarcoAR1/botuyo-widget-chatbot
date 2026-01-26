/**
 * @package @botuyo/chat-widget
 * Hook para detectar y soportar modo de alto contraste (WCAG AAA)
 */

import { useState, useEffect } from 'react'

export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-contrast: high)').matches || 
           window.matchMedia('(prefers-contrast: more)').matches
  })

  useEffect(() => {
    const queryHigh = window.matchMedia('(prefers-contrast: high)')
    const queryMore = window.matchMedia('(prefers-contrast: more)')

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }

    // Escuchar ambas queries para máxima compatibilidad
    queryHigh.addEventListener('change', handleChange)
    queryMore.addEventListener('change', handleChange)

    return () => {
      queryHigh.removeEventListener('change', handleChange)
      queryMore.removeEventListener('change', handleChange)
    }
  }, [])

  return isHighContrast
}
