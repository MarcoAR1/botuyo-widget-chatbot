import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Función para chequear el tamaño
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Chequear al montar
    checkMobile()

    // Escuchar cambios de tamaño
    window.addEventListener('resize', checkMobile)

    // Limpiar listener
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}