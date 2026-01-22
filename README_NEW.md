# 🤖 Paseo Libre Chatbot Widget

AI-powered chatbot widget that can be embedded in any website. Provides instant customer support, lead generation, and intelligent conversations powered by Google Gemini and Socket.IO.

[![npm version](https://img.shields.io/npm/v/@paseolibre/chatbot-widget)](https://www.npmjs.com/package/@paseolibre/chatbot-widget)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CDN](https://img.shields.io/badge/CDN-Cloudflare-orange)](https://cdn.paseolibre.com)

---

## 🚀 Quick Start

### Via CDN (3 lines of code!)

```html
<link rel="stylesheet" href="https://cdn.paseolibre.com/v1/chatbot.css">
<script src="https://cdn.paseolibre.com/v1/chatbot.umd.js"></script>
<script>
  PaseoLibreChatbot.init({
    serverUrl: 'https://bot.paseolibre.com',
    apiKey: 'YOUR_API_KEY',
  });
</script>
```

### Via NPM (React, Next.js, Vue)

```bash
npm install @paseolibre/chatbot-widget
```

```tsx
import { ChatWidget } from '@paseolibre/chatbot-widget'
import '@paseolibre/chatbot-widget/dist/chatbot.css'

<ChatWidget serverUrl="https://bot.paseolibre.com" apiKey="YOUR_API_KEY" />
```

---

## ✨ Features

- 🤖 **AI-powered** responses using Google Gemini
- 💬 **Real-time chat** with Socket.IO
- 🎨 **Fully customizable** theme and colors
- 📱 **Responsive design** (mobile & desktop)
- 🔊 **Voice messages** support
- 📍 **Location sharing**
- 🖼️ **Image attachments**
- 🌍 **Multi-language** support (ES, EN, PT, FR)
- 📊 **Conversation analytics**
- 🔒 **Secure** and privacy-focused

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[DOCS_INDEX.md](./DOCS_INDEX.md)** | 📖 Complete documentation index |
| **[README.md](./README.md)** | 🚀 Quick start guide (this file) |
| **[CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md)** | ☁️ Deploy to Cloudflare R2 CDN |
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | 🚀 Production deployment guide |
| **[COMMERCIAL.md](./COMMERCIAL.md)** | 💰 Business model & pricing |
| **[REPOSITORY_MIGRATION.md](./REPOSITORY_MIGRATION.md)** | 🔄 Repository setup guide |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | 📊 Executive summary |

👉 **Start here**: [DOCS_INDEX.md](./DOCS_INDEX.md)

---

## 💰 Pricing

| Plan | Messages/Month | Price | Best For |
|------|---------------|-------|----------|
| **Free** | 1,000 | $0 | Personal websites |
| **Starter** | 10,000 | $29/mo | Small businesses |
| **Professional** | 50,000 | $99/mo | Growing companies |
| **Enterprise** | Unlimited | Custom | Large corporations |

Get your API key at: [dashboard.paseolibre.com/chatbot](https://dashboard.paseolibre.com/chatbot)

---

## 🛠️ Development

### Prerequisites

- Node.js 18+ or 20+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the demo.

### Build for Production

```bash
npm run build
```

Output in `dist/`:
- `chatbot.umd.js` - For CDN (browsers)
- `chatbot.es.js` - For bundlers (Webpack, Vite)
- `chatbot.css` - Styles
- `index.d.ts` - TypeScript definitions

---

## 🚀 Deploy to CDN

### Cloudflare R2 (Recommended - Free!)

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login
wrangler login

# Deploy
./deploy-r2.sh
```

See [CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md) for complete guide.

### GitHub Actions (Auto-deploy)

Included workflow deploys automatically on:
- Git tags (v1.0.0, v1.1.0, etc.)
- Manual trigger

Configure secrets in GitHub:
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

See [.github/workflows/deploy-r2.yml](./.github/workflows/deploy-r2.yml)

---

## 🎨 Customization

```javascript
PaseoLibreChatbot.init({
  serverUrl: 'https://bot.paseolibre.com',
  apiKey: 'YOUR_API_KEY',
  theme: {
    primaryColor: '#10b981',        // Main color
    botName: 'Sarah',               // Bot name
    botAvatar: 'https://...',       // Bot avatar URL
    position: 'bottom-left',        // Position
    bubbleStyles: {
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      borderRadius: '12px',
    }
  },
  lang: 'es',  // 'es', 'en', 'pt', 'fr'
})
```

---

## 🔌 API Reference

### `PaseoLibreChatbot.init(config)`

Initialize the chatbot widget.

**Parameters:**

```typescript
interface ChatbotConfig {
  // Required
  serverUrl: string          // Your chatbot server URL
  apiKey: string            // Your API key
  
  // Optional
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
  
  // Callbacks
  onReady?: () => void
  onMessage?: (message: ChatMessage) => void
  onError?: (error: Error) => void
}
```

---

## 🧪 Testing

```bash
npm test
```

---

## 📦 Package Info

- **Package**: `@paseolibre/chatbot-widget`
- **Version**: `1.0.0`
- **License**: MIT
- **Repository**: [github.com/MarcoAR1/paseo-widget-chatbot](https://github.com/MarcoAR1/paseo-widget-chatbot)

---

## 🤝 Contributing

Contributions welcome! Please read [REPOSITORY_MIGRATION.md](./REPOSITORY_MIGRATION.md) for development setup.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT © Paseo Libre

---

## 💬 Support

- 📧 Email: support@paseolibre.com
- 💬 Live Chat: [paseolibre.com](https://paseolibre.com)
- 📖 Documentation: [DOCS_INDEX.md](./DOCS_INDEX.md)
- 🐛 Issues: [GitHub Issues](https://github.com/MarcoAR1/paseo-widget-chatbot/issues)

---

## 🌟 Show Your Support

Give a ⭐️ if this project helped you!

---

**Built with ❤️ by Paseo Libre Team**
