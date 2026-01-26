import { useState, useEffect } from 'react'
import { throttle } from '../utils/performance'

export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(() => {
    // Cálculo inicial solo si estamos en browser
    if (typeof window === 'undefined') return false
    return window.innerWidth < breakpoint
  })

  useEffect(() => {
    // Throttle: max 1 check cada 250ms para evitar re-renders excesivos
    const checkMobile = throttle(() => {
      setIsMobile(window.innerWidth < breakpoint)
    }, 250)

    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}
