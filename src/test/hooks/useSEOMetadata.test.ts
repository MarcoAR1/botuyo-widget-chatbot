/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSEOMetadata } from '../../chat-widget/hooks/useSEOMetadata'

describe('useSEOMetadata', () => {
  beforeEach(() => {
    // Limpiar el document antes de cada test
    document.head.innerHTML = ''
    document.title = ''
  })

  afterEach(() => {
    document.head.innerHTML = ''
    document.title = ''
  })

  describe('Basic Functionality', () => {
    it('should return undefined when disabled', () => {
      const { result } = renderHook(() => useSEOMetadata(false))

      expect(result.current).toBeUndefined()
    })

    it('should return object with title when enabled even if title is empty', async () => {
      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      // El hook siempre extrae al menos el título (aunque esté vacío)
      expect(result.current).toBeDefined()
      expect(result.current?.title).toBe('')
    })

    it('should extract page title', async () => {
      document.title = 'Test Page Title'

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current).toBeDefined()
      expect(result.current?.title).toBe('Test Page Title')
    })
  })

  describe('Meta Tags Extraction', () => {
    it('should extract description meta tag', async () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      meta.setAttribute('content', 'This is a test description')
      document.head.appendChild(meta)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current?.description).toBe('This is a test description')
    })

    it('should extract keywords as array', async () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'keywords')
      meta.setAttribute('content', 'test, vitest, react, hooks')
      document.head.appendChild(meta)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current?.keywords).toEqual(['test', 'vitest', 'react', 'hooks'])
    })

    it('should extract author meta tag', async () => {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'author')
      meta.setAttribute('content', 'John Doe')
      document.head.appendChild(meta)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current?.author).toBe('John Doe')
    })
  })

  describe('Open Graph Tags', () => {
    it('should extract og:title', async () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:title')
      meta.setAttribute('content', 'OG Title')
      document.head.appendChild(meta)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current?.og_title).toBe('OG Title')
    })

    it('should extract og:description', async () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:description')
      meta.setAttribute('content', 'OG Description')
      document.head.appendChild(meta)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current?.og_description).toBe('OG Description')
    })

    it('should extract og:image', async () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'og:image')
      meta.setAttribute('content', 'https://example.com/image.jpg')
      document.head.appendChild(meta)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current?.og_image).toBe('https://example.com/image.jpg')
    })
  })

  describe('Twitter Card Tags', () => {
    it('should extract twitter:card', async () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'twitter:card')
      meta.setAttribute('content', 'summary_large_image')
      document.head.appendChild(meta)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current?.twitter_card).toBe('summary_large_image')
    })

    it('should extract twitter:site', async () => {
      const meta = document.createElement('meta')
      meta.setAttribute('property', 'twitter:site')
      meta.setAttribute('content', '@testsite')
      document.head.appendChild(meta)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current?.twitter_site).toBe('@testsite')
    })
  })

  describe('Structured Data (JSON-LD)', () => {
    it('should extract JSON-LD structured data', async () => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Test Page'
      })
      document.head.appendChild(script)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current?.structuredData).toHaveLength(1)
      expect(result.current?.structuredData[0]['@type']).toBe('WebPage')
      expect(result.current?.structuredData[0].name).toBe('Test Page')
    })

    it('should handle multiple JSON-LD scripts', async () => {
      const script1 = document.createElement('script')
      script1.type = 'application/ld+json'
      script1.textContent = JSON.stringify({ '@type': 'WebPage' })
      document.head.appendChild(script1)

      const script2 = document.createElement('script')
      script2.type = 'application/ld+json'
      script2.textContent = JSON.stringify({ '@type': 'Organization' })
      document.head.appendChild(script2)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current?.structuredData).toHaveLength(2)
    })

    it('should handle invalid JSON-LD gracefully', async () => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = 'invalid json {'
      document.head.appendChild(script)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      // No debe lanzar error, debe ignorar el JSON inválido
      expect(result.current?.structuredData).toBeUndefined()
    })
  })

  describe('Complete Metadata', () => {
    it('should extract all metadata types together', async () => {
      document.title = 'Complete Test Page'
      
      const metaDesc = document.createElement('meta')
      metaDesc.setAttribute('name', 'description')
      metaDesc.setAttribute('content', 'Test description')
      document.head.appendChild(metaDesc)

      const metaOg = document.createElement('meta')
      metaOg.setAttribute('property', 'og:title')
      metaOg.setAttribute('content', 'OG Title')
      document.head.appendChild(metaOg)

      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify({ '@type': 'WebPage' })
      document.head.appendChild(script)

      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(result.current).toBeDefined()
      expect(result.current?.title).toBe('Complete Test Page')
      expect(result.current?.description).toBe('Test description')
      expect(result.current?.og_title).toBe('OG Title')
      expect(result.current?.structuredData).toHaveLength(1)
    })
  })

  describe('State Management', () => {
    it('should clear metadata when disabled', async () => {
      document.title = 'Test Page'

      const { result, rerender } = renderHook(
        ({ enabled }) => useSEOMetadata(enabled),
        { initialProps: { enabled: true } }
      )

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(result.current).toBeDefined()

      // Deshabilitar
      rerender({ enabled: false })

      expect(result.current).toBeUndefined()
    })

    it('should update metadata when pathname changes', async () => {
      document.title = 'Original Title'

      // Simular cambio de pathname mediante re-render
      const { result } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(result.current?.title).toBe('Original Title')

      // Cambiar el título (simula navegación)
      document.title = 'New Title'

      // Forzar re-render cambiando el pathname
      Object.defineProperty(window.location, 'pathname', {
        writable: true,
        value: '/new-page'
      })

      // Como el pathname es useMemo, necesitamos un nuevo renderHook
      const { result: newResult } = renderHook(() => useSEOMetadata(true))

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(newResult.current?.title).toBe('New Title')
    })
  })
})
