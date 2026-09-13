export type NavigationStatus = 'completed' | 'failed' | 'delegated'

/** Only same-origin local destinations from a server navigation request are accepted. */
export async function performNavigation(
  path: string,
  onNavigate?: (path: string) => void | Promise<void>
): Promise<NavigationStatus> {
  if (
    !/^(#[^\s]+|\/(?!\/)[^\s]*)$/.test(path) ||
    [...path].some(c => c === '\\' || c.charCodeAt(0) < 32)
  )
    return 'failed'
  try {
    const target = new URL(path, window.location.href)
    if (target.origin !== window.location.origin) return 'failed'
    if (
      target.pathname === window.location.pathname &&
      target.search === window.location.search &&
      target.hash
    ) {
      const section = document.getElementById(decodeURIComponent(target.hash.slice(1)))
      if (!section) return 'failed'
      section.scrollIntoView({ behavior: 'auto', block: 'start' })
      window.history.replaceState(window.history.state, '', target.href)
      return 'completed'
    }
    if (onNavigate) {
      await onNavigate(path)
      return window.location.href === target.href ? 'completed' : 'delegated'
    }
    // A full-page navigation cannot confirm completion before this document unloads.
    window.location.assign(target.href)
    return 'delegated'
  } catch {
    return 'failed'
  }
}
