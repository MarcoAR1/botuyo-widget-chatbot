# Chatbot CDN Deployment Guide

This guide explains how to deploy the Paseo Libre Chatbot Widget to a CDN for commercial distribution.

## 📦 Build Process

### 1. Install Dependencies

```bash
cd chatbot-cdn
npm install
```

### 2. Build for Production

```bash
npm run build
```

This creates:
- `dist/chatbot.umd.js` - UMD bundle for CDN
- `dist/chatbot.es.js` - ES modules for modern bundlers
- `dist/chatbot.css` - Styles
- `dist/index.d.ts` - TypeScript definitions

## 🌐 CDN Deployment Options

### Option 1: Cloudflare CDN (Recommended)

1. Create Cloudflare account
2. Set up R2 bucket for assets
3. Configure Cloudflare CDN

```bash
# Upload to Cloudflare R2
npm run deploy:cloudflare
```

URL structure:
```
https://cdn.paseolibre.com/chatbot/v1/chatbot.umd.js
https://cdn.paseolibre.com/chatbot/v1/chatbot.css
```

### Option 2: AWS CloudFront + S3

1. Create S3 bucket: `paseolibre-chatbot-cdn`
2. Enable static website hosting
3. Create CloudFront distribution
4. Upload files

```bash
aws s3 sync dist/ s3://paseolibre-chatbot-cdn/v1/ --acl public-read
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/v1/*"
```

### Option 3: jsdelivr (Free for Open Source)

If open-sourcing on GitHub:

```html
<script src="https://cdn.jsdelivr.net/gh/paseolibre/chatbot-widget@1.0.0/dist/chatbot.umd.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/paseolibre/chatbot-widget@1.0.0/dist/chatbot.css">
```

### Option 4: NPM + unpkg

Publish to NPM, then users can load from unpkg:

```bash
npm publish
```

```html
<script src="https://unpkg.com/@paseolibre/chatbot-widget@1.0.0/dist/chatbot.umd.js"></script>
```

## 🔐 API Key System

### Backend Implementation Needed

Create an API key management system in `paseo-bot-whatsapp`:

```typescript
// src/contexts/whatsapp/domain/entities/ApiKey.ts
interface IApiKey {
  id: string
  tenantId: string
  key: string // pk_live_xxx or pk_test_xxx
  environment: 'live' | 'test'
  permissions: string[]
  rateLimit: number // requests per minute
  isActive: boolean
  createdAt: Date
  lastUsedAt?: Date
}
```

### Validation Middleware

```typescript
// src/infrastructure/middlewares/validateApiKey.ts
export async function validateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key']
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' })
  }
  
  const keyData = await ApiKeyService.validate(apiKey)
  
  if (!keyData || !keyData.isActive) {
    return res.status(401).json({ error: 'Invalid API key' })
  }
  
  // Check rate limit
  const allowed = await RateLimiter.check(apiKey)
  if (!allowed) {
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }
  
  req.apiKey = keyData
  req.tenantId = keyData.tenantId
  next()
}
```

## 📊 Usage Tracking

Track usage for billing:

```typescript
// Track every message
await UsageService.track({
  tenantId: req.tenantId,
  apiKey: req.apiKey.key,
  event: 'message.sent',
  metadata: {
    messageType: 'text',
    timestamp: new Date(),
  }
})

// Monthly aggregation
interface TenantUsage {
  tenantId: string
  month: string // '2026-01'
  messagesCount: number
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  limit: number
}
```

## 💰 Pricing Tiers

```typescript
const PRICING_PLANS = {
  free: {
    name: 'Free',
    monthlyMessages: 1000,
    price: 0,
    features: ['Basic AI', 'Email support'],
  },
  starter: {
    name: 'Starter',
    monthlyMessages: 10000,
    price: 29,
    features: ['Advanced AI', 'Priority support', 'Analytics'],
  },
  professional: {
    name: 'Professional',
    monthlyMessages: 50000,
    price: 99,
    features: ['Custom branding', 'API access', 'Webhooks'],
  },
  enterprise: {
    name: 'Enterprise',
    monthlyMessages: -1, // unlimited
    price: null, // custom
    features: ['Dedicated support', 'SLA', 'Custom integration'],
  },
}
```

## 🔧 Integration Examples

### Basic Integration (Free Tier)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdn.paseolibre.com/chatbot/v1/chatbot.css">
</head>
<body>
  <h1>My Website</h1>
  
  <script src="https://cdn.paseolibre.com/chatbot/v1/chatbot.umd.js"></script>
  <script>
    PaseoLibreChatbot.init({
      serverUrl: 'https://bot.paseolibre.com',
      apiKey: 'pk_live_abc123xyz', // Get from dashboard
      theme: {
        primaryColor: '#3b82f6',
        botName: 'Support Bot',
      }
    });
  </script>
</body>
</html>
```

### Advanced Integration (React)

```tsx
import { ChatWidget } from '@paseolibre/chatbot-widget'
import '@paseolibre/chatbot-widget/dist/chatbot.css'

function App() {
  return (
    <ChatWidget
      serverUrl="https://bot.paseolibre.com"
      apiKey={process.env.REACT_APP_CHATBOT_API_KEY}
      theme={{
        primaryColor: '#10b981',
        botName: 'Sarah',
        position: 'bottom-left',
      }}
      onMessage={(msg) => {
        // Track in analytics
        analytics.track('chatbot_message', {
          type: msg.type,
          timestamp: msg.timestamp,
        })
      }}
    />
  )
}
```

## 📈 Analytics Integration

```typescript
// Track events for customers
window.PaseoLibreChatbot.init({
  serverUrl: 'https://bot.paseolibre.com',
  apiKey: 'pk_live_xxx',
  onMessage: (msg) => {
    // Send to customer's analytics
    if (window.gtag) {
      gtag('event', 'chatbot_message', {
        message_type: msg.type,
      })
    }
  },
  onReady: () => {
    console.log('Chatbot ready')
  }
})
```

## 🚀 Versioning Strategy

Use semver for CDN URLs:

- `v1/` - Major version (breaking changes)
- `v1.2/` - Minor version (new features)
- `v1.2.3/` - Patch version (bug fixes)

```html
<!-- Always latest v1 (auto-updates) -->
<script src="https://cdn.paseolibre.com/chatbot/v1/chatbot.umd.js"></script>

<!-- Locked to specific version (recommended for production) -->
<script src="https://cdn.paseolibre.com/chatbot/v1.2.3/chatbot.umd.js"></script>
```

## 🔒 Security Considerations

1. **CORS Configuration**
   - Allow specific domains only
   - Validate origin in backend

2. **Rate Limiting**
   - Per API key: 60 req/min (free), 300 req/min (paid)
   - Per IP: 100 req/min

3. **API Key Rotation**
   - Allow users to regenerate keys
   - Revoke old keys after 30 days

4. **Content Security Policy**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="script-src https://cdn.paseolibre.com">
   ```

## 📦 NPM Publishing

```bash
# Login to NPM
npm login

# Publish
npm publish --access public

# Update version
npm version patch
npm publish
```

## 🎯 Customer Onboarding Flow

1. User signs up at `https://dashboard.paseolibre.com`
2. System generates API key: `pk_live_xxxxx`
3. User copies integration code
4. User pastes in website
5. Chatbot appears automatically

## 📞 Support

- Dashboard: https://dashboard.paseolibre.com
- Docs: https://docs.paseolibre.com/chatbot
- Support: support@paseolibre.com
