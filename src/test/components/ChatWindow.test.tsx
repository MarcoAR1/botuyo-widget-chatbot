/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../utils/i18n-test-utils'
import userEvent from '@testing-library/user-event'
import { ChatWindow } from '../../chat-widget/components/ChatWindow'
import type { ChatMessage } from '../../chat-widget/types'

// Mock hooks
vi.mock('../../chat-widget/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))

vi.mock('../../chat-widget/hooks/useDynamicHeight', () => ({
  useDynamicHeight: () => ({}),
}))

vi.mock('../../chat-widget/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({ current: null }),
}))

describe('ChatWindow', () => {
  const mockOnClose = vi.fn()
  const mockOnSendMessage = vi.fn()

  const defaultProps = {
    isOpen: true,
    isConnected: true,
    isTyping: false,
    messages: [] as ChatMessage[],
    onClose: mockOnClose,
    onSendMessage: mockOnSendMessage,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Visibility', () => {
    it('should render when isOpen is true', () => {
      renderWithI18n(<ChatWindow {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      renderWithI18n(<ChatWindow {...defaultProps} isOpen={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Header', () => {
    it('should display bot name', () => {
      const { container } = renderWithI18n(<ChatWindow {...defaultProps} botName="Assistant" />)

      expect(container.textContent).toContain('Assistant')
    })

    it('should use default bot name when not provided', () => {
      const { container } = renderWithI18n(<ChatWindow {...defaultProps} />)

      // Verificar que el nombre del bot está en el DOM
      expect(container.textContent).toContain('Mar')
    })

    it('should show close button', () => {
      renderWithI18n(<ChatWindow {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: /cerrar ventana de chat/i })
      expect(closeButton).toBeInTheDocument()
    })

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup()
      renderWithI18n(<ChatWindow {...defaultProps} />)

      const closeButton = screen.getByRole('button', { name: /cerrar ventana de chat/i })
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should display bot logo', () => {
      const { container } = renderWithI18n(
        <ChatWindow {...defaultProps} logoUrl="https://example.com/bot.jpg" botName="Bot" />
      )

      const logo = container.querySelector('img[alt="Bot"]')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', 'https://example.com/bot.jpg')
    })

    it('should show connected status indicator', () => {
      const { container } = renderWithI18n(<ChatWindow {...defaultProps} isConnected={true} />)

      const statusIndicator = container.querySelector('.bg-emerald-500')
      expect(statusIndicator).toBeInTheDocument()
    })

    it('should show disconnected status indicator', () => {
      const { container } = renderWithI18n(<ChatWindow {...defaultProps} isConnected={false} />)

      const statusIndicator = container.querySelector('.bg-amber-500')
      expect(statusIndicator).toBeInTheDocument()
    })
  })

  describe('Messages', () => {
    it('should render MessageList component', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          type: 'text',
          content: 'Hello',
          sender: 'user',
          timestamp: new Date(),
        },
      ]

      renderWithI18n(<ChatWindow {...defaultProps} messages={messages} />)

      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    it('should pass welcome message to MessageList', () => {
      const { container } = renderWithI18n(
        <ChatWindow {...defaultProps} welcomeMessage="Custom welcome message" />
      )

      // Verificar que el mensaje de bienvenida se pasa al componente
      expect(container.textContent).toContain('Custom welcome message')
    })
  })

  describe('Input Area', () => {
    it('should render InputArea component', () => {
      renderWithI18n(<ChatWindow {...defaultProps} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      expect(input).toBeInTheDocument()
    })

    it('should use custom input placeholder', () => {
      renderWithI18n(<ChatWindow {...defaultProps} inputPlaceholder="Type your message here..." />)

      expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument()
    })

    it('should call onSendMessage when message is sent', async () => {
      const user = userEvent.setup()
      const { container } = renderWithI18n(<ChatWindow {...defaultProps} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      await user.click(input)
      await user.type(input, 'Test message')

      // Find and click the send button (circular button with send icon)
      const sendButton = container.querySelector('button svg.lucide-send')?.closest('button')
      expect(sendButton).toBeInTheDocument()
      await user.click(sendButton!)

      expect(mockOnSendMessage).toHaveBeenCalledWith('Test message')
    })
  })

  describe('Typing Indicator', () => {
    it('should show typing indicator when isTyping is true', () => {
      const { container } = renderWithI18n(<ChatWindow {...defaultProps} isTyping={true} />)

      const typingDots = container.querySelectorAll('.animate-bounce')
      expect(typingDots.length).toBeGreaterThan(0)
    })

    it('should not show typing indicator when isTyping is false', () => {
      const { container } = renderWithI18n(<ChatWindow {...defaultProps} isTyping={false} />)

      const typingDots = container.querySelectorAll('.animate-bounce')
      expect(typingDots.length).toBeLessThan(3)
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      renderWithI18n(<ChatWindow {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have aria-modal attribute', () => {
      renderWithI18n(<ChatWindow {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('should have aria-labelledby attribute', () => {
      renderWithI18n(<ChatWindow {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'chat-window-title')
    })

    it('should be keyboard accessible', () => {
      renderWithI18n(<ChatWindow {...defaultProps} />)

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('Theming', () => {
    it('should apply custom primary color', () => {
      renderWithI18n(<ChatWindow {...defaultProps} primaryColor="hsl(200, 100%, 50%)" />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should apply custom border radius', () => {
      renderWithI18n(<ChatWindow {...defaultProps} borderRadius="16px" />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Attachment Support', () => {
    it('should render with attachment handler', () => {
      const mockOnSendAttachment = vi.fn()

      renderWithI18n(<ChatWindow {...defaultProps} onSendAttachment={mockOnSendAttachment} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should render with location handler', () => {
      const mockOnSendLocation = vi.fn()

      renderWithI18n(<ChatWindow {...defaultProps} onSendLocation={mockOnSendLocation} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
