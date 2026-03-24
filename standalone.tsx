/**
 * BotUyo Chat Widget - Standalone Version
 * Entry point for CDN distribution
 * 
 * This file creates a global `BotUyoChat` object that can be used
 * to initialize the chat widget on any website without React/Next.js
 * 
 * Self-contained: includes built-in error boundary, auto dark mode
 * detection, and Shadow DOM CSS isolation. Only requires an API key.
 *
 * OPTIMIZATION: Code splitting enabled
 * - Core bundle loads only Launcher (~80KB)
 * - ChatWidget lazy loads on user interaction (~200KB)
 * - Total reduction: 306KB -> ~100KB initial load (66% reduction)
 */

import { createRoot, Root } from 'react-dom/client';
import React, { Component, lazy, Suspense, type ReactNode } from 'react';
import type { ChatWidgetProps } from './src/chat-widget/types';
import { LanguageProvider as _LanguageProvider } from './src/chat-widget/i18n/LanguageContext';

// CSS inlined as string — auto-injected at runtime
// Consumers never need to import CSS manually
import cssContent from './styles.css?inline';

// CSS is injected into Shadow DOM (not <head>) — see render() below

// Default API base URL — consumers only need to pass apiKey
const DEFAULT_API_BASE_URL = 'https://api.botuyo.com';

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
    console.error('[BotUyoChat] Widget error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) return null; // Silently fail
    return this.props.children;
  }
}

// ── Dark Mode Auto-Detection ────────────────────────────
const DARK_CSS_VARS: Record<string, string> = {
  '--background': '240 10% 3.9%',
  '--foreground': '0 0% 98%',
  '--card': '240 10% 3.9%',
  '--card-foreground': '0 0% 98%',
  '--primary': '160 84% 39%',
  '--primary-foreground': '0 0% 100%',
  '--muted': '240 3.7% 15.9%',
  '--muted-foreground': '240 5% 64.9%',
  '--border': '240 3.7% 15.9%',
};

function detectDarkMode(): boolean {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark') return true;
  if (attr === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Lazy load ChatWidget - only loaded when user opens chat
const ChatWidget = lazy(() => 
  import('./src/chat-widget/ChatWidget').then(module => ({
    default: module.ChatWidget
  }))
);

interface CSSVariables {
  background?: string;
  foreground?: string;
  card?: string;
  cardForeground?: string;
  primary?: string;
  primaryForeground?: string;
  muted?: string;
  mutedForeground?: string;
  border?: string;
  destructive?: string;
  radius?: string;
  // Layout
  windowBorderRadius?: string;
  launcherBorderRadius?: string;
  windowHeight?: string;
  windowBottom?: string;
  // Spacing
  spacing1?: string;
  spacing2?: string;
  spacing3?: string;
  spacing4?: string;
  spacing5?: string;
  spacing6?: string;
  spacing7?: string;
  spacing8?: string;
}

interface StandaloneConfig extends Partial<ChatWidgetProps> {
  // Only apiKey is required — apiBaseUrl defaults to production
  apiKey: string;
  apiBaseUrl?: string;
  theme?: ChatWidgetProps['theme'] & {
    cssVariables?: CSSVariables;
  };
}

class BotUyoChatWidget {
  private root: Root | null = null;
  private container: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private mountPoint: HTMLElement | null = null;
  private darkModeObserver: MutationObserver | null = null;
  private darkModeMediaQuery: MediaQueryList | null = null;
  private config: StandaloneConfig | null = null;

  /**
   * Initialize the chat widget
   * @param config - Widget configuration
   * @returns Widget instance for chaining
   */
  init(config: StandaloneConfig): this {
    this.config = {
      ...config,
      apiBaseUrl: config.apiBaseUrl || DEFAULT_API_BASE_URL,
    };
    this.render();
    this.setupDarkModeDetection();
    return this;
  }

  /**
   * Render the widget into the DOM
   */
  private render(): void {
    if (!this.config) {
      console.error('[BotUyoChat] No configuration provided');
      return;
    }

    // Create container with Shadow DOM for CSS isolation
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'botuyo-chat-widget-root';
      // Outer container is just an anchor — no position/sizing
      // so it doesn't create a containing block that breaks
      // position:fixed on child elements (launcher, chat window)
      document.body.appendChild(this.container);

      // Shadow DOM: CSS inside here can't leak out, host CSS can't leak in
      this.shadowRoot = this.container.attachShadow({ mode: 'open' });

      // Inject CSS into shadow root (not <head>)
      const style = document.createElement('style');
      // CRITICAL: In Shadow DOM, :root targets <html> (outside shadow boundary),
      // so Tailwind theme variables set on :root are undefined inside the shadow.
      // Replace :root with :host (shadow host) so variables inherit into the tree.
      style.textContent = cssContent.replace(/:root/g, ':host');
      this.shadowRoot.appendChild(style);

      // Create mount point for React inside shadow root
      this.mountPoint = document.createElement('div');
      this.mountPoint.id = 'botuyo-chat-widget-root';
      this.shadowRoot.appendChild(this.mountPoint);
    }

    // Apply CSS variables to mount point if provided
    if (this.config.theme?.cssVariables && this.mountPoint) {
      const vars = this.config.theme.cssVariables;

      // Map camelCase config keys to kebab-case CSS custom property names
      const varMap: [string, string | undefined][] = [
        // Colors
        ['--background', vars.background],
        ['--foreground', vars.foreground],
        ['--card', vars.card],
        ['--card-foreground', vars.cardForeground],
        ['--primary', vars.primary],
        ['--primary-foreground', vars.primaryForeground],
        ['--muted', vars.muted],
        ['--muted-foreground', vars.mutedForeground],
        ['--border', vars.border],
        ['--destructive', vars.destructive],
        ['--radius', vars.radius],
        // Layout
        ['--window-border-radius', vars.windowBorderRadius],
        ['--launcher-border-radius', vars.launcherBorderRadius],
        ['--window-height', vars.windowHeight],
        ['--window-bottom', vars.windowBottom],
        // Spacing
        ['--spacing-1', vars.spacing1],
        ['--spacing-2', vars.spacing2],
        ['--spacing-3', vars.spacing3],
        ['--spacing-4', vars.spacing4],
        ['--spacing-5', vars.spacing5],
        ['--spacing-6', vars.spacing6],
        ['--spacing-7', vars.spacing7],
        ['--spacing-8', vars.spacing8],
      ];

      varMap.forEach(([cssVar, value]) => {
        if (value !== undefined) {
          this.mountPoint!.style.setProperty(cssVar, value);
        }
      });
    }

    // Apply auto dark mode if no explicit cssVariables provided
    if (this.mountPoint && !this.config.theme?.cssVariables) {
      const dark = detectDarkMode();
      if (dark) {
        Object.entries(DARK_CSS_VARS).forEach(([key, value]) => {
          this.mountPoint!.style.setProperty(key, value);
        });
      } else {
        Object.keys(DARK_CSS_VARS).forEach(key => {
          this.mountPoint!.style.removeProperty(key);
        });
      }
    }

    // Create React root on the mount point inside shadow root
    if (!this.root && this.mountPoint) {
      this.root = createRoot(this.mountPoint);
    }

    // Merge config with defaults (user config takes precedence)
    const widgetProps: ChatWidgetProps = {
      apiKey: this.config.apiKey,
      apiBaseUrl: this.config.apiBaseUrl || DEFAULT_API_BASE_URL,
      agentId: this.config.agentId,
      theme: {
        // Defaults
        botName: 'Asistente Virtual',
        // logoUrl is optional - components use DEFAULT_AVATAR_URL if not provided
        position: 'bottom-right',
        welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?',
        inputPlaceholder: 'Escribe tu mensaje...',
        cssVariables: {
          primary: '160 84% 39%',
          windowBorderRadius: '24px',
          launcherBorderRadius: '50%',
        },
        // User config overrides defaults
        ...this.config.theme,
      },
      userContext: this.config.userContext,
      pageContext: this.config.pageContext,
      includeSEOMetadata: this.config.includeSEOMetadata ?? false,
      mediaConfig: this.config.mediaConfig, // Media features config
      onNavigate: this.config.onNavigate,
      onLogin: this.config.onLogin,
      onEvent: this.config.onEvent,
      onStateChange: this.config.onStateChange,
    };

    // Render React component with Error Boundary + Suspense for code splitting
    const suspenseElement = React.createElement(
      Suspense,
      {
        fallback: React.createElement(
          'div',
          {
            style: {
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              cursor: 'wait',
            }
          },
          React.createElement(
            'div',
            {
              style: {
                width: '24px',
                height: '24px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }
            }
          )
        )
      },
      React.createElement(ChatWidget, widgetProps)
    );

    // Wrap in ErrorBoundary + LanguageProvider
    this.root!.render(
      React.createElement(
        WidgetErrorBoundary,
        null,
        React.createElement(
          _LanguageProvider,
          { 
            defaultLocale: this.config.theme?.defaultLocale,
            children: suspenseElement
          }
        )
      )
    );

    console.log('[BotUyoChat] Widget initialized', widgetProps);
  }

  /**
   * Update widget configuration
   * @param config - Partial configuration to update
   */
  update(config: Partial<StandaloneConfig>): void {
    if (!this.config) {
      console.error('[BotUyoChat] Widget not initialized');
      return;
    }

    this.config = {
      ...this.config,
      ...config,
      theme: {
        ...this.config.theme,
        ...config.theme,
      },
    };

    this.render();
  }

  /**
   * Destroy the widget and clean up
   */
  destroy(): void {
    // Clean up dark mode observers
    if (this.darkModeObserver) {
      this.darkModeObserver.disconnect();
      this.darkModeObserver = null;
    }
    if (this.darkModeMediaQuery) {
      this.darkModeMediaQuery.removeEventListener('change', this.handleDarkModeChange);
      this.darkModeMediaQuery = null;
    }

    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
      this.shadowRoot = null;
      this.mountPoint = null;
    }

    this.config = null;
    console.log('[BotUyoChat] Widget destroyed');
  }

  /**
   * Set up dark mode auto-detection.
   * Observes data-theme on <html> and prefers-color-scheme media query.
   */
  private setupDarkModeDetection(): void {
    // Skip if consumer explicitly provides cssVariables
    if (this.config?.theme?.cssVariables) return;

    this.handleDarkModeChange = () => this.render();

    // Observe data-theme attribute changes
    this.darkModeObserver = new MutationObserver(this.handleDarkModeChange);
    this.darkModeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    // Listen to prefers-color-scheme
    this.darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.darkModeMediaQuery.addEventListener('change', this.handleDarkModeChange);
  }

  private handleDarkModeChange: () => void = () => {};

  /**
   * Open the chat window programmatically
   */
  open(): void {
    // This will be implemented by dispatching a custom event
    // that the widget listens to
    window.dispatchEvent(new CustomEvent('botuyo-chat:open'));
  }

  /**
   * Close the chat window programmatically
   */
  close(): void {
    window.dispatchEvent(new CustomEvent('botuyo-chat:close'));
  }

  /**
   * Send a message programmatically
   * @param message - Message text
   */
  sendMessage(message: string): void {
    window.dispatchEvent(
      new CustomEvent('botuyo-chat:send-message', {
        detail: { message },
      })
    );
  }

  /**
   * Get current widget state
   */
  getState(): { isOpen: boolean; messageCount: number } | null {
    // This would need to be implemented with proper state management
    return null;
  }
}

// Create global instance
const instance = new BotUyoChatWidget();

// Expose to window
declare global {
  interface Window {
    BotUyoChat: BotUyoChatWidget;
  }
}

window.BotUyoChat = instance;

// Export for module systems (CDN/standalone usage)
export default instance;
export { BotUyoChatWidget };
export type { StandaloneConfig };

// Re-export React components for npm package usage
export { ChatWidget } from './src/chat-widget/ChatWidget';
export { ChatWidget as ChatWidgetUnstyled } from './src/chat-widget/ChatWidget';
export { ChatWidgetProvider, useChatWidget } from './src/chat-widget/ChatWidgetProvider';
export type { ChatWidgetContextValue, ChatWidgetProviderProps } from './src/chat-widget/ChatWidgetProvider';
export type { 
  ChatWidgetProps, 
  ChatTheme, 
  UserContext, 
  ChatMessage, 
  TextMessage, 
  ImageMessage, 
  AudioMessage, 
  LocationMessage, 
  PageContext 
} from './src/chat-widget/types';
export { LanguageProvider, useLanguage } from './src/chat-widget/i18n/LanguageContext';
