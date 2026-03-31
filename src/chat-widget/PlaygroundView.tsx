/**
 * PlaygroundView — Embeddable chat widget for playground/testing mode.
 *
 * Renders the ChatWidget inline (no floating launcher, always open).
 * Exported from @botuyo/chat-widget-standalone for use in admin panels
 * and dashboards without CSS override hacks.
 *
 * Usage:
 *   import { PlaygroundView } from '@botuyo/chat-widget-standalone'
 *   <PlaygroundView apiKey="agent_xxx" apiBaseUrl="https://api.botuyo.com" />
 */
'use client'

import { useMemo } from 'react'
import type { ChatWidgetProps } from './types'
import { ChatWidgetWithProviders } from './ChatWidget'
import { LanguageProvider } from './i18n/LanguageContext'

export interface PlaygroundViewProps {
  /** Agent API key (e.g. "agent_abc123") */
  apiKey: string
  /** Backend URL (e.g. "https://api.botuyo.com") */
  apiBaseUrl?: string
  /** Force remount by changing this key */
  sessionKey?: number | string
  /** Locale for widget text */
  locale?: 'es' | 'en' | 'pt' | 'fr'
  /** Callback when widget connects */
  onReady?: () => void
}

export function PlaygroundView({
  apiKey,
  apiBaseUrl = 'https://api.botuyo.com',
  sessionKey,
  locale = 'es',
  onReady,
}: PlaygroundViewProps) {
  const widgetProps: ChatWidgetProps = useMemo(
    () => ({
      apiKey,
      apiBaseUrl,
      initialOpen: true,
      hideLauncher: true,
      theme: {
        position: 'bottom-right',
        defaultLocale: locale,
        cssVariables: {
          windowBorderRadius: '0px',
          windowHeight: '100%',
          windowBottom: '0px',
        },
      },
      onEvent: (eventName: string) => {
        if (eventName === 'connected' && onReady) onReady()
      },
    }),
    [apiKey, apiBaseUrl, locale, onReady]
  )

  return (
    <div
      key={sessionKey}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <LanguageProvider defaultLocale={locale}>
        <ChatWidgetWithProviders {...widgetProps} />
      </LanguageProvider>
    </div>
  )
}
