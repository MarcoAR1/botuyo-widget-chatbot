import '@/styles/globals.css'

export { ChatWidget } from './ChatWidget'
export type {
  ChatWidgetProps,
  ChatMessage,
  TextMessage,
  ImageMessage,
  AudioMessage,
  LocationMessage,
  SystemMessage,
  PageContext,
  BubbleStyles,
} from './types'

// CDN API
export interface ChatbotConfig {
  serverUrl: string
  apiKey: string
  theme?: {
    primaryColor?: string
    botName?: string
    botAvatar?: string
    position?: 'bottom-right' | 'bottom-left'
    bubbleStyles?: {
      backgroundColor?: string
      textColor?: string
      borderRadius?: string
    }
  }
  lang?: 'es' | 'en' | 'pt' | 'fr'
  pageContext?: PageContext
  onReady?: () => void
  onMessage?: (message: ChatMessage) => void
  onError?: (error: Error) => void
}

declare global {
  interface Window {
    PaseoLibreChatbot: {
      init: (config: ChatbotConfig) => void
      open: () => void
      close: () => void
      sendMessage: (message: string) => void
      updateTheme: (theme: Partial<ChatbotConfig['theme']>) => void
      trackEvent: (event: string, data?: Record<string, unknown>) => void
      destroy: () => void
    }
  }
}

// CDN initialization function
export function init(config: ChatbotConfig): void {
  if (typeof document === 'undefined') {
    console.error('PaseoLibreChatbot: Can only be initialized in browser')
    return
  }

  // Create container
  const container = document.createElement('div')
  container.id = 'paseo-chatbot-root'
  document.body.appendChild(container)

  // Import React dynamically
  import('react').then((React) => {
    import('react-dom/client').then((ReactDOM) => {
      const { ChatWidget } = require('./ChatWidget')
      
      const root = ReactDOM.createRoot(container)
      
      const widgetRef: { current: any } = { current: null }
      
      root.render(
        React.createElement(ChatWidget, {
          serverUrl: config.serverUrl,
          apiKey: config.apiKey,
          theme: config.theme,
          lang: config.lang,
          pageContext: config.pageContext,
          onReady: config.onReady,
          onMessage: config.onMessage,
          onError: config.onError,
          ref: widgetRef,
        })
      )

      // Expose API methods
      if (typeof window !== 'undefined') {
        window.PaseoLibreChatbot = {
          init: () => console.warn('Already initialized'),
          open: () => widgetRef.current?.open(),
          close: () => widgetRef.current?.close(),
          sendMessage: (msg: string) => widgetRef.current?.sendMessage(msg),
          updateTheme: (theme) => widgetRef.current?.updateTheme(theme),
          trackEvent: (event, data) => widgetRef.current?.trackEvent(event, data),
          destroy: () => {
            root.unmount()
            container.remove()
          },
        }
      }

      config.onReady?.()
    })
  })
}

// Auto-init if config is in window
if (typeof window !== 'undefined' && (window as any).PASEO_CHATBOT_CONFIG) {
  init((window as any).PASEO_CHATBOT_CONFIG)
}
