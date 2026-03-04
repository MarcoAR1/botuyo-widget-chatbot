/**
 * ShadowChatWidget — Shadow DOM wrapper for ChatWidget React component
 * 
 * Self-contained wrapper that provides:
 * - Shadow DOM for CSS isolation
 * - Built-in Error Boundary (consumers don't need to wrap)
 * - Auto dark mode detection (observes data-theme + prefers-color-scheme)
 * - Lazy loading with Suspense
 * 
 * Used when the widget is imported as an npm React component (not CDN).
 * The standalone/CDN version handles Shadow DOM in standalone.tsx.
 */

import React, { Component, useEffect, useRef, useState, type FC, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ChatWidgetProps } from './src/chat-widget/types';
import cssContent from './styles.css?inline';

// ── Built-in Error Boundary ─────────────────────────────
class WidgetErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[BotUyoWidget] Internal error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) return null; // Silently fail — never break host page
    return this.props.children;
  }
}

// ── Dark Mode CSS Variables ─────────────────────────────
const DARK_CSS_VARS: Record<string, string> = {
  '--background': '240 10% 3.9%',
  '--foreground': '0 0% 98%',
  '--card': '240 10% 3.9%',
  '--cardForeground': '0 0% 98%',
  '--primary': '160 84% 39%',
  '--primaryForeground': '0 0% 100%',
  '--muted': '240 3.7% 15.9%',
  '--mutedForeground': '240 5% 64.9%',
  '--border': '240 3.7% 15.9%',
};

function detectDarkMode(): boolean {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Lazy-load ChatWidget to preserve code splitting
const ChatWidget = React.lazy(() =>
  import('./src/chat-widget/ChatWidget').then(module => ({
    default: module.ChatWidget
  }))
);

/**
 * Shadow DOM wrapper that renders ChatWidget inside an isolated shadow root.
 * All props are forwarded to the inner ChatWidget.
 * 
 * Includes:
 * - Error Boundary (crashes render null, never break host page)
 * - Auto dark mode (observes host page data-theme + prefers-color-scheme)
 */
export const ShadowChatWidget: FC<ChatWidgetProps> = (props) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const reactRootRef = useRef<Root | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Create shadow root once on mount
  useEffect(() => {
    if (!hostRef.current || shadowRootRef.current) return;

    const shadow = hostRef.current.attachShadow({ mode: 'open' });
    shadowRootRef.current = shadow;

    // Inject CSS into shadow root
    const style = document.createElement('style');
    // Replace :root with :host so Tailwind theme vars work inside Shadow DOM
    style.textContent = cssContent.replace(/:root/g, ':host');
    shadow.appendChild(style);

    // Create mount point inside shadow root
    const mount = document.createElement('div');
    mount.id = 'botuyo-chat-widget-root';
    shadow.appendChild(mount);
    mountRef.current = mount;

    // Create React root inside shadow DOM
    reactRootRef.current = createRoot(mount);

    // Detect initial dark mode
    setIsDark(detectDarkMode());
    setReady(true);

    return () => {
      reactRootRef.current?.unmount();
      reactRootRef.current = null;
      shadowRootRef.current = null;
      mountRef.current = null;
    };
  }, []);

  // ── Auto Dark Mode Detection ───────────────────────────
  useEffect(() => {
    const update = () => setIsDark(detectDarkMode());

    // Observe data-theme attribute changes on <html>
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Also listen to prefers-color-scheme changes (for theme: "system")
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', update);
    };
  }, []);

  // Apply dark mode CSS variables to mount point
  useEffect(() => {
    if (!mountRef.current) return;
    const mount = mountRef.current;

    if (isDark && !props.theme?.cssVariables) {
      // Auto-apply dark theme when no explicit cssVariables provided
      Object.entries(DARK_CSS_VARS).forEach(([key, value]) => {
        mount.style.setProperty(key, value);
      });
    } else if (!isDark && !props.theme?.cssVariables) {
      // Clear dark vars when switching back to light
      Object.keys(DARK_CSS_VARS).forEach(key => {
        mount.style.removeProperty(key);
      });
    }
  }, [isDark, props.theme?.cssVariables]);

  // Render/re-render ChatWidget when props change or shadow is ready
  useEffect(() => {
    if (!ready || !reactRootRef.current) return;

    reactRootRef.current.render(
      <WidgetErrorBoundary>
        <React.Suspense fallback={null}>
          <ChatWidget {...props} />
        </React.Suspense>
      </WidgetErrorBoundary>
    );
  }, [ready, props]);

  // The host div is just an anchor — no styles leak in or out
  return <div ref={hostRef} id="botuyo-shadow-host" />;
};

export default ShadowChatWidget;
