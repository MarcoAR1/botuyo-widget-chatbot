import type { ChatMessage, ButtonsMessage } from '../types'

/**
 * Returns the "active" quiz to pin — the most recent unanswered `buttons` message —
 * or `null` if there is none. Scans from the end so the latest question wins.
 *
 * A quiz is "active" until the user resolves it (taps an option, or moves on by typing),
 * at which point it is marked `answered` and filed back into the transcript as history.
 * Pinning the active quiz keeps the question + options on screen while the bot keeps
 * talking, instead of scrolling away with the rest of the transcript.
 */
export function getActiveQuiz(messages: ChatMessage[]): ButtonsMessage | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.type === 'buttons' && !(m as ButtonsMessage).answered) {
      return m as ButtonsMessage
    }
  }
  return null
}
