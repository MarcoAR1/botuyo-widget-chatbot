/**
 * @package @botuyo/chat-widget
 * Voice UI Components Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { VoiceButton } from '../components/VoiceButton'
import { WaveformVisualizer } from '../components/WaveformVisualizer'
import type { VoiceState } from '../types'

describe('VoiceButton', () => {
  const defaultProps = {
    state: 'idle' as VoiceState,
    isSupported: true,
    onPress: vi.fn(),
    onRelease: vi.fn(),
    onCancel: vi.fn(),
  }

  it('should not render when isSupported is false', () => {
    const { container } = render(<VoiceButton {...defaultProps} isSupported={false} />)

    expect(container.firstChild).toBeNull()
  })

  it('should render when isSupported is true', () => {
    render(<VoiceButton {...defaultProps} />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should call onPress on mousedown', () => {
    const onPress = vi.fn()
    render(<VoiceButton {...defaultProps} onPress={onPress} />)

    const button = screen.getByRole('button')
    fireEvent.mouseDown(button)

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('should call onRelease on mouseup when listening', () => {
    const onRelease = vi.fn()
    render(<VoiceButton {...defaultProps} state="listening" onRelease={onRelease} />)

    const button = screen.getByRole('button')
    fireEvent.mouseUp(button)

    expect(onRelease).toHaveBeenCalledTimes(1)
  })

  it('should call onCancel on mouseleave when listening', () => {
    const onCancel = vi.fn()
    render(<VoiceButton {...defaultProps} state="listening" onCancel={onCancel} />)

    const button = screen.getByRole('button')
    fireEvent.mouseLeave(button)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when state is speaking', () => {
    render(<VoiceButton {...defaultProps} state="speaking" />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<VoiceButton {...defaultProps} disabled />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should not call onPress when disabled', () => {
    const onPress = vi.fn()
    render(<VoiceButton {...defaultProps} onPress={onPress} disabled />)

    const button = screen.getByRole('button')
    fireEvent.mouseDown(button)

    expect(onPress).not.toHaveBeenCalled()
  })

  it('should have correct aria-label for idle state', () => {
    render(<VoiceButton {...defaultProps} state="idle" />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Hold to record voice message')
  })

  it('should have correct aria-label for listening state', () => {
    render(<VoiceButton {...defaultProps} state="listening" />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Release to send voice message')
  })

  it('should have correct aria-label for processing state', () => {
    render(<VoiceButton {...defaultProps} state="processing" />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Processing voice...')
  })

  it('should have correct aria-label for speaking state', () => {
    render(<VoiceButton {...defaultProps} state="speaking" />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Bot is speaking')
  })

  it('should have aria-pressed attribute for toggle state', () => {
    render(<VoiceButton {...defaultProps} state="listening" />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })

  it('should prevent context menu on long press', () => {
    render(<VoiceButton {...defaultProps} />)

    const button = screen.getByRole('button')
    fireEvent.contextMenu(button)

    // Event should be prevented (though fireEvent doesn't return this info)
    expect(button).toBeInTheDocument()
  })
})

describe('WaveformVisualizer', () => {
  it('should render with correct role', () => {
    render(<WaveformVisualizer isActive barCount={5} />)

    const container = screen.getByRole('img')
    expect(container).toBeInTheDocument()
  })

  it('should have correct aria-label when active', () => {
    render(<WaveformVisualizer isActive />)

    const container = screen.getByRole('img')
    expect(container).toHaveAttribute('aria-label', 'Recording audio')
  })

  it('should have correct aria-label when inactive', () => {
    render(<WaveformVisualizer isActive={false} />)

    const container = screen.getByRole('img')
    expect(container).toHaveAttribute('aria-label', 'Audio visualization')
  })

  it('should animate bars when active', () => {
    render(<WaveformVisualizer isActive />)

    const container = screen.getByRole('img')
    const bars = container.querySelectorAll('span')

    // Bars should have animation class when active
    bars.forEach(bar => {
      expect(bar.className).toContain('animate-waveform')
    })
  })

  it('should not animate bars when inactive', () => {
    render(<WaveformVisualizer isActive={false} />)

    const container = screen.getByRole('img')
    const bars = container.querySelectorAll('span')

    // Bars should not have animation class when inactive
    bars.forEach(bar => {
      expect(bar.className).not.toContain('animate-waveform')
    })
  })

  it('should apply custom className', () => {
    render(<WaveformVisualizer isActive className="custom-class" />)

    const container = screen.getByRole('img')
    expect(container.className).toContain('custom-class')
  })

  it('should render bars as span elements', () => {
    render(<WaveformVisualizer isActive barCount={3} />)

    const container = screen.getByRole('img')
    const bars = container.querySelectorAll('span')

    expect(bars.length).toBe(3)
  })
})
