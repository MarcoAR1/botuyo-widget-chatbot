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
    (key: string): string => {
      const messages = translations[currentLocale]
      const fullKey = namespace ? `${namespace}.${key}` : key
      const translation = getNestedValue(messages, fullKey)
      return translation || key
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
export function t(key: string, locale: SupportedLocale = 'es'): string {
  return getNestedValue(translations[locale], key) || key
}

export default useTranslations
