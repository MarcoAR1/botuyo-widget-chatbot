/**
 * Sistema de internacionalización del Chat Widget
 * Exportaciones centralizadas
 */

export { useTranslations, t, default } from './useTranslations'
export { translations, detectLanguage, type SupportedLocale } from './translations'
export { LanguageProvider, useLanguage } from './LanguageContext'
