/**
 * Compose a human-friendly display label for an agent/variant switch.
 *
 * Combines the agent name with a short variant label
 * (e.g. "Ms. Ellis" + "A2" → "Ms. Ellis · A2"), avoiding duplication when the
 * name already contains the label (e.g. "Ms. Ellis — A2" + "A2" → unchanged).
 * Used by the `agent_switched` flow to update the header + system bubble.
 */
export function composeAgentLabel(name?: string, label?: string): string {
  const n = (name || '').trim()
  const l = (label || '').trim()
  if (n && l && !n.toLowerCase().includes(l.toLowerCase())) return `${n} · ${l}`
  return n || l
}
