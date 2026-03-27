---
name: BotUyo Chat Widget Architecture & TDD
description: Comprehensive architecture, structure, conventions, component patterns, and hard rules for the botuyo-widget-chatbot project. Read this BEFORE making any changes.
---

# BotUyo Chat Widget — Hard Rules & Architecture

> **READ THIS ENTIRE FILE before making changes to the codebase.** These are immutable rules that MUST be followed.

**Core stack:** React · TypeScript (strict) · Vite · Tailwind CSS · Socket.IO · Zod · Vitest · Playwright · Storybook
**Published as:** `@botuyo/chat-widget-standalone` on npm (ES + UMD formats)
**Path alias:** `@/` → `./src/`

---

## RULE 1: Project Architecture

```
src/
├── chat-widget/          # Main widget source
│   ├── components/       # UI components (one responsibility each, co-located stories)
│   ├── hooks/            # Custom React hooks (socket, state, theme, a11y)
│   ├── types/            # TypeScript types (props, messages, socket events)
│   ├── utils/            # Pure utility functions (logger, theme, storage, etc.)
│   ├── i18n/             # Internationalization (translations + context + hook)
│   ├── voice/            # Voice chat module (Enterprise tier)
│   ├── contexts/         # React contexts (animation, etc.)
│   ├── styles/           # CSS files (a11y, animations)
│   ├── ChatWidget.tsx    # Root orchestrator component
│   ├── ChatWidgetProvider.tsx  # React Context Provider (public API)
│   └── index.tsx         # npm public API exports
├── lib/                  # Generic React-free utilities
└── test/                 # Test files (mirrors src/ structure)
    ├── setup.ts          # Global mocks (browser APIs)
    ├── components/       # Component tests
    ├── hooks/            # Hook tests
    └── utils/            # Utility tests
```

## RULE 2: Dual Build Output (ES + UMD)

The widget ships as an **npm library** with two formats — ES module for React apps, UMD for CDN `<script>` tags.

**Hard rules:**
- **React and Three.js are externalized** — consumers provide their own
- **CSS is compiled** via Tailwind CLI into an internal stylesheet — imported inline
- **`standalone.tsx`** is the CDN entry — auto-mounts via `window.BotUyoChat.init()`
- **`src/chat-widget/index.tsx`** is the npm public API — export everything consumers need here
- **NEVER add non-tree-shakeable imports** — bundle size is critical for an embeddable widget

## RULE 3: Shadow DOM CSS Isolation

The widget uses **Shadow DOM** to prevent CSS conflicts with host pages:

- A dedicated host component creates a shadow root and injects compiled Tailwind CSS
- **All styles MUST be Tailwind classes** — external CSS won't reach inside shadow DOM
- **The compiled CSS file is auto-generated** — NEVER edit it manually (gets overwritten on build)

## RULE 4: Component Architecture

**Single Responsibility** — each component has ONE job. The root `ChatWidget` orchestrates hooks and renders the window + launcher.

**Hard rules:**
- **Functional components only** — no class components
- **Named exports** — `export function Name()`, not `export default`
- **Props via interface** — inline `Props` or `{Name}Props`
- **Co-located stories** — `Component.stories.tsx` next to `Component.tsx`
- **Logger over console** — use the centralized `logger` from `utils/logger.ts`

```typescript
// ✅ Standard component pattern
interface Props {
  message: ChatMessage
  onAction?: () => void
}

export function MyComponent({ message, onAction }: Props) {
  // hooks first, then handlers, then render
  return <div>...</div>
}
```

## RULE 5: Hook Architecture

The widget uses an **orchestrator hook pattern**:

```
useChatWidget (orchestrator)
├── useChatSocket  → Socket.IO lifecycle, message validation (Zod), send/receive
├── useChatState   → useReducer for ChatState (messages, typing, errors)
├── useWidgetTheme → Injects CSS variables from ChatTheme
├── useDarkMode    → Dark mode detection
└── useDynamicHeight → Mobile viewport fix
```

**Hard rules:**
- **`useChatSocket` is the CRITICAL hook** — Socket.IO lifecycle, Zod validation of incoming messages, reconnection
- **Socket events are typed** via `types/socket.ts` — `ClientToServerEvents`, `ServerToClientEvents`
- **Bot messages validated with Zod** before processing — invalid payloads are logged and dropped
- **`pageContext` uses `useRef`** internally — changes do NOT cause socket reconnection
- **Rate limiting** enforced to prevent message spam

## RULE 6: Socket.IO Protocol

Connection authenticates with `{ apiKey, deviceId, agentId }`. Transport: websocket with polling fallback.

**Hard rules:**
- **Device ID persisted** in localStorage — identifies anonymous users across sessions
- **Socket reconnection** handled automatically by Socket.IO — NEVER manually reconnect
- **NEVER send raw user input** without sanitization — XSS prevention
- **All socket event types** defined in `types/socket.ts` — NEVER use untyped events

## RULE 7: Theming & CSS Variables

Theme flows: `ChatWidgetProps.theme` → `useWidgetTheme` hook → CSS variables injected on shadow root.

**Architecture:** HSL-based CSS variable system supporting light/dark mode. Dark mode overrides only surface colors — primary is preserved from light mode.

**Hard rules:**
- **Use Tailwind classes** referencing CSS vars (e.g., `bg-[hsl(var(--background))]`)
- **NEVER use hardcoded colors** — always reference theme tokens or CSS variables
- **`BubbleStyles`** allows per-tenant bubble customization

## RULE 8: Internationalization (i18n)

Supported languages: `es` (Spanish - default) · `en` · `pt` · `fr`

**Architecture:** Single translations file with 4 language objects, exposed via React context + `useTranslations()` hook.

**Hard rules:**
- **Add keys to ALL 4 languages** when adding translations
- **NEVER hardcode user-facing strings** — always use `t()`
- **Language auto-detected** from browser, overrideable via `defaultLocale` prop

## RULE 9: Logging

The widget uses a centralized `logger` with a DEBUG flag:

- **`logger.error`** — ALWAYS shown (even in production)
- **All other levels** (`log`, `warn`, `debug`, `info`) — only in dev mode or when `window.DEBUG = true`
- **Prefix format:** `[ComponentName] Description`
- **In tests** use `silentLogger` to suppress output
- **NEVER use `console.*` directly** — always use `logger.*`

## RULE 10: Testing & TDD (MANDATORY)

**TEST-DRIVEN DEVELOPMENT (TDD) IS MANDATORY for all changes.**

### TDD Cycle — Red → Green → Refactor
1. **🔴 Red** — Write the test FIRST. It MUST fail.
2. **🟢 Green** — Write the MINIMUM code to make it pass.
3. **🔵 Refactor** — Improve quality while keeping ALL tests green.
4. **✅ Verify** — `npm run build && npm run test:run` must pass with zero errors.

### Test Conventions
- **Framework:** Vitest (happy-dom) + React Testing Library + Playwright (E2E)
- **Tests live in `src/test/`** mirroring the source structure
- **Naming:** `{ComponentName}.test.tsx`, `{hookName}.test.ts`, `{flow}.e2e.ts`
- **Mocking:** Socket.IO via `vi.mock`, browser APIs globally in `setup.ts`, never mock React itself

### Regression Prevention
- **Run FULL suite** before marking any task done
- **If an existing test breaks:** false regression → update test first; real regression → fix your code
- **NEVER delete or weaken tests** without explicit user direction
- **NEVER skip tests** with `.skip` or `xit`
- **NEVER use `--no-verify`** on git hooks — fix the errors instead

**No task is considered complete until build + test pass with zero errors.**

## RULE 11: Code Quality

- **TypeScript strict mode** — `strict: true`, `noUnusedLocals`, `noUnusedParameters`
- **Strong typing** — every prop, socket payload, and message MUST have an interface
- **Unused params:** prefix with `_`
- **Prettier + ESLint** enforced via husky pre-commit + lint-staged — NEVER skip
- **File naming:** Components `PascalCase.tsx`, hooks/utils/types `camelCase.ts`, stories `PascalCase.stories.tsx`

## RULE 12: Common Pitfalls (NEVER Do These)

1. ❌ Editing the compiled CSS manually → gets overwritten on build
2. ❌ Adding CSS that doesn't work in Shadow DOM → styles won't apply
3. ❌ Causing socket reconnection on `pageContext` change → use `useRef` pattern
4. ❌ Hardcoding strings instead of using `t()` → breaks i18n
5. ❌ Hardcoding colors instead of CSS variables → breaks theming
6. ❌ Importing heavy libs unconditionally → bloats bundle (must be lazy/external)
7. ❌ Modifying public API types without considering npm consumers → breaking change
8. ❌ Skipping Zod validation on bot messages → crashes on malformed payloads
9. ❌ Using `console.*` directly instead of `logger.*` → inconsistent debug behavior
10. ❌ Deleting/weakening tests → violates TDD policy

---

## Reference Files

For mutable details (specific component list, build pipeline, publish workflow, Storybook patterns), see:
- [conventions.md](./conventions.md) — How to add components, hooks, publish workflow, Storybook patterns
