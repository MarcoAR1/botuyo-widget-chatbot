/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatWidget } from '../../chat-widget/ChatWidget'
import type { ChatWidgetProps } from '../../chat-widget/types'

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  default: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
}))

// Mock IDB
vi.mock('idb', () => ({
  openDB: vi.fn().mockResolvedValue({
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  }),
}))

describe('ChatWidget Integration', () => {
  const defaultProps: ChatWidgetProps = {
    apiKey: 'test-api-key',
    apiBaseUrl: 'http://localhost:3000',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render launcher button', () => {
    render(<ChatWidget {...defaultProps} />)

    const launcher = screen.getByRole('button', { name: /abrir chat/i })
    expect(launcher).toBeInTheDocument()
  })

  it('should open chat window when launcher clicked', async () => {
    render(<ChatWidget {...defaultProps} />)

    const launcher = screen.getByRole('button', { name: /abrir chat/i })
    await userEvent.click(launcher)

    // Chat window should be visible (role is dialog, not complementary)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should apply custom theme colors', () => {
    const customTheme = {
      primaryColor: '#FF5733',
      backgroundColor: '#FFFFFF',
    }

    render(<ChatWidget {...defaultProps} theme={customTheme} />)

    const launcher = screen.getByRole('button', { name: /abrir chat/i })
    expect(launcher).toBeInTheDocument()
    // Verify theme is applied
    expect(launcher).toHaveStyle({ backgroundColor: '#FF5733' })
  })
})
