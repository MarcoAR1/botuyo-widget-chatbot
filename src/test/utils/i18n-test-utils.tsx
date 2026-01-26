/**
 * Test utilities para i18n
 * Helpers para envolver componentes con LanguageProvider en tests
 */

import { ReactElement, ReactNode } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { LanguageProvider, type SupportedLocale } from '@/chat-widget/i18n'

interface I18nProviderWrapperProps {
  children: ReactNode
  defaultLocale?: SupportedLocale
}

/**
 * Wrapper para tests que necesitan i18n
 * Permite auto-detección si no se especifica defaultLocale
 */
export function I18nProviderWrapper({
  children,
  defaultLocale,
}: I18nProviderWrapperProps) {
  return <LanguageProvider defaultLocale={defaultLocale}>{children}</LanguageProvider>
}

/**
 * Custom render que incluye LanguageProvider automáticamente
 *
 * @example
 * renderWithI18n(<MyComponent />, { defaultLocale: 'en' })
 */
export function renderWithI18n(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { defaultLocale?: SupportedLocale }
) {
  const { defaultLocale = 'es', ...renderOptions } = options || {}

  return render(ui, {
    wrapper: ({ children }) => (
      <I18nProviderWrapper defaultLocale={defaultLocale}>{children}</I18nProviderWrapper>
    ),
    ...renderOptions,
  })
}
