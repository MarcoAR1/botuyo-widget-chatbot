/**
 * @package @botuyo/chat-widget
 * Live Call Components Tests
 *
 * Tests for CallButton and LiveCallOverlay components.
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import '@testing-library/jest-dom'
import { CallButton } from '../components/CallButton'
import { LiveCallOverlay } from '../components/LiveCallOverlay'

describe('CallButton', () => {
  const defaultProps = {
    state: 'idle' as const,
    isSupported: true,
    onStartCall: vi.fn(),
    onEndCall: vi.fn(),
  }

  describe('rendering', () => {
    it('should render nothing when not supported', () => {
      const { container } = render(<CallButton {...defaultProps} isSupported={false} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render Start Call button in idle state', () => {
      render(<CallButton {...defaultProps} />)
      expect(screen.getByText('Start Call')).toBeInTheDocument()
    })

    it('should render Connecting when in calling state', () => {
      render(<CallButton {...defaultProps} state="calling" />)
      expect(screen.getByText('Connecting...')).toBeInTheDocument()
    })

    it('should render End Call button when in call', () => {
      render(<CallButton {...defaultProps} state="ready" />)
      expect(screen.getByText('End Call')).toBeInTheDocument()
    })

    it('should show call duration when in call', () => {
      render(<CallButton {...defaultProps} state="listening" callDuration={65} />)
      expect(screen.getByText('🔴 01:05')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onStartCall when clicked in idle state', () => {
      const onStartCall = vi.fn()
      render(<CallButton {...defaultProps} onStartCall={onStartCall} />)

      fireEvent.click(screen.getByRole('button'))
      expect(onStartCall).toHaveBeenCalled()
    })

    it('should call onEndCall when clicked in active state', () => {
      const onEndCall = vi.fn()
      render(<CallButton {...defaultProps} state="ready" onEndCall={onEndCall} />)

      fireEvent.click(screen.getByRole('button'))
      expect(onEndCall).toHaveBeenCalled()
    })

    it('should be disabled when calling', () => {
      render(<CallButton {...defaultProps} state="calling" />)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should be disabled when disabled prop is true', () => {
      render(<CallButton {...defaultProps} disabled />)
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('accessibility', () => {
    it('should have correct aria-label for idle state', () => {
      render(<CallButton {...defaultProps} />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Start voice call')
    })

    it('should have correct aria-label for active state', () => {
      render(<CallButton {...defaultProps} state="speaking" />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'End call')
    })
  })
})

describe('LiveCallOverlay', () => {
  const defaultProps = {
    isOpen: true,
    state: 'ready' as const,
    callDuration: 0,
    onEndCall: vi.fn(),
  }

  describe('rendering', () => {
    it('should not render when not open', () => {
      const { container } = render(<LiveCallOverlay {...defaultProps} isOpen={false} />)
      expect(container.firstChild).toBeNull()
    })

    it('should render call duration', () => {
      render(<LiveCallOverlay {...defaultProps} callDuration={125} />)
      expect(screen.getByText('02:05')).toBeInTheDocument()
    })

    it('should show Listo para hablar in ready state', () => {
      render(<LiveCallOverlay {...defaultProps} state="ready" />)
      expect(screen.getByText('Listo para hablar')).toBeInTheDocument()
    })

    it('should show Escuchando in listening state', () => {
      render(<LiveCallOverlay {...defaultProps} state="listening" />)
      expect(screen.getByText('Escuchando...')).toBeInTheDocument()
    })

    it('should show Procesando in thinking state', () => {
      render(<LiveCallOverlay {...defaultProps} state="thinking" />)
      expect(screen.getByText('Procesando...')).toBeInTheDocument()
    })

    it('should show Bot hablando in speaking state', () => {
      render(<LiveCallOverlay {...defaultProps} state="speaking" />)
      expect(screen.getByText('Bot hablando...')).toBeInTheDocument()
    })

    it('should display transcription when provided', () => {
      render(<LiveCallOverlay {...defaultProps} transcription="Hello world" />)
      expect(screen.getByText('Tú dijiste:')).toBeInTheDocument()
      expect(screen.getByText('"Hello world"')).toBeInTheDocument()
    })

    it('should display bot response when speaking', () => {
      render(<LiveCallOverlay {...defaultProps} state="speaking" botResponse="Hi there!" />)
      expect(screen.getByText('Bot respondió:')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should call onEndCall when end call button is clicked', () => {
      const onEndCall = vi.fn()
      render(<LiveCallOverlay {...defaultProps} onEndCall={onEndCall} />)

      fireEvent.click(screen.getByLabelText('Colgar llamada'))
      expect(onEndCall).toHaveBeenCalled()
    })
  })

  describe('waveform', () => {
    it('should show waveform when listening', () => {
      render(<LiveCallOverlay {...defaultProps} state="listening" />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('should show waveform when speaking', () => {
      render(<LiveCallOverlay {...defaultProps} state="speaking" />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })
})
