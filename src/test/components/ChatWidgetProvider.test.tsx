/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatWidgetProvider, useChatWidget } from '../../chat-widget/ChatWidgetProvider'

// The provider renders the full ChatWidget (opens a socket / loads Three.js).
// Stub it — we only exercise the context API here.
vi.mock('../../chat-widget/ChatWidget', () => ({
  ChatWidget: () => null,
}))

function Consumer() {
  const chat = useChatWidget()
  return (
    <div>
      <span data-testid="open">{String(chat.isOpen)}</span>
      <button onClick={chat.startCall}>start</button>
      <button onClick={chat.open}>open</button>
    </div>
  )
}

describe('ChatWidgetProvider — startCall', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('opens the widget AND dispatches botuyo-chat:start-call', async () => {
    const onStartCall = vi.fn()
    window.addEventListener('botuyo-chat:start-call', onStartCall)
    const user = userEvent.setup()

    render(
      <ChatWidgetProvider apiKey="test-key">
        <Consumer />
      </ChatWidgetProvider>
    )

    expect(screen.getByTestId('open').textContent).toBe('false')

    await user.click(screen.getByRole('button', { name: 'start' }))

    expect(screen.getByTestId('open').textContent).toBe('true')
    expect(onStartCall).toHaveBeenCalledTimes(1)

    window.removeEventListener('botuyo-chat:start-call', onStartCall)
  })

  it('does NOT dispatch start-call for a plain open()', async () => {
    const onStartCall = vi.fn()
    window.addEventListener('botuyo-chat:start-call', onStartCall)
    const user = userEvent.setup()

    render(
      <ChatWidgetProvider apiKey="test-key">
        <Consumer />
      </ChatWidgetProvider>
    )

    await user.click(screen.getByRole('button', { name: 'open' }))

    expect(screen.getByTestId('open').textContent).toBe('true')
    expect(onStartCall).not.toHaveBeenCalled()

    window.removeEventListener('botuyo-chat:start-call', onStartCall)
  })
})
