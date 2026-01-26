# 📊 Plan de Optimización - BotUyo Chat Widget

**Fecha de Inicio**: 25 de enero de 2026  
**Duración Estimada**: 2-3 semanas  
**Objetivo**: Reducir bundle 50% (1,021KB → ~500KB) + Implementar E2E tests

---

## 🎯 Objetivos Principales

### 1. **Code Splitting y Lazy Loading** (Semana 4-5)
**Target**: Reducir initial bundle de 1,021KB a ~300KB  
**Estrategia**: Cargar solo lo esencial al inicio, el resto bajo demanda

### 2. **Playwright E2E Tests** (Semana 6-7)
**Target**: 626/626 tests pasando (100%)  
**Estrategia**: Migrar 10 tests dark-mode skipped a E2E con navegador real

### 3. **Optimización General de Bundle** (Continuo)
**Target**: Bundle total ~500KB (reducción 50%)  
**Estrategia**: Tree shaking, compresión, code splitting

---

## 📋 Plan de Acción Detallado

### **Fase 1: Análisis del Bundle Actual** (Día 1)

#### ✅ Tareas
- [x] Instalar `rollup-plugin-visualizer`
- [ ] Generar reporte visual del bundle
- [ ] Identificar dependencias más pesadas
- [ ] Documentar oportunidades de optimización

#### 📊 Análisis Esperado
```bash
# Bundle actual (conocido):
- Total: 1,021KB (306KB gzip)
- CSS: 45KB (8.7KB gzip)

# Dependencias pesadas (estimado):
- react + react-dom: ~140KB
- socket.io-client: ~100KB
- lucide-react: ~18 iconos (optimizado ✅)
- @tanstack/react-virtual: ~30KB
- clsx + cn utils: ~2KB
```

#### 🎯 Output
Reporte `dist/stats.html` con visualización interactiva del bundle

---

### **Fase 2: Code Splitting Implementation** (Días 2-4)

#### Strategy: Dividir en 3 chunks principales

##### **Chunk 1: Core (Launcher)** - Target: ~50-80KB
```typescript
// standalone.tsx - Solo cargar el launcher inicialmente
import { Launcher } from './src/chat-widget/components/Launcher'
import './styles.css'

// NO importar ChatWidget todavía
const root = document.getElementById('botuyo-chat-widget-root')
ReactDOM.createRoot(root).render(<Launcher onOpen={loadChatWidget} />)
```

##### **Chunk 2: Chat UI** - Target: ~150-200KB  
```typescript
// Lazy load cuando usuario abre el chat
const ChatWidget = lazy(() => import('./src/chat-widget/ChatWidget'))
const ChatWindow = lazy(() => import('./src/chat-widget/components/ChatWindow'))
const MessageList = lazy(() => import('./src/chat-widget/components/MessageList'))
const InputArea = lazy(() => import('./src/chat-widget/components/InputArea'))

const loadChatWidget = () => {
  setShowChat(true) // Esto dispara el lazy load
}
```

##### **Chunk 3: Features Opcionales** - Target: ~100-150KB
```typescript
// Lazy load solo cuando se usan
const Gallery = lazy(() => import('./src/chat-widget/components/Gallery'))
const AudioPlayer = lazy(() => import('./src/chat-widget/components/AudioPlayer'))

// En MessageBubble.tsx
{message.type === 'audio' && (
  <Suspense fallback={<div>Cargando reproductor...</div>}>
    <AudioPlayer src={message.audioUrl} />
  </Suspense>
)}

{message.gallery && (
  <Suspense fallback={<div>Cargando galería...</div>}>
    <Gallery images={message.gallery} />
  </Suspense>
)}
```

##### **Chunk 4: Socket.IO** - Target: ~100KB
```typescript
// Lazy load socket solo cuando se abre el chat
const initSocket = async () => {
  const { io } = await import('socket.io-client')
  return io(config.socketUrl, config.socketOptions)
}

// En ChatWidget.tsx
useEffect(() => {
  if (isOpen && !socket) {
    initSocket().then(setSocket)
  }
}, [isOpen])
```

#### 📝 Implementation Checklist
- [ ] Mover Launcher a componente independiente
- [ ] Envolver ChatWidget en React.lazy()
- [ ] Envolver Gallery en React.lazy()
- [ ] Envolver AudioPlayer en React.lazy()
- [ ] Lazy load Socket.IO client
- [ ] Agregar Suspense boundaries con fallbacks apropiados
- [ ] Configurar Vite manualChunks para control de splitting
- [ ] Probar que todos los lazy loads funcionan correctamente

#### ⚙️ Vite Configuration
```javascript
// vite.config.mjs
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'socket': ['socket.io-client'],
          'ui-components': [
            './src/chat-widget/components/ChatWindow',
            './src/chat-widget/components/MessageList',
            './src/chat-widget/components/InputArea',
          ],
          'features': [
            './src/chat-widget/components/Gallery',
            './src/chat-widget/components/AudioPlayer',
          ]
        }
      }
    }
  }
})
```

#### 🎯 Expected Results
```
✅ Initial Load (Launcher only):
   - botuyo-chat-core.js: ~80KB (25KB gzip)
   - botuyo-chat.css: 45KB (8.7KB gzip)
   - Total: ~125KB (~34KB gzip) ⚡

📦 Lazy Loaded Chunks:
   - react-vendor.js: ~140KB (deduped if already on page)
   - chat-ui.js: ~180KB (lazy load on open)
   - socket.js: ~100KB (lazy load on open)
   - features.js: ~120KB (lazy load on use)

💡 Total Downloaded on Full Use: ~500KB
   vs Current: 1,021KB
   **Savings: 51% reduction** 🎉
```

---

### **Fase 3: Playwright E2E Setup** (Días 5-6)

#### 📦 Installation
```bash
npm install -D @playwright/test
npx playwright install chromium
```

#### ⚙️ Configuration
```javascript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

#### 🧪 Migration Plan: Dark Mode Tests
```typescript
// src/test/e2e/dark-mode.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Dark Mode Detection', () => {
  test('detects dark class on standalone container', async ({ page }) => {
    await page.goto('/demo.html')
    
    // Add dark class to container
    await page.evaluate(() => {
      const container = document.getElementById('botuyo-chat-widget-root')
      container?.classList.add('dark')
    })
    
    // Wait for widget to detect and apply dark mode
    const widget = page.locator('#botuyo-chat-widget')
    await expect(widget).toHaveClass(/dark/)
  })
  
  test('detects dark class on parent elements', async ({ page }) => {
    await page.goto('/demo.html')
    
    await page.evaluate(() => {
      document.body.classList.add('dark')
    })
    
    const widget = page.locator('#botuyo-chat-widget')
    await expect(widget).toHaveClass(/dark/)
  })
  
  test('responds to dark mode toggle', async ({ page }) => {
    await page.goto('/demo.html')
    
    const widget = page.locator('#botuyo-chat-widget')
    
    // Should start without dark mode
    await expect(widget).not.toHaveClass(/dark/)
    
    // Add dark mode
    await page.evaluate(() => document.body.classList.add('dark'))
    await expect(widget).toHaveClass(/dark/)
    
    // Remove dark mode
    await page.evaluate(() => document.body.classList.remove('dark'))
    await expect(widget).not.toHaveClass(/dark/)
  })
  
  test('detects prefers-color-scheme: dark', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/demo.html')
    
    const widget = page.locator('#botuyo-chat-widget')
    await expect(widget).toHaveClass(/dark/)
  })
})
```

#### 📝 E2E Test Checklist
- [ ] Instalar Playwright
- [ ] Crear `playwright.config.ts`
- [ ] Crear carpeta `src/test/e2e/`
- [ ] Crear archivo demo `public/demo.html` para testing
- [ ] Migrar 10 tests dark-mode a E2E
- [ ] Agregar script `"test:e2e": "playwright test"` a package.json
- [ ] Verificar que todos los tests pasen en Chromium
- [ ] Verificar cross-browser (Firefox, Safari)
- [ ] Actualizar CI para ejecutar E2E tests

#### 🎯 Expected Results
```bash
✅ Before: 616/626 tests passing (10 skipped)
✅ After: 626/626 tests passing (100% ✨)

E2E Test Coverage:
  - Dark mode detection: 10 tests
  - Cross-browser: 3 browsers
  - Visual regression: Screenshots on failure
```

---

### **Fase 4: Optimizaciones Adicionales** (Días 7-10)

#### 🔧 CSS Optimization
```bash
npm install -D cssnano
```

```javascript
// postcss.config.cjs
module.exports = {
  plugins: {
    cssnano: {
      preset: ['advanced', {
        discardComments: { removeAll: true },
        reduceIdents: true,
        mergeRules: true,
      }]
    }
  }
}
```

**Expected**: 45KB → ~35KB CSS (22% reduction)

#### 🚀 Preload Critical Resources
```html
<!-- index.html -->
<link rel="preload" href="/dist/botuyo-chat-core.js" as="script">
<link rel="preload" href="/dist/botuyo-chat.css" as="style">
<link rel="dns-prefetch" href="https://api.botuyo.com">
<link rel="preconnect" href="wss://api.botuyo.com">
```

**Expected**: -200ms en tiempo de carga inicial

#### ⚙️ Terser Optimization
```javascript
// vite.config.mjs
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      }
    }
  }
})
```

**Expected**: Additional 5-10KB reduction

#### 📝 Optimization Checklist
- [ ] Configurar cssnano para CSS
- [ ] Agregar preload hints a index.html
- [ ] Optimizar terserOptions
- [ ] Configurar brotli compression
- [ ] Analizar y eliminar código muerto
- [ ] Optimizar imports (tree shaking)

---

## 📊 Success Metrics

### Performance Targets
```
Initial Load (Critical):
  ✅ Target: < 100KB (gzip)
  📊 Current: 306KB (gzip)
  🎯 Goal: ~30KB (launcher only)

Full Widget Load:
  ✅ Target: < 500KB (total)
  📊 Current: 1,021KB
  🎯 Goal: ~500KB (50% reduction)

Loading Times:
  ✅ FCP: < 1s (First Contentful Paint)
  ✅ TTI: < 2s (Time to Interactive)
  ✅ Launcher visible: < 500ms
```

### Test Coverage
```
Unit Tests:
  ✅ Current: 616/626 (98.4%)
  🎯 Target: 626/626 (100%)

E2E Tests:
  ✅ Current: 0
  🎯 Target: 10+ tests (dark-mode)
  
Cross-Browser:
  ✅ Chrome: Required
  ✅ Firefox: Required
  ✅ Safari: Required
```

### Quality Gates
```
Build:
  ✅ Build succeeds without errors
  ✅ All chunks load correctly
  ✅ Lazy loading works as expected

Tests:
  ✅ 100% tests passing
  ✅ No regressions in functionality
  ✅ E2E tests pass in CI

Bundle:
  ✅ < 500KB total size
  ✅ < 100KB initial load
  ✅ Proper code splitting applied
```

---

## 🗓️ Timeline

### Semana 4 (Días 1-5): Code Splitting
- **Día 1**: Análisis de bundle + visualización
- **Día 2**: Implementar lazy load de ChatWidget
- **Día 3**: Implementar lazy load de features (Gallery, Audio)
- **Día 4**: Lazy load Socket.IO + configurar manualChunks
- **Día 5**: Testing + ajustes de Suspense boundaries

### Semana 5 (Días 6-10): Playwright + Optimizaciones
- **Día 6**: Instalar y configurar Playwright
- **Día 7**: Migrar tests dark-mode a E2E
- **Día 8**: CSS optimization + preload hints
- **Día 9**: Terser optimization + final tuning
- **Día 10**: Testing completo + documentación

---

## 📁 Files to Create/Modify

### New Files
```
✅ OPTIMIZATION_PLAN.md (este archivo)
□ playwright.config.ts
□ src/test/e2e/dark-mode.spec.ts
□ public/demo.html (para E2E testing)
□ postcss.config.cjs (para cssnano)
```

### Files to Modify
```
□ vite.config.mjs (code splitting + optimization)
□ standalone.tsx (lazy loading implementation)
□ src/chat-widget/ChatWidget.tsx (lazy socket.io)
□ src/chat-widget/components/MessageBubble.tsx (lazy features)
□ package.json (new scripts: test:e2e)
□ README.md (update with new bundle sizes)
□ CHANGELOG.md (document optimizations)
```

---

## 🚀 Next Steps

**Immediate Actions (Hoy)**:
1. ✅ Crear este documento de planificación
2. ⏳ Generar reporte visual del bundle
3. ⏳ Identificar dependencias más pesadas
4. ⏳ Comenzar implementación de lazy loading

**Tomorrow**:
1. Implementar lazy load de ChatWidget
2. Configurar Suspense boundaries
3. Comenzar con lazy load de features

---

## 📚 Referencias

- [Vite Code Splitting](https://vite.dev/guide/build.html#chunking-strategy)
- [React.lazy + Suspense](https://react.dev/reference/react/lazy)
- [Playwright Testing](https://playwright.dev/docs/intro)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
- [Web Vitals](https://web.dev/vitals/)

---

**Última actualización**: 25 de enero de 2026, 20:00  
**Estado**: 📋 En progreso - Fase 1 iniciada
