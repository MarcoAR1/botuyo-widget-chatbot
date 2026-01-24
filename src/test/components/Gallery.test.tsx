/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Gallery } from '../../chat-widget/components/Gallery'

describe('Gallery', () => {
  const singleImage = [{ src: 'https://example.com/image1.jpg', alt: 'Image 1' }]

  const twoImages = [
    { src: 'https://example.com/image1.jpg', alt: 'Image 1' },
    { src: 'https://example.com/image2.jpg', alt: 'Image 2' },
  ]

  const threeImages = [
    { src: 'https://example.com/image1.jpg', alt: 'Image 1' },
    { src: 'https://example.com/image2.jpg', alt: 'Image 2' },
    { src: 'https://example.com/image3.jpg', alt: 'Image 3' },
  ]

  const manyImages = [
    { src: 'https://example.com/image1.jpg', alt: 'Image 1' },
    { src: 'https://example.com/image2.jpg', alt: 'Image 2' },
    { src: 'https://example.com/image3.jpg', alt: 'Image 3' },
    { src: 'https://example.com/image4.jpg', alt: 'Image 4' },
    { src: 'https://example.com/image5.jpg', alt: 'Image 5' },
  ]

  describe('Single Image Display', () => {
    it('should render single image correctly', () => {
      render(<Gallery images={singleImage} />)

      const image = screen.getByAltText('Image 1')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', singleImage[0].src)
    })

    it('should make single image clickable', () => {
      render(<Gallery images={singleImage} />)

      const image = screen.getByAltText('Image 1')
      expect(image).toHaveClass('cursor-pointer')
    })

    it('should use lazy loading for single image', () => {
      render(<Gallery images={singleImage} />)

      const image = screen.getByAltText('Image 1')
      expect(image).toHaveAttribute('loading', 'lazy')
    })

    it('should have fallback alt text when not provided', () => {
      const imageWithoutAlt = [{ src: 'https://example.com/image.jpg' }]
      render(<Gallery images={imageWithoutAlt} />)

      const image = screen.getByAltText('Imagen')
      expect(image).toBeInTheDocument()
    })
  })

  describe('Grid Display (2-3 images)', () => {
    it('should render 2 images in grid layout', () => {
      render(<Gallery images={twoImages} />)

      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(2)
    })

    it('should render 3 images in grid layout', () => {
      render(<Gallery images={threeImages} />)

      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(3)
    })

    it('should show image counter for grid images', () => {
      render(<Gallery images={twoImages} />)

      expect(screen.getByText('1/2')).toBeInTheDocument()
      expect(screen.getByText('2/2')).toBeInTheDocument()
    })

    it('should apply grid-cols-2 for 2 images', () => {
      const { container } = render(<Gallery images={twoImages} />)

      const grid = container.querySelector('.grid-cols-2')
      expect(grid).toBeInTheDocument()
    })

    it('should apply grid-cols-3 for 3 images', () => {
      const { container } = render(<Gallery images={threeImages} />)

      const grid = container.querySelector('.grid-cols-3')
      expect(grid).toBeInTheDocument()
    })

    it('all images in grid should be clickable', () => {
      render(<Gallery images={twoImages} />)

      const images = screen.getAllByRole('img')
      images.forEach((img) => {
        expect(img).toHaveClass('cursor-pointer')
      })
    })
  })

  describe('Carousel Display (4+ images)', () => {
    it('should render carousel for 4+ images', () => {
      render(<Gallery images={manyImages} />)

      // Debería mostrar imagen principal y thumbnails
      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(1)
    })

    it('should show image counter in carousel', () => {
      render(<Gallery images={manyImages} />)

      // Buscar el contador
      expect(screen.getByText(/1/)).toBeInTheDocument()
      expect(screen.getByText(/5/)).toBeInTheDocument()
    })

    it('should have navigation buttons for carousel', () => {
      render(<Gallery images={manyImages} />)

      const prevButton = screen.getByLabelText('Previous')
      const nextButton = screen.getByLabelText('Next')

      expect(prevButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()
    })

    it('should navigate to next image when next button clicked', async () => {
      render(<Gallery images={manyImages} />)

      const nextButton = screen.getByLabelText('Next')
      await userEvent.click(nextButton)

      // Verificar que navegó (buscar contador actualizado)
      expect(screen.getByText(/2/)).toBeInTheDocument()
    })

    it('should navigate to previous image when prev button clicked', async () => {
      render(<Gallery images={manyImages} />)

      const nextButton = screen.getByLabelText('Next')
      await userEvent.click(nextButton)

      const prevButton = screen.getByLabelText('Previous')
      await userEvent.click(prevButton)

      // Debería volver a 1
      const mainImages = screen.getAllByAltText('Image 1')
      expect(mainImages.length).toBeGreaterThan(0)
    })

    it('should loop from last to first image', async () => {
      render(<Gallery images={manyImages} />)

      const prevButton = screen.getByLabelText('Previous')
      await userEvent.click(prevButton)

      // Debería ir a la imagen 5
      const lastImages = screen.getAllByAltText('Image 5')
      expect(lastImages.length).toBeGreaterThan(0)
    })

    it('should display thumbnails for carousel', () => {
      const { container } = render(<Gallery images={manyImages} />)

      const thumbnailContainer = container.querySelector('.overflow-x-auto')
      expect(thumbnailContainer).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper alt text for all images', () => {
      render(<Gallery images={threeImages} />)

      const images = screen.getAllByRole('img')
      images.forEach((img) => {
        expect(img).toHaveAttribute('alt')
      })
    })

    it('should use lazy loading for all images', () => {
      render(<Gallery images={manyImages} />)

      const images = screen.getAllByRole('img')
      images.forEach((img) => {
        expect(img).toHaveAttribute('loading', 'lazy')
      })
    })

    it('should have keyboard navigable buttons in carousel', () => {
      render(<Gallery images={manyImages} />)

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty images array gracefully', () => {
      const { container } = render(<Gallery images={[]} />)

      expect(container).toBeInTheDocument()
    })

    it('should handle images without alt text', () => {
      const imagesNoAlt = [
        { src: 'https://example.com/img1.jpg' },
        { src: 'https://example.com/img2.jpg' },
      ]

      render(<Gallery images={imagesNoAlt} />)

      const images = screen.getAllByRole('img')
      expect(images.length).toBeGreaterThan(0)
    })

    it('should handle very long image URLs', () => {
      const longUrlImage = [
        {
          src: 'https://example.com/very/long/path/to/image/that/might/cause/issues/image.jpg?param1=value1&param2=value2&param3=value3',
          alt: 'Long URL Image',
        },
      ]

      render(<Gallery images={longUrlImage} />)

      const image = screen.getByAltText('Long URL Image')
      expect(image).toBeInTheDocument()
    })

    it('should maintain aspect ratio for images', () => {
      const { container } = render(<Gallery images={singleImage} />)

      const image = container.querySelector('img')
      expect(image).toHaveClass('object-cover')
    })
  })
})
