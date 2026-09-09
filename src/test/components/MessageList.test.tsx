/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithI18n } from '../utils/i18n-test-utils'
import { MessageList } from '../../chat-widget/components/MessageList'
import type { ChatMessage } from '../../chat-widget/types'

beforeAll(() => {
  // The list auto-scrolls on update; happy-dom doesn't implement scrollIntoView.
  Element.prototype.scrollIntoView = vi.fn()
})

describe('MessageList', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all messages', () => {
    const messages: ChatMessage[] = [
      { id: 'a', type: 'text', content: 'hello', sender: 'user', timestamp: new Date() },
      { id: 'b', type: 'text', content: 'world', sender: 'bot', timestamp: new Date() },
    ]

    renderWithI18n(<MessageList messages={messages} isTyping={false} />)

    expect(screen.getByText('hello')).toBeInTheDocument()
    expect(screen.getByText('world')).toBeInTheDocument()
  })

  it('refreshes content with unchanged length, IDs and timestamps', () => {
    const message: ChatMessage = { id: 'same', type: 'text', content: 'old content', sender: 'bot', timestamp: new Date() }
    const { rerender } = renderWithI18n(<MessageList messages={[message]} isTyping={false} />)
    rerender(<MessageList messages={[{ ...message, content: 'restored content' }]} isTyping={false} />)
    expect(screen.queryByText('old content')).not.toBeInTheDocument()
    expect(screen.getByText('restored content')).toBeInTheDocument()
  })

  it('uses the latest callback when message identities do not change', () => {
    const first = vi.fn()
    const latest = vi.fn()
    const messages: ChatMessage[] = [{ id: 'quiz', type: 'buttons', content: 'Choose', sender: 'bot', timestamp: new Date(), buttons: [{ id: 'a', label: 'Option A' }] }]
    const { rerender } = renderWithI18n(<MessageList messages={messages} isTyping={false} onButtonClick={first} />)
    rerender(<MessageList messages={messages} isTyping={false} onButtonClick={latest} />)
    screen.getByRole('button', { name: /Option A/ }).click()
    expect(latest).toHaveBeenCalledOnce()
    expect(first).not.toHaveBeenCalled()
  })

  it('disables quiz buttons when the answer arrives through history', () => {
    const message: ChatMessage = { id: 'quiz', type: 'buttons', content: 'Choose', sender: 'bot', timestamp: new Date(), buttons: [{ id: 'a', label: 'Option A' }] }
    const { rerender } = renderWithI18n(<MessageList messages={[message]} isTyping={false} />)
    rerender(<MessageList messages={[{ ...message, answered: true, selectedId: 'a' }]} isTyping={false} />)
    expect(screen.getByRole('button', { name: /Option A/ })).toBeDisabled()
  })

  it('does not collide React keys when two messages share the same id', () => {
    // Regression: a server transcript that repeats a message id rendered with
    // key={message.id} produced duplicate React keys, which corrupts reconciliation
    // (a single bot message visually split around the user's message). Keys must be
    // unique even when message.id repeats.
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const messages: ChatMessage[] = [
      { id: 'dup', type: 'text', content: 'first', sender: 'bot', timestamp: new Date() },
      { id: 'dup', type: 'text', content: 'second', sender: 'bot', timestamp: new Date() },
      { id: 'dup__1', type: 'text', content: 'third', sender: 'bot', timestamp: new Date() },
    ]

    renderWithI18n(<MessageList messages={messages} isTyping={false} />)

    // Both messages still render (no content lost).
    expect(screen.getByText('first')).toBeInTheDocument()
    expect(screen.getByText('second')).toBeInTheDocument()
    expect(screen.getByText('third')).toBeInTheDocument()

    // React must NOT warn about duplicate keys.
    const duplicateKeyWarning = errorSpy.mock.calls.some(call =>
      call.some(arg => typeof arg === 'string' && /same key|two children with the same key/i.test(arg))
    )
    expect(duplicateKeyWarning).toBe(false)
  })
})
