import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Tests de Accesibilidad (A11y) con axe-core
 *
 * Valida:
 * - Cumplimiento WCAG 2.1 AA
 * - Roles ARIA correctos
 * - Navegación por teclado
 * - Contraste de colores
 * - Screen reader compatibility
 */

test.describe('Accessibility (A11y)', () => {
  test.beforeEach(async ({ page }) => {
    // Usar demo.html que tiene el widget auto-inicializado
    await page.goto('http://localhost:5173/demo.html')

    // Esperar a que el widget esté listo
    await page.waitForSelector('[data-testid="chat-launcher"]', { timeout: 10000 })
  })

  test('should not have any automatically detectable accessibility issues (launcher closed)', async ({
    page,
  }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility issues when chat is open', async ({ page }) => {
    // Abrir el chat
    const launcher = page.locator('[data-testid="chat-launcher"]')
    await launcher.click()

    // Esperar a que se abra completamente
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })
    await page.waitForTimeout(500) // Esperar animaciones

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper ARIA roles', async ({ page }) => {
    const launcher = page.locator('[data-testid="chat-launcher"]')
    await launcher.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Verificar rol de diálogo
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toHaveAttribute('aria-labelledby')
    await expect(dialog).toHaveAttribute('aria-describedby')

    // Verificar región de mensajes
    const messagesRegion = page.locator('[role="region"]')
    await expect(messagesRegion).toBeVisible()

    // Verificar log de mensajes (si está presente)
    const messageLog = page.locator('[role="log"]')
    if ((await messageLog.count()) > 0) {
      await expect(messageLog).toHaveAttribute('aria-live', 'polite')
    }
  })

  test('should be keyboard navigable (Tab, Enter, Escape)', async ({ page }) => {
    // Tab hasta el launcher
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Verificar que el launcher tiene focus
    const launcher = page.locator('[data-testid="chat-launcher"]')
    await expect(launcher).toBeFocused()

    // Enter para abrir
    await page.keyboard.press('Enter')
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Verificar que el diálogo está visible
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Escape para cerrar
    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)

    // Verificar que el diálogo se cerró
    await expect(dialog).not.toBeVisible()
  })

  test('should support Ctrl+Enter to send messages', async ({ page }) => {
    const launcher = page.locator('[data-testid="chat-launcher"]')
    await launcher.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Encontrar el textarea
    const textarea = page.locator('textarea').first()
    await textarea.fill('Test message')

    // Verificar que Ctrl+Enter envía el mensaje
    await page.keyboard.press('Control+Enter')

    // El textarea debería limpiarse
    await expect(textarea).toHaveValue('')
  })

  test('should have sufficient color contrast', async ({ page }) => {
    const launcher = page.locator('[data-testid="chat-launcher"]')
    await launcher.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.color'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should support prefers-reduced-motion', async ({ page, context }) => {
    // Simular preferencia de reducción de movimiento
    await context.emulateMedia({ reducedMotion: 'reduce' })

    const launcher = page.locator('[data-testid="chat-launcher"]')
    await launcher.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Verificar que las animaciones están deshabilitadas o reducidas
    const dialog = page.locator('[role="dialog"]')
    const animationDuration = await dialog.evaluate(el => {
      const style = window.getComputedStyle(el)
      return style.animationDuration || style.transitionDuration
    })

    // En modo prefers-reduced-motion, las duraciones deben ser muy cortas
    expect(animationDuration).toMatch(/0\.01ms|0s/)
  })

  test('should support high contrast mode', async ({ page, context }) => {
    // Simular preferencia de alto contraste
    await context.emulateMedia({ colorScheme: 'dark', forcedColors: 'active' })

    const launcher = page.locator('[data-testid="chat-launcher"]')
    await launcher.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Verificar que no hay violaciones de contraste
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.color'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have accessible form labels', async ({ page }) => {
    const launcher = page.locator('[data-testid="chat-launcher"]')
    await launcher.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Verificar que el textarea tiene aria-label
    const textarea = page.locator('textarea').first()
    const ariaLabel = await textarea.getAttribute('aria-label')
    const ariaDescribedby = await textarea.getAttribute('aria-describedby')

    expect(ariaLabel || ariaDescribedby).toBeTruthy()
  })

  test('should have focus visible indicators', async ({ page }) => {
    const launcher = page.locator('[data-testid="chat-launcher"]')
    await launcher.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Navegar con Tab
    await page.keyboard.press('Tab')

    // Verificar que el elemento enfocado tiene outline visible
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      if (!el) return null
      const style = window.getComputedStyle(el)
      return {
        outline: style.outline,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      }
    })

    // Debe tener outline o box-shadow para indicar focus
    expect(
      focusedElement?.outline !== 'none' ||
        focusedElement?.outlineWidth !== '0px' ||
        focusedElement?.boxShadow !== 'none'
    ).toBe(true)
  })

  test('should trap focus within dialog when open', async ({ page }) => {
    const launcher = page.locator('[data-testid="chat-launcher"]')
    await launcher.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Obtener todos los elementos enfocables dentro del diálogo
    const focusableElements = await page
      .locator('[role="dialog"] button, [role="dialog"] textarea, [role="dialog"] [tabindex="0"]')
      .count()

    expect(focusableElements).toBeGreaterThan(0)

    // Tab múltiples veces
    for (let i = 0; i < focusableElements + 2; i++) {
      await page.keyboard.press('Tab')

      // Verificar que el focus sigue dentro del diálogo
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        return el?.closest('[role="dialog"]') !== null
      })

      expect(focusedElement).toBe(true)
    }
  })

  test('should announce new messages to screen readers', async ({ page }) => {
    const launcher = page.locator('[data-testid="chat-launcher"]')
    await launcher.click()
    await page.waitForSelector('[role="dialog"]', { state: 'visible' })

    // Verificar que existe una región aria-live para anunciar mensajes
    const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]')
    await expect(liveRegion).toBeAttached()
  })
})
