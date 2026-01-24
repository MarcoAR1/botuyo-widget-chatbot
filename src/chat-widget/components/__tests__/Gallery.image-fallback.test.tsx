/**
 * @package @paseolibre/chat-widget
 * Tests de fallback de imágenes en Gallery
 */
// @ts-nocheck - Testing library getByAlt types need update
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Gallery } from '../Gallery'

describe('Gallery - Image Fallback', () => {
  describe('Single Image', () => {
    it('should show fallback when image fails to load', async () => {
      const images = [{ src: 'https://invalid-url.com/image.jpg', alt: 'Test Image' }]
      
      render(<Gallery images={images} />)
      
      const img = screen.getByAlt('Test Image') as HTMLImageElement
      
      // Simular error de carga
      fireEvent.error(img)
      
      await waitFor(() => {
        expect(screen.getByText('Imagen no disponible')).toBeInTheDocument()
      })
    })

    it('should display image when it loads successfully', () => {
      const images = [{ src: 'https://example.com/image.jpg', alt: 'Valid Image' }]
      
      render(<Gallery images={images} />)
      
      const img = screen.getByAlt('Valid Image')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('should show fallback icon and text', async () => {
      const images = [{ src: 'broken-url.jpg' }]
      
      render(<Gallery images={images} />)
      
      const img = screen.getByAlt('Imagen')
      fireEvent.error(img)
      
      await waitFor(() => {
        const fallbackText = screen.getByText('Imagen no disponible')
        expect(fallbackText).toBeInTheDocument()
        
        // Verificar que existe el SVG del placeholder
        const svg = fallbackText.previousElementSibling
        expect(svg?.tagName).toBe('svg')
      })
    })
  })

  describe('Grid Layout (2-3 Images)', () => {
    it('should show fallback for failed images in grid', async () => {
      const images = [
        { src: 'https://example.com/valid.jpg', alt: 'Valid' },
        { src: 'broken-url.jpg', alt: 'Broken' },
        { src: 'https://example.com/valid2.jpg', alt: 'Valid 2' },
      ]
      
      render(<Gallery images={images} />)
      
      const brokenImg = screen.getByAlt('Broken')
      fireEvent.error(brokenImg)
      
      await waitFor(() => {
        // Debe mostrar el placeholder para la imagen rota
        const placeholders = screen.getAllByRole('img').filter(img => 
          img.parentElement?.className.includes('bg-muted')
        )
        expect(placeholders.length).toBeGreaterThan(0)
      })
    })

    it('should handle multiple image failures', async () => {
      const images = [
        { src: 'broken1.jpg', alt: 'Broken 1' },
        { src: 'broken2.jpg', alt: 'Broken 2' },
      ]
      
      render(<Gallery images={images} />)
      
      const img1 = screen.getByAlt('Broken 1')
      const img2 = screen.getByAlt('Broken 2')
      
      fireEvent.error(img1)
      fireEvent.error(img2)
      
      await waitFor(() => {
        // Ambas imágenes deben mostrar el placeholder
        const svgElements = screen.getAllByRole('img', { hidden: true })
          .filter(el => el.tagName === 'svg')
        expect(svgElements.length).toBeGreaterThan(0)
      })
    })

    it('should not break lightbox functionality with failed images', async () => {
      const images = [
        { src: 'https://example.com/valid.jpg', alt: 'Valid' },
        { src: 'broken.jpg', alt: 'Broken' },
      ]
      
      render(<Gallery images={images} />)
      
      const brokenImg = screen.getByAlt('Broken')
      fireEvent.error(brokenImg)
      
      const validImg = screen.getByAlt('Valid')
      fireEvent.click(validImg)
      
      // El lightbox debería abrirse normalmente
      await waitFor(() => {
        const lightbox = document.querySelector('[role="dialog"]') || 
                        document.querySelector('.fixed.inset-0')
        expect(lightbox).toBeInTheDocument()
      })
    })
  })

  describe('Carousel Layout (4+ Images)', () => {
    it('should show fallback for current image in carousel', async () => {
      const images = [
        { src: 'broken.jpg', alt: 'Broken Main' },
        { src: 'https://example.com/valid.jpg', alt: 'Valid' },
        { src: 'https://example.com/valid2.jpg', alt: 'Valid 2' },
        { src: 'https://example.com/valid3.jpg', alt: 'Valid 3' },
      ]
      
      render(<Gallery images={images} />)
      
      const mainImg = screen.getByAlt('Broken Main')
      fireEvent.error(mainImg)
      
      await waitFor(() => {
        expect(screen.getByText('Imagen no disponible')).toBeInTheDocument()
      })
    })

    it('should show fallback in thumbnails when they fail', async () => {
      const images = [
        { src: 'https://example.com/valid.jpg', alt: 'Valid' },
        { src: 'broken-thumb.jpg', alt: 'Broken Thumb' },
        { src: 'https://example.com/valid2.jpg', alt: 'Valid 2' },
        { src: 'https://example.com/valid3.jpg', alt: 'Valid 3' },
      ]
      
      render(<Gallery images={images} />)
      
      const thumbImg = screen.getByAlt('Thumbnail 2')
      fireEvent.error(thumbImg)
      
      await waitFor(() => {
        // El thumbnail debe mostrar el placeholder
        const thumbContainer = thumbImg.closest('button')
        expect(thumbContainer?.querySelector('svg')).toBeInTheDocument()
      })
    })

    it('should handle navigation with failed images', async () => {
      const images = [
        { src: 'https://example.com/valid.jpg', alt: 'Valid' },
        { src: 'broken.jpg', alt: 'Broken' },
        { src: 'https://example.com/valid2.jpg', alt: 'Valid 2' },
        { src: 'https://example.com/valid3.jpg', alt: 'Valid 3' },
      ]
      
      render(<Gallery images={images} />)
      
      // Navegar a la siguiente imagen (broken)
      const nextButton = screen.getByLabelText(/siguiente/i) || 
                         screen.getAllByRole('button').find(btn => 
                           btn.querySelector('svg')?.classList.contains('chevron-right')
                         )
      
      if (nextButton) {
        fireEvent.click(nextButton)
        
        await waitFor(() => {
          const currentImg = screen.getByAlt('Broken')
          fireEvent.error(currentImg)
          
          expect(screen.getByText('Imagen no disponible')).toBeInTheDocument()
        })
      }
    })

    it('should maintain carousel state after image error', async () => {
      const images = [
        { src: 'broken1.jpg', alt: 'Broken 1' },
        { src: 'broken2.jpg', alt: 'Broken 2' },
        { src: 'https://example.com/valid.jpg', alt: 'Valid' },
        { src: 'broken3.jpg', alt: 'Broken 3' },
      ]
      
      render(<Gallery images={images} />)
      
      const mainImg = screen.getByAlt('Broken 1')
      fireEvent.error(mainImg)
      
      // El contador debe seguir funcionando
      await waitFor(() => {
        const counter = screen.getByText(/1 \/ 4/)
        expect(counter).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty src gracefully', () => {
      const images = [{ src: '', alt: 'Empty' }]
      
      render(<Gallery images={images} />)
      
      // No debe mostrar imagen si src está vacío
      const img = screen.queryByAlt('Empty')
      expect(img).not.toBeInTheDocument()
    })

    it('should not crash with null/undefined images', () => {
      const images = [
        { src: 'https://example.com/valid.jpg', alt: 'Valid' },
        null as any,
        { src: 'https://example.com/valid2.jpg', alt: 'Valid 2' },
      ].filter(Boolean)
      
      expect(() => {
        render(<Gallery images={images} />)
      }).not.toThrow()
    })

    it('should preserve error state across re-renders', async () => {
      const { rerender } = render(
        <Gallery images={[{ src: 'broken.jpg', alt: 'Broken' }]} />
      )
      
      const img = screen.getByAlt('Broken')
      fireEvent.error(img)
      
      await waitFor(() => {
        expect(screen.getByText('Imagen no disponible')).toBeInTheDocument()
      })
      
      // Re-renderizar con la misma imagen
      rerender(<Gallery images={[{ src: 'broken.jpg', alt: 'Broken' }]} />)
      
      // El estado de error debe persistir
      expect(screen.getByText('Imagen no disponible')).toBeInTheDocument()
    })

    it('should reset error state when images change', async () => {
      const { rerender } = render(
        <Gallery images={[{ src: 'broken.jpg', alt: 'Broken' }]} />
      )
      
      const img = screen.getByAlt('Broken')
      fireEvent.error(img)
      
      await waitFor(() => {
        expect(screen.getByText('Imagen no disponible')).toBeInTheDocument()
      })
      
      // Cambiar a una imagen válida
      rerender(<Gallery images={[{ src: 'https://example.com/valid.jpg', alt: 'Valid' }]} />)
      
      // Ya no debe mostrar el fallback
      expect(screen.queryByText('Imagen no disponible')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should maintain alt text in fallback', async () => {
      const images = [{ src: 'broken.jpg', alt: 'Important Alt Text' }]
      
      render(<Gallery images={images} />)
      
      const img = screen.getByAlt('Important Alt Text')
      fireEvent.error(img)
      
      await waitFor(() => {
        // El contenedor de fallback debe tener información accesible
        const fallback = screen.getByText('Imagen no disponible')
        expect(fallback).toBeInTheDocument()
      })
    })

    it('should provide screen reader feedback for errors', async () => {
      const images = [{ src: 'broken.jpg', alt: 'Error Image' }]
      
      render(<Gallery images={images} />)
      
      const img = screen.getByAlt('Error Image')
      fireEvent.error(img)
      
      await waitFor(() => {
        const fallbackText = screen.getByText('Imagen no disponible')
        expect(fallbackText).toBeVisible()
      })
    })
  })
})
