/**
 * ShadowChatWidget — Shadow DOM wrapper for ChatWidget React component
 * 
 * This component wraps the ChatWidget inside a Shadow DOM container,
 * providing complete CSS isolation:
 * - Widget CSS can't leak to the host page
 * - Host CSS can't affect the widget
 * 
 * Used when the widget is imported as an npm React component (not CDN).
 * The standalone/CDN version handles Shadow DOM in standalone.tsx.
 */

import React, { useEffect, useRef, useState, type FC } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ChatWidgetProps } from './src/chat-widget/types';
import cssContent from './styles.css?inline';

// Lazy-load ChatWidget to preserve code splitting
const ChatWidget = React.lazy(() =>
  import('./src/chat-widget/ChatWidget').then(module => ({
    default: module.ChatWidget
  }))
);

/**
 * Shadow DOM wrapper that renders ChatWidget inside an isolated shadow root.
 * All props are forwarded to the inner ChatWidget.
 */
export const ShadowChatWidget: FC<ChatWidgetProps> = (props) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const reactRootRef = useRef<Root | null>(null);
  const [ready, setReady] = useState(false);

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

    // Create React root inside shadow DOM
    reactRootRef.current = createRoot(mount);
    setReady(true);

    return () => {
      // Cleanup on unmount
      reactRootRef.current?.unmount();
      reactRootRef.current = null;
      shadowRootRef.current = null;
    };
  }, []);

  // Render/re-render ChatWidget when props change or shadow is ready
  useEffect(() => {
    if (!ready || !reactRootRef.current) return;

    reactRootRef.current.render(
      <React.Suspense fallback={null}>
        <ChatWidget {...props} />
      </React.Suspense>
    );
  }, [ready, props]);

  // The host div is just an anchor — no styles leak in or out
  return <div ref={hostRef} id="botuyo-shadow-host" />;
};

export default ShadowChatWidget;
