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

const signature = (m: ChatMessage): string => `${m.sender}|${contentOf(m).trim()}`

/**
 * Reconcile the LOCAL message list with the SERVER's authoritative transcript
 * (the `chat_history` socket event). The server is the source of truth, so its
 * messages REPLACE the local list — this kills the duplication/pile-up that came
 * from the old client-side voice dump (different ids for the same logical turn).
 *
 * Only genuinely LOCAL in-flight messages are preserved: those NEWER than the
 * server's newest message AND not already represented on the server (by id, and by
 * sender+content signature to survive small clock skew). That keeps an optimistic
 * just-sent text from disappearing before it persists, without re-introducing dupes.
 *
 * When the server sends an empty history, the local list is kept untouched (the
 * widget falls back to its localStorage fast-paint cache).
 */
export function mergeServerHistory(local: ChatMessage[], server: ChatMessage[]): ChatMessage[] {
  if (!server || server.length === 0) return local

  const newestServerTs = server.reduce((max, m) => Math.max(max, ts(m)), 0)
  const serverIds = new Set(server.map(m => m.id))
  const serverSignatures = new Set(server.map(signature))

  const inFlight = local.filter(
    m => !serverIds.has(m.id) && ts(m) > newestServerTs && !serverSignatures.has(signature(m))
  )

  return [...server, ...inFlight].sort((a, b) => ts(a) - ts(b))
}
