/**
 * @package @paseolibre/chat-widget
 * Focus management hook for accessible dialogs
 * 
 * Principio: Single Responsibility - solo gestionar el foco del teclado
 */

import { useEffect, useRef } from 'react'

interface UseFocusTrapOptions {
  /** Si el trap está activo */
  enabled: boolean
  /** Elemento al que retornar el foco al desactivar */
  returnFocusRef?: React.RefObject<HTMLElement>
  /** Callback al cerrar con Escape */
  onEscape?: () => void
}

/**
 * Hook para atrapar el foco dentro de un contenedor (dialog, modal)
 * 
 * Características:
 * - Previene que Tab salga del contenedor
 * - Retorna el foco al elemento anterior al cerrar
 * - Cierra con tecla Escape
 * - Compatible con lectores de pantalla
 * 
 * @example
 * const containerRef = useFocusTrap({ 
 *   enabled: isOpen, 
 *   onEscape: handleClose 
 * })
 * 
 * return <div ref={containerRef}>...</div>
 */
export function useFocusTrap({
  enabled,
  returnFocusRef,
  onEscape,
}: UseFocusTrapOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!enabled) return

    // Guardar elemento activo antes de abrir
    previousActiveElementRef.current = document.activeElement as HTMLElement
    
    // Capturar returnFocusRef.current al inicio para evitar stale closure
    const returnTarget = returnFocusRef?.current

    // Enfocar el contenedor al abrir
    const container = containerRef.current
    if (!container) return

    // Pequeño delay para asegurar que el DOM está listo
    const focusTimeout = setTimeout(() => {
      // Buscar primer elemento focusable
      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        container.focus()
      }
    }, 100)

    // Handler para atrapar el foco con Tab
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!container) return

      // Escape para cerrar
      if (e.key === 'Escape') {
        onEscape?.()
        return
      }

      // Tab cycling
      if (e.key === 'Tab') {
        const focusableElements = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        // Shift + Tab en el primero → ir al último
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
        // Tab en el último → ir al primero
        else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(focusTimeout)
      document.removeEventListener('keydown', handleKeyDown)
      
      // Retornar foco al elemento capturado al inicio
      const targetToFocus = returnTarget || previousActiveElementRef.current
      if (targetToFocus && typeof targetToFocus.focus === 'function') {
        targetToFocus.focus()
      }
    }
  }, [enabled, onEscape, returnFocusRef])

  return containerRef
}
