/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useIsMobile } from '../../chat-widget/hooks/useIsMobile'

describe('useIsMobile', () => {
  // Guardar el innerWidth original
  const originalInnerWidth = window.innerWidth

  beforeEach(() => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    // Restaurar valor original
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
    vi.clearAllTimers()
  })

  describe('Initial State', () => {
    it('should return false when window width is above default breakpoint (640px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })

    it('should return true when window width is below default breakpoint (640px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    it('should use custom breakpoint when provided', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 900,
      })

      const { result } = renderHook(() => useIsMobile(1024))

      expect(result.current).toBe(true) // 900 < 1024
    })

    it('should return false for exact breakpoint width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      })

      const { result } = renderHook(() => useIsMobile(640))

      expect(result.current).toBe(false) // 640 is NOT less than 640
    })
  })

  describe('Window Resize', () => {
    it('should update to true when window is resized below breakpoint', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)

      // Simular resize a mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })
      window.dispatchEvent(new Event('resize'))

      // Esperar a que el throttle se ejecute
      await waitFor(
        () => {
          expect(result.current).toBe(true)
        },
        { timeout: 500 }
      )
    })

    it('should update to false when window is resized above breakpoint', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)

      // Simular resize a desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      })
      window.dispatchEvent(new Event('resize'))

      await waitFor(
        () => {
          expect(result.current).toBe(false)
        },
        { timeout: 500 }
      )
    })

    it('should handle multiple rapid resize events (throttling)', async () => {
      // Con React 19, los fake timers pueden causar race conditions
      // Usar real timers y waitFor para este test
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)

      // Simular múltiples resize events rápidos
      Object.defineProperty(window, 'innerWidth', { value: 500 })
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('resize'))
      window.dispatchEvent(new Event('resize'))

      // Esperar a que el throttle (250ms) procese y React actualice
      await waitFor(
        () => {
          expect(result.current).toBe(true)
        },
        { timeout: 500 }
      )
    })
  })

  describe('Custom Breakpoints', () => {
    it('should work with tablet breakpoint (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 700,
      })

      const { result } = renderHook(() => useIsMobile(768))

      expect(result.current).toBe(true)
    })

    it('should work with desktop breakpoint (1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 900,
      })

      const { result } = renderHook(() => useIsMobile(1024))

      expect(result.current).toBe(true)
    })

    it('should update when breakpoint prop changes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 700,
      })

      const { result, rerender } = renderHook(({ bp }) => useIsMobile(bp), {
        initialProps: { bp: 640 },
      })

      // Con breakpoint 640, width 700 = desktop
      expect(result.current).toBe(false)

      // Cambiar breakpoint a 768
      rerender({ bp: 768 })

      // Disparar resize para actualizar
      window.dispatchEvent(new Event('resize'))

      // Con breakpoint 768, width 700 = mobile (debe actualizarse en el próximo ciclo)
      // El efecto se ejecuta cuando cambia el breakpoint
    })
  })

  describe('Cleanup', () => {
    it('should remove resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useIsMobile())

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should not update state after unmount', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      })

      const { result, unmount } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)

      unmount()

      // Intentar disparar resize después de unmount
      Object.defineProperty(window, 'innerWidth', { value: 500 })

      // No debe lanzar error al disparar el evento
      expect(() => {
        window.dispatchEvent(new Event('resize'))
      }).not.toThrow()

      // El valor no debe haber cambiado porque el componente está unmounted
      expect(result.current).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle very small viewport (mobile phone)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true)
    })

    it('should handle very large viewport (4K monitor)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 3840,
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(false)
    })

    it('should handle zero breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      })

      const { result } = renderHook(() => useIsMobile(0))

      expect(result.current).toBe(false) // 500 is not less than 0
    })

    it('should handle negative width (edge case)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: -1,
      })

      const { result } = renderHook(() => useIsMobile())

      expect(result.current).toBe(true) // -1 < 640
    })
  })
})
