import { expect, test, type Page } from '@playwright/test'

async function expectSeparateRows(page: Page) {
  // Wait for entry animations and ResizeObserver to settle, then inspect actual
  // browser geometry (DOM-only unit tests cannot detect overlapping bubbles).
  await expect
    .poll(async () =>
      page.locator('[style*="position: absolute"][style*="translateY"]').evaluateAll(rows => {
        if (rows.length < 2) return Number.MAX_SAFE_INTEGER
        const boxes = rows.map(row => row.getBoundingClientRect())
        return Math.max(...boxes.slice(1).map((box, i) => boxes[i].bottom - box.top))
      })
    )
    .toBeLessThanOrEqual(1)
}

for (const count of [100, 120]) {
  test(`no overlap after inactivity, history refresh and reopen (${count} messages)`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`/e2e/fixtures/messages.html?count=${count}`)
    await page.getByRole('button', { name: 'Enviar tras inactividad' }).click()
    await expect(page.getByText(`Mensaje ${count}.`, { exact: false })).toBeVisible()
    await expectSeparateRows(page)
    await page.getByRole('button', { name: 'Recuperar historial' }).click()
    await expect(page.getByText('Historial actualizado.', { exact: false })).toBeVisible()
    await expectSeparateRows(page)
    await page.getByRole('button', { name: 'Cambiar ancho' }).click()
    await expectSeparateRows(page)
    await page.getByRole('button', { name: 'Abrir/cerrar' }).click()
    await page.getByRole('button', { name: 'Abrir/cerrar' }).click()
    await expect(page.getByText(`Mensaje ${count}.`, { exact: false })).toBeVisible()
    await expectSeparateRows(page)
    await page.getByRole('button', { name: 'Anteponer historial' }).click()
    await expectSeparateRows(page)
    await page.getByRole('button', { name: 'Ocultar contenedor' }).click()
    await page.getByRole('button', { name: 'Ocultar contenedor' }).click()
    await expectSeparateRows(page)
    await page.getByRole('button', { name: 'Escribiendo', exact: true }).click()
    await expect
      .poll(() =>
        page.getByTestId('chat').evaluate(chat => {
          const scroll = chat.firstElementChild as HTMLElement
          return scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop
        })
      )
      .toBeLessThanOrEqual(1)
    await page.getByRole('button', { name: 'Historial parcial' }).click()
    await expect(page.locator('[data-index]')).toHaveCount(0)
    await expect(page.getByText(`Mensaje ${count}.`, { exact: false })).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('short conversations wrap unbroken text within the viewport', async ({ page }) => {
  await page.goto('/e2e/fixtures/messages.html?count=3')
  await page.getByRole('button', { name: 'Cambiar ancho' }).click()
  await page.getByRole('button', { name: 'Enviar tras inactividad' }).click()
  await expect(page.getByText('Mensaje 3.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Texto sin espacios' }).click()
  await expect(page.getByText('x'.repeat(500), { exact: true })).toBeVisible()
  const overflow = await page.getByTestId('chat').evaluate(chat => {
    const scroll = chat.firstElementChild as HTMLElement
    return scroll.scrollWidth - scroll.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(1)
})

test('remeasures a virtual row when a delayed image loads', async ({ page }) => {
  let release!: () => void
  const ready = new Promise<void>(resolve => {
    release = resolve
  })
  await page.route('**/delayed.svg', async route => {
    await ready
    await route.fulfill({
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="600"><rect width="200" height="600" fill="blue"/></svg>',
    })
  })
  await page.goto('/e2e/fixtures/messages.html?count=120')
  await page.getByRole('button', { name: 'Cargar imagen' }).click()
  await expect(page.getByAltText('Prueba de carga')).toBeAttached()
  release()
  await expect
    .poll(() =>
      page
        .getByAltText('Prueba de carga')
        .evaluate(image => (image as HTMLImageElement).naturalHeight)
    )
    .toBe(600)
  await expectSeparateRows(page)
})
