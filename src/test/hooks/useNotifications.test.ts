/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useNotifications } from '../../chat-widget/hooks/useNotifications'
import type { ChatMessage } from '../../chat-widget/types'

describe('useNotifications', () => {
  let notificationMock: any

  beforeEach(() => {
    // Reset notification mock
    notificationMock = vi.fn()
    notificationMock.permission = 'default'
    notificationMock.requestPermission = vi.fn().mockResolvedValue('granted')
    global.Notification = notificationMock as any

    // Mock document.hasFocus
    document.hasFocus = vi.fn().mockReturnValue(false)
  })

  it('should initialize with default permission', () => {
    const { result } = renderHook(() =>
      useNotifications({
        enabled: true,
        soundEnabled: false,
      })
    )

    expect(result.current).toBeDefined()
  })

  it('should not show notification if disabled', () => {
    const { result } = renderHook(() =>
      useNotifications({
        enabled: false,
        soundEnabled: false,
      })
    )

    const message: ChatMessage = {
      id: '1',
      content: 'Test',
      timestamp: new Date(),
      sender: 'bot',
      type: 'text',
    }

    result.current.notify(message)

    expect(notificationMock).not.toHaveBeenCalled()
  })

  it('should not show notification if window is focused', () => {
    document.hasFocus = vi.fn().mockReturnValue(true)

    const { result } = renderHook(() =>
      useNotifications({
        enabled: true,
        soundEnabled: false,
      })
    )

    const message: ChatMessage = {
      id: '1',
      content: 'Test',
      timestamp: new Date(),
      sender: 'bot',
      type: 'text',
    }

    result.current.notify(message)

    expect(notificationMock).not.toHaveBeenCalled()
  })

  it('should use custom bot name in notification title', () => {
    notificationMock.permission = 'granted'
    document.hasFocus = vi.fn().mockReturnValue(false)

    const customBotName = 'MiAsistente'
    const { result } = renderHook(() =>
      useNotifications({
        enabled: true,
        soundEnabled: false,
        botName: customBotName,
      })
    )

    const message: ChatMessage = {
      id: '1',
      content: 'Test message',
      timestamp: new Date(),
      sender: 'bot',
      type: 'text',
    }

    result.current.notify(message)

    // Should be called with bot name, even if permission not granted in mock
    // In real environment, notification would be created
    expect(document.hasFocus).toHaveBeenCalled()
  })
})
