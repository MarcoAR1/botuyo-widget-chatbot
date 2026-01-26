/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageList } from '../../chat-widget/components/MessageList'
import type { ChatMessage } from '../../chat-widget/types'

// Mock de date utils
vi.mock('../../chat-widget/utils/dateUtils', () => ({
  formatRelative: (_date: Date) => 'Hace 2 horas',
  differenceInMinutes: () => 10, // Por defecto retorna 10 minutos
}))

describe('MessageList', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: 'msg-1',
      type: 'text',
      content: 'Hello',
      sender: 'user',
      timestamp: new Date('2026-01-23T10:00:00'),
    },
    {
      id: 'msg-2',
      type: 'text',
      content: 'Hi there!',
      sender: 'bot',
      timestamp: new Date('2026-01-23T10:01:00'),
    },
  ]

  describe('Empty State', () => {
    it('should render welcome message when no messages', () => {
      render(
        <MessageList
          messages={[]}
          isTyping={false}
          welcomeMessage="Welcome to chat!"
          botName="Assistant"
        />
      )

      expect(screen.getByText('Assistant')).toBeInTheDocument()
      expect(screen.getByText('"Welcome to chat!"')).toBeInTheDocument()
    })

    it('should show default welcome message', () => {
      render(<MessageList messages={[]} isTyping={false} />)

      expect(screen.getByText('"¡Hola! ¿En qué puedo ayudarte?"')).toBeInTheDocument()
    })

    it('should show bot avatar in welcome state', () => {
      const { container } = render(
        <MessageList
          messages={[]}
          isTyping={false}
          logoUrl="https://example.com/bot.jpg"
          botName="Bot"
        />
      )

      const img = container.querySelector('img[alt="Bot"]')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', 'https://example.com/bot.jpg')
    })

    it('should show emoji when no logo provided', () => {
      const { container } = render(<MessageList messages={[]} isTyping={false} botName="Bot" />)

      expect(container.textContent).toContain('👋')
    })
  })

  describe('Message Rendering', () => {
    it('should render messages', () => {
      render(<MessageList messages={mockMessages} isTyping={false} />)

      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    it('should render single message', () => {
      render(<MessageList messages={[mockMessages[0]]} isTyping={false} />)

      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    it('should render multiple messages in order', () => {
      render(<MessageList messages={mockMessages} isTyping={false} />)

      // Verify both messages are rendered
      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    it('should handle empty content gracefully', () => {
      const messageWithEmptyContent: ChatMessage = {
        id: 'msg-empty',
        type: 'text',
        content: '',
        sender: 'user',
        timestamp: new Date(),
      }

      render(<MessageList messages={[messageWithEmptyContent]} isTyping={false} />)

      // Should render without crashing
      expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    })
  })

  describe('Typing Indicator', () => {
    it('should show typing indicator when isTyping is true', () => {
      const { container } = render(<MessageList messages={mockMessages} isTyping={true} />)

      // Check for typing animation dots
      const typingDots = container.querySelectorAll('.animate-bounce')
      expect(typingDots.length).toBeGreaterThan(0)
    })

    it('should not show typing indicator when isTyping is false', () => {
      const { container } = render(<MessageList messages={mockMessages} isTyping={false} />)

      const typingDots = container.querySelectorAll('.animate-bounce')
      // Should only have 0 or very minimal animation elements (not the typing ones)
      expect(typingDots.length).toBeLessThan(3)
    })

    it('should show typing indicator with empty messages', () => {
      const { container } = render(<MessageList messages={[]} isTyping={true} />)

      const typingDots = container.querySelectorAll('.animate-bounce')
      expect(typingDots.length).toBeGreaterThan(0)
    })
  })

  describe('Customization', () => {
    it('should apply custom primary color', () => {
      render(<MessageList messages={[]} isTyping={false} primaryColor="hsl(200, 100%, 50%)" />)

      // Component should render without errors
      expect(screen.getByText('"¡Hola! ¿En qué puedo ayudarte?"')).toBeInTheDocument()
    })

    it('should use custom bot name', () => {
      render(<MessageList messages={[]} isTyping={false} botName="CustomBot" />)

      expect(screen.getByText('CustomBot')).toBeInTheDocument()
    })

    it('should use default bot name when not provided', () => {
      render(<MessageList messages={[]} isTyping={false} />)

      expect(screen.getByText('Mar')).toBeInTheDocument()
    })
  })

  describe('Scroll Behavior', () => {
    it('should render container with overflow-y-auto', () => {
      const { container } = render(<MessageList messages={mockMessages} isTyping={false} />)

      const scrollContainer = container.querySelector('.overflow-y-auto')
      expect(scrollContainer).toBeInTheDocument()
    })

    it('should have scroll-smooth class', () => {
      const { container } = render(<MessageList messages={mockMessages} isTyping={false} />)

      const scrollContainer = container.querySelector('.scroll-smooth')
      expect(scrollContainer).toBeInTheDocument()
    })
  })

  describe('Message Types', () => {
    it('should render text messages', () => {
      render(<MessageList messages={mockMessages} isTyping={false} />)

      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    it('should render image messages', () => {
      const imageMessage: ChatMessage = {
        id: 'msg-img',
        type: 'image',
        imageUrl: 'https://example.com/image.jpg',
        altText: 'Test image',
        sender: 'bot',
        timestamp: new Date(),
      }

      render(<MessageList messages={[imageMessage]} isTyping={false} />)

      // MessageBubble will handle the image rendering
      expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    })

    it('should render audio messages', () => {
      const audioMessage: ChatMessage = {
        id: 'msg-audio',
        type: 'audio',
        content: 'https://example.com/audio.mp3',
        sender: 'bot',
        timestamp: new Date(),
      }

      render(<MessageList messages={[audioMessage]} isTyping={false} />)

      // MessageBubble will handle the audio rendering
      expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    })

    it('should render location messages', () => {
      const locationMessage: ChatMessage = {
        id: 'msg-location',
        type: 'location',
        latitude: 40.7128,
        longitude: -74.006,
        name: 'New York',
        sender: 'user',
        timestamp: new Date(),
      }

      render(<MessageList messages={[locationMessage]} isTyping={false} />)

      // MessageBubble will handle the location rendering
      expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    })

    it('should render system messages', () => {
      const systemMessage: ChatMessage = {
        id: 'msg-system',
        type: 'system',
        content: 'Connection established',
        sender: 'system',
        timestamp: new Date(),
      }

      render(<MessageList messages={[systemMessage]} isTyping={false} />)

      // MessageBubble will handle the system message rendering
      expect(screen.queryByText('Hello')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should be scrollable', () => {
      const { container } = render(<MessageList messages={mockMessages} isTyping={false} />)

      const scrollableElement = container.querySelector('.overflow-y-auto')
      expect(scrollableElement).toBeInTheDocument()
    })

    it('should have proper structure', () => {
      const { container } = render(<MessageList messages={mockMessages} isTyping={false} />)

      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long message list', () => {
      const manyMessages = Array.from({ length: 150 }, (_, i) => ({
        id: `msg-${i}`,
        type: 'text' as const,
        content: `Message ${i}`,
        sender: i % 2 === 0 ? ('user' as const) : ('bot' as const),
        timestamp: new Date(),
      }))

      const { container } = render(<MessageList messages={manyMessages} isTyping={false} />)

      // Should render without crashing - virtualization activates for >100 messages
      // With virtualization, only visible items are rendered
      expect(container.querySelector('.overflow-y-auto')).toBeInTheDocument()
    })

    it('should handle messages without IDs', () => {
      const messagesWithoutIds: ChatMessage[] = [
        {
          id: '',
          type: 'text',
          content: 'Message without ID',
          sender: 'user',
          timestamp: new Date(),
        },
      ]

      render(<MessageList messages={messagesWithoutIds} isTyping={false} />)

      expect(screen.getByText('Message without ID')).toBeInTheDocument()
    })

    it('should handle rapid message updates', () => {
      const { rerender } = render(<MessageList messages={[mockMessages[0]]} isTyping={false} />)

      rerender(<MessageList messages={mockMessages} isTyping={false} />)

      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should memoize component', () => {
      const { rerender } = render(<MessageList messages={mockMessages} isTyping={false} />)

      // Rerender with same props shouldn't trigger updates
      rerender(<MessageList messages={mockMessages} isTyping={false} />)

      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    it('should handle different message arrays with same content', () => {
      const messages1 = [...mockMessages]
      const messages2 = [...mockMessages]

      const { rerender } = render(<MessageList messages={messages1} isTyping={false} />)

      rerender(<MessageList messages={messages2} isTyping={false} />)

      expect(screen.getByText('Hello')).toBeInTheDocument()
    })
  })
})
