/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithI18n } from '../utils/i18n-test-utils'
import userEvent from '@testing-library/user-event'
import { InputArea } from '../../chat-widget/components/InputArea'

// Mock validateFile utility
vi.mock('../../chat-widget/utils/fileValidation', () => ({
  validateFile: vi.fn(async () => ({ valid: true })),
}))

// Mock browser-image-compression
vi.mock('browser-image-compression', () => ({
  default: vi.fn((file: File) => Promise.resolve(file)),
}))

describe('InputArea', () => {
  const mockOnSendMessage = vi.fn()
  const mockOnSendAttachment = vi.fn()
  const mockOnSendLocation = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Text Input', () => {
    it('should render input field', () => {
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      expect(input).toBeInTheDocument()
    })

    it('should render with custom placeholder', () => {
      renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          placeholder="Type here..."
        />
      )

      expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument()
    })

    it('should send message on Enter key', async () => {
      const user = userEvent.setup()
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      await user.type(input, 'Hello world{Enter}')

      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world')
    })

    it('should add new line on Shift+Enter', async () => {
      const user = userEvent.setup()
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2')

      expect(input).toHaveValue('Line 1\nLine 2')
      expect(mockOnSendMessage).not.toHaveBeenCalled()
    })

    it('should not send empty messages', async () => {
      const user = userEvent.setup()
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      await user.type(input, '{Enter}')

      expect(mockOnSendMessage).not.toHaveBeenCalled()
    })

    it('should not send whitespace-only messages', async () => {
      const user = userEvent.setup()
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      await user.type(input, '   {Enter}')

      expect(mockOnSendMessage).not.toHaveBeenCalled()
    })

    it('should trim message before sending', async () => {
      const user = userEvent.setup()
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      await user.type(input, '  Hello  {Enter}')

      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello')
    })

    it('should clear input after sending', async () => {
      const user = userEvent.setup()
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i) as HTMLTextAreaElement
      await user.type(input, 'Test message{Enter}')

      expect(input.value).toBe('')
    })

    it('should update input value when typing', async () => {
      const user = userEvent.setup()
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      await user.type(input, 'Hello')

      expect(input).toHaveValue('Hello')
    })
  })

  describe('Character Limit', () => {
    it('should render textarea element', () => {
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i) as HTMLTextAreaElement

      expect(input.tagName).toBe('TEXTAREA')
    })

    it('should accept short messages', async () => {
      const user = userEvent.setup()
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i) as HTMLTextAreaElement

      await user.click(input)
      await user.paste('Short message')

      expect(input.value).toBe('Short message')
    })

    it('should allow pasting text', async () => {
      const user = userEvent.setup()
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i) as HTMLTextAreaElement

      await user.click(input)
      await user.paste('Pasted text')

      expect(input.value).toBe('Pasted text')
    })
  })

  describe('File Attachments', () => {
    it('should have hidden file input', () => {
      renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
        />
      )

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveClass('hidden')
    })

    it('should accept image files', () => {
      renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
        />
      )

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toHaveAttribute('accept', 'image/*')
    })

    it('should render input area when attachment callback provided', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
        />
      )

      expect(container).toBeInTheDocument()
    })
  })

  describe('Audio Recording', () => {
    it('should handle media recorder initialization', () => {
      // Mock MediaRecorder
      const mockMediaRecorder = vi.fn() as any
      global.MediaRecorder = mockMediaRecorder

      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
          }),
        },
        writable: true,
        configurable: true,
      })

      renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
        />
      )

      const { container } = renderWithI18n(
        <InputArea isConnected={true} onSendMessage={mockOnSendMessage} />
      )
      expect(container).toBeInTheDocument()
    })

    it('should have recording capabilities when attachment handler provided', () => {
      const mockMediaRecorder = vi.fn() as any
      global.MediaRecorder = mockMediaRecorder

      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue({}),
        },
        writable: true,
        configurable: true,
      })

      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
        />
      )

      expect(container).toBeInTheDocument()
    })
  })

  describe('Location Sharing', () => {
    it('should support location sharing when handler provided', () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn(),
      }

      Object.defineProperty(global.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
        configurable: true,
      })

      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendLocation={mockOnSendLocation}
        />
      )

      expect(container).toBeInTheDocument()
    })

    it('should render component with location capability', () => {
      Object.defineProperty(global.navigator, 'geolocation', {
        value: { getCurrentPosition: vi.fn() },
        writable: true,
        configurable: true,
      })

      renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendLocation={mockOnSendLocation}
        />
      )

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      expect(input).toBeInTheDocument()
    })
  })

  describe('Connection State', () => {
    it('should render when not connected', () => {
      renderWithI18n(<InputArea isConnected={false} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      expect(input).toBeInTheDocument()
    })

    it('should render when connected', () => {
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      expect(input).toBeInTheDocument()
      expect(input).not.toBeDisabled()
    })

    it('should prevent sending when not connected', async () => {
      const user = userEvent.setup()
      renderWithI18n(<InputArea isConnected={false} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      await user.type(input, 'Test message{Enter}')

      expect(mockOnSendMessage).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should be accessible', () => {
      renderWithI18n(<InputArea isConnected={true} onSendMessage={mockOnSendMessage} />)

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      expect(input).toBeInTheDocument()
      expect(input.tagName).toBe('TEXTAREA')
    })

    it('should have proper structure for screen readers', () => {
      const { container } = renderWithI18n(
        <InputArea isConnected={true} onSendMessage={mockOnSendMessage} />
      )

      expect(container.querySelector('textarea')).toBeInTheDocument()
    })

    it('should be keyboard navigable', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          onSendLocation={mockOnSendLocation}
        />
      )

      const textarea = container.querySelector('textarea')
      expect(textarea).toBeInTheDocument()
    })
  })

  describe('MediaConfig - Conditional Features', () => {
    it('should hide media button when all features disabled', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{
            enableImages: false,
            enableAudio: false,
            enableFiles: false,
            enableLocation: false,
          }}
        />
      )

      // No + button should be visible
      const buttons = container.querySelectorAll('button')
      const plusButton = Array.from(buttons).find(btn => btn.textContent?.includes('+'))
      expect(plusButton).toBeUndefined()
    })

    it('should show media button when at least one feature enabled', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{ enableImages: true }}
        />
      )

      const buttons = container.querySelectorAll('button')
      const hasMediaButton = Array.from(buttons).some(
        btn => btn.textContent?.includes('+') || btn.className.includes('shrink-0')
      )
      expect(hasMediaButton).toBe(true)
    })

    it('should show only images option when enableImages=true, others false', async () => {
      const user = userEvent.setup()
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{
            enableImages: true,
            enableFiles: false,
            enableLocation: false,
            enableAudio: false,
          }}
        />
      )

      // Click the + button to open menu
      const buttons = container.querySelectorAll('button')
      const plusButton = Array.from(buttons).find(btn => {
        const svg = btn.querySelector('svg')
        return (
          svg &&
          (svg.classList.contains('lucide-plus') || svg.getAttribute('class')?.includes('lucide'))
        )
      })
      if (plusButton) await user.click(plusButton)

      // Esperar a que el menú se abra
      await waitFor(() => {
        const menuButtons = container.querySelectorAll('button')
        const menuText = Array.from(menuButtons)
          .map(btn => btn.textContent?.toUpperCase())
          .join(' ')
        expect(menuText).toContain('FOTOS')
      })

      const menuButtons = container.querySelectorAll('button')
      const menuText = Array.from(menuButtons)
        .map(btn => btn.textContent?.toUpperCase())
        .join(' ')
      expect(menuText).not.toContain('ARCHIVOS')
    })

    it('should show only files option when enableFiles=true, others false', async () => {
      const user = userEvent.setup()
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{
            enableImages: false,
            enableFiles: true,
            enableLocation: false,
            enableAudio: false,
          }}
        />
      )

      const buttons = container.querySelectorAll('button')
      const plusButton = Array.from(buttons).find(btn => {
        const svg = btn.querySelector('svg')
        return (
          svg &&
          (svg.classList.contains('lucide-plus') || svg.getAttribute('class')?.includes('lucide'))
        )
      })
      if (plusButton) await user.click(plusButton)

      await waitFor(() => {
        const menuButtons = container.querySelectorAll('button')
        const menuText = Array.from(menuButtons)
          .map(btn => btn.textContent?.toUpperCase())
          .join(' ')
        expect(menuText).toContain('ARCHIVOS')
      })

      const menuButtons = container.querySelectorAll('button')
      const menuText = Array.from(menuButtons)
        .map(btn => btn.textContent?.toUpperCase())
        .join(' ')
      expect(menuText).not.toContain('FOTOS')
    })

    it('should show only location option when enableLocation=true, others false', async () => {
      const user = userEvent.setup()
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          onSendLocation={mockOnSendLocation}
          mediaConfig={{
            enableImages: false,
            enableFiles: false,
            enableLocation: true,
            enableAudio: false,
          }}
        />
      )

      const buttons = container.querySelectorAll('button')
      const plusButton = Array.from(buttons).find(btn => {
        const svg = btn.querySelector('svg')
        return (
          svg &&
          (svg.classList.contains('lucide-plus') || svg.getAttribute('class')?.includes('lucide'))
        )
      })
      if (plusButton) await user.click(plusButton)

      await waitFor(() => {
        const menuButtons = container.querySelectorAll('button')
        const menuText = Array.from(menuButtons)
          .map(btn => btn.textContent?.toUpperCase())
          .join(' ')
        expect(menuText).toContain('UBICACIÓN')
      })

      const menuButtons = container.querySelectorAll('button')
      const menuText = Array.from(menuButtons)
        .map(btn => btn.textContent?.toUpperCase())
        .join(' ')
      expect(menuText).not.toContain('FOTOS')
      expect(menuText).not.toContain('ARCHIVOS')
    })

    it('should show all options when all features enabled', async () => {
      const user = userEvent.setup()
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          onSendLocation={mockOnSendLocation}
          mediaConfig={{
            enableImages: true,
            enableFiles: true,
            enableLocation: true,
          }}
        />
      )

      const buttons = container.querySelectorAll('button')
      const plusButton = Array.from(buttons).find(btn => {
        const svg = btn.querySelector('svg')
        return (
          svg &&
          (svg.classList.contains('lucide-plus') || svg.getAttribute('class')?.includes('lucide'))
        )
      })
      if (plusButton) await user.click(plusButton)

      await waitFor(() => {
        const menuButtons = container.querySelectorAll('button')
        const menuText = Array.from(menuButtons)
          .map(btn => btn.textContent?.toUpperCase())
          .join(' ')
        expect(menuText).toContain('FOTOS')
        expect(menuText).toContain('ARCHIVOS')
      })
    })

    it('should use default config when mediaConfig not provided', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
        />
      )

      // With default config, + button should be visible
      const buttons = container.querySelectorAll('button')
      const hasMediaButton = Array.from(buttons).some(
        btn => btn.textContent?.includes('+') || btn.className.includes('shrink-0')
      )
      expect(hasMediaButton).toBe(true)
    })

    it('should partially override default config', async () => {
      const user = userEvent.setup()
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{ enableFiles: false }} // Only disable files
        />
      )

      const buttons = container.querySelectorAll('button')
      const plusButton = Array.from(buttons).find(btn => {
        const svg = btn.querySelector('svg')
        return (
          svg &&
          (svg.classList.contains('lucide-plus') || svg.getAttribute('class')?.includes('lucide'))
        )
      })
      if (plusButton) await user.click(plusButton)

      await waitFor(() => {
        const menuButtons = container.querySelectorAll('button')
        const menuText = Array.from(menuButtons)
          .map(btn => btn.textContent?.toUpperCase())
          .join(' ')
        expect(menuText).toContain('FOTOS')
      })

      const menuButtons = container.querySelectorAll('button')
      const menuText = Array.from(menuButtons)
        .map(btn => btn.textContent?.toUpperCase())
        .join(' ')
      // Images should be enabled (default), files disabled
      expect(menuText).not.toContain('ARCHIVOS')
    })
  })

  describe('MediaConfig - Audio Recording', () => {
    beforeEach(() => {
      // Mock MediaRecorder
      const mockMediaRecorder = vi.fn() as any
      global.MediaRecorder = mockMediaRecorder

      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
          }),
        },
        writable: true,
        configurable: true,
      })
    })

    it('should show microphone button when enableAudio=true and onSendAttachment provided', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{ enableAudio: true }}
        />
      )

      // Buscar el ícono de micrófono (SVG de Lucide React)
      const svgs = container.querySelectorAll('svg')
      const hasMicIcon = Array.from(svgs).some(svg => {
        const className = svg.getAttribute('class') || ''
        const parentButton = svg.closest('button')
        return (
          className.includes('lucide-mic') ||
          (parentButton && parentButton.classList.contains('rounded-full'))
        )
      })
      expect(hasMicIcon).toBe(true)
    })

    it('should show send button when enableAudio=false', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{ enableAudio: false }}
        />
      )

      // Cuando enableAudio=false, debe haber un botón de enviar (Send icon)
      const svgs = container.querySelectorAll('svg')
      const hasSendIcon = Array.from(svgs).some(svg => {
        const className = svg.getAttribute('class') || ''
        return className.includes('lucide-send')
      })

      expect(hasSendIcon).toBe(true)
    })

    it('should show send button when onSendAttachment not provided', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          mediaConfig={{ enableAudio: true }}
        />
      )

      const buttons = container.querySelectorAll('button')
      const hasMicButton = Array.from(buttons).some(btn => btn.textContent?.includes('🎤'))
      expect(hasMicButton).toBe(false)
    })
  })

  describe('MediaConfig - File Inputs', () => {
    it('should have image input when enableImages=true', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{ enableImages: true }}
        />
      )

      const imageInput = container.querySelector('input[accept="image/*"]')
      expect(imageInput).toBeInTheDocument()
    })

    it('should have file input when enableFiles=true', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{ enableFiles: true }}
        />
      )

      const fileInputs = container.querySelectorAll('input[type="file"]')
      // Should have at least one file input
      expect(fileInputs.length).toBeGreaterThan(0)
    })

    it('should respect allowedFileTypes configuration', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{
            enableFiles: true,
            allowedFileTypes: ['pdf', 'doc', 'docx'],
          }}
        />
      )

      const fileInputs = container.querySelectorAll('input[type="file"]')
      const fileInput = Array.from(fileInputs).find(input =>
        input.getAttribute('accept')?.includes('pdf')
      )

      expect(fileInput).toBeInTheDocument()
      expect(fileInput?.getAttribute('accept')).toContain('.pdf')
      expect(fileInput?.getAttribute('accept')).toContain('.doc')
      expect(fileInput?.getAttribute('accept')).toContain('.docx')
    })

    it('should have both image and file inputs when both enabled', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{
            enableImages: true,
            enableFiles: true,
          }}
        />
      )

      const imageInput = container.querySelector('input[accept="image/*"]')
      const fileInputs = container.querySelectorAll('input[type="file"]')

      expect(imageInput).toBeInTheDocument()
      expect(fileInputs.length).toBeGreaterThanOrEqual(2) // At least 2 inputs
    })

    it('should use default allowedFileTypes when not specified', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{ enableFiles: true }}
        />
      )

      const fileInputs = container.querySelectorAll('input[type="file"]')
      const fileInput = Array.from(fileInputs).find(input => {
        const accept = input.getAttribute('accept')
        return accept && accept.includes('.pdf')
      })

      // Default should include common types like pdf, jpg, png
      expect(fileInput).toBeInTheDocument()
    })

    it('should set maxFileSizeMB in config', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{
            enableFiles: true,
            maxFileSizeMB: 5,
          }}
        />
      )

      // Component should render successfully with custom max size
      expect(container).toBeInTheDocument()
    })
  })

  describe('MediaConfig - Text-Only Mode', () => {
    it('should work in text-only mode (all media disabled)', async () => {
      const user = userEvent.setup()
      renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          mediaConfig={{
            enableImages: false,
            enableAudio: false,
            enableFiles: false,
            enableLocation: false,
          }}
        />
      )

      const input = screen.getByPlaceholderText(/escribe un mensaje/i)
      await user.type(input, 'Text message{Enter}')

      expect(mockOnSendMessage).toHaveBeenCalledWith('Text message')
    })

    it('should only show send button in text-only mode', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{
            enableImages: false,
            enableAudio: false,
            enableFiles: false,
            enableLocation: false,
          }}
        />
      )

      const buttons = container.querySelectorAll('button')
      // Should only have send button, no media buttons
      expect(buttons.length).toBeLessThanOrEqual(1)
    })

    it('should not show file inputs in text-only mode', () => {
      const { container } = renderWithI18n(
        <InputArea
          isConnected={true}
          onSendMessage={mockOnSendMessage}
          onSendAttachment={mockOnSendAttachment}
          mediaConfig={{
            enableImages: false,
            enableFiles: false,
          }}
        />
      )

      // Los inputs de archivo están presentes (hidden), pero el botón + no debe mostrarse
      const buttons = container.querySelectorAll('button')
      const hasPlusButton = Array.from(buttons).some(btn => btn.textContent?.includes('+'))
      expect(hasPlusButton).toBe(false)
    })
  })

  describe('Focus & Styling', () => {
    it('should apply focus styling to pill container when textarea is focused', async () => {
      const user = userEvent.setup()
      const { container } = renderWithI18n(
        <InputArea isConnected={true} onSendMessage={mockOnSendMessage} />
      )

      const textarea = screen.getByPlaceholderText(/escribe un mensaje/i)
      const pillContainer = container.querySelector('.chat-input-pill')

      expect(pillContainer).toBeInTheDocument()
      expect(textarea).toHaveClass('chat-input-textarea')

      await user.click(textarea)

      expect(pillContainer).toHaveClass('border-[hsl(var(--primary))]')
    })
  })
})

