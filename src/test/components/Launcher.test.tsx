/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Launcher } from '../../chat-widget/components/Launcher'

describe('Launcher', () => {
  const mockOnClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render launcher button', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const button = screen.getByRole('button', { name: /abrir chat/i })
      expect(button).toBeInTheDocument()
    })

    it('should render with logo URL', () => {
      const { container } = render(
        <Launcher isOpen={false} onClick={mockOnClick} logoUrl="https://example.com/avatar.jpg" />
      )

      const avatar = container.querySelector('img')
      expect(avatar).toBeInTheDocument()
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    it('should use icon when no logo provided', () => {
      const { container } = render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const icon = container.querySelector('svg.lucide-message-circle')
      expect(icon).toBeInTheDocument()
    })

    it('should render launcher in closed state', () => {
      const { container } = render(<Launcher onClick={mockOnClick} isOpen={false} />)

      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('should render launcher in open state', () => {
      const { container } = render(<Launcher onClick={mockOnClick} isOpen={true} />)

      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('should show different icons based on state', () => {
      const { container, rerender } = render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const messageIcon = container.querySelector('svg.lucide-message-circle')
      expect(messageIcon).toBeInTheDocument()

      rerender(<Launcher isOpen={true} onClick={mockOnClick} />)
      const closeIcon = container.querySelector('svg.lucide-x')
      expect(closeIcon).toBeInTheDocument()
    })
  })

  describe('Unread Count Badge', () => {
    it('should not show badge when unread count is 0', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} unreadCount={0} />)

      const badge = screen.queryByText('0')
      expect(badge).not.toBeInTheDocument()
    })

    it('should show badge when unread count is greater than 0', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} unreadCount={5} />)

      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should show badge with single digit', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} unreadCount={1} />)

      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should show 9+ when unread count exceeds 9', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} unreadCount={15} />)

      expect(screen.getByText('9+')).toBeInTheDocument()
    })

    it('should show 9+ for exactly 10 messages', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} unreadCount={10} />)

      expect(screen.getByText('9+')).toBeInTheDocument()
    })

    it('should show 9+ for high unread counts', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} unreadCount={99} />)

      expect(screen.getByText('9+')).toBeInTheDocument()
    })

    it('should hide badge when isOpen is true', () => {
      render(<Launcher onClick={mockOnClick} unreadCount={5} isOpen={true} />)

      const badge = screen.queryByText('5')
      expect(badge).not.toBeInTheDocument()
    })
  })

  describe('Bot Emotions', () => {
    it('should display happy emotion avatar', () => {
      const avatars = {
        happy: 'https://example.com/happy.jpg',
        sad: 'https://example.com/sad.jpg',
        thinking: 'https://example.com/thinking.jpg',
        confused: 'https://example.com/confused.jpg',
        default: 'https://example.com/default.jpg',
      }

      const { container } = render(
        <Launcher isOpen={false} onClick={mockOnClick} emotion="happy" avatars={avatars} />
      )

      const avatar = container.querySelector('img')
      expect(avatar).toHaveAttribute('src', 'https://example.com/happy.jpg')
    })

    it('should display sad emotion avatar', () => {
      const avatars = {
        happy: 'https://example.com/happy.jpg',
        sad: 'https://example.com/sad.jpg',
        default: 'https://example.com/default.jpg',
      }

      const { container } = render(
        <Launcher
          isOpen={false}
          onClick={mockOnClick}
          emotion="sorry"
          avatars={{ ...avatars, sorry: 'https://example.com/sad.jpg' }}
        />
      )

      const avatar = container.querySelector('img')
      expect(avatar).toHaveAttribute('src', 'https://example.com/sad.jpg')
    })

    it('should display thinking emotion avatar', () => {
      const avatars = {
        thinking: 'https://example.com/thinking.jpg',
        default: 'https://example.com/default.jpg',
      }

      const { container } = render(
        <Launcher isOpen={false} onClick={mockOnClick} emotion="thinking" avatars={avatars} />
      )

      const avatar = container.querySelector('img')
      expect(avatar).toHaveAttribute('src', 'https://example.com/thinking.jpg')
    })

    it('should display confused emotion avatar', () => {
      const avatars = {
        confused: 'https://example.com/confused.jpg',
        default: 'https://example.com/default.jpg',
      }

      const { container } = render(
        <Launcher isOpen={false} onClick={mockOnClick} emotion="confused" avatars={avatars} />
      )

      const avatar = container.querySelector('img')
      expect(avatar).toHaveAttribute('src', 'https://example.com/confused.jpg')
    })

    it('should fallback to default avatar when emotion avatar not provided', () => {
      const avatars = {
        default: 'https://example.com/default.jpg',
      }

      const { container } = render(
        <Launcher isOpen={false} onClick={mockOnClick} emotion="happy" avatars={avatars} />
      )

      const avatar = container.querySelector('img')
      expect(avatar).toHaveAttribute('src', 'https://example.com/default.jpg')
    })

    it('should use logoUrl when no avatars object provided', () => {
      const { container } = render(
        <Launcher
          isOpen={false}
          onClick={mockOnClick}
          emotion="happy"
          logoUrl="https://example.com/bot.jpg"
        />
      )

      const avatar = container.querySelector('img')
      expect(avatar).toHaveAttribute('src', 'https://example.com/bot.jpg')
    })
  })

  describe('User Interactions', () => {
    it('should call onClick when launcher is clicked', async () => {
      const user = userEvent.setup()
      render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const button = screen.getByRole('button', { name: /abrir chat/i })
      await user.click(button)

      expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('should be clickable multiple times', async () => {
      const user = userEvent.setup()
      render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const button = screen.getByRole('button', { name: /abrir chat/i })
      await user.click(button)
      await user.click(button)
      await user.click(button)

      expect(mockOnClick).toHaveBeenCalledTimes(3)
    })

    it('should be keyboard accessible', async () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const button = screen.getByRole('button', { name: /abrir chat/i })
      button.focus()

      expect(button).toHaveFocus()
    })

    it('should trigger onClick on Enter key', async () => {
      const user = userEvent.setup()
      render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const button = screen.getByRole('button', { name: /abrir chat/i })
      button.focus()
      await user.keyboard('{Enter}')

      expect(mockOnClick).toHaveBeenCalled()
    })

    it('should trigger onClick on Space key', async () => {
      const user = userEvent.setup()
      render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const button = screen.getByRole('button', { name: /abrir chat/i })
      button.focus()
      await user.keyboard(' ')

      expect(mockOnClick).toHaveBeenCalled()
    })
  })

  describe('Styling and Theming', () => {
    it('should apply custom primary color', () => {
      const { container } = render(
        <Launcher isOpen={false} onClick={mockOnClick} primaryColor="200 100% 50%" />
      )

      const button = container.querySelector('button[aria-label]')
      expect(button).toBeInTheDocument()
    })

    it('should have rounded corners', () => {
      const { container } = render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const button = container.querySelector('button[aria-label]')
      expect(button?.className).toMatch(/rounded/)
    })

    it('should have shadow on main launcher button', () => {
      const { container } = render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const button = container.querySelector('button[aria-label]')
      expect(button?.className).toMatch(/shadow-soft-xl/)
    })

    it('should have proper flex layout', () => {
      const { container } = render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toMatch(/flex/)
      expect(wrapper.className).toMatch(/items-center/)
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label for closed state', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const button = screen.getByRole('button', { name: /abrir chat/i })
      expect(button).toHaveAccessibleName()
    })

    it('should have proper aria-label for open state', () => {
      render(<Launcher isOpen={true} onClick={mockOnClick} />)

      const button = screen.getByRole('button', { name: /cerrar chat/i })
      expect(button).toHaveAccessibleName()
    })

    it('should have button role', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} />)

      expect(screen.getByRole('button', { name: /abrir chat/i })).toBeInTheDocument()
    })

    it('should have alt text on avatar image when logo provided', () => {
      const { container } = render(
        <Launcher isOpen={false} onClick={mockOnClick} logoUrl="https://example.com/bot.jpg" />
      )

      const avatar = container.querySelector('img')
      expect(avatar).toHaveAttribute('alt')
    })

    it('should be tabbable', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} />)

      const button = screen.getByRole('button', { name: /abrir chat/i })
      expect(button).not.toHaveAttribute('tabindex', '-1')
    })
  })

  describe('Edge Cases', () => {
    it('should handle negative unread count gracefully', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} unreadCount={-5} />)

      const badge = screen.queryByText('-5')
      expect(badge).not.toBeInTheDocument()
    })

    it('should handle very large unread counts', () => {
      render(<Launcher isOpen={false} onClick={mockOnClick} unreadCount={999999} />)

      expect(screen.getByText('9+')).toBeInTheDocument()
    })

    it('should render without logoUrl', () => {
      const { container } = render(<Launcher isOpen={false} onClick={mockOnClick} />)

      expect(container.querySelector('button')).toBeInTheDocument()
    })

    it('should render without avatars', () => {
      const { container } = render(<Launcher isOpen={false} onClick={mockOnClick} />)

      expect(container.querySelector('button')).toBeInTheDocument()
    })

    it('should handle undefined emotion', () => {
      const { container } = render(
        <Launcher isOpen={false} onClick={mockOnClick} emotion={undefined} />
      )

      expect(container.querySelector('button')).toBeInTheDocument()
    })
  })

  describe('Animation States', () => {
    it('should render in closed state without animations interfering', () => {
      const { container } = render(<Launcher onClick={mockOnClick} isOpen={false} />)

      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('should render in open state', () => {
      const { container } = render(<Launcher onClick={mockOnClick} isOpen={true} />)

      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })
  })
})
