import type { ButtonsMessage } from '../types'
import { getPrimaryColor } from '../utils/theme'

interface QuizDockProps {
  quiz: ButtonsMessage
  primaryColor?: string
  /** Called when the user taps an option. Receives the option label + its id. */
  onAnswer: (label: string, buttonId: string) => void
}

/**
 * Pinned quiz dock — keeps the active question + options on screen (just above the
 * input) so they never scroll away while the bot keeps talking. Tapping an option
 * resolves the quiz, which then files back into the transcript as history.
 */
export function QuizDock({ quiz, primaryColor, onAnswer }: QuizDockProps) {
  const brandColor = getPrimaryColor({ primaryColor })

  return (
    <div
      data-testid="quiz-dock"
      className="shrink-0 border-t animate-in fade-in slide-in-from-bottom-2 duration-300"
      style={{
        paddingLeft: 'var(--spacing-5)',
        paddingRight: 'var(--spacing-5)',
        paddingTop: 'var(--spacing-3)',
        paddingBottom: 'var(--spacing-3)',
        backgroundColor: 'hsl(var(--background))',
        borderColor: 'hsl(var(--border))',
      }}
    >
      <div
        className="rounded-2xl border p-3"
        style={{
          backgroundColor: 'hsl(var(--muted) / 0.4)',
          borderColor: `${brandColor}33`,
        }}
      >
        <p className="text-sm font-semibold mb-2 text-foreground break-words leading-snug">
          {quiz.content}
        </p>
        <div className="flex flex-col gap-2">
          {quiz.buttons.map((btn, i) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => onAnswer(btn.label, btn.id)}
              className="w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-md active:scale-[0.97]"
              style={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            >
              <span className="flex items-center gap-3">
                <span
                  className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-black shrink-0"
                  style={{ backgroundColor: brandColor, color: 'white' }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{btn.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
