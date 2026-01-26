/**
 * @package @botuyo/chat-widget
 * Performance utilities - throttle, debounce, lazy loading
 * 
 * Principio: Single Responsibility - solo optimizaciones de rendimiento
 */

/**
 * Throttle: limita la ejecución a una vez por intervalo
 * Útil para eventos frecuentes como scroll, resize, typing
 * 
 * @example
 * const handleScroll = throttle(() => console.log('scroll'), 250)
 * window.addEventListener('scroll', handleScroll)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null

  return function throttled(...args: Parameters<T>) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    const execute = () => {
      lastCall = now
      func(...args)
    }

    if (timeSinceLastCall >= delay) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      execute()
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        execute()
        timeoutId = null
      }, delay - timeSinceLastCall)
    }
  }
}

/**
 * Debounce: retrasa la ejecución hasta que pasen N ms sin nuevas llamadas
 * Útil para input search, auto-save, validación
 * 
 * @example
 * const handleSearch = debounce((query) => fetchResults(query), 300)
 * input.addEventListener('input', (e) => handleSearch(e.target.value))
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Memoización simple para cálculos costosos
 * 
 * @example
 * const expensiveCalc = memoize((n: number) => fibonacci(n))
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)
    
    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = func(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * RequestAnimationFrame throttle para animaciones suaves
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null

  return function throttled(...args: Parameters<T>) {
    if (rafId !== null) return

    rafId = requestAnimationFrame(() => {
      func(...args)
      rafId = null
    })
  }
}

/**
 * Batch de operaciones para reducir re-renders
 * Acumula llamadas y ejecuta todas juntas
 * 
 * @example
 * const batchedUpdate = createBatcher((items) => {
 *   setState(prev => [...prev, ...items])
 * }, 50)
 */
export function createBatcher<T>(
  callback: (items: T[]) => void,
  delay: number = 50
): (item: T) => void {
  let batch: T[] = []
  let timeoutId: NodeJS.Timeout | null = null

  return function addToBatch(item: T) {
    batch.push(item)

    if (timeoutId) clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      callback([...batch])
      batch = []
      timeoutId = null
    }, delay)
  }
}

/**
 * Intersection Observer para lazy loading
 */
export function createLazyLoader(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry)
      }
    })
  }, options)
}
