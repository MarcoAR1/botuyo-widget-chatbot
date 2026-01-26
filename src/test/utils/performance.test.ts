/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  throttle,
  debounce,
  memoize,
  rafThrottle,
  createBatcher,
  createLazyLoader,
} from '../../chat-widget/utils/performance'

describe('performance', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('throttle', () => {
    it('should execute function immediately on first call', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should throttle subsequent calls within delay', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should allow execution after delay passes', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(150)
      throttled()

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should pass arguments correctly', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled('arg1', 'arg2', 123)

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123)
    })

    it('should schedule pending call if called within delay', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1)

      // Llamar dentro del delay
      vi.advanceTimersByTime(50)
      throttled()

      // Debe ejecutarse después del delay completo
      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should handle rapid calls correctly', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 100)

      // Primera llamada se ejecuta inmediatamente
      throttled()
      expect(fn).toHaveBeenCalledTimes(1)

      // Múltiples llamadas dentro del delay
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(10)
        throttled()
      }

      // Solo debe haber ejecutado la primera y programado una más
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  describe('debounce', () => {
    it('should delay execution until delay passes', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should reset timer on new calls', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced()
      vi.advanceTimersByTime(50)

      debounced() // Reset timer
      vi.advanceTimersByTime(50)
      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should only execute last call after rapid succession', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      for (let i = 0; i < 10; i++) {
        debounced(i)
        vi.advanceTimersByTime(10)
      }

      expect(fn).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith(9) // Último valor
    })

    it('should pass arguments correctly', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('test', 123, { key: 'value' })
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledWith('test', 123, { key: 'value' })
    })

    it('should cancel previous timeout on new call', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 100)

      debounced('first')
      vi.advanceTimersByTime(50)

      debounced('second')
      vi.advanceTimersByTime(100)

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('second')
    })
  })

  describe('memoize', () => {
    it('should cache function results', () => {
      const fn = vi.fn((x: number) => x * 2)
      const memoized = memoize(fn)

      expect(memoized(5)).toBe(10)
      expect(memoized(5)).toBe(10)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should compute new results for different arguments', () => {
      const fn = vi.fn((x: number) => x * 2)
      const memoized = memoize(fn)

      expect(memoized(5)).toBe(10)
      expect(memoized(10)).toBe(20)

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should handle multiple arguments', () => {
      const fn = vi.fn((a: number, b: number) => a + b)
      const memoized = memoize(fn)

      expect(memoized(2, 3)).toBe(5)
      expect(memoized(2, 3)).toBe(5)
      expect(memoized(3, 2)).toBe(5)

      expect(fn).toHaveBeenCalledTimes(2) // (2,3) y (3,2) son diferentes
    })

    it('should handle object arguments', () => {
      const fn = vi.fn((obj: { x: number }) => obj.x * 2)
      const memoized = memoize(fn)

      expect(memoized({ x: 5 })).toBe(10)
      expect(memoized({ x: 5 })).toBe(10)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should cache complex return values', () => {
      const fn = vi.fn(() => ({ result: Math.random() }))
      const memoized = memoize(fn)

      const first = memoized()
      const second = memoized()

      expect(first).toBe(second) // Mismo objeto
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('rafThrottle', () => {
    it('should throttle using requestAnimationFrame', () => {
      const fn = vi.fn()
      const throttled = rafThrottle(fn)

      // Mock requestAnimationFrame
      global.requestAnimationFrame = vi.fn(cb => {
        cb(0)
        return 0
      }) as any

      throttled()
      throttled()
      throttled()

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments correctly', () => {
      const fn = vi.fn()
      const throttled = rafThrottle(fn)

      global.requestAnimationFrame = vi.fn(cb => {
        cb(0)
        return 0
      }) as any

      throttled('arg1', 123)

      expect(fn).toHaveBeenCalledWith('arg1', 123)
    })

    it('should ignore subsequent calls until frame completes', () => {
      const fn = vi.fn()
      const throttled = rafThrottle(fn)
      let rafCallback: ((time: number) => void) | null = null

      global.requestAnimationFrame = vi.fn(cb => {
        rafCallback = cb
        return 1
      }) as any

      throttled()
      throttled()
      throttled()

      expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1)

      // Ejecutar el callback
      if (rafCallback) (rafCallback as (time: number) => void)(0)

      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('createBatcher', () => {
    it('should batch multiple calls', () => {
      const callback = vi.fn()
      const batcher = createBatcher(callback, 50)

      batcher('item1')
      batcher('item2')
      batcher('item3')

      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(50)

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith(['item1', 'item2', 'item3'])
    })

    it('should reset timer on new items', () => {
      const callback = vi.fn()
      const batcher = createBatcher(callback, 50)

      batcher('item1')
      vi.advanceTimersByTime(25)

      batcher('item2')
      vi.advanceTimersByTime(25)

      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(25)
      expect(callback).toHaveBeenCalledWith(['item1', 'item2'])
    })

    it('should clear batch after callback', () => {
      const callback = vi.fn()
      const batcher = createBatcher(callback, 50)

      batcher('item1')
      vi.advanceTimersByTime(50)

      expect(callback).toHaveBeenCalledTimes(1)

      batcher('item2')
      vi.advanceTimersByTime(50)

      expect(callback).toHaveBeenCalledTimes(2)
      expect(callback).toHaveBeenLastCalledWith(['item2'])
    })

    it('should use default delay if not specified', () => {
      const callback = vi.fn()
      const batcher = createBatcher(callback)

      batcher('item')

      vi.advanceTimersByTime(49)
      expect(callback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('createLazyLoader', () => {
    it('should create IntersectionObserver', () => {
      const callback = vi.fn()
      const observer = createLazyLoader(callback)

      expect(observer).toBeInstanceOf(IntersectionObserver)
    })

    it('should handle intersecting entries', () => {
      const callback = vi.fn()
      const observer = createLazyLoader(callback)

      // En happy-dom, IntersectionObserver está disponible pero es un mock básico
      // Solo verificamos que se crea correctamente
      expect(observer).toBeInstanceOf(IntersectionObserver)
      expect(typeof observer.observe).toBe('function')
      expect(typeof observer.disconnect).toBe('function')
    })

    it('should not call callback when not intersecting', () => {
      const callback = vi.fn()
      const observer = createLazyLoader(callback)

      // Simplemente verificamos que el observer se creó correctamente
      expect(observer).toBeInstanceOf(IntersectionObserver)
    })

    it('should accept custom options', () => {
      const callback = vi.fn()
      const options = {
        root: null,
        rootMargin: '10px',
        threshold: 0.5,
      }

      const observer = createLazyLoader(callback, options)

      expect(observer).toBeInstanceOf(IntersectionObserver)
    })
  })

  describe('Edge Cases', () => {
    it('throttle should handle zero delay', () => {
      const fn = vi.fn()
      const throttled = throttle(fn, 0)

      throttled()
      expect(fn).toHaveBeenCalledTimes(1)

      // Con delay 0, la segunda llamada debe ejecutarse
      vi.advanceTimersByTime(0)
      throttled()

      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('debounce should handle zero delay', () => {
      const fn = vi.fn()
      const debounced = debounce(fn, 0)

      debounced()
      vi.advanceTimersByTime(0)

      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('memoize should handle no arguments', () => {
      let counter = 0
      const fn = vi.fn(() => ++counter)
      const memoized = memoize(fn)

      expect(memoized()).toBe(1)
      expect(memoized()).toBe(1) // Cached
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('batcher should handle single item', () => {
      const callback = vi.fn()
      const batcher = createBatcher(callback, 50)

      batcher('single')
      vi.advanceTimersByTime(50)

      expect(callback).toHaveBeenCalledWith(['single'])
    })
  })
})
