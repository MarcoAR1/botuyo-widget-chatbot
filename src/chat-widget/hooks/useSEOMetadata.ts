/**
 * Hook interno del widget para capturar metadata SEO del DOM
 */

'use client'

import { useState, useEffect, useMemo } from 'react'

/**
 * Extrae metadata SEO del DOM
 */
function extractSEOMetadata() {
  if (typeof window === 'undefined') return {}

  const metadata: Record<string, any> = {}

  // Título de la página
  metadata.title = document.title

  // Meta tags importantes
  const metaTags = document.querySelectorAll('meta')
  
  metaTags.forEach((tag) => {
    const name = tag.getAttribute('name')
    const property = tag.getAttribute('property')
    const content = tag.getAttribute('content')

    if (content) {
      // Meta name (description, keywords, author, etc.)
      if (name) {
        switch (name) {
          case 'description':
            metadata.description = content
            break
          case 'keywords':
            metadata.keywords = content.split(',').map(k => k.trim())
            break
          case 'author':
            metadata.author = content
            break
        }
      }

      // Open Graph (og:title, og:description, og:image, etc.)
      if (property) {
        if (property.startsWith('og:')) {
          const key = property.replace('og:', 'og_')
          metadata[key] = content
        }
        
        // Twitter Card
        if (property.startsWith('twitter:')) {
          const key = property.replace('twitter:', 'twitter_')
          metadata[key] = content
        }
      }
    }
  })

  // Intentar extraer JSON-LD (structured data)
  try {
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
    if (jsonLdScripts.length > 0) {
      const structuredData: any[] = []
      jsonLdScripts.forEach((script) => {
        try {
          const data = JSON.parse(script.textContent || '')
          structuredData.push(data)
        } catch {
          // Ignorar errores de parsing
        }
      })
      if (structuredData.length > 0) {
        metadata.structuredData = structuredData
      }
    }
  } catch {
    // Ignorar errores
  }

  return metadata
}

/**
 * Hook para capturar metadata SEO
 * @param enabled - Si está habilitado
 * @param pathname - Pathname actual para detectar cambios de página
 */
export function useSEOMetadata(enabled: boolean = false) {
  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const pathname = useMemo<string>(() => currentPathname, [currentPathname])
  const [seoMetadata, setSeoMetadata] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!enabled) {
      setSeoMetadata({})
      return
    }

    // Esperar un tick para asegurar que el DOM esté actualizado
    const timeoutId = setTimeout(() => {
      const metadata = extractSEOMetadata()
      setSeoMetadata(metadata)
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [pathname, enabled])


  return enabled && Object.keys(seoMetadata).length > 0 ? seoMetadata : undefined
}
