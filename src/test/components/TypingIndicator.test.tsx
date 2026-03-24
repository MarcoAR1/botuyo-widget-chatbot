/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { renderWithI18n } from '../utils/i18n-test-utils'
import { TypingIndicator } from '../../chat-widget/components/TypingIndicator'

describe('TypingIndicator', () => {
  describe('Rendering', () => {
    it('should render typing indicator', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      expect(container.firstChild).toBeInTheDocument()
    })

    it('should render three animated dots', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const dots = container.querySelectorAll('.animate-typing-dots')
      expect(dots).toHaveLength(3)
    })

    it('should have proper flex structure', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.style.display).toBe('flex')
      expect(outerDiv.style.alignItems).toBe('center')
    })
  })

  describe('Animation', () => {
    it('should have animate-typing-dots class on dots', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const dots = container.querySelectorAll('.animate-typing-dots')
      dots.forEach(dot => {
        expect(dot.className).toContain('animate-typing-dots')
      })
    })

    it('should have staggered animation delays', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const dots = container.querySelectorAll('.animate-typing-dots')
      expect(dots[0]).toHaveStyle({ animationDelay: '0ms' })
      expect(dots[1]).toHaveStyle({ animationDelay: '200ms' })
      expect(dots[2]).toHaveStyle({ animationDelay: '400ms' })
    })
  })

  describe('Styling', () => {
    it('should have rounded border radius on bubble', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      // The inner bubble div has borderRadius: '18px' inline
      const bubble = (container.firstChild as HTMLElement)?.querySelector('div') as HTMLElement
      expect(bubble.style.borderRadius).toContain('18px')
    })

    it('should have border on bubble', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const bubble = (container.firstChild as HTMLElement)?.querySelector('div') as HTMLElement
      expect(bubble.style.cssText).toContain('border')
    })

    it('should have box shadow on bubble', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const bubble = (container.firstChild as HTMLElement)?.querySelector('div') as HTMLElement
      expect(bubble.style.cssText).toContain('box-shadow')
    })
  })

  describe('Dots Structure', () => {
    it('should render dots as circular spans', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const dots = container.querySelectorAll('.animate-typing-dots')
      dots.forEach(dot => {
        const span = dot as HTMLElement
        expect(span.style.borderRadius).toBe('50%')
        expect(span.style.width).toBe('8px')
        expect(span.style.height).toBe('8px')
      })
    })
  })

  describe('Memoization', () => {
    it('should render consistently', () => {
      const { container: container1 } = renderWithI18n(<TypingIndicator />)
      const { container: container2 } = renderWithI18n(<TypingIndicator />)

      const dots1 = container1.querySelectorAll('.animate-typing-dots')
      const dots2 = container2.querySelectorAll('.animate-typing-dots')

      expect(dots1).toHaveLength(dots2.length)
    })
  })
})
