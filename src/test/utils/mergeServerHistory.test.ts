import { describe, it, expect } from 'vitest'
import { mergeServerHistory } from '@/chat-widget/utils/mergeServerHistory'
import type { ChatMessage } from '@/chat-widget/types'

const ids = (list: ChatMessage[]): string[] => list.map(m => m.id)

const msg = (over: Partial<ChatMessage> & { id: string }): ChatMessage =>
  ({
    type: 'text',
    sender: 'user',
    content: '',
    timestamp: new Date('2026-01-01T10:00:00.000Z'),
    ...over,
  }) as ChatMessage

describe('mergeServerHistory — server-authoritative reconciliation', () => {
  it('returns the local list untouched when the server history is empty', () => {
    const local = [msg({ id: 'a' }), msg({ id: 'b' })]
    expect(mergeServerHistory(local, [])).toBe(local)
  })

  it('replaces local messages with the server transcript (kills duplication)', () => {
    // Same logical turns, DIFFERENT ids (the old voice-dump duplication scenario)
    const local = [
      msg({ id: 'voice-1', sender: 'user', content: 'hola', timestamp: new Date('2026-01-01T10:00:00Z') }),
      msg({ id: 'voice-2', sender: 'bot', content: 'buenas', timestamp: new Date('2026-01-01T10:00:01Z') }),
    ]
    const server = [
      msg({ id: 'srv-1', sender: 'user', content: 'hola', timestamp: new Date('2026-01-01T10:00:00Z') }),
      msg({ id: 'srv-2', sender: 'bot', content: 'buenas', timestamp: new Date('2026-01-01T10:00:01Z') }),
    ]

    const result = mergeServerHistory(local, server)

    expect(ids(result)).toEqual(['srv-1', 'srv-2'])
  })

  it('preserves a local in-flight message newer than the server and not on the server', () => {
    const server = [
      msg({ id: 'srv-1', sender: 'user', content: 'hola', timestamp: new Date('2026-01-01T10:00:00Z') }),
    ]
    const local = [
      msg({ id: 'srv-1-localcopy', sender: 'user', content: 'hola', timestamp: new Date('2026-01-01T10:00:00Z') }),
      msg({ id: 'temp-99', sender: 'user', content: 'recién enviado', timestamp: new Date('2026-01-01T10:05:00Z') }),
    ]

    const result = mergeServerHistory(local, server)

    expect(ids(result)).toEqual(['srv-1', 'temp-99'])
  })

  it('does NOT re-add an in-flight message that the server already has by content (clock-skew safe)', () => {
    const server = [
      msg({ id: 'srv-1', sender: 'user', content: 'hola', timestamp: new Date('2026-01-01T10:00:00.000Z') }),
    ]
    // Optimistic copy is a few ms NEWER than the server's persisted ts but same content+sender
    const local = [
      msg({ id: 'temp-1', sender: 'user', content: 'hola', timestamp: new Date('2026-01-01T10:00:00.500Z') }),
    ]

    const result = mergeServerHistory(local, server)

    expect(ids(result)).toEqual(['srv-1'])
  })

  it('drops stale local (older) messages — server is authoritative on reload', () => {
    const local = [
      msg({ id: 'old-1', sender: 'bot', content: 'antiguo', timestamp: new Date('2026-01-01T09:00:00Z') }),
    ]
    const server = [
      msg({ id: 'srv-1', sender: 'user', content: 'nuevo', timestamp: new Date('2026-01-01T10:00:00Z') }),
    ]

    const result = mergeServerHistory(local, server)

    expect(ids(result)).toEqual(['srv-1'])
  })

  it('orders the merged transcript chronologically by timestamp (defensive against server order)', () => {
    // Server delivered OUT of chronological order; the widget must not rely on it.
    const server = [
      msg({ id: 's-late', sender: 'bot', content: 'b', timestamp: new Date('2026-01-01T10:00:02Z') }),
      msg({ id: 's-early', sender: 'user', content: 'a', timestamp: new Date('2026-01-01T10:00:00Z') }),
    ]
    // A genuine in-flight message, newer than everything on the server.
    const local = [
      msg({ id: 'temp-1', sender: 'user', content: 'c', timestamp: new Date('2026-01-01T10:00:05Z') }),
    ]

    const result = mergeServerHistory(local, server)

    expect(ids(result)).toEqual(['s-early', 's-late', 'temp-1'])
  })

  it('keeps a stable order for messages sharing the same timestamp', () => {
    const sameTs = new Date('2026-01-01T10:00:00.000Z')
    const server = [
      msg({ id: 's-1', sender: 'user', content: 'first', timestamp: sameTs }),
      msg({ id: 's-2', sender: 'bot', content: 'second', timestamp: sameTs }),
    ]

    const result = mergeServerHistory([], server)

    expect(ids(result)).toEqual(['s-1', 's-2'])
  })
})
