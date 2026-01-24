/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '../../chat-widget/components/ErrorBoundary'

// Mock logger
vi.mock('../../chat-widget/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

// Componente que lanza error intencionalmente
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>Child component</div>
}

// Componente que lanza error de tipo específico
const ThrowCustomError = ({ message }: { message: string }) => {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  // Suprimir console.error en tests para evitar ruido
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalError
  })

  describe('Normal Rendering', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('should render multiple children without errors', () => {
      render(
        <ErrorBoundary>
          <div>First child</div>
          <div>Second child</div>
          <div>Third child</div>
        </ErrorBoundary>
      )

      expect(screen.getByText('First child')).toBeInTheDocument()
      expect(screen.getByText('Second child')).toBeInTheDocument()
      expect(screen.getByText('Third child')).toBeInTheDocument()
    })
  })

  describe('Error Catching', () => {
    it('should catch errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should display error icon when error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('⚠️')).toBeInTheDocument()
    })

    it('should display error message in fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowCustomError message="Custom error text" />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error text')).toBeInTheDocument()
    })

    it('should show default message when error has no message', () => {
      const ThrowNoMessage = () => {
        const err = new Error()
        err.message = ''
        throw err
      }

      render(
        <ErrorBoundary>
          <ThrowNoMessage />
        </ErrorBoundary>
      )

      expect(screen.getByText('Ocurrió un error inesperado')).toBeInTheDocument()
    })
  })

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error UI</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
      expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument()
    })

    it('should render custom fallback with action button', () => {
      const customFallback = (
        <div>
          <p>Error occurred</p>
          <button>Custom action</button>
        </div>
      )

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Error occurred')).toBeInTheDocument()
      expect(screen.getByText('Custom action')).toBeInTheDocument()
    })
  })

  describe('Error Callback', () => {
    it('should call onError callback when error occurs', () => {
      const onErrorMock = vi.fn()

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(onErrorMock).toHaveBeenCalled()
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })

    it('should pass correct error to onError callback', () => {
      const onErrorMock = vi.fn()

      render(
        <ErrorBoundary onError={onErrorMock}>
          <ThrowCustomError message="Specific error" />
        </ErrorBoundary>
      )

      expect(onErrorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Specific error',
        }),
        expect.any(Object)
      )
    })
  })

  describe('Reset Functionality', () => {
    it('should show reset button in default fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByRole('button', { name: /intentar de nuevo/i })).toBeInTheDocument()
    })

    it('should reset error state when reset button clicked', async () => {
      const user = userEvent.setup()
      
      // Componente que puede cambiar su comportamiento
      let shouldThrow = true
      const DynamicComponent = () => {
        if (shouldThrow) {
          throw new Error('Test error')
        }
        return <div>Child component</div>
      }

      render(
        <ErrorBoundary>
          <DynamicComponent />
        </ErrorBoundary>
      )

      // Error debe estar visible
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument()

      // Cambiar el estado para que no lance error en el próximo render
      shouldThrow = false

      // Click en reset - esto reseteará el estado interno del ErrorBoundary
      const resetButton = screen.getByRole('button', { name: /intentar de nuevo/i })
      await user.click(resetButton)

      // El error boundary intenta re-renderizar los children
      // Como ahora shouldThrow es false, debería renderizar correctamente
      expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const heading = screen.getByRole('heading', { name: /algo salió mal/i })
      expect(heading).toBeInTheDocument()
    })

    it('should have focusable reset button', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const resetButton = screen.getByRole('button', { name: /intentar de nuevo/i })
      expect(resetButton).toBeInTheDocument()
      expect(resetButton.tagName).toBe('BUTTON')
    })
  })

  describe('Edge Cases', () => {
    it('should handle nested error boundaries', () => {
      const outerFallback = <div>Outer error</div>
      const innerFallback = <div>Inner error</div>

      render(
        <ErrorBoundary fallback={outerFallback}>
          <div>Outer content</div>
          <ErrorBoundary fallback={innerFallback}>
            <ThrowError shouldThrow={true} />
          </ErrorBoundary>
        </ErrorBoundary>
      )

      // Solo el error boundary interno debe capturar el error
      expect(screen.getByText('Inner error')).toBeInTheDocument()
      expect(screen.queryByText('Outer error')).not.toBeInTheDocument()
      expect(screen.getByText('Outer content')).toBeInTheDocument()
    })

    it('should not catch errors from outside its tree', () => {
      render(
        <div>
          <ErrorBoundary>
            <div>Safe content</div>
          </ErrorBoundary>
          <div>Other content</div>
        </div>
      )

      expect(screen.getByText('Safe content')).toBeInTheDocument()
      expect(screen.getByText('Other content')).toBeInTheDocument()
    })
  })
})
