/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHighContrast } from '../../chat-widget/hooks/useHighContrast'

describe('useHighContrast', () => {
  let matchMediaMock: any

  beforeEach(() => {
    // Reset matchMedia mock
    matchMediaMock = {
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }

    window.matchMedia = vi.fn().mockImplementation((query) => {
      matchMediaMock.media = query
      return matchMediaMock
    })
  })

  it('should return false when no high contrast preference', () => {
    const { result } = renderHook(() => useHighContrast())
    expect(result.current).toBe(false)
  })

  it('should return true when prefers-contrast: high', () => {
    matchMediaMock.matches = true
    window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock)

    const { result } = renderHook(() => useHighContrast())
    expect(result.current).toBe(true)
  })

  it('should register event listener for media query changes', () => {
    renderHook(() => useHighContrast())

    // Should register listener for 'prefers-contrast: high'
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)')
    expect(matchMediaMock.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )
  })

  it('should cleanup event listeners on unmount', () => {
    const { unmount } = renderHook(() => useHighContrast())

    unmount()

    expect(matchMediaMock.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    )
  })

  it('should update when contrast preference changes', () => {
    const { result, rerender } = renderHook(() => useHighContrast())

    expect(result.current).toBe(false)

    // Simulate preference change
    matchMediaMock.matches = true
    
    // Trigger the change event
    const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1]
    changeHandler({ matches: true })

    rerender()

    expect(result.current).toBe(true)
  })
})
