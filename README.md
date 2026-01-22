# Paseo Libre Chatbot Widget

AI-powered chatbot widget that can be embedded in any website. Provides instant customer support, lead generation, and intelligent conversations.

> 📚 **[Ver índice completo de documentación](./DOCS_INDEX.md)** - Guías de deploy, comercialización, migración y más.

## Features

- 🤖 AI-powered responses using Google Gemini
- 💬 Real-time chat with Socket.IO
- 🎨 Fully customizable theme and colors
- 📱 Responsive design (mobile & desktop)
- 🔊 Voice message support
- 📍 Location sharing
- 🖼️ Image attachments
- 🌍 Multi-language support
- 📊 Conversation analytics
- 🔒 Secure and privacy-focused

## Installation

### Via CDN (Recommended for most cases)

Add this code to your HTML, just before the closing `</body>` tag:

```html
<!-- Paseo Libre Chatbot CSS -->
<link rel="stylesheet" href="https://cdn.paseolibre.com/chatbot/v1/chatbot.css">

<!-- Paseo Libre Chatbot Widget -->
<script src="https://cdn.paseolibre.com/chatbot/v1/chatbot.umd.js"></script>

<script>
  // Initialize the chatbot
  PaseoLibreChatbot.init({
    serverUrl: 'https://bot.paseolibre.com',
    apiKey: 'YOUR_API_KEY', // Get your API key from dashboard
    theme: {
      primaryColor: '#3b82f6',
      botName: 'Assistant',
      botAvatar: 'https://your-site.com/bot-avatar.png',
      position: 'bottom-right',
    },
    lang: 'es', // 'es', 'en', 'pt', 'fr'
  });
</script>
```

### Via NPM (For React projects)

```bash
npm install @paseolibre/chatbot-widget
```

```tsx
import { ChatWidget } from '@paseolibre/chatbot-widget'
import '@paseolibre/chatbot-widget/dist/chatbot.css'

function App() {
  return (
    <ChatWidget
      serverUrl="https://bot.paseolibre.com"
      apiKey="YOUR_API_KEY"
      theme={{
        primaryColor: '#3b82f6',
        botName: 'Assistant',
        position: 'bottom-right',
      }}
      lang="es"
    />
  )
}
```

## Configuration Options

```typescript
interface ChatbotConfig {
  // Required
  serverUrl: string          // Your chatbot server URL
  apiKey: string            // Your API key from dashboard
  
  // Optional
  theme?: {
    primaryColor?: string   // Main color (default: '#3b82f6')
    botName?: string        // Bot name (default: 'Assistant')
    botAvatar?: string      // Bot avatar URL
    position?: 'bottom-right' | 'bottom-left' // Position (default: 'bottom-right')
    bubbleStyles?: {
      backgroundColor?: string
      textColor?: string
      borderRadius?: string
    }
  }
  lang?: 'es' | 'en' | 'pt' | 'fr' // Language (default: 'es')
  
  // Page context (auto-detected if not provided)
  pageContext?: {
    title?: string
    url?: string
    path?: string
    referrer?: string
  }
  
  // Callbacks
  onReady?: () => void
  onMessage?: (message: ChatMessage) => void
  onError?: (error: Error) => void
}
```

## API Key

To use this widget, you need an API key. Get yours at:

👉 **[https://dashboard.paseolibre.com/chatbot](https://dashboard.paseolibre.com/chatbot)**

### Pricing

- **Free Tier**: 1,000 messages/month
- **Starter**: $29/month - 10,000 messages
- **Professional**: $99/month - 50,000 messages
- **Enterprise**: Custom pricing - Unlimited messages

## Examples

### Minimal Setup

```html
<script src="https://cdn.paseolibre.com/chatbot/v1/chatbot.umd.js"></script>
<script>
  PaseoLibreChatbot.init({
    serverUrl: 'https://bot.paseolibre.com',
    apiKey: 'pk_live_abc123xyz',
  });
</script>
```

### Custom Theme

```javascript
PaseoLibreChatbot.init({
  serverUrl: 'https://bot.paseolibre.com',
  apiKey: 'pk_live_abc123xyz',
  theme: {
    primaryColor: '#10b981', // Green
    botName: 'Sarah',
    botAvatar: 'https://mysite.com/sarah.jpg',
    position: 'bottom-left',
    bubbleStyles: {
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      borderRadius: '12px',
    }
  },
  lang: 'en',
  onReady: () => {
    console.log('Chatbot ready!');
  },
  onMessage: (msg) => {
    console.log('New message:', msg);
  }
});
```

### E-commerce Integration

```javascript
// Track user viewing a product
PaseoLibreChatbot.trackEvent('product_viewed', {
  productId: '12345',
  productName: 'Cool Sneakers',
  price: 99.99
});

// The bot can now answer questions about this product
```

## Advanced Features

### Custom Context

Pass custom context to provide the bot with information about the user or page:

```javascript
PaseoLibreChatbot.init({
  serverUrl: 'https://bot.paseolibre.com',
  apiKey: 'pk_live_abc123xyz',
  pageContext: {
    title: 'Product Page - Cool Sneakers',
    category: 'Footwear',
    userId: 'user_123',
    metadata: {
      cartValue: 150.00,
      isLoggedIn: true
    }
  }
});
```

### Programmatic Control

```javascript
// Open chatbot programmatically
PaseoLibreChatbot.open();

// Close chatbot
PaseoLibreChatbot.close();

// Send a message programmatically
PaseoLibreChatbot.sendMessage('Hello!');

// Update theme dynamically
PaseoLibreChatbot.updateTheme({
  primaryColor: '#f59e0b'
});

// Destroy widget
PaseoLibreChatbot.destroy();
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📚 Additional Documentation

- **[DOCS_INDEX.md](./DOCS_INDEX.md)** - Índice completo de documentación
- **[COMMERCIAL.md](./COMMERCIAL.md)** - Modelo de negocio y pricing ($0-$99/mo)
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy a CDN (Cloudflare, AWS, Vercel)
- **[REPOSITORY_MIGRATION.md](./REPOSITORY_MIGRATION.md)** - Migrar a repositorio propio
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Resumen ejecutivo

## License

MIT © Paseo Libre

## Support

- 📧 Email: support@paseolibre.com
- 💬 Live Chat: [https://paseolibre.com](https://paseolibre.com)
- 📖 Documentation: [https://docs.paseolibre.com/chatbot](https://docs.paseolibre.com/chatbot)
- 🐛 Issues: [GitHub Issues](https://github.com/paseolibre/chatbot-widget/issues)
