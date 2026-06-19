/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import { getActiveQuiz } from '../../chat-widget/utils/activeQuiz'
import type { ChatMessage, ButtonsMessage } from '../../chat-widget/types'

const quiz = (id: string, answered = false): ButtonsMessage => ({
  id,
  type: 'buttons',
  sender: 'bot',
  timestamp: new Date(),
  content: 'Question?',
  buttons: [{ id: 'a', label: 'A' }],
  ...(answered ? { answered: true } : {}),
})

const text = (id: string): ChatMessage => ({
  id,
  type: 'text',
  sender: 'bot',
  timestamp: new Date(),
  content: 'hi',
})

describe('getActiveQuiz', () => {
  it('returns null when there are no messages', () => {
    expect(getActiveQuiz([])).toBeNull()
  })

  it('returns null when there are no quiz messages', () => {
    expect(getActiveQuiz([text('1'), text('2')])).toBeNull()
  })

  it('returns the unanswered quiz (the one to pin)', () => {
    const q = quiz('q1')
    expect(getActiveQuiz([text('1'), q, text('2')])).toBe(q)
  })

  it('ignores an answered quiz', () => {
    expect(getActiveQuiz([quiz('q1', true), text('2')])).toBeNull()
  })

  it('returns the most recent unanswered quiz when several exist', () => {
    const q1 = quiz('q1')
    const q2 = quiz('q2')
    expect(getActiveQuiz([q1, text('x'), q2])).toBe(q2)
  })

  it('skips a more recent answered quiz and pins an earlier unanswered one', () => {
    const q1 = quiz('q1')
    const q2 = quiz('q2', true)
    expect(getActiveQuiz([q1, q2])).toBe(q1)
  })
})
