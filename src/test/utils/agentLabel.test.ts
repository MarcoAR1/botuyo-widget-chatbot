import { describe, it, expect } from 'vitest'
import { composeAgentLabel } from '@/chat-widget/utils/agentLabel'

describe('composeAgentLabel', () => {
  it('joins name and label with a separator', () => {
    expect(composeAgentLabel('Ms. Ellis', 'A2')).toBe('Ms. Ellis · A2')
  })

  it('avoids duplication when the name already contains the label (case-insensitive)', () => {
    expect(composeAgentLabel('Ms. Ellis — A2', 'A2')).toBe('Ms. Ellis — A2')
    expect(composeAgentLabel('Ventas', 'ventas')).toBe('Ventas')
  })

  it('falls back to the label alone when there is no name', () => {
    expect(composeAgentLabel(undefined, 'A2')).toBe('A2')
  })

  it('falls back to the name alone when there is no label', () => {
    expect(composeAgentLabel('Ms. Ellis')).toBe('Ms. Ellis')
  })

  it('returns an empty string when neither is provided', () => {
    expect(composeAgentLabel()).toBe('')
    expect(composeAgentLabel('  ', '  ')).toBe('')
  })

  it('trims surrounding whitespace', () => {
    expect(composeAgentLabel('  Ms. Ellis  ', '  A2 ')).toBe('Ms. Ellis · A2')
  })
})
