/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRateLimit } from '../../chat-widget/hooks/useRateLimit'

describe('useRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should allow messages within rate limit', () => {
    const { result } = renderHook(() => useRateLimit(3, 60000))

    // Primera 3 mensajes deberían estar permitidos
    expect(result.current.isAllowed()).toBe(true)
    expect(result.current.isAllowed()).toBe(true)
    expect(result.current.isAllowed()).toBe(true)
  })

  it('should block messages after exceeding rate limit', () => {
    const { result } = renderHook(() => useRateLimit(3, 60000))

    // Enviar 3 mensajes
    act(() => {
      result.current.isAllowed()
      result.current.isAllowed()
      result.current.isAllowed()
    })

    // El cuarto debería ser bloqueado
    expect(result.current.isAllowed()).toBe(false)
  })

  it('should return correct remaining attempts', () => {
    const { result } = renderHook(() => useRateLimit(5, 60000))

    expect(result.current.getRemainingAttempts()).toBe(5)

    act(() => {
      result.current.isAllowed()
      result.current.isAllowed()
    })

    expect(result.current.getRemainingAttempts()).toBe(3)
  })

  it('should reset after time window expires', () => {
    const { result } = renderHook(() => useRateLimit(2, 1000)) // 2 mensajes por 1 segundo

    // Consumir límite
    act(() => {
      result.current.isAllowed()
      result.current.isAllowed()
    })

    expect(result.current.isAllowed()).toBe(false)

    // Avanzar tiempo 1.1 segundos
    act(() => {
      vi.advanceTimersByTime(1100)
    })

    // Ahora debería permitir de nuevo
    expect(result.current.isAllowed()).toBe(true)
  })

  it('should calculate correct time until reset', () => {
    const { result } = renderHook(() => useRateLimit(1, 60000))

    act(() => {
      result.current.isAllowed()
    })

    const timeUntilReset = result.current.getTimeUntilReset()
    expect(timeUntilReset).toBeGreaterThan(59000)
    expect(timeUntilReset).toBeLessThanOrEqual(60000)
  })

  it('should allow manual reset', () => {
    const { result } = renderHook(() => useRateLimit(2, 60000))

    // Consumir límite
    act(() => {
      result.current.isAllowed()
      result.current.isAllowed()
    })

    expect(result.current.isAllowed()).toBe(false)

    // Reset manual
    act(() => {
      result.current.reset()
    })

    // Ahora debería permitir de nuevo
    expect(result.current.isAllowed()).toBe(true)
  })

  it('should handle sliding window correctly', () => {
    const { result } = renderHook(() => useRateLimit(3, 2000)) // 3 mensajes por 2 segundos

    // Enviar 2 mensajes en t=0
    act(() => {
      result.current.isAllowed()
      result.current.isAllowed()
    })

    // Avanzar 1 segundo
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Enviar 1 mensaje en t=1000
    expect(result.current.isAllowed()).toBe(true)

    // Ahora debería estar bloqueado (3 mensajes en ventana de 2s)
    expect(result.current.isAllowed()).toBe(false)

    // Avanzar otro segundo (t=2000, el primer mensaje ya expiró)
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Ahora debería permitir 1 mensaje (solo 2 en ventana)
    expect(result.current.isAllowed()).toBe(true)
  })
})
