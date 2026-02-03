/**
 * @package @botuyo/chat-widget
 * Voice State Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVoiceState } from '../useVoiceState'

describe('useVoiceState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('should start in idle state', () => {
      const { result } = renderHook(() => useVoiceState())

      expect(result.current.state).toBe('idle')
      expect(result.current.recordingDuration).toBe(0)
    })
  })

  describe('state transitions', () => {
    it('should transition from idle to listening', () => {
      const { result } = renderHook(() => useVoiceState())

      act(() => {
        result.current.transition('listening')
      })

      expect(result.current.state).toBe('listening')
    })

    it('should transition from listening to processing', () => {
      const { result } = renderHook(() => useVoiceState())

      act(() => {
        result.current.transition('listening')
      })

      act(() => {
        result.current.transition('processing')
      })

      expect(result.current.state).toBe('processing')
    })

    it('should transition from processing to speaking', () => {
      const { result } = renderHook(() => useVoiceState())

      act(() => {
        result.current.transition('listening')
      })
      act(() => {
        result.current.transition('processing')
      })
      act(() => {
        result.current.transition('speaking')
      })

      expect(result.current.state).toBe('speaking')
    })

    it('should transition from speaking to idle', () => {
      const { result } = renderHook(() => useVoiceState())

      // Go through full cycle
      act(() => result.current.transition('listening'))
      act(() => result.current.transition('processing'))
      act(() => result.current.transition('speaking'))
      act(() => result.current.transition('idle'))

      expect(result.current.state).toBe('idle')
    })

    it('should always allow transition to idle from any state', () => {
      const { result } = renderHook(() => useVoiceState())

      // From listening
      act(() => result.current.transition('listening'))
      act(() => result.current.transition('idle'))
      expect(result.current.state).toBe('idle')

      // From processing
      act(() => result.current.transition('listening'))
      act(() => result.current.transition('processing'))
      act(() => result.current.transition('idle'))
      expect(result.current.state).toBe('idle')

      // From speaking
      act(() => result.current.transition('listening'))
      act(() => result.current.transition('processing'))
      act(() => result.current.transition('speaking'))
      act(() => result.current.transition('idle'))
      expect(result.current.state).toBe('idle')
    })

    it('should ignore invalid transitions', () => {
      const { result } = renderHook(() => useVoiceState())
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // Try to go from idle to speaking (invalid)
      act(() => {
        result.current.transition('speaking')
      })

      expect(result.current.state).toBe('idle')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid voice state transition')
      )

      consoleSpy.mockRestore()
    })

    it('should not allow transition from idle to processing directly', () => {
      const { result } = renderHook(() => useVoiceState())
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      act(() => {
        result.current.transition('processing')
      })

      expect(result.current.state).toBe('idle')
      consoleSpy.mockRestore()
    })
  })

  describe('recording timer', () => {
    it('should start timer when transitioning to listening', () => {
      const { result } = renderHook(() => useVoiceState())

      act(() => {
        result.current.transition('listening')
      })

      expect(result.current.recordingDuration).toBe(0)

      // Advance 1 second
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(result.current.recordingDuration).toBe(1)

      // Advance 3 more seconds
      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.recordingDuration).toBe(4)
    })

    it('should stop timer when transitioning away from listening', () => {
      const { result } = renderHook(() => useVoiceState())

      act(() => {
        result.current.transition('listening')
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.recordingDuration).toBe(5)

      act(() => {
        result.current.transition('processing')
      })

      // Timer should stop, duration should persist
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(result.current.recordingDuration).toBe(5) // Should not increase
    })

    it('should reset timer when going back to idle', () => {
      const { result } = renderHook(() => useVoiceState())

      act(() => result.current.transition('listening'))
      act(() => vi.advanceTimersByTime(5000))

      expect(result.current.recordingDuration).toBe(5)

      act(() => result.current.transition('idle'))

      expect(result.current.recordingDuration).toBe(0)
    })
  })

  describe('max duration', () => {
    it('should call onMaxDurationReached when max is reached', () => {
      const onMaxDurationReached = vi.fn()

      const { result } = renderHook(() =>
        useVoiceState({
          maxDuration: 5,
          onMaxDurationReached,
        })
      )

      act(() => {
        result.current.transition('listening')
      })

      // Advance to 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(onMaxDurationReached).toHaveBeenCalledTimes(1)
    })

    it('should use default max duration of 60 seconds', () => {
      const onMaxDurationReached = vi.fn()

      const { result } = renderHook(() =>
        useVoiceState({
          onMaxDurationReached,
        })
      )

      act(() => {
        result.current.transition('listening')
      })

      // Advance to 59 seconds - should not trigger
      act(() => {
        vi.advanceTimersByTime(59000)
      })

      expect(onMaxDurationReached).not.toHaveBeenCalled()

      // Advance one more second - should trigger
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(onMaxDurationReached).toHaveBeenCalledTimes(1)
    })
  })

  describe('callbacks', () => {
    it('should call onStateChange when state changes', () => {
      const onStateChange = vi.fn()

      const { result } = renderHook(() => useVoiceState({ onStateChange }))

      act(() => {
        result.current.transition('listening')
      })

      expect(onStateChange).toHaveBeenCalledWith('listening')

      act(() => {
        result.current.transition('processing')
      })

      expect(onStateChange).toHaveBeenCalledWith('processing')
    })
  })

  describe('reset', () => {
    it('should reset to idle state', () => {
      const onStateChange = vi.fn()

      const { result } = renderHook(() => useVoiceState({ onStateChange }))

      act(() => result.current.transition('listening'))
      act(() => vi.advanceTimersByTime(5000))
      act(() => result.current.transition('processing'))

      expect(result.current.state).toBe('processing')
      expect(result.current.recordingDuration).toBe(5)

      act(() => {
        result.current.reset()
      })

      expect(result.current.state).toBe('idle')
      expect(result.current.recordingDuration).toBe(0)
      expect(onStateChange).toHaveBeenLastCalledWith('idle')
    })
  })
})
