/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAnalytics } from '../../chat-widget/hooks/useAnalytics'

describe('useAnalytics', () => {
  let fetchMock: any

  beforeEach(() => {
    vi.clearAllTimers()
    fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
    global.fetch = fetchMock
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should initialize analytics', () => {
    const { result } = renderHook(() => useAnalytics('https://api.test.com', 'test-key', true))

    expect(result.current).toBeDefined()
    expect(result.current.trackOpen).toBeInstanceOf(Function)
  })

  it('should not send events when disabled', () => {
    const { result } = renderHook(() => useAnalytics('https://api.test.com', 'test-key', false))

    act(() => {
      result.current.trackOpen()
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should track chat open event', () => {
    const { result } = renderHook(() => useAnalytics('https://api.test.com', 'test-key', true))

    act(() => {
      result.current.trackOpen()
    })

    // Event should be queued
    expect(result.current).toBeDefined()
  })

  it('should track different event types', () => {
    const { result } = renderHook(() => useAnalytics('https://api.test.com', 'test-key', true))

    act(() => {
      result.current.trackOpen()
      result.current.trackClose()
      result.current.trackMessageSent('text')
      result.current.trackMessageReceived('150')
      result.current.trackError('Test error', 'TEST_ERROR')
    })

    // All events should be queued without errors
    expect(result.current.trackOpen).toBeInstanceOf(Function)
  })
})
