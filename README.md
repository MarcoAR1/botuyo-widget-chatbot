# @botuyo/chat-widget-standalone

> AI-powered chat widget with Shadow DOM isolation, dark mode, voice chat, and full white-labeling. Works as a CDN script tag or NPM React component.

---

## Quick Start — CDN (Standalone)

Add a single script tag to any HTML page. No build step required.

```html
<script src="https://cdn.botuyo.com/widget/botuyo-chat.js"></script>
<script>
  BotUyoChat.init({
    apiKey: 'YOUR_API_KEY'
  });
</script>
```

That's it. The widget connects to the BotUyo backend, receives the agent configuration (name, avatar, colors, voice settings), and renders itself in a Shadow DOM so it never conflicts with your site's CSS.

### CDN — Custom Theme Override

You can override any server-sent value locally:

```html
<script src="https://cdn.botuyo.com/widget/botuyo-chat.js"></script>
<script>
  BotUyoChat.init({
    apiKey: 'YOUR_API_KEY',
    theme: {
      botName: 'Soporte',
      position: 'bottom-left',
      welcomeMessage: '¡Hola! ¿En qué te puedo ayudar?',
      inputPlaceholder: 'Escribí tu mensaje...',
      cssVariables: {
        primary: '210 100% 50%',        // Blue
        primaryForeground: '0 0% 100%', // White text on blue
        background: '0 0% 100%',        // White background
        foreground: '210 20% 12%',      // Dark text
        radius: '0.75rem',
      },
      darkCssVariables: {
        background: '220 40% 3%',
        foreground: '210 20% 98%',
        card: '220 40% 5%',
        muted: '220 30% 10%',
        border: '220 30% 12%',
      },
    },
  });
</script>
```

### CDN — Programmatic API

```js
BotUyoChat.open();                    // Open the chat window
BotUyoChat.close();                   // Close the chat window
BotUyoChat.sendMessage('Hola!');      // Send a message
BotUyoChat.destroy();                 // Remove widget from page

// Update config at runtime
BotUyoChat.update({
  theme: { botName: 'New Name' }
});
```

---

## NPM — React / Next.js

```bash
npm install @botuyo/chat-widget-standalone
```

### Option 1: Drop-in Component (Shadow DOM)

The default `ChatWidget` export renders inside Shadow DOM for full CSS isolation:

```tsx
import { ChatWidget } from '@botuyo/chat-widget-standalone';

export default function App() {
  return (
    <ChatWidget
      apiKey="YOUR_API_KEY"
      theme={{
        position: 'bottom-right',
        cssVariables: {
          primary: '210 100% 50%',
        },
      }}
    />
  );
}
```

### Option 2: Provider + Hook (Programmatic Control)

Use `ChatWidgetProvider` to access the widget state from any component:

```tsx
import { ChatWidgetProvider, useChatWidget } from '@botuyo/chat-widget-standalone';

function App() {
  return (
    <ChatWidgetProvider apiKey="YOUR_API_KEY">
      <MyPage />
    </ChatWidgetProvider>
  );
}

function MyPage() {
  const { open, close, isOpen, unreadCount, sendMessage } = useChatWidget();

  return (
    <button onClick={open}>
      Chat {unreadCount > 0 && `(${unreadCount})`}
    </button>
  );
}
```

### Option 3: Unstyled Component (No Shadow DOM)

If you want the widget in your own DOM tree (useful inside existing design systems):

```tsx
import { ChatWidgetUnstyled } from '@botuyo/chat-widget-standalone';
import '@botuyo/chat-widget-standalone/style.css';

export default function App() {
  return <ChatWidgetUnstyled apiKey="YOUR_API_KEY" />;
}
```

---

## Configuration Reference

### `ChatWidgetProps`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | **(required)** | Your public API key |
| `apiBaseUrl` | `string` | `https://api.botuyo.com` | Backend gateway URL |
| `agentId` | `string` | — | Connect to a specific agent flow |
| `theme` | `ChatTheme` | — | Visual configuration (see below) |
| `mediaConfig` | `MediaConfig` | — | Toggle images, audio, files, location, voice |
| `userContext` | `{ token?, metadata? }` | — | Pass authenticated user info |
| `pageContext` | `PageContext` | — | Page-level context sent with each message |
| `includeSEOMetadata` | `boolean` | `false` | Auto-capture page SEO data |
| `onNavigate` | `(url) => void` | — | Bot requests navigation |
| `onLogin` | `(userData) => void` | — | Bot completes authentication |
| `onEvent` | `(name, data) => void` | — | Widget lifecycle events |
| `onStateChange` | `(isOpen) => void` | — | Window open/close callback |

### `ChatTheme`

| Property | Type | Description |
|----------|------|-------------|
| `botName` | `string` | Bot display name |
| `logoUrl` | `string` | Bot avatar URL |
| `headerText` | `string` | Header bar text (overrides botName in header) |
| `position` | `'bottom-right' \| 'bottom-left'` | Launcher position |
| `welcomeMessage` | `string` | First message shown to user |
| `inputPlaceholder` | `string` | Input field placeholder |
| `starterPrompt` | `string` | Prompt bubble shown when chat is closed |
| `defaultLocale` | `'es' \| 'en' \| 'pt' \| 'fr'` | Widget language |
| `avatarScale` | `number` | 2D avatar zoom in the prompt/launcher (e.g., `1.2` = 20% bigger) |
| `avatarZoom` | `number` | 3D avatar (voice call) camera zoom — `>1` closer, `<1` farther. Default `1` |
| `avatarOffsetY` | `number` | 3D avatar (voice call) vertical framing nudge, in metres (`+` = look higher). Default `0` |
| `showPromptAvatar` | `boolean` | Show mini avatar in prompt bubble |
| `isHidden` | `boolean` | Hide widget (draft/paused agents) |
| `cssVariables` | `CSSVariables` | Light mode colors and layout (see below) |
| `darkCssVariables` | `Partial<CSSVariables>` | Dark mode color overrides |
| `animations` | `AnimationConfig` | Animation toggles |
| `effects` | `EffectsConfig` | Visual effect toggles |
| `avatars` | `EmotionAvatarMap` | Per-emotion avatar URLs |
| `avatar3dUrl` | `string` | URL to `.vrm`/`.glb` 3D model for voice calls |
| `bubbleStyles` | `BubbleStyles` | Fine-grained bubble/card styling |

### `cssVariables` — Design Tokens (HSL format)

All color values use **HSL without the `hsl()` wrapper**, e.g., `"210 100% 50%"`.

> **Two ways to set these tokens:**
> 1. **Consumer-side** — pass `theme.cssVariables` to `init()` / `<ChatWidget>` (this doc).
> 2. **Server-side (no code)** — set them on the agent's `widgetConfig.cssVariables` in the
>    BotUyo dashboard/JSON; they arrive via the socket `connection_ack` and apply to every embed.
>    Consumer-side values take precedence over server-side ones.
>
> Tip: to stay in sync with a host site's design system, read the site's CSS custom
> properties at runtime (`getComputedStyle(document.documentElement).getPropertyValue('--...')`)
> and map them into `cssVariables` — the widget then follows the site's tokens automatically.

| Variable | CSS Property | Default (Light) | Description |
|----------|-------------|-----------------|-------------|
| `background` | `--background` | `0 0% 100%` | Page/widget background |
| `foreground` | `--foreground` | `240 10% 3.9%` | Main text color |
| `card` | `--card` | `0 0% 100%` | Card background |
| `cardForeground` | `--card-foreground` | `240 10% 3.9%` | Card text |
| `primary` | `--primary` | `160 84% 39%` | Brand/accent color |
| `primaryForeground` | `--primary-foreground` | `0 0% 100%` | Text on primary bg |
| `muted` | `--muted` | `240 4.8% 95.9%` | Muted backgrounds |
| `mutedForeground` | `--muted-foreground` | `240 3.8% 46.1%` | Muted text |
| `border` | `--border` | `240 5.9% 90%` | Border color |
| `destructive` | `--destructive` | `0 84.2% 60.2%` | Error/danger color |
| `radius` | `--radius` | `0.5rem` | Base border radius |

**Layout, radius, border & typography variables:**

| Variable | CSS Property | Default | Description |
|----------|-------------|---------|-------------|
| `windowBorderRadius` | `--window-border-radius` | `24px` | Chat window corner radius (desktop) |
| `launcherBorderRadius` | `--launcher-border-radius` | `50%` | Launcher button radius |
| `bubbleRadius` | `--bubble-radius` | `18px` | Chat message bubble radius |
| `inputRadius` | `--input-radius` | `24px` | Text input radius |
| `buttonRadius` | `--button-radius` | *(round / `rounded-xl`)* | Buttons: send, mic, attach, header actions, quick-replies, CTAs |
| `avatarRadius` | `--avatar-radius` | *(circle)* | Avatar/logo container radius — set a small value so **square logos aren't cropped into circles** |
| `borderWidth` | `--border-width` | `1px` | Border thickness (window / bot bubbles / input) |
| `fontFamily` | `--font-family` | *(inherits page font)* | Widget font stack, e.g. `"'Inter', sans-serif"` |
| `windowHeight` | `--window-height` | `700px` | Chat window height (desktop) |
| `windowBottom` | `--window-bottom` | `24px` | Distance from bottom edge |

> **Everything here is fully consumer-customizable.** Any unset token falls back to
> its default, so you only override what you need — the widget never hard-codes these
> values internally.

**Spacing variables:**

| Variable | CSS Property | Default |
|----------|-------------|---------|
| `spacing1` | `--spacing-1` | `0.25rem` (4px) |
| `spacing2` | `--spacing-2` | `0.5rem` (8px) |
| `spacing3` | `--spacing-3` | `0.75rem` (12px) |
| `spacing4` | `--spacing-4` | `1rem` (16px) |
| `spacing5` | `--spacing-5` | `0.75rem` (12px) |
| `spacing6` | `--spacing-6` | `1.5rem` (24px) |
| `spacing7` | `--spacing-7` | `1.75rem` (28px) |
| `spacing8` | `--spacing-8` | `2rem` (32px) |

### `darkCssVariables`

Same keys as `cssVariables`. Only override surface colors — `primary` and `primaryForeground` are preserved from the light theme by default:

```js
darkCssVariables: {
  background: '220 40% 3%',
  foreground: '210 20% 98%',
  card: '220 40% 5%',
  muted: '220 30% 10%',
  border: '220 30% 12%',
}
```

### `AnimationConfig`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Master toggle |
| `messageEntry` | `'slide' \| 'fade' \| 'scale' \| 'spring' \| 'none'` | `'spring'` | Message entry style |
| `typingIndicator` | `'dots' \| 'wave' \| 'pulse' \| 'none'` | `'dots'` | Typing animation |
| `buttonEffects` | `boolean` | `true` | Hover/press effects |
| `smoothScroll` | `boolean` | `true` | Smooth scroll in messages |
| `launcherPulse` | `boolean` | `true` | Launcher pulse animation |
| `windowTransitions` | `boolean` | `true` | Window open/close animation |

### `EffectsConfig`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `glassmorphism` | `boolean` | `true` | Blur effect on headers |
| `gradients` | `boolean` | `true` | Gradient backgrounds |
| `softShadows` | `boolean` | `true` | Soft shadow effects |
| `glowEffects` | `boolean` | `true` | Hover/focus glow |
| `shimmerLoading` | `boolean` | `true` | Shimmer loading skeleton |
| `hoverLift` | `boolean` | `true` | Card hover lift effect |

---

## Dark Mode

The widget auto-detects dark mode via:
1. `data-theme="dark"` attribute on `<html>`
2. `prefers-color-scheme: dark` media query

When dark mode is active, colors are applied in this priority:
1. **User-provided `darkCssVariables`** (highest priority)
2. **Server-sent `darkCssVariables`** (from agent config)
3. **Built-in dark defaults** (fallback)

`primary` and `primaryForeground` are **never overridden** by dark defaults — they always come from your brand configuration.

---

## Events

Listen to widget lifecycle events via `onEvent`:

| Event Name | Data | Description |
|-----------|------|-------------|
| `backend_config` | `config` | Agent config received from server |
| `history_loaded` | `{ messages }` | Chat history loaded |
| `message_sent` | `{ id }` | Message delivered successfully |
| `message_failed` | `{ id, payload }` | Message delivery failed |
| `queued_message` | `{ id, payload }` | Message queued (offline) |

---

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build (ES + UMD + types)
npm run test:run     # Run all tests
npm run lint         # ESLint
npm run typecheck    # TypeScript check
```

## License

MIT
