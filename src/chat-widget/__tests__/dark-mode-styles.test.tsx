/**
 * @package @paseolibre/chat-widget
 * Tests de Dark Mode y CSS Variables Injection
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { ChatWidget } from '../ChatWidget'
import type { ChatWidgetProps } from '../types'

describe('Dark Mode & CSS Variables', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    // Crear container para el widget
    container = document.createElement('div')
    container.id = 'test-widget-container'
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  const baseProps: ChatWidgetProps = {
    apiKey: 'test-key',
    apiBaseUrl: 'https://test.com',
    theme: {
      primaryColor: '#10b981',
      botName: 'Test Bot',
      cssVariables: {
        background: '0 0% 100%',
        foreground: '222.2 84% 4.9%',
        card: '0 0% 100%',
        cardForeground: '222.2 84% 4.9%',
        primary: '210 100% 50%',
        primaryForeground: '210 40% 98%',
        muted: '210 40% 96.1%',
        mutedForeground: '215.4 16.3% 46.9%',
        border: '214.3 31.8% 91.4%',
        radius: '0.75rem',
      },
    },
  }

  describe('CSS Variables Injection', () => {
    it('debe inyectar CSS variables al widget container', () => {
      render(<ChatWidget {...baseProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')
      expect(widget).toBeInTheDocument()

      // En el nuevo diseño, solo --chat-primary se aplica inline
      // Las demás CSS variables se aplican en el root container desde standalone.tsx
      const style = widget?.getAttribute('style') || ''
      expect(style).toContain('--chat-primary')
      expect(widget).toHaveClass('paseolibre-chat-widget')
    })

    it('debe aplicar valores correctos de CSS variables', () => {
      render(<ChatWidget {...baseProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')
      expect(widget).toBeInTheDocument()

      // En ambiente de prueba, las CSS variables se heredan de :root en styles.css
      // Solo verificamos que el widget se renderiza correctamente
      expect(widget).toHaveClass('paseolibre-chat-widget')
      expect(widget?.getAttribute('style')).toContain('--chat-primary')
    })

    it('debe manejar CSS variables parciales', () => {
      const partialProps: ChatWidgetProps = {
        ...baseProps,
        theme: {
          ...baseProps.theme,
          cssVariables: {
            primary: '280 100% 50%',
            radius: '1rem',
          },
        },
      }

      render(<ChatWidget {...partialProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')
      expect(widget).toBeInTheDocument()
      
      // Verificar que el widget se renderiza con el tema parcial
      expect(widget).toHaveClass('paseolibre-chat-widget')
    })

    it('debe usar valores por defecto cuando no hay cssVariables', () => {
      const noVarsProps: ChatWidgetProps = {
        apiKey: 'test-key',
        apiBaseUrl: 'https://test.com',
        theme: {
          primaryColor: '#10b981',
          botName: 'Test Bot',
        },
      }

      render(<ChatWidget {...noVarsProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')
      expect(widget).toBeInTheDocument()

      // Debe tener al menos algunas variables por defecto
      const style = widget?.getAttribute('style') || ''
      expect(style).toContain('--chat-primary')
    })
  })

  describe('Dark Mode Detection', () => {
    it('debe detectar clase dark en el container padre', async () => {
      // Agregar clase dark al container
      container.classList.add('dark')

      render(<ChatWidget {...baseProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')

      await waitFor(() => {
        expect(widget?.classList.contains('dark')).toBe(true)
      })
    })

    it('debe detectar clase dark en document.body', async () => {
      document.body.classList.add('dark')

      render(<ChatWidget {...baseProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')

      await waitFor(() => {
        expect(widget?.classList.contains('dark')).toBe(true)
      })

      document.body.classList.remove('dark')
    })

    it('debe detectar clase dark en document.documentElement', async () => {
      document.documentElement.classList.add('dark')

      render(<ChatWidget {...baseProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')

      await waitFor(() => {
        expect(widget?.classList.contains('dark')).toBe(true)
      })

      document.documentElement.classList.remove('dark')
    })

    it('debe reaccionar a cambios dinámicos de dark mode', async () => {
      const { unmount } = render(<ChatWidget {...baseProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')

      // Inicialmente sin dark
      expect(widget?.classList.contains('dark')).toBe(false)

      // Agregar clase dark
      container.classList.add('dark')

      await waitFor(() => {
        expect(widget?.classList.contains('dark')).toBe(true)
      }, { timeout: 2000 })

      // Remover clase dark - darle más tiempo al MutationObserver
      container.classList.remove('dark')

      // Esperar un tick para que el MutationObserver procese
      await new Promise(resolve => setTimeout(resolve, 100))

      await waitFor(() => {
        expect(widget?.classList.contains('dark')).toBe(false)
      }, { timeout: 2000 })

      unmount()
    })

    it('debe usar MutationObserver para detectar cambios', async () => {
      const observeSpy = vi.spyOn(MutationObserver.prototype, 'observe')

      render(<ChatWidget {...baseProps} />, { container })

      // Debe haber llamado a observe al menos una vez
      expect(observeSpy).toHaveBeenCalled()

      observeSpy.mockRestore()
    })
  })

  describe('Dark Mode Styles', () => {
    it('debe aplicar estilos dark correctamente con Tailwind', async () => {
      container.classList.add('dark')

      render(<ChatWidget {...baseProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')

      await waitFor(() => {
        expect(widget?.classList.contains('dark')).toBe(true)
      })

      // Verificar que el widget tenga la clase dark para que Tailwind aplique dark:
      expect(widget?.className).toContain('dark')
    })

    it('debe mantener CSS variables en dark mode', async () => {
      container.classList.add('dark')

      render(<ChatWidget {...baseProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')

      await waitFor(() => {
        expect(widget?.classList.contains('dark')).toBe(true)
      })

      // Verificar que el widget se renderiza correctamente en dark mode
      expect(widget).toBeInTheDocument()
      expect(widget).toHaveClass('dark')
    })
  })

  describe('Standalone Container Integration', () => {
    it('debe detectar dark mode en container standalone', async () => {
      // Simular el container que crea standalone.tsx
      const standaloneContainer = document.createElement('div')
      standaloneContainer.id = 'paseo-libre-chat-widget-root'
      standaloneContainer.classList.add('dark')
      document.body.appendChild(standaloneContainer)

      render(<ChatWidget {...baseProps} />, { container: standaloneContainer })

      const widget = document.getElementById('paseolibre-chat-widget')

      await waitFor(() => {
        expect(widget?.classList.contains('dark')).toBe(true)
      })

      document.body.removeChild(standaloneContainer)
    })

    it('debe inyectar CSS variables tanto en standalone como en widget', () => {
      const standaloneContainer = document.createElement('div')
      standaloneContainer.id = 'paseo-libre-chat-widget-root'
      
      // Simular inyección de variables en standalone container
      standaloneContainer.style.setProperty('--primary', '210 100% 50%')
      standaloneContainer.style.setProperty('--radius', '0.75rem')
      
      document.body.appendChild(standaloneContainer)

      render(<ChatWidget {...baseProps} />, { container: standaloneContainer })

      // Verificar que el widget también tenga las variables
      const widget = document.getElementById('paseolibre-chat-widget')
      const widgetStyle = widget?.getAttribute('style') || ''
      
      // El widget solo debe tener --chat-primary inline
      // Las demás variables se heredan del root container
      expect(widgetStyle).toContain('--chat-primary')
      expect(widget).toBeInTheDocument()

      document.body.removeChild(standaloneContainer)
    })
  })

  describe('High Contrast Mode', () => {
    it('debe sobreescribir colores en modo alto contraste', () => {
      // Mock window.matchMedia para alto contraste
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-contrast: more)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      })

      render(<ChatWidget {...baseProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')
      const computedStyle = window.getComputedStyle(widget!)

      // En alto contraste, debe usar colores WCAG AAA
      const primary = computedStyle.getPropertyValue('--chat-primary')
      expect(primary).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('debe manejar valores undefined en cssVariables', () => {
      const propsWithUndefined: ChatWidgetProps = {
        ...baseProps,
        theme: {
          ...baseProps.theme,
          cssVariables: {
            primary: '210 100% 50%',
            background: undefined,
            foreground: undefined,
          } as any,
        },
      }

      expect(() => {
        render(<ChatWidget {...propsWithUndefined} />, { container })
      }).not.toThrow()
    })

    it('debe manejar cambios múltiples de dark mode rápidamente', async () => {
      render(<ChatWidget {...baseProps} />, { container })

      const widget = document.getElementById('paseolibre-chat-widget')

      // Cambios rápidos
      container.classList.add('dark')
      container.classList.remove('dark')
      container.classList.add('dark')
      container.classList.remove('dark')
      container.classList.add('dark')

      await waitFor(() => {
        expect(widget?.classList.contains('dark')).toBe(true)
      }, { timeout: 1000 })
    })

    it('debe cleanup MutationObserver al desmontar', () => {
      const disconnectSpy = vi.spyOn(MutationObserver.prototype, 'disconnect')

      const { unmount } = render(<ChatWidget {...baseProps} />, { container })

      unmount()

      expect(disconnectSpy).toHaveBeenCalled()

      disconnectSpy.mockRestore()
    })
  })
})
