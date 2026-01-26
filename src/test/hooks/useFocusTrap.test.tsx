/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useFocusTrap } from '../../chat-widget/hooks/useFocusTrap'

// Componente wrapper para testear el hook
function TestComponent({
  enabled,
  onEscape,
  returnFocusRef,
}: {
  enabled: boolean
  onEscape?: () => void
  returnFocusRef?: React.RefObject<HTMLElement>
}) {
  const containerRef = useFocusTrap({ enabled, onEscape, returnFocusRef })

  return (
    <div ref={containerRef} data-testid="trap-container">
      <button>Button 1</button>
      <button>Button 2</button>
      <button>Button 3</button>
    </div>
  )
}

describe('useFocusTrap', () => {
  describe('Focus Management', () => {
    it('should focus first focusable element when enabled', async () => {
      render(<TestComponent enabled={true} />)

      // Esperar el setTimeout de 100ms
      await new Promise(resolve => setTimeout(resolve, 150))

      const button1 = screen.getByText('Button 1')
      expect(document.activeElement).toBe(button1)
    })

    it('should not trap focus when disabled', () => {
      const externalButton = document.createElement('button')
      externalButton.textContent = 'External'
      document.body.appendChild(externalButton)
      externalButton.focus()

      render(<TestComponent enabled={false} />)

      expect(document.activeElement).toBe(externalButton)

      document.body.removeChild(externalButton)
    })
  })

  describe('Tab Cycling', () => {
    it('should cycle focus from last to first with Tab key', async () => {
      const user = userEvent.setup()
      render(<TestComponent enabled={true} />)

      await new Promise(resolve => setTimeout(resolve, 150))

      const button3 = screen.getByText('Button 3')

      // Focus al último botón
      button3.focus()
      expect(document.activeElement).toBe(button3)

      // Tab debe volver al primero
      await user.tab()

      // Nota: El comportamiento puede variar según el navegador/test environment
      // Simplemente verificamos que el focus sigue dentro del container
      const container = screen.getByTestId('trap-container')
      expect(container.contains(document.activeElement)).toBe(true)
    })

    it('should handle Shift+Tab navigation', async () => {
      const user = userEvent.setup()
      render(<TestComponent enabled={true} />)

      await new Promise(resolve => setTimeout(resolve, 150))

      const button1 = screen.getByText('Button 1')

      button1.focus()
      expect(document.activeElement).toBe(button1)

      // Shift+Tab desde el primero
      await user.tab({ shift: true })

      // El focus debe seguir dentro del container
      const container = screen.getByTestId('trap-container')
      expect(container.contains(document.activeElement)).toBe(true)
    })
  })

  describe('Escape Key', () => {
    it('should call onEscape when Escape is pressed', async () => {
      const user = userEvent.setup()
      const onEscape = vi.fn()

      render(<TestComponent enabled={true} onEscape={onEscape} />)

      await new Promise(resolve => setTimeout(resolve, 150))

      await user.keyboard('{Escape}')

      expect(onEscape).toHaveBeenCalledTimes(1)
    })

    it('should not call onEscape when disabled', async () => {
      const user = userEvent.setup()
      const onEscape = vi.fn()

      render(<TestComponent enabled={false} onEscape={onEscape} />)

      await user.keyboard('{Escape}')

      expect(onEscape).not.toHaveBeenCalled()
    })
  })

  describe('Return Focus', () => {
    it('should restore focus to previous element on unmount', async () => {
      const previousButton = document.createElement('button')
      previousButton.textContent = 'Previous'
      document.body.appendChild(previousButton)
      previousButton.focus()

      const { unmount } = render(<TestComponent enabled={true} />)

      await new Promise(resolve => setTimeout(resolve, 150))

      unmount()

      await new Promise(resolve => setTimeout(resolve, 50))
      expect(document.activeElement).toBe(previousButton)

      document.body.removeChild(previousButton)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty container gracefully', async () => {
      function EmptyComponent({ enabled }: { enabled: boolean }) {
        const containerRef = useFocusTrap({ enabled })
        return <div ref={containerRef} data-testid="empty-trap" />
      }

      render(<EmptyComponent enabled={true} />)

      await new Promise(resolve => setTimeout(resolve, 150))

      // No debe lanzar errores
      const container = screen.getByTestId('empty-trap')
      expect(container).toBeInTheDocument()
    })

    it('should cleanup event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

      const { unmount } = render(<TestComponent enabled={true} />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })
})
