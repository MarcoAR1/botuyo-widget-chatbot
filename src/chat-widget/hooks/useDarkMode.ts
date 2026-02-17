import { useEffect, useState } from 'react'

/**
 * Hook para detectar y sincronizar el dark mode del widget con el container padre
 * Observa cambios en las clases 'dark' de los ancestros y aplica/remueve la clase al widget
 */
export function useDarkMode(containerRef: React.RefObject<HTMLDivElement>) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    let lastParent: Element | null = null

    const detectDarkMode = () => {
      if (!containerRef.current) return

      // Buscar dark en los PADRES, NO en el widget mismo
      const hasClosestDark = !!containerRef.current.parentElement?.closest('.dark')
      const hasRootDark = !!document
        .getElementById('botuyo-chat-widget-root')
        ?.classList.contains('dark')

      // También buscar dark en CUALQUIER ANCESTOR del widget-root (para casos donde se mueve el widget)
      const widgetRoot = document.getElementById('botuyo-chat-widget-root')
      const hasRootParentDark = !!widgetRoot?.parentElement?.closest('.dark')

      const hasDocElementDark = document.documentElement.classList.contains('dark')
      const hasBodyDark = document.body.classList.contains('dark')

      // Detectar data-theme="dark" (usado por el dashboard de botuyo-landing)
      const hasDataThemeDark = document.documentElement.getAttribute('data-theme') === 'dark'
      const hasBodyDataThemeDark = document.body.getAttribute('data-theme') === 'dark'
      const hasClosestDataThemeDark = !!containerRef.current.parentElement?.closest('[data-theme="dark"]')

      // Detectar prefers-color-scheme: dark
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      const isDark =
        hasClosestDark ||
        hasRootDark ||
        hasRootParentDark ||
        hasDocElementDark ||
        hasBodyDark ||
        hasDataThemeDark ||
        hasBodyDataThemeDark ||
        hasClosestDataThemeDark ||
        prefersDark

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

    // Observer para detectar cambios de clase
    const observer = new MutationObserver(() => {
      detectDarkMode()
    })

    // Observar el root standalone container si existe
    const rootContainer = document.getElementById('botuyo-chat-widget-root')
    if (rootContainer) {
      observer.observe(rootContainer, {
        attributes: true,
        attributeFilter: ['class'],
      })

      // Observar el parent del root container también
      if (rootContainer.parentElement) {
        observer.observe(rootContainer.parentElement, {
          attributes: true,
          attributeFilter: ['class'],
          childList: true, // Para detectar cuando el widget se mueve
        })
        lastParent = rootContainer.parentElement
      }
    }

    // Observar document.documentElement y body (class + data-theme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    })

    // Observar todos los contenedores padre actuales
    let parent = containerRef.current?.parentElement
    while (parent) {
      observer.observe(parent, {
        attributes: true,
        attributeFilter: ['class', 'data-theme'],
      })
      parent = parent.parentElement
    }

    // Polling ligero para detectar cuando el widget-root cambia de parent
    // Esto es necesario porque MutationObserver no puede seguir un elemento cuando se mueve
    const pollInterval = setInterval(() => {
      const widgetRoot = document.getElementById('botuyo-chat-widget-root')
      if (widgetRoot && widgetRoot.parentElement !== lastParent) {
        // El widget se movió a un nuevo parent
        if (lastParent && widgetRoot.parentElement) {
          // Observar el nuevo parent
          observer.observe(widgetRoot.parentElement, {
            attributes: true,
            attributeFilter: ['class'],
            childList: true,
          })
          lastParent = widgetRoot.parentElement
        }
        detectDarkMode()
      }
    }, 100) // Check cada 100ms - más frecuente para detectar movimientos rápidos

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleMediaChange)
      clearInterval(pollInterval)
    }
  }, [containerRef])

  return isDarkMode
}
