/**
 * Hook de internacionalización para el Chat Widget
 * Sistema multi-idioma con detección automática y contexto global
 */

import { useCallback } from 'react'
import { translations, type SupportedLocale } from './translations'
import { useLanguage } from './LanguageContext'

// Función helper para obtener valor anidado
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}

/**
 * Hook para acceder a las traducciones con soporte multi-idioma
 * Usa el contexto global de idioma automáticamente
 *
 * @example
 * const { t, setLocale, currentLocale } = useTranslations()
 * t('online') // 'En línea' (si locale es 'es')
 * t('extracted.cerrar') // 'Cerrar'
 * setLocale('en') // Cambiar a inglés
 */
export function useTranslations(namespace?: string) {
  const { locale: currentLocale, setLocale } = useLanguage()

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const messages = translations[currentLocale]
      const fullKey = namespace ? `${namespace}.${key}` : key
      let translation = getNestedValue(messages, fullKey) || key
      if (params) {
        translation = translation.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => params[k] ?? `{{${k}}}`)
      }
      return translation
    },
    [currentLocale, namespace]
  )

  return {
    t,
    setLocale,
    currentLocale,
  }
}

/**
 * Función para obtener traducción directamente sin hook
 * Útil para uso fuera de componentes
 */
export function t(key: string, locale: SupportedLocale = 'es', params?: Record<string, string>): string {
  let translation = getNestedValue(translations[locale], key) || key
  if (params) {
    translation = translation.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => params[k] ?? `{{${k}}}`)
  }
  return translation
}

export default useTranslations
