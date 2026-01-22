# Chatbot Widget - Commercial SaaS Package

This directory contains the standalone chatbot widget that can be commercialized as a SaaS product.

## 🎯 Product Overview

**Paseo Libre Chatbot Widget** is an embeddable AI-powered chatbot that can be integrated into any website with just a few lines of code.

### Key Features
- 🤖 AI-powered conversations (Google Gemini)
- 💬 Real-time chat with Socket.IO
- 🎨 Fully customizable theming
- 📱 Responsive design
- 🔊 Voice messages
- 📍 Location sharing
- 🖼️ Image attachments
- 🌍 Multi-language (ES, EN, PT, FR)

## 📁 Structure

```
chatbot-cdn/
├── src/
│   ├── components/      # React components (copied from main app)
│   ├── hooks/          # React hooks
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities
│   ├── styles/         # Global styles
│   ├── ChatWidget.tsx  # Main widget component
│   ├── index.tsx       # CDN entry point
│   └── demo.tsx        # Demo page
├── dist/               # Built files (generated)
│   ├── chatbot.umd.js  # UMD bundle for CDN
│   ├── chatbot.es.js   # ES module for bundlers
│   ├── chatbot.css     # Styles
│   └── index.d.ts      # TypeScript definitions
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── README.md           # Public documentation
├── DEPLOYMENT.md       # Deployment guide
└── copy-sources.sh     # Script to sync from main app
```

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

### Testing Locally

1. Start dev server: `npm run dev`
2. Open http://localhost:5173
3. Test chatbot features

## 🌐 Integration Methods

### Method 1: CDN (Recommended)

```html
<link rel="stylesheet" href="https://cdn.paseolibre.com/chatbot/v1/chatbot.css">
<script src="https://cdn.paseolibre.com/chatbot/v1/chatbot.umd.js"></script>
<script>
  PaseoLibreChatbot.init({
    serverUrl: 'https://bot.paseolibre.com',
    apiKey: 'pk_live_xxx',
  });
</script>
```

### Method 2: NPM Package

```bash
npm install @paseolibre/chatbot-widget
```

```tsx
import { ChatWidget } from '@paseolibre/chatbot-widget'
import '@paseolibre/chatbot-widget/dist/chatbot.css'

<ChatWidget
  serverUrl="https://bot.paseolibre.com"
  apiKey="pk_live_xxx"
/>
```

## 💰 Monetization Model

### Pricing Tiers

| Plan | Messages/Month | Price | Features |
|------|---------------|-------|----------|
| **Free** | 1,000 | $0 | Basic AI, Email support |
| **Starter** | 10,000 | $29 | Advanced AI, Priority support |
| **Professional** | 50,000 | $99 | Custom branding, Analytics |
| **Enterprise** | Unlimited | Custom | Dedicated support, SLA |

### Revenue Streams

1. **Subscription Plans** - Monthly/yearly subscriptions
2. **Overage Fees** - $0.01 per message over limit
3. **Custom Integration** - One-time setup fees
4. **White Label** - Premium branding removal

## 🔐 Backend Requirements

### API Key Management
- Generate unique keys per customer
- Track usage per key
- Rate limiting
- Key rotation

### Database Schema
```typescript
// Tenant (Customer)
{
  id: string
  email: string
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  apiKey: string
  messagesUsed: number
  messagesLimit: number
  isActive: boolean
}

// Usage Tracking
{
  tenantId: string
  date: Date
  messagesCount: number
  apiKey: string
}
```

### Endpoints
- `POST /api/v1/chat/message` - Send message (validates API key)
- `GET /api/v1/usage` - Get usage stats
- `POST /api/v1/keys/rotate` - Rotate API key

## 📊 Analytics

Track for customers:
- Total messages
- Average response time
- User satisfaction
- Peak hours
- Top questions

## 🎨 Customization Options

Customers can customize:
- Primary color
- Bot name & avatar
- Position (bottom-right, bottom-left)
- Language
- Welcome message

## 🔧 Maintenance

### Syncing from Main App

When updating the chatbot in main app:

```bash
cd chatbot-cdn
./copy-sources.sh
npm run build
```

### Versioning

Use semantic versioning:
- **Major** (v2.x.x): Breaking changes
- **Minor** (v1.2.x): New features
- **Patch** (v1.0.3): Bug fixes

### Deployment Checklist

- [ ] Update version in package.json
- [ ] Run tests
- [ ] Build production bundle
- [ ] Upload to CDN
- [ ] Update documentation
- [ ] Notify customers of updates

## 🌟 Competitive Advantages

1. **Easy Integration** - 3 lines of code
2. **AI-Powered** - Google Gemini integration
3. **Multi-language** - 4 languages supported
4. **Voice & Media** - Rich media support
5. **Real-time** - Socket.IO powered
6. **Affordable** - Starts at $29/month

## 🎯 Target Market

- E-commerce websites
- SaaS products
- Corporate websites
- Real estate platforms
- Educational platforms

## 📞 Next Steps

1. Set up payment gateway (Stripe)
2. Create customer dashboard
3. Implement API key system
4. Set up CDN deployment
5. Create marketing website
6. Launch beta program

## 📚 Resources

- [Deployment Guide](./DEPLOYMENT.md)
- [Public Documentation](./README.md)
- Main repo: `/paseo-libre`
- Backend: `/paseo-bot-whatsapp`
