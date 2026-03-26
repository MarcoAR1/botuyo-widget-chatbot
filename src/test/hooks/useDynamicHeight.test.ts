/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDynamicHeight } from '../../chat-widget/hooks/useDynamicHeight'
import * as useIsMobileModule from '../../chat-widget/hooks/useIsMobile'

describe('useDynamicHeight', () => {
  let useIsMobileSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    useIsMobileSpy = vi.spyOn(useIsMobileModule, 'useIsMobile')
    vi.stubGlobal('innerHeight', 1000)
  })

  afterEach(() => {
    useIsMobileSpy.mockRestore()
    vi.unstubAllGlobals()
  })

  describe('Desktop Mode', () => {
    beforeEach(() => {
      useIsMobileSpy.mockReturnValue(false)
    })

    it('should return correct height for desktop when isOpen is true', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      const { result } = renderHook(() => useDynamicHeight({ isOpen: true }))

      expect(result.current).toMatchObject({
        height: '700px',
        maxHeight: '912px', // 1000 - 64 - 24 (DESKTOP_MARGIN_TOP + DEFAULT_BOTTOM)
        bottom: '24px',
      })
    })

    it('should respect minimum height on small screens', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 400, // Muy pequeño
      })

      const { result } = renderHook(() => useDynamicHeight({ isOpen: true }))

      expect(result.current).toMatchObject({
        height: '500px', // DESKTOP_MIN_HEIGHT
        maxHeight: '312px', // 400 - 64 - 24
      })
    })

    it('should respect maximum height on large screens', () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 2000, // Muy grande
      })

      const { result } = renderHook(() => useDynamicHeight({ isOpen: true }))

      expect(result.current).toMatchObject({
        height: '700px', // DESKTOP_MAX_HEIGHT
        maxHeight: '1912px', // 2000 - 64 - 24
      })
    })

    it('should not calculate height when isOpen is false', () => {
      const { result } = renderHook(() => useDynamicHeight({ isOpen: false }))

      expect(result.current).toEqual({})
    })

    it('should update height on window resize', async () => {
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      const { result, rerender } = renderHook(() => useDynamicHeight({ isOpen: true }))

      expect(result.current.height).toBe('700px')

      // Cambiar el tamaño de la ventana
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 600,
      })
      window.dispatchEvent(new Event('resize'))

      rerender()

      // Altura ajustada: 600 - 64 - 24 (DESKTOP_MARGIN_TOP + DEFAULT_BOTTOM) = 512, clamped to [500, 700] = 512
      expect(result.current.height).toBe('512px')
    })
  })

  describe('Mobile Mode', () => {
    beforeEach(() => {
      useIsMobileSpy.mockReturnValue(true)
    })

    it('should use visualViewport when available', () => {
      const mockVisualViewport = {
        height: 500,
        width: 375,
        offsetTop: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      Object.defineProperty(window, 'visualViewport', {
        writable: true,
        configurable: true,
        value: mockVisualViewport,
      })

      const { result } = renderHook(() => useDynamicHeight({ isOpen: true }))

      // Only height is set — positioning comes from CSS `fixed inset-0`
      expect(result.current).toEqual({
        height: '500px',
      })

      expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
      expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
    })

    it('should use fallback when visualViewport is not available', () => {
      Object.defineProperty(window, 'visualViewport', {
        writable: true,
        configurable: true,
        value: undefined,
      })

      const { result } = renderHook(() => useDynamicHeight({ isOpen: true }))

      // Fallback: only height via dvh
      expect(result.current).toEqual({
        height: '100dvh',
      })
    })

    it('should cleanup visualViewport listeners on unmount', () => {
      const mockVisualViewport = {
        height: 500,
        width: 375,
        offsetTop: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      Object.defineProperty(window, 'visualViewport', {
        writable: true,
        configurable: true,
        value: mockVisualViewport,
      })

      const { unmount } = renderHook(() => useDynamicHeight({ isOpen: true }))

      unmount()

      expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
      expect(mockVisualViewport.removeEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
    })

    it('should register event listeners for keyboard handling', () => {
      const mockVisualViewport = {
        height: 500,
        width: 375,
        offsetTop: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      Object.defineProperty(window, 'visualViewport', {
        writable: true,
        configurable: true,
        value: mockVisualViewport,
      })

      renderHook(() => useDynamicHeight({ isOpen: true }))

      // Verificar que se registraron los listeners para resize y scroll
      expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      )
      expect(mockVisualViewport.addEventListener).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
    })
  })

  describe('Mode Switching', () => {
    it('should update height when switching from mobile to desktop', () => {
      useIsMobileSpy.mockReturnValue(true)

      const mockVisualViewport = {
        height: 500,
        width: 375,
        offsetTop: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }

      Object.defineProperty(window, 'visualViewport', {
        writable: true,
        configurable: true,
        value: mockVisualViewport,
      })

      const { result, rerender } = renderHook(() => useDynamicHeight({ isOpen: true }))

      expect(result.current.height).toBe('500px')
      // width is no longer set by useDynamicHeight on mobile — managed by CSS inset-0
      expect(result.current.width).toBeUndefined()

      // Cambiar a desktop
      useIsMobileSpy.mockReturnValue(false)
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 1000,
      })

      rerender()

      expect(result.current.height).toBe('700px')
      expect(result.current.maxHeight).toBe('912px')
      expect(result.current.width).toBeUndefined()
    })
  })
})
