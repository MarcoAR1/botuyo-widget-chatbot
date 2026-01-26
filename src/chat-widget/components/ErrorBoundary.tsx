import React, { Component, ReactNode } from 'react'
import { logger } from '../utils/logger'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * 🛡️ ERROR BOUNDARY
 *
 * Componente que captura errores de React en sus hijos y muestra un UI de fallback.
 * Previene que un error en un componente rompa toda la aplicación.
 *
 * @example
 * ```tsx
 * <ErrorBoundary fallback={<div>Algo salió mal</div>}>
 *   <MiComponente />
 * </ErrorBoundary>
 * ```
 *
 * Principios SOLID aplicados:
 * - Single Responsibility: Solo maneja captura de errores
 * - Open/Closed: Extensible mediante props fallback y onError
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-background text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Algo salió mal</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {this.state.error?.message || 'Ocurrió un error inesperado'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Intentar de nuevo
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
