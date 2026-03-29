'use client'

import { memo, useCallback } from 'react'

interface SuggestedQuestionsProps {
  questions: string[]
  onSelect: (question: string) => void
}

/**
 * SuggestedQuestions — Clickable bubble chips shown before the first message.
 * When a user clicks one, it sends that question as a user message.
 * Renders above the input area, horizontally scrollable.
 */
export const SuggestedQuestions = memo(function SuggestedQuestions({
  questions,
  onSelect,
}: SuggestedQuestionsProps) {
  const handleClick = useCallback(
    (q: string) => {
      onSelect(q)
    },
    [onSelect]
  )

  if (!questions || questions.length === 0) return null

  return (
    <div className="px-4 pb-2 pt-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <p
        className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-50"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        Preguntas frecuentes
      </p>
      <div className="flex flex-wrap gap-1.5">
        {questions.map((q, i) => (
          <button
            key={`sq-${i}`}
            onClick={() => handleClick(q)}
            className="px-3 py-1.5 text-[11px] font-semibold rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-95 text-left leading-tight"
            style={{
              color: 'hsl(var(--foreground))',
              backgroundColor: 'hsl(var(--muted) / 0.3)',
              borderColor: 'hsl(var(--border) / 0.6)',
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
})
