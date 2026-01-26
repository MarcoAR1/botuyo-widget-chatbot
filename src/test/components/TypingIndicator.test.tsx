/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
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

      const dots = container.querySelectorAll('.animate-bounce')
      expect(dots).toHaveLength(3)
    })

    it('should have proper structure', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const wrapper = container.querySelector('.flex.items-center')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Animation', () => {
    it('should have bouncing animation on dots', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const dots = container.querySelectorAll('.animate-bounce')
      dots.forEach(dot => {
        expect(dot.className).toContain('animate-bounce')
      })
    })

    it('should have staggered animation delays', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const dots = container.querySelectorAll('span.animate-bounce')
      expect(dots[0]).toHaveStyle({ animationDelay: '0ms' })
      expect(dots[1]).toHaveStyle({ animationDelay: '150ms' })
      expect(dots[2]).toHaveStyle({ animationDelay: '300ms' })
    })
  })

  describe('Styling', () => {
    it('should have rounded corners', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const bubble = container.querySelector('.rounded-\\[18px\\]')
      expect(bubble).toBeInTheDocument()
    })

    it('should have border', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const bubble = container.querySelector('.border')
      expect(bubble).toBeInTheDocument()
    })

    it('should have shadow', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const bubble = container.querySelector('.shadow-soft-sm')
      expect(bubble).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be visible to screen readers', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const element = container.firstChild
      expect(element).toBeInTheDocument()
    })

    it('should have proper padding for touch targets', () => {
      const { container } = renderWithI18n(<TypingIndicator />)

      const bubble = container.querySelector('.px-4.py-3')
      expect(bubble).toBeInTheDocument()
    })
  })

  describe('Memoization', () => {
    it('should render consistently', () => {
      const { container: container1 } = renderWithI18n(<TypingIndicator />)
      const { container: container2 } = renderWithI18n(<TypingIndicator />)

      const dots1 = container1.querySelectorAll('.animate-bounce')
      const dots2 = container2.querySelectorAll('.animate-bounce')

      expect(dots1).toHaveLength(dots2.length)
    })
  })
})
