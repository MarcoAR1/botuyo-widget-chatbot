# BotUyo Chat Widget — Conventions & How-To Guide

> This file contains patterns that CAN change over time. For immutable rules, see [SKILL.md](./SKILL.md).

## How to Add a New Component

### Step-by-step checklist:

1. **Create component** at `src/chat-widget/components/{Name}.tsx`
2. **Create test** at `src/test/components/{Name}.test.tsx` (TDD: write test FIRST)
3. **Create story** at `src/chat-widget/components/{Name}.stories.tsx`
4. **Export from barrel** — add to `src/chat-widget/components/index.ts`
5. **If public API** — also export from `src/chat-widget/index.tsx`
6. **Run checks** — `npm run typecheck && npm run test:run && npm run build`

### Component Template
```typescript
// src/chat-widget/components/MyComponent.tsx
import { logger } from '../utils/logger'
import type { ChatMessage } from '../types'

interface Props {
  data: ChatMessage
  onAction?: () => void
}

export function MyComponent({ data, onAction }: Props) {
  return (
    <div className="rounded-lg bg-[hsl(var(--card))] p-3">
      {/* content */}
    </div>
  )
}
```

### Story Template
```typescript
// src/chat-widget/components/MyComponent.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyComponent } from './MyComponent'

const meta: Meta<typeof MyComponent> = {
  title: 'Widget/MyComponent',
  component: MyComponent,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof MyComponent>

export const Default: Story = {
  args: {
    data: { /* mock data */ },
  },
}
```

---

## How to Add a New Hook

### Step-by-step checklist:

1. **Create test** at `src/test/hooks/{hookName}.test.ts` (TDD: test FIRST)
2. **Create hook** at `src/chat-widget/hooks/{hookName}.ts`
3. **Run checks** — `npm run typecheck && npm run test:run`

### Hook Template
```typescript
// src/chat-widget/hooks/useMyHook.ts
import { useState, useCallback } from 'react'
import { logger } from '../utils/logger'

interface UseMyHookOptions {
  initialValue?: string
}

interface UseMyHookReturn {
  value: string
  update: (newValue: string) => void
}

export function useMyHook(options: UseMyHookOptions = {}): UseMyHookReturn {
  const [value, setValue] = useState(options.initialValue ?? '')

  const update = useCallback((newValue: string) => {
    logger.debug('[useMyHook] Updating value:', newValue)
    setValue(newValue)
  }, [])

  return { value, update }
}
```

### Hook Test Template
```typescript
// src/test/hooks/useMyHook.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useMyHook } from '@/chat-widget/hooks/useMyHook'

describe('useMyHook', () => {
  it('should return default value', () => {
    const { result } = renderHook(() => useMyHook())
    expect(result.current.value).toBe('')
  })

  it('should update value', () => {
    const { result } = renderHook(() => useMyHook())
    act(() => result.current.update('new'))
    expect(result.current.value).toBe('new')
  })
})
```

---

## How to Add a New Utility

1. **Create test** at `src/test/utils/{utilName}.test.ts` (TDD: test FIRST)
2. **Create util** at `src/chat-widget/utils/{utilName}.ts`
3. **Keep it pure** — no React imports, no side effects
4. **Run checks** — `npm run typecheck && npm run test:run`

---

## How to Add Translations

1. Open `src/chat-widget/i18n/translations.ts`
2. Add the key to **ALL 4 language objects** (es, en, pt, fr)
3. Use in component: `const { t } = useTranslations(); t('new.key')`

---

## Build Pipeline Details

The full `npm run build` pipeline:

```bash
# 1. Clean dist/
npm run clean

# 2. Compile Tailwind CSS (input: styles.css → output: compiled-tailwind.css)
npm run build:css

# 3. Build ES module (vite.config.mjs → dist/botuyo-chat.es.js)
npm run build:es

# 4. Build UMD bundle (vite.config.umd.mjs → dist/botuyo-chat.umd.js)
npm run build:umd

# 5. Generate type declarations (tsconfig.build.json → dist/*.d.ts)
npm run build:types
```

### Build Outputs
```
dist/
├── botuyo-chat.es.js     # ES module (npm import)
├── botuyo-chat.umd.js    # UMD bundle (CDN <script>)
├── botuyo-chat.css        # Compiled styles
├── standalone.d.ts        # Type declarations
└── stats.html             # Bundle size visualization
```

---

## Publish Workflow

```bash
# 1. Full build + test
npm run build
npm run test:run
npm run typecheck

# 2. Bump version in package.json
# 3. Publish to npm
npm publish --access public
```

### Version Bumping
- **Patch** (1.0.x): Bug fixes, style tweaks, dependency updates
- **Minor** (1.x.0): New components, new hooks, new theme options
- **Major** (x.0.0): Breaking changes to `ChatWidgetProps`, socket protocol, or public API

---

## Storybook Conventions

### Story Organization
Stories are organized by category:
```
Widget/
├── ChatWindow
├── MessageBubble
├── InputArea
├── Launcher
├── AudioPlayer
├── Gallery
├── ErrorBoundary
└── TypingIndicator
```

### Writing Good Stories
- **One story per visual state** — Default, Loading, Error, Empty, etc.
- **Use realistic mock data** — not "lorem ipsum"
- **Include args** for interactive controls in Storybook UI
- **Add `tags: ['autodocs']`** for auto-generated documentation

---

## CSS Class Composition

Use the `cn()` helper from `src/lib/utils.ts` for conditional classes:

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  'rounded-lg p-3',
  isBot ? 'bg-[hsl(var(--card))]' : 'bg-[hsl(var(--primary))]',
  className
)}>
```

### Tailwind Class Priorities
1. **Layout** — flex, grid, w-, h-, p-, m-
2. **Visual** — bg-, text-, border-, rounded-, shadow-
3. **State** — hover:, focus:, active:, disabled:
4. **Animation** — transition-, animate-, duration-

---

## Message Type Handling

The `ChatMessage` union type dispatches rendering in `MessageBubble.tsx`:

| Type | Interface | Key Fields |
|------|-----------|-----------|
| `text` | `TextMessage` | `content`, `emotion?` |
| `image` | `ImageMessage` | `imageUrl`, `altText?` |
| `audio` | `AudioMessage` | `content` (URL/base64), `text?` (transcript) |
| `location` | `LocationMessage` | `latitude`, `longitude`, `name?` |
| `system` | `SystemMessage` | `content`, `sender: 'system'` |
| `file` | `FileMessage` | `fileUrl`, `fileName`, `mimeType?` |

When adding a new message type:
1. Add interface to `types/index.ts`
2. Add to `ChatMessage` union type
3. Add to `MessageType` literal union
4. Add rendering case in `MessageBubble.tsx`
5. Add Zod validation in `useChatSocket.ts` `BotMessageSchema`
6. Write tests for the new rendering

---

## State Management (useReducer)

Chat state is managed via `useChatState.ts` with a reducer pattern:

```typescript
// ChatState shape
interface ChatState {
  isOpen: boolean
  isConnected: boolean
  isTyping: boolean
  messages: ChatMessage[]
  error: string | null
  sessionId: string | null
}

// Dispatch actions
dispatch({ type: 'ADD_MESSAGE', payload: message })
dispatch({ type: 'SET_TYPING', payload: true })
dispatch({ type: 'CLEAR_CHAT' })
```

**Rule:** All state mutations go through dispatch — NEVER modify state directly.

---

## Deploy Script

`deploy.ps1` is a PowerShell script for CI/CD. It:
1. Runs full build + test suite
2. Bumps version
3. Publishes to npm
4. Tags the git release

On macOS/Linux, use the manual publish workflow above.
