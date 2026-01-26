import { useEffect, useState } from 'react'

/**
 * Hook para detectar y sincronizar el dark mode del widget con el container padre
 * Observa cambios en las clases 'dark' de los ancestros y aplica/remueve la clase al widget
 */
export function useDarkMode(containerRef: React.RefObject<HTMLDivElement>) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const detectDarkMode = () => {
      if (!containerRef.current) return
      
      // Buscar dark en los PADRES, NO en el widget mismo
      // Empezamos desde el parent para evitar detectar la clase que nosotros mismos agregamos
      const hasClosestDark = !!containerRef.current.parentElement?.closest('.dark')
      const hasRootDark = !!document.getElementById('botuyo-chat-widget-root')?.classList.contains('dark')
      const hasDocElementDark = document.documentElement.classList.contains('dark')
      const hasBodyDark = document.body.classList.contains('dark')
      
      // Detectar prefers-color-scheme: dark
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      const isDark = hasClosestDark || hasRootDark || hasDocElementDark || hasBodyDark || prefersDark
      
      // Aplicar directamente al DOM (más confiable que React state)
      if (containerRef.current) {
        if (isDark) {
          containerRef.current.classList.add('dark')
        } else {
          containerRef.current.classList.remove('dark')
        }
      }
      
      // También actualizar state para otros componentes
      setIsDarkMode(isDark)
    }

    // Ejecutar detectDarkMode cada vez que algo cambie
    detectDarkMode()
    
    // Listener para cambios en prefers-color-scheme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => detectDarkMode()
    mediaQuery.addEventListener('change', handleMediaChange)

    // Observer global para detectar cambios en cualquier parte del DOM
    const observer = new MutationObserver(() => {
      detectDarkMode()
    })
    
    // Observar el root standalone container si existe
    const rootContainer = document.getElementById('botuyo-chat-widget-root')
    if (rootContainer) {
      observer.observe(rootContainer, {
        attributes: true,
        attributeFilter: ['class']
      })
    }
    
    // Observar document.documentElement y body
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    // Observar todos los contenedores padre
    let parent = containerRef.current?.parentElement
    while (parent) {
      observer.observe(parent, {
        attributes: true,
        attributeFilter: ['class']
      })
      parent = parent.parentElement
    }

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [containerRef])

  return isDarkMode
}
