import type { ChatMessage } from '../types'

const ts = (m: ChatMessage): number => {
  const t = new Date(m.timestamp as unknown as string).getTime()
  return Number.isFinite(t) ? t : 0
}

// ChatMessage is a union; only some variants carry `content`. Read it type-safely.
const contentOf = (m: ChatMessage): string => {
  const c = (m as { content?: string }).content
  return typeof c === 'string' ? c : ''
}

// Only textual turns can be compared by content. Images/locations without
// `content` used to all share the same empty signature and disappear on resume.
const signature = (m: ChatMessage): string | null =>
  (m.type === 'text' || m.type === 'system') && contentOf(m).trim()
    ? JSON.stringify([m.type, m.sender, contentOf(m).trim()])
    : null

const CLOCK_SKEW_WINDOW_MS = 30_000

/**
 * Reconcile the LOCAL message list with the SERVER's authoritative transcript
 * (the `chat_history` socket event). The server is the source of truth, so its
 * messages REPLACE the local list — this kills the duplication/pile-up that came
 * from the old client-side voice dump (different ids for the same logical turn).
 *
 * Only genuinely LOCAL in-flight messages are preserved: those NEWER than the
 * server's newest message AND not already represented on the server (by id, and by
 * type+sender+content within 30 seconds to survive small clock skew). That keeps an optimistic
 * just-sent text from disappearing before it persists, without re-introducing dupes.
 *
 * When the server sends an empty history, the local list is kept untouched (the
 * widget falls back to its localStorage fast-paint cache).
 */
export function mergeServerHistory(local: ChatMessage[], server: ChatMessage[]): ChatMessage[] {
  if (!server || server.length === 0) return local

  const newestServerTs = server.reduce((max, m) => Math.max(max, ts(m)), 0)
  const serverIds = new Set(server.map(m => m.id))
  const localIds = new Set(local.map(m => m.id))
  const unmatchedServer = server.filter(m => !localIds.has(m.id))

  const inFlight = local.filter(
    m => {
      if (serverIds.has(m.id) || ts(m) <= newestServerTs) return false
      const key = signature(m)
      const match = key === null ? -1 : unmatchedServer.findIndex(s =>
        signature(s) === key && Math.abs(ts(s) - ts(m)) <= CLOCK_SKEW_WINDOW_MS
      )
      if (match < 0) return true
      // One server turn can reconcile only one optimistic turn.
      unmatchedServer.splice(match, 1)
      return false
    }
  )

  return [...server, ...inFlight].sort((a, b) => ts(a) - ts(b))
}
