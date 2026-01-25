/**
 * Paseo Libre Chat Widget - Standalone Version
 * Entry point for CDN distribution
 * 
 * This file creates a global `PaseoLibreChat` object that can be used
 * to initialize the chat widget on any website without React/Next.js
 */

import { createRoot, Root } from 'react-dom/client';
import { ChatWidget } from './src/chat-widget/ChatWidget';
import type { ChatWidgetProps } from './src/chat-widget/types';
import React from 'react';

// Import standalone styles
import './styles.css';

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

    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'botuyo-chat-widget-root';
      this.container.style.position = 'fixed';
      this.container.style.zIndex = '999999';
      document.body.appendChild(this.container);
    }

    // Apply CSS variables to container if provided
    if (this.config.theme?.cssVariables) {
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
        // Design System - Spacing (no spacing7 - no existe en CSSVariables)
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
          this.container!.style.setProperty(`--${key}`, value);
        }
      });
    }

    // Create React root
    if (!this.root) {
      this.root = createRoot(this.container);
    }

    // Merge config with defaults (user config takes precedence)
    const widgetProps: ChatWidgetProps = {
      apiKey: this.config.apiKey,
      apiBaseUrl: this.config.apiBaseUrl,
      theme: {
        // Defaults
        primaryColor: '#10b981',
        botName: 'Asistente Virtual',
        logoUrl: '/avatar/mar_default.webp',
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
      onNavigate: this.config.onNavigate,
      onLogin: this.config.onLogin,
      onEvent: this.config.onEvent,
      onStateChange: this.config.onStateChange,
    };

    // Render React component
    this.root.render(
      React.createElement(ChatWidget, widgetProps)
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

// Export for module systems
export default instance;
export { BotUyoChatWidget };
export type { StandaloneConfig };
