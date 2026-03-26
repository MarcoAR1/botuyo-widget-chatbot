import { useState, useEffect, useRef, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { logger } from '../utils/logger'
import cssContent from '../compiled-tailwind.css?raw'

/**
 * Creates a Shadow DOM container in document.body, injects widget CSS,
 * and renders children inside via React Portal.
 * Handles React Strict Mode double-invocation safely.
 */
export function ShadowDOMHost({ children }: { children: ReactNode }) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof document === 'undefined') return

    // Reuse existing container if present (React Strict Mode remount)
    let container = document.getElementById('botuyo-chat-widget-root') as HTMLDivElement | null
    let shadow: ShadowRoot
    let mount: HTMLDivElement

    if (container && container.shadowRoot) {
      // Reuse — already set up from a previous mount
      shadow = container.shadowRoot
      mount = shadow.getElementById('botuyo-chat-widget-root') as HTMLDivElement
        || shadow.querySelector('div') as HTMLDivElement
    } else {
      // Create fresh container + shadow
      container = document.createElement('div')
      container.id = 'botuyo-chat-widget-root'
      document.body.appendChild(container)

      shadow = container.attachShadow({ mode: 'open' })

      // Inject CSS (replace :root with :host for Shadow DOM)
      const style = document.createElement('style')
      style.textContent = cssContent.replace(/:root/g, ':host')
      shadow.appendChild(style)

      // Mount point for React
      mount = document.createElement('div')
      mount.id = 'botuyo-chat-widget-root'
      shadow.appendChild(mount)
    }

    containerRef.current = container
    mountRef.current = mount
    setReady(true)
    logger.debug('ShadowDOMHost initialized')

    return () => {
      if (containerRef.current) {
        containerRef.current.remove()
        containerRef.current = null
        mountRef.current = null
      }
    }
  }, [])

  if (!ready || !mountRef.current) return null

  // Portal renders React children inside Shadow DOM while preserving React context
  return createPortal(children, mountRef.current)
}
