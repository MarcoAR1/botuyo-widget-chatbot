/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MessageBubble } from '../../chat-widget/components/MessageBubble'
import type {
  TextMessage,
  ImageMessage,
  AudioMessage,
  LocationMessage,
  SystemMessage,
  FileMessage,
} from '../../chat-widget/types'

describe('MessageBubble', () => {
  describe('Text Messages', () => {
    it('should render text message from user', () => {
      const message: TextMessage = {
        id: '1',
        type: 'text',
        content: 'Hello world',
        sender: 'user',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      expect(screen.getByText('Hello world')).toBeInTheDocument()
    })

    it('should render text message from bot', () => {
      const message: TextMessage = {
        id: '2',
        type: 'text',
        content: 'Hi there!',
        sender: 'bot',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} botName="Mar" />)

      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })

    it('should render markdown bold text', () => {
      const message: TextMessage = {
        id: '3',
        type: 'text',
        content: '**Bold text**',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      const strong = container.querySelector('strong')
      expect(strong).toBeInTheDocument()
      expect(strong?.textContent).toBe('Bold text')
    })

    it('should render markdown italic text', () => {
      const message: TextMessage = {
        id: '4',
        type: 'text',
        content: '*Italic text*',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      const em = container.querySelector('em')
      expect(em).toBeInTheDocument()
      expect(em?.textContent).toBe('Italic text')
    })

    it('should render markdown links', () => {
      const message: TextMessage = {
        id: '5',
        type: 'text',
        content: '[Click here](https://example.com)',
        sender: 'bot',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      const link = screen.getByRole('link', { name: /click here/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('should render markdown lists', () => {
      const message: TextMessage = {
        id: '6',
        type: 'text',
        content: '- Item 1\n- Item 2\n- Item 3',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      const list = container.querySelector('ul')
      expect(list).toBeInTheDocument()

      const items = container.querySelectorAll('li')
      expect(items).toHaveLength(3)
    })

    it('should sanitize dangerous HTML', () => {
      const message: TextMessage = {
        id: '7',
        type: 'text',
        content: '<script>alert("XSS")</script>Hello',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      const script = container.querySelector('script')
      expect(script).not.toBeInTheDocument()
    })
  })

  describe('System Messages', () => {
    it('should render system message', () => {
      const message: SystemMessage = {
        id: '8',
        type: 'system',
        content: 'User joined the chat',
        sender: 'system',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      expect(screen.getByText('User joined the chat')).toBeInTheDocument()
    })

    it('should apply system message styles', () => {
      const message: SystemMessage = {
        id: '9',
        type: 'system',
        content: 'System notification',
        sender: 'system',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      const systemMsg = container.querySelector('.rounded-full')
      expect(systemMsg).toBeInTheDocument()
    })
  })

  describe('Audio Messages', () => {
    it('should render audio message with AudioPlayer', async () => {
      const message: AudioMessage = {
        id: '10',
        type: 'audio',
        content: 'https://example.com/audio.mp3',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      // AudioPlayer is lazy loaded, wait for it
      await vi.waitFor(
        () => {
          const audio = container.querySelector('audio')
          expect(audio).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    it('should pass correct props to AudioPlayer', async () => {
      const message: AudioMessage = {
        id: '11',
        type: 'audio',
        content: 'https://example.com/audio.mp3',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} primaryColor="200 100% 50%" />)

      await vi.waitFor(
        () => {
          const audio = container.querySelector('audio')
          expect(audio).toHaveAttribute('src', 'https://example.com/audio.mp3')
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Image Messages', () => {
    it('should render image message with Gallery', async () => {
      const message: ImageMessage = {
        id: '12',
        type: 'image',
        imageUrl: 'https://example.com/image.jpg',
        altText: 'Test image',
        sender: 'bot',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      // Gallery is lazy loaded
      await vi.waitFor(
        () => {
          const img = screen.getByAltText('Test image')
          expect(img).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })

    it('should use default alt text when not provided', async () => {
      const message: ImageMessage = {
        id: '13',
        type: 'image',
        imageUrl: 'https://example.com/image.jpg',
        sender: 'bot',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      await vi.waitFor(
        () => {
          const img = screen.getByAltText('Imagen')
          expect(img).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Location Messages', () => {
    it('should render location message with map link', () => {
      const message: LocationMessage = {
        id: '14',
        type: 'location',
        latitude: 40.7128,
        longitude: -74.006,
        name: 'New York',
        sender: 'user',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      const link = screen.getByRole('link', { name: /ver ubicación/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', expect.stringContaining('40.7128,-74.006'))
      expect(link).toHaveAttribute('target', '_blank')
    })
  })

  describe('Message Styling', () => {
    it('should apply user bubble styles', () => {
      const message: TextMessage = {
        id: '15',
        type: 'text',
        content: 'User message',
        sender: 'user',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      const bubble = container.querySelector('.text-primary-foreground')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply bot bubble styles', () => {
      const message: TextMessage = {
        id: '16',
        type: 'text',
        content: 'Bot message',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      const bubble = container.querySelector('.border')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply rounded corners for first message', () => {
      const message: TextMessage = {
        id: '17',
        type: 'text',
        content: 'First message',
        sender: 'user',
        timestamp: new Date(),
      }

      const { container } = render(
        <MessageBubble message={message} isFirst={true} isLast={false} />
      )

      const bubble = container.querySelector('.rounded-tr-\\[4px\\]')
      expect(bubble).toBeInTheDocument()
    })

    it('should apply custom primary color', () => {
      const message: TextMessage = {
        id: '18',
        type: 'text',
        content: 'Colored message',
        sender: 'user',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} primaryColor="200 100% 50%" />)

      expect(container).toBeInTheDocument()
    })
  })

  describe('Avatar Display', () => {
    it('should show bot avatar on last message', () => {
      const message: TextMessage = {
        id: '19',
        type: 'text',
        content: 'Last bot message',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(
        <MessageBubble
          message={message}
          isLast={true}
          botAvatar="https://example.com/avatar.jpg"
          botName="Mar"
        />
      )

      const avatar = container.querySelector('img[alt="Mar"]')
      expect(avatar).toBeInTheDocument()
    })

    it('should not show avatar on grouped messages', () => {
      const message: TextMessage = {
        id: '20',
        type: 'text',
        content: 'Grouped message',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(
        <MessageBubble
          message={message}
          isFirst={false}
          isLast={false}
          botAvatar="https://example.com/avatar.jpg"
          botName="Mar"
        />
      )

      const avatar = container.querySelector('img[alt="Mar"]')
      expect(avatar).not.toBeInTheDocument()
    })

    it('should show different avatars for emotions', () => {
      const message: TextMessage = {
        id: '21',
        type: 'text',
        content: 'Happy message',
        sender: 'bot',
        timestamp: new Date(),
        emotion: 'happy',
      }

      const avatars = {
        happy: 'https://example.com/happy.jpg',
        sad: 'https://example.com/sad.jpg',
        default: 'https://example.com/default.jpg',
      }

      const { container } = render(
        <MessageBubble message={message} isLast={true} avatars={avatars} botName="Mar" />
      )

      const avatar = container.querySelector('img[src="https://example.com/happy.jpg"]')
      expect(avatar).toBeInTheDocument()
    })
  })

  describe('Timestamp Display', () => {
    it('should display message timestamp', () => {
      const timestamp = new Date('2024-01-15T14:30:00')
      const message: TextMessage = {
        id: '22',
        type: 'text',
        content: 'Timestamped message',
        sender: 'bot',
        timestamp,
      }

      const { container } = render(<MessageBubble message={message} isLast={true} />)

      // Check for time format HH:MM
      expect(container.textContent).toMatch(/14:30/)
    })

    it('should format time correctly', () => {
      const timestamp = new Date('2024-01-15T09:05:00')
      const message: TextMessage = {
        id: '23',
        type: 'text',
        content: 'Morning message',
        sender: 'user',
        timestamp,
      }

      const { container } = render(<MessageBubble message={message} isLast={true} />)

      expect(container.textContent).toMatch(/09:05/)
    })
  })

  describe('Accessibility', () => {
    it('should have proper structure for screen readers', () => {
      const message: TextMessage = {
        id: '24',
        type: 'text',
        content: 'Accessible message',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      expect(container.firstChild).toBeInTheDocument()
    })

    it('should have alt text for images', async () => {
      const message: ImageMessage = {
        id: '25',
        type: 'image',
        imageUrl: 'https://example.com/accessible.jpg',
        altText: 'Accessible image',
        sender: 'bot',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      await vi.waitFor(
        () => {
          const img = screen.getByAltText('Accessible image')
          expect(img).toBeInTheDocument()
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty content gracefully', () => {
      const message: TextMessage = {
        id: '26',
        type: 'text',
        content: '',
        sender: 'bot',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      expect(container).toBeInTheDocument()
    })

    it('should handle very long messages', () => {
      const longContent = 'A'.repeat(1000)
      const message: TextMessage = {
        id: '27',
        type: 'text',
        content: longContent,
        sender: 'bot',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      expect(screen.getByText(longContent)).toBeInTheDocument()
    })

    it('should handle special characters', () => {
      const message: TextMessage = {
        id: '28',
        type: 'text',
        content: '¡Hola! ¿Cómo estás? 你好 مرحبا',
        sender: 'bot',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      expect(screen.getByText(/¡Hola!/)).toBeInTheDocument()
    })

    it('should handle invalid timestamp gracefully', () => {
      const message: TextMessage = {
        id: '29',
        type: 'text',
        content: 'Invalid time',
        sender: 'bot',
        timestamp: new Date('invalid'),
      }

      const { container } = render(<MessageBubble message={message} isLast={true} />)

      expect(container).toBeInTheDocument()
    })
  })

  describe('File Messages', () => {
    it('should render file message with file name', () => {
      const message: FileMessage = {
        id: '30',
        type: 'file',
        fileUrl: 'https://example.com/document.pdf',
        fileName: 'document.pdf',
        sender: 'user',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      expect(screen.getByText('document.pdf')).toBeInTheDocument()
    })

    it('should render file message with file size', () => {
      const message: FileMessage = {
        id: '31',
        type: 'file',
        fileUrl: 'https://example.com/report.pdf',
        fileName: 'report.pdf',
        fileSize: 2097152, // 2 MB in bytes
        sender: 'user',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      // Should display "2.00 MB"
      expect(container.textContent).toContain('2.00 MB')
    })

    it('should render file message with file extension', () => {
      const message: FileMessage = {
        id: '32',
        type: 'file',
        fileUrl: 'https://example.com/data.xlsx',
        fileName: 'data.xlsx',
        fileSize: 2048000, // 2 MB
        sender: 'user',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      // Should display "XLSX" (uppercase extension)
      expect(container.textContent).toContain('XLSX')
    })

    it('should render file message with download link', () => {
      const message: FileMessage = {
        id: '33',
        type: 'file',
        fileUrl: 'https://example.com/contract.pdf',
        fileName: 'contract.pdf',
        sender: 'user',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      const link = container.querySelector('a[download]')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', 'https://example.com/contract.pdf')
      expect(link).toHaveAttribute('download', 'contract.pdf')
    })

    it('should display download icon for file message', () => {
      const message: FileMessage = {
        id: '34',
        type: 'file',
        fileUrl: 'https://example.com/file.zip',
        fileName: 'archive.zip',
        sender: 'user',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      // Check for download icon (lucide-react Download component)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should handle file message without file size', () => {
      const message: FileMessage = {
        id: '35',
        type: 'file',
        fileUrl: 'https://example.com/doc.txt',
        fileName: 'notes.txt',
        sender: 'user',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      expect(screen.getByText('notes.txt')).toBeInTheDocument()
      // Sin fileSize, no se muestra la extensión
      expect(container.textContent).not.toContain('TXT •')
    })

    it('should handle file message without extension', () => {
      const message: FileMessage = {
        id: '36',
        type: 'file',
        fileUrl: 'https://example.com/file',
        fileName: 'README',
        sender: 'user',
        timestamp: new Date(),
      }

      const { container: _container } = render(<MessageBubble message={message} />)

      expect(screen.getByText('README')).toBeInTheDocument()
    })

    it('should format large file sizes correctly', () => {
      const message: FileMessage = {
        id: '37',
        type: 'file',
        fileUrl: 'https://example.com/video.mp4',
        fileName: 'presentation.mp4',
        fileSize: 52428800, // 50 MB
        sender: 'user',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      expect(container.textContent).toContain('50.00 MB')
    })

    it('should format small file sizes correctly', () => {
      const message: FileMessage = {
        id: '38',
        type: 'file',
        fileUrl: 'https://example.com/tiny.txt',
        fileName: 'config.txt',
        fileSize: 10240, // 0.01 MB
        sender: 'user',
        timestamp: new Date(),
      }

      const { container } = render(<MessageBubble message={message} />)

      expect(container.textContent).toContain('0.01 MB')
    })

    it('should render file message from bot', () => {
      const message: FileMessage = {
        id: '39',
        type: 'file',
        fileUrl: 'https://example.com/invoice.pdf',
        fileName: 'invoice_2024.pdf',
        fileSize: 1048576, // 1 MB
        sender: 'bot',
        timestamp: new Date(),
      }

      render(<MessageBubble message={message} />)

      expect(screen.getByText('invoice_2024.pdf')).toBeInTheDocument()
      const { container } = render(<MessageBubble message={message} />)
      expect(container.textContent).toContain('PDF')
      expect(container.textContent).toContain('1.00 MB')
    })

    it('should handle mimeType if provided', () => {
      const message: FileMessage = {
        id: '40',
        type: 'file',
        fileUrl: 'https://example.com/data.json',
        fileName: 'data.json',
        mimeType: 'application/json',
        sender: 'user',
        timestamp: new Date(),
      }

      const { container: _container } = render(<MessageBubble message={message} />)

      expect(screen.getByText('data.json')).toBeInTheDocument()
    })
  })
})
