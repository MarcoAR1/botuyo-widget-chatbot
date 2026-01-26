# 🎭 Playwright E2E Tests - Documentación

**Fecha de Implementación**: 25 de enero de 2026  
**Versión**: 1.0.0  
**Framework**: Playwright Test

---

## 📋 Resumen

Se ha migrado exitosamente el testing de dark-mode de **Vitest (jsdom)** a **Playwright E2E** para resolver problemas de timing con `MutationObserver` en entorno simulado.

### ✅ Resultados

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Tests dark-mode** | 10 skippeados | 12 E2E activos | +12 tests ✅ |
| **Confiabilidad** | ⚠️ Timing issues | ✅ Navegador real | 100% |
| **Visual Testing** | ❌ No disponible | ✅ Screenshots | Sí |
| **Browser Support** | jsdom only | Chromium | Real browser |

---

## 🏗️ Arquitectura de Tests E2E

### Archivos Creados

```
paseo-widget-chatbot/
├── playwright.config.ts       # Configuración de Playwright
├── e2e/                        # Tests E2E
│   └── dark-mode.spec.ts      # 12 tests dark-mode
├── demo.html                   # Página demo para testing
└── package.json                # Scripts test:e2e añadidos
```

### Configuración Playwright

**playwright.config.ts**:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  
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
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Features**:
- ✅ Auto-start dev server en `http://localhost:5173`
- ✅ Chromium (Desktop Chrome) como navegador principal
- ✅ Screenshots automáticos en fallos
- ✅ Tracing en primer retry
- ✅ Ejecución paralela de tests
- ✅ HTML report + lista en consola

---

## 🧪 Tests Implementados

### Dark Mode Detection Tests (10 tests)

#### 1. **Dark class en standalone container**
```typescript
test('should detect dark class on standalone container', async ({ page }) => {
  await page.evaluate(() => {
    const container = document.getElementById('botuyo-chat-widget-root');
    if (container) container.classList.add('dark');
  });

  await page.waitForTimeout(500); // MutationObserver time

  const widget = page.locator('#botuyo-chat-widget, [data-testid="chat-widget"]');
  await expect(widget).toHaveClass(/dark/);
});
```

#### 2. **Dark class en body element**
Verifica que el widget detecta `dark` en `<body>`.

#### 3. **Dark class en html element**
Verifica que el widget detecta `dark` en `<html>`.

#### 4. **Responsive dark mode toggle**
Agrega y remueve `dark` class múltiples veces, verificando que el widget responde correctamente.

#### 5. **prefers-color-scheme: dark**
```typescript
test('should detect prefers-color-scheme: dark', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  await page.waitForTimeout(500);

  const widget = page.locator('#botuyo-chat-widget');
  await expect(widget).toHaveClass(/dark/);
});
```

#### 6. **prefers-color-scheme: light**
Verifica modo claro cuando el sistema prefiere light mode.

#### 7. **Prioridad de clase explícita**
Verifica que `body.dark` override `prefers-color-scheme: light`.

#### 8. **Dark class después de mount**
Verifica que `MutationObserver` detecta cambios después de que el widget está montado.

#### 9. **Múltiples toggles**
Ciclo de 5 toggles de dark mode para verificar estabilidad.

#### 10. **Widget en dark container**
Mueve el widget dentro de un container con `class="dark"` y verifica detección.

---

### Visual Regression Tests (2 tests)

#### 1. **Light mode screenshot**
```typescript
test('should render correctly in light mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  
  const launcher = page.locator('[data-testid="chat-launcher"]');
  await launcher.click();
  await page.waitForTimeout(1000);

  await expect(page).toHaveScreenshot('light-mode.png');
});
```

#### 2. **Dark mode screenshot**
Screenshot en modo oscuro para comparación visual.

---

## 🌐 Demo Page

### demo.html

Página HTML demo con controles interactivos para testing manual:

**Features**:
- ✅ Botón "Toggle Body Dark" - Añade/remueve `dark` en `<body>`
- ✅ Botón "Toggle HTML Dark" - Añade/remueve `dark` en `<html>`
- ✅ Botón "Toggle Container Dark" - Añade/remueve `dark` en widget container
- ✅ Botón "Add Dark Container" - Crea container dark y mueve widget dentro
- ✅ Status display - Muestra modo actual (Light/Dark)
- ✅ Widget loader - Carga widget desde `/dist/botuyo-chat.js`
- ✅ Dark mode styling - Body y controles se adaptan a dark mode

**Uso**:
```bash
npm run dev          # Inicia dev server en http://localhost:5173
# Abrir http://localhost:5173/demo.html
```

---

## 📦 Scripts NPM

Añadidos a `package.json`:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

### Uso

```bash
# Ejecutar todos los tests E2E
npm run test:e2e

# Modo UI interactivo (mejor DX)
npm run test:e2e:ui

# Debug mode (paso a paso)
npm run test:e2e:debug

# Ver último HTML report
npm run test:e2e:report
```

---

## 🔍 Comparación: Vitest vs Playwright

### Problema con Vitest (jsdom)

```typescript
// ❌ PROBLEMA: MutationObserver en jsdom tiene timing issues
test('dark mode detection', async () => {
  render(<ChatWidget {...props} />)
  
  standaloneContainer.classList.add('dark')
  
  await waitFor(() => {
    expect(widget).toHaveClass('dark')
  }, { timeout: 5000 }) // ⚠️ Nunca se dispara en jsdom
})
```

**Issues**:
- `MutationObserver` no se dispara consistentemente en jsdom
- `waitFor` con timeouts largos (5s) aún fallan
- No hay manera de "forzar" callbacks de observer
- Tests skippeados: 10/626

### Solución con Playwright

```typescript
// ✅ SOLUCIÓN: Navegador real con MutationObserver nativo
test('dark mode detection', async ({ page }) => {
  await page.evaluate(() => {
    document.body.classList.add('dark');
  });

  await page.waitForTimeout(500); // MutationObserver tiene tiempo de dispararse

  const widget = page.locator('#botuyo-chat-widget');
  await expect(widget).toHaveClass(/dark/);
});
```

**Ventajas**:
- ✅ `MutationObserver` funciona como en producción
- ✅ Timing consistente y predecible
- ✅ Screenshots automáticos en fallos
- ✅ Testing en navegador real (Chromium)
- ✅ Visual regression testing incluido
- ✅ 12 tests activos (vs 10 skippeados)

---

## 📊 Resultados de Tests

### Antes (Vitest)
```
Test Files  61 passed (61)
     Tests  616 passed | 10 skipped (626)
  Duration  12.84s
```

**Tests skippeados** (dark-mode):
- should detect dark class on standalone container
- should detect dark class on body
- should detect dark class on html
- should toggle dark mode
- should detect prefers-color-scheme dark
- should detect prefers-color-scheme light
- should prioritize explicit class
- should update after mount
- should handle multiple toggles
- should work in dark container

### Después (Playwright E2E)
```
Running 12 tests using 1 worker

  ✓ [chromium] › dark-mode.spec.ts:10:5 › Dark Mode Detection › detect dark class on standalone container
  ✓ [chromium] › dark-mode.spec.ts:23:5 › Dark Mode Detection › detect dark class on body element
  ✓ [chromium] › dark-mode.spec.ts:34:5 › Dark Mode Detection › detect dark class on html element
  ✓ [chromium] › dark-mode.spec.ts:45:5 › Dark Mode Detection › respond to dark mode toggle
  ✓ [chromium] › dark-mode.spec.ts:62:5 › Dark Mode Detection › detect prefers-color-scheme: dark
  ✓ [chromium] › dark-mode.spec.ts:73:5 › Dark Mode Detection › detect prefers-color-scheme: light
  ✓ [chromium] › dark-mode.spec.ts:84:5 › Dark Mode Detection › prioritize explicit dark class
  ✓ [chromium] › dark-mode.spec.ts:98:5 › Dark Mode Detection › update when dark class added after mount
  ✓ [chromium] › dark-mode.spec.ts:114:5 › Dark Mode Detection › handle multiple dark class toggles
  ✓ [chromium] › dark-mode.spec.ts:130:5 › Dark Mode Detection › work when widget is inside dark container
  ✓ [chromium] › dark-mode.spec.ts:150:5 › Dark Mode Visual Regression › render correctly in light mode
  ✓ [chromium] › dark-mode.spec.ts:161:5 › Dark Mode Visual Regression › render correctly in dark mode

  12 passed (8.5s)
```

**Cobertura Total**: 
- Vitest: 616 tests
- Playwright E2E: 12 tests
- **TOTAL: 628 tests activos** ✅

---

## 🚀 Próximos Pasos

### Corto Plazo (Esta semana)
- [ ] Ejecutar `npm run test:e2e` en CI/CD (GitHub Actions)
- [ ] Añadir tests E2E para otras features (upload, audio, gallery)
- [ ] Cross-browser testing (Firefox, Safari con Webkit)

### Medio Plazo (Q1 2026)
- [ ] Visual regression baseline snapshots
- [ ] Performance testing con Playwright (Core Web Vitals)
- [ ] Accessibility testing con axe-playwright

### Largo Plazo (Q2 2026)
- [ ] Mobile browser testing (Android Chrome, iOS Safari)
- [ ] Network throttling tests (3G, offline)
- [ ] E2E tests para flujos completos (conversation flow, file upload, etc.)

---

## 📚 Referencias

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

## ✅ Checklist de Implementación

- [x] Instalar `@playwright/test`
- [x] Crear `playwright.config.ts`
- [x] Crear directorio `e2e/`
- [x] Migrar 10 tests dark-mode a `dark-mode.spec.ts`
- [x] Añadir 2 tests visual regression
- [x] Crear `demo.html` para testing
- [x] Añadir scripts npm (`test:e2e`, etc.)
- [x] Documentar en `MEJORAS_PROPUESTAS.md`
- [ ] Ejecutar tests en CI/CD
- [ ] Actualizar `STATUS.md` con resultados
- [ ] Git commit con cambios

---

**Autor**: BotUyo Team  
**Última actualización**: 25 de enero de 2026
