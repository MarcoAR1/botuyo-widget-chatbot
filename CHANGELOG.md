# Changelog

All notable changes to the BotUyo Chat Widget will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-21

### Added
- 🎉 Initial release of BotUyo Chat Widget
- ⚛️ React-based chat widget with TypeScript
- 🔌 Socket.IO real-time integration
- 📦 CDN distribution via IIFE bundle
- 📚 NPM package support (`@paseolibre/chat-widget`)
- 🎨 Configurable theming (colors, bot name, logo, position)
- 📱 Mobile-responsive design (fullscreen on mobile, modal on desktop)
- 🌙 Dark mode support with CSS variables
- 🔧 Public API (`window.PaseoLibreChat`)
  - `init()` - Initialize widget
  - `open()` - Open chat programmatically
  - `close()` - Close chat programmatically
  - `sendMessage()` - Send messages programmatically
  - `update()` - Update configuration on the fly
  - `destroy()` - Clean up and remove widget
- 📝 Comprehensive documentation
  - README.md - Main documentation
  - IMPLEMENTATION_SUMMARY.md - Technical details
  - CDN_DEPLOYMENT_GUIDE.md - Deploy and usage guide
  - MIGRATION_GUIDE.md - Repository migration steps
- 🧪 Demo page (`index.html`) with live configuration
- ⚡ Optimized build with Vite
  - Minified bundle (~150KB gzipped)
  - Source maps for debugging
  - Tree-shaking for smaller bundle

### Components
- `ChatWidget` - Main widget component
- `Launcher` - Floating button with badge
- `ChatWindow` - Chat interface container
- `MessageList` - Message history display
- `MessageBubble` - Individual message component
- `InputArea` - Message input with send button
- `TypingIndicator` - Animated typing indicator
- `AudioPlayer` - Audio message playback
- `Gallery` - Image carousel viewer

### Hooks
- `useChatSocket` - Socket.IO connection management
- `useChatState` - Chat state management with reducer
- `useIsMobile` - Responsive breakpoint detection
- `useSEOMetadata` - SEO context extraction

### Features
- 🔐 API key authentication
- 👤 User context support (token, metadata)
- 📄 Page context support (URL, title, path)
- 📊 SEO metadata extraction (optional)
- 🎯 Event callbacks (`onNavigate`, `onLogin`, `onEvent`, `onStateChange`)
- 💬 Message types support (text, image, audio, location, buttons)
- 🔔 Notification badge on launcher
- ⚡ Typing indicators
- 📱 Mobile-first UI/UX
- 🎨 Customizable bubble styles
- 🖼️ Avatar system with emotions
- 🔄 Auto-reconnection handling

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ iOS Safari 14+
- ✅ Chrome Mobile

---

## [Unreleased]

### Planned Features
- [ ] Message persistence (localStorage/IndexedDB)
- [ ] Offline mode support
- [ ] File upload support
- [ ] Voice recording
- [ ] Rich media messages (cards, carousels)
- [ ] Multi-language support (i18n)
- [ ] Accessibility improvements (ARIA labels)
- [ ] Unit tests (Jest)
- [ ] E2E tests (Playwright)
- [ ] Storybook for component documentation
- [ ] Performance optimizations (lazy loading, code splitting)

---

[1.0.0]: https://github.com/tu-usuario/paseo-chat-widget/releases/tag/v1.0.0
