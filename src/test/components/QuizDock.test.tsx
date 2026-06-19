/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QuizDock } from '../../chat-widget/components/QuizDock'
import type { ButtonsMessage } from '../../chat-widget/types'

const quiz: ButtonsMessage = {
  id: 'q1',
  type: 'buttons',
  sender: 'bot',
  timestamp: new Date(),
  content: 'Pick one',
  buttons: [
    { id: 'a', label: 'Option A' },
    { id: 'b', label: 'Option B' },
  ],
}

describe('QuizDock', () => {
  it('renders the question and options in a pinned dock', () => {
    render(<QuizDock quiz={quiz} onAnswer={() => {}} />)
    expect(screen.getByTestId('quiz-dock')).toBeInTheDocument()
    expect(screen.getByText('Pick one')).toBeInTheDocument()
    expect(screen.getByText('Option A')).toBeInTheDocument()
    expect(screen.getByText('Option B')).toBeInTheDocument()
  })

  it('renders a letter badge per option', () => {
    render(<QuizDock quiz={quiz} onAnswer={() => {}} />)
    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('calls onAnswer with the label and button id when an option is tapped', () => {
    const onAnswer = vi.fn()
    render(<QuizDock quiz={quiz} onAnswer={onAnswer} />)
    fireEvent.click(screen.getByText('Option B'))
    expect(onAnswer).toHaveBeenCalledWith('Option B', 'b')
  })
})
