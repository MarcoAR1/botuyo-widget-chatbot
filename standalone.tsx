/**
 * BotUyo Chat Widget - Standalone Version
 * Entry point for CDN distribution
 * 
 * This file creates a global `BotUyoChat` object that can be used
 * to initialize the chat widget on any website without React/Next.js
 * 
 * OPTIMIZATION: Code splitting enabled
 * - Core bundle loads only Launcher (~80KB)
 * - ChatWidget lazy loads on user interaction (~200KB)
 * - Total reduction: 306KB -> ~100KB initial load (66% reduction)
 */

import { createRoot, Root } from 'react-dom/client';
import React, { lazy, Suspense } from 'react';
import type { ChatWidgetProps } from './src/chat-widget/types';
import { LanguageProvider as _LanguageProvider } from './src/chat-widget/i18n/LanguageContext';

// CSS inlined as string — auto-injected at runtime
// Consumers never need to import CSS manually
import cssContent from './styles.css?inline';

// CSS is injected into Shadow DOM (not <head>) — see render() below

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
  spacing1?: string;
  spacing2?: string;
  spacing3?: string;
  spacing4?: string;
  spacing5?: string;
  spacing6?: string;
  spacing8?: string;
}

interface StandaloneConfig extends Partial<ChatWidgetProps> {
  // Override required fields to make them optional for standalone
  apiKey: string;
  apiBaseUrl: string;
  theme?: ChatWidgetProps['theme'] & {
    cssVariables?: CSSVariables;
  };
}

class BotUyoChatWidget {
  private root: Root | null = null;
  private container: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private mountPoint: HTMLElement | null = null;
  private config: StandaloneConfig | null = null;

  /**
   * Initialize the chat widget
   * @param config - Widget configuration
   * @returns Widget instance for chaining
   */
  init(config: StandaloneConfig): this {
    this.config = config;
    this.render();
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
      const varMap: Record<string, string | undefined> = {
        background: vars.background,
        foreground: vars.foreground,
        card: vars.card,
        cardForeground: vars.cardForeground,
        primary: vars.primary,
        primaryForeground: vars.primaryForeground,
        muted: vars.muted,
        mutedForeground: vars.mutedForeground,
        border: vars.border,
        destructive: vars.destructive,
        radius: vars.radius,
        // Design System - Spacing
        spacing1: vars.spacing1,
        spacing2: vars.spacing2,
        spacing3: vars.spacing3,
        spacing4: vars.spacing4,
        spacing5: vars.spacing5,
        spacing6: vars.spacing6,
        spacing8: vars.spacing8,
      };

      Object.entries(varMap).forEach(([key, value]) => {
        if (value !== undefined) {
          this.mountPoint!.style.setProperty(`--${key}`, value);
        }
      });
    }

    // Create React root on the mount point inside shadow root
    if (!this.root && this.mountPoint) {
      this.root = createRoot(this.mountPoint);
    }

    // Merge config with defaults (user config takes precedence)
    const widgetProps: ChatWidgetProps = {
      apiKey: this.config.apiKey,
      apiBaseUrl: this.config.apiBaseUrl,
      agentId: this.config.agentId,
      theme: {
        // Defaults
        primaryColor: '#10b981',
        botName: 'Asistente Virtual',
        // logoUrl is optional - components use DEFAULT_AVATAR_URL if not provided
        position: 'bottom-right',
        welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?',
        inputPlaceholder: 'Escribe tu mensaje...',
        borderRadius: '0.75rem',
        launcherBorderRadius: '50%',
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

    // Render React component with Suspense for code splitting
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
              backgroundColor: widgetProps.theme?.primaryColor || '#10b981',
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

    this.root!.render(
      React.createElement(
        _LanguageProvider,
        { 
          defaultLocale: this.config.theme?.defaultLocale,
          children: suspenseElement
        }
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
// ShadowChatWidget wraps ChatWidget in Shadow DOM for CSS isolation
export { ShadowChatWidget as ChatWidget } from './ShadowChatWidget';
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
