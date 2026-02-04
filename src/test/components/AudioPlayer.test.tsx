/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithI18n } from '../utils/i18n-test-utils'
import userEvent from '@testing-library/user-event'
import { AudioPlayer } from '../../chat-widget/components/AudioPlayer'

describe('AudioPlayer', () => {
  // Helper to simulate audio ready state
  const simulateAudioReady = (audioElement: HTMLAudioElement) => {
    Object.defineProperty(audioElement, 'duration', {
      value: 120,
      writable: true,
    })
    audioElement.dispatchEvent(new Event('loadedmetadata'))
    audioElement.dispatchEvent(new Event('canplaythrough'))
  }

  describe('Rendering', () => {
    it('should render audio player with play button', () => {
      const { container } = renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()

      const audio = container.querySelector('audio')
      expect(audio).toBeInTheDocument()
      expect(audio).toHaveAttribute('src', 'https://example.com/audio.mp3')
    })

    it('should show loading state initially', () => {
      renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should display duration after audio loads', async () => {
      const { container } = renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const audioElement = container.querySelector('audio')!
      simulateAudioReady(audioElement)

      await waitFor(() => {
        const button = screen.getByRole('button')
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('Playback Controls', () => {
    it('should play audio when play button is clicked', async () => {
      const { container } = renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const audioElement = container.querySelector('audio')!
      const playSpy = vi.spyOn(audioElement, 'play').mockResolvedValue(undefined)

      simulateAudioReady(audioElement)

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled()
      })

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(playSpy).toHaveBeenCalled()
    })

    it('should pause audio when pause button is clicked', async () => {
      const { container } = renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const audioElement = container.querySelector('audio')!
      const playSpy = vi.spyOn(audioElement, 'play').mockResolvedValue(undefined)
      const pauseSpy = vi.spyOn(audioElement, 'pause')

      simulateAudioReady(audioElement)

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled()
      })

      const button = screen.getByRole('button')
      await userEvent.click(button)
      expect(playSpy).toHaveBeenCalled()

      await userEvent.click(button)
      expect(pauseSpy).toHaveBeenCalled()
    })
  })

  describe('Progress Tracking', () => {
    it('should display progress bar', () => {
      const { container } = renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const progressBar = container.querySelector('.bg-current\\/20')
      expect(progressBar).toBeInTheDocument()
    })

    it('should update progress as audio plays', async () => {
      const { container } = renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const audioElement = container.querySelector('audio')!

      Object.defineProperty(audioElement, 'duration', {
        value: 100,
        writable: true,
      })

      Object.defineProperty(audioElement, 'currentTime', {
        value: 50,
        writable: true,
      })

      audioElement.dispatchEvent(new Event('loadedmetadata'))
      audioElement.dispatchEvent(new Event('canplaythrough'))
      audioElement.dispatchEvent(new Event('timeupdate'))

      await waitFor(() => {
        const progressIndicator = container.querySelector('.absolute.h-full')
        expect(progressIndicator).toHaveStyle({ width: '50%' })
      })
    })

    it('should reset to play button when audio ends', async () => {
      const { container } = renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const audioElement = container.querySelector('audio')!
      vi.spyOn(audioElement, 'play').mockResolvedValue(undefined)

      simulateAudioReady(audioElement)

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled()
      })

      const button = screen.getByRole('button')
      await userEvent.click(button)

      audioElement.dispatchEvent(new Event('ended'))

      await waitFor(() => {
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error state when audio fails to load', async () => {
      const { container } = renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const audioElement = container.querySelector('audio')!
      audioElement.dispatchEvent(new Event('error'))

      await waitFor(() => {
        expect(screen.getByText('No se pudo cargar')).toBeInTheDocument()
      })
    })

    it('should show retry button on error', async () => {
      const { container } = renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const audioElement = container.querySelector('audio')!
      audioElement.dispatchEvent(new Event('error'))

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /reintentar/i })
        expect(retryButton).toBeInTheDocument()
      })
    })

    it('should reload audio when retry button is clicked', async () => {
      const { container } = renderWithI18n(<AudioPlayer url="https://example.com/audio.mp3" isBot={true} />)

      const audioElement = container.querySelector('audio')!
      const loadSpy = vi.spyOn(audioElement, 'load')
      
      audioElement.dispatchEvent(new Event('error'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /reintentar/i })
      await userEvent.click(retryButton)

      expect(loadSpy).toHaveBeenCalled()
    })
  })

  describe('Styling', () => {
    it('should apply different styles for bot vs user messages', () => {
      const { container: botContainer } = renderWithI18n(
        <AudioPlayer url="https://example.com/audio.mp3" isBot={true} />
      )

      const { container: userContainer } = renderWithI18n(
        <AudioPlayer url="https://example.com/audio.mp3" isBot={false} />
      )

      const botWrapper = botContainer.querySelector('.text-foreground')
      const userWrapper = userContainer.querySelector('.text-primary-foreground')

      expect(botWrapper).toBeInTheDocument()
      expect(userWrapper).toBeInTheDocument()
    })
  })

  describe('Audio Format Support', () => {
    it('should handle different audio formats', () => {
      const formats = ['audio.mp3', 'audio.ogg', 'audio.wav', 'audio.m4a']

      formats.forEach(file => {
        const { container, unmount } = renderWithI18n(
          <AudioPlayer url={`https://example.com/${file}`} isBot={true} />
        )

        const audio = container.querySelector('audio')
        expect(audio).toHaveAttribute('src', `https://example.com/${file}`)

        unmount()
      })
    })
  })
})
