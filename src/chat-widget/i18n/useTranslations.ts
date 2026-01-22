/**
 * Hook de internacionalización para el Chat Widget
 * Reemplazo de next-intl con nuestro propio sistema
 */

import { translations, type Locale } from './translations'

// Idioma por defecto
const DEFAULT_LOCALE: Locale = 'es'

// Función helper para obtener valor anidado
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}

/**
 * Hook para acceder a las traducciones
 * Compatible con la API de next-intl pero sin dependencias
 * 
 * @example
 * const t = useTranslations()
 * t('online') // 'En línea'
 * t('extracted.cerrar') // 'Cerrar'
 */
export function useTranslations(namespace?: string) {
  // Por ahora usamos español, pero se puede extender para soportar múltiples idiomas
  const locale = DEFAULT_LOCALE
  const messages = translations[locale]

  return (key: string): string => {
    // Si hay namespace, construir la clave completa
    const fullKey = namespace ? `${namespace}.${key}` : key
    
    // Obtener la traducción
    const translation = getNestedValue(messages, fullKey)
    
    // Si no se encuentra, retornar la clave original
    return translation || key
  }
}

/**
 * Función para obtener traducción directamente sin hook
 * Útil para uso fuera de componentes
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return getNestedValue(translations[locale], key) || key
}

/**
 * Cambiar el idioma del widget (para futuras extensiones)
 * Por ahora solo retorna español
 */
export function getLocale(): Locale {
  return DEFAULT_LOCALE
}

export default useTranslations
