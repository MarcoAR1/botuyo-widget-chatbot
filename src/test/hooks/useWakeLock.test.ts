/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWakeLock } from '../../chat-widget/hooks/useWakeLock'

type FakeSentinel = {
  released: boolean
  release: ReturnType<typeof vi.fn>
  addEventListener: ReturnType<typeof vi.fn>
  removeEventListener: ReturnType<typeof vi.fn>
  fireRelease: () => void
}

function makeSentinel(): FakeSentinel {
  const releaseListeners: Array<() => void> = []
  const s: FakeSentinel = {
    released: false,
    release: vi.fn(() => {
      s.released = true
      return Promise.resolve()
    }),
    addEventListener: vi.fn((type: string, cb: () => void) => {
      if (type === 'release') releaseListeners.push(cb)
    }),
    removeEventListener: vi.fn(),
    fireRelease: () => {
      s.released = true
      releaseListeners.forEach(cb => cb())
    },
  }
  return s
}

describe('useWakeLock', () => {
  let requestMock: ReturnType<typeof vi.fn>
  let sentinels: FakeSentinel[]

  const setVisibility = (state: 'visible' | 'hidden') => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => state,
    })
  }

  beforeEach(() => {
    sentinels = []
    requestMock = vi.fn(() => {
      const s = makeSentinel()
      sentinels.push(s)
      return Promise.resolve(s)
    })
    ;(navigator as unknown as { wakeLock?: unknown }).wakeLock = { request: requestMock }
    setVisibility('visible')
  })

  afterEach(() => {
    delete (navigator as unknown as { wakeLock?: unknown }).wakeLock
    vi.restoreAllMocks()
  })

  it('requests a screen wake lock when active', async () => {
    await act(async () => {
      renderHook(() => useWakeLock(true))
    })
    expect(requestMock).toHaveBeenCalledWith('screen')
    expect(sentinels).toHaveLength(1)
  })

  it('does not request when inactive', async () => {
    await act(async () => {
      renderHook(() => useWakeLock(false))
    })
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('releases the lock when active turns false', async () => {
    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    })
    await act(async () => {})
    expect(sentinels).toHaveLength(1)

    await act(async () => {
      rerender({ active: false })
    })
    expect(sentinels[0].release).toHaveBeenCalled()
  })

  it('releases the lock on unmount', async () => {
    const { unmount } = renderHook(() => useWakeLock(true))
    await act(async () => {})
    expect(sentinels).toHaveLength(1)

    await act(async () => {
      unmount()
    })
    expect(sentinels[0].release).toHaveBeenCalled()
  })

  it('re-acquires the lock when the page becomes visible again', async () => {
    renderHook(() => useWakeLock(true))
    await act(async () => {})
    expect(requestMock).toHaveBeenCalledTimes(1)

    // System auto-released the lock (e.g. tab hidden / screen blanked)
    act(() => {
      sentinels[0].fireRelease()
    })

    // Page becomes visible again → must re-acquire
    await act(async () => {
      setVisibility('visible')
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(requestMock).toHaveBeenCalledTimes(2)
  })

  it('does not throw when the Wake Lock API is unsupported', async () => {
    delete (navigator as unknown as { wakeLock?: unknown }).wakeLock
    await act(async () => {
      renderHook(() => useWakeLock(true))
    })
    expect(requestMock).not.toHaveBeenCalled()
  })

  it('does not throw when the request is rejected', async () => {
    requestMock.mockRejectedValueOnce(new Error('NotAllowedError'))
    await act(async () => {
      renderHook(() => useWakeLock(true))
    })
    expect(requestMock).toHaveBeenCalled()
  })
})
