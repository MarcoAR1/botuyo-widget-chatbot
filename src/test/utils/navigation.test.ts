import { it, expect, vi, afterEach } from 'vitest'
import { performNavigation } from '@/chat-widget/utils/navigation'

afterEach(() => {
  document.body.innerHTML = ''
})

it.each(['/es', '/en'])('scrolls a real section without changing locale %s', async locale => {
  window.history.replaceState({}, '', locale)
  const section = document.createElement('section')
  section.id = 'precios'
  section.scrollIntoView = vi.fn()
  document.body.append(section)
  expect(await performNavigation('#precios')).toBe('completed')
  expect(section.scrollIntoView).toHaveBeenCalledOnce()
  expect(window.location.pathname).toBe(locale)
})

it('rejects external URLs and missing anchors without calling the host router', async () => {
  const router = vi.fn()
  expect(await performNavigation('//evil.test', router)).toBe('failed')
  expect(await performNavigation('javascript:alert(1)', router)).toBe('failed')
  expect(await performNavigation('#missing', router)).toBe('failed')
  expect(router).not.toHaveBeenCalled()
})

it('does not call an unverified host route completed', async () => {
  const router = vi.fn()
  expect(await performNavigation('/another-route', router)).toBe('delegated')
  expect(router).toHaveBeenCalledWith('/another-route')
})
