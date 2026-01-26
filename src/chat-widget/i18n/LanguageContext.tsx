/**
 * Contexto de idioma para el Chat Widget
 * Permite cambio dinámico de idioma con persistencia en localStorage
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { type SupportedLocale, detectLanguage } from './translations'

interface LanguageContextType {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LOCALE_STORAGE_KEY = 'botuyo-chat-locale'

interface LanguageProviderProps {
  children: ReactNode
  defaultLocale?: SupportedLocale
}

/**
 * Provider de idioma con detección automática y persistencia
 *
 * @example
 * <LanguageProvider>
 *   <ChatWidget />
 * </LanguageProvider>
 */
export function LanguageProvider({ children, defaultLocale }: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    // 1. Prioridad a prop defaultLocale
    if (defaultLocale) return defaultLocale

    // 2. Segundo, intentar desde localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as SupportedLocale | null
      if (stored) return stored
    }

    // 3. Finalmente, detección automática del navegador
    return detectLanguage()
  })

  const setLocale = (newLocale: SupportedLocale) => {
    // Validar que el locale sea soportado
    const supportedLocales: SupportedLocale[] = ['es', 'en', 'pt', 'fr']
    if (!supportedLocales.includes(newLocale)) {
      console.warn(`[BotUyo] Locale "${newLocale}" no es soportado. Manteniendo "${locale}"`)
      return
    }

    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
    }
  }

  // Efecto para manejar cambios del idioma del navegador
  useEffect(() => {
    if (typeof window === 'undefined' || defaultLocale) return

    const handleLanguageChange = () => {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (!stored) {
        // Si no hay preferencia guardada, actualizar con idioma del navegador
        setLocaleState(detectLanguage())
      }
    }

    window.addEventListener('languagechange', handleLanguageChange)
    return () => window.removeEventListener('languagechange', handleLanguageChange)
  }, [defaultLocale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>{children}</LanguageContext.Provider>
  )
}

/**
 * Hook para acceder al idioma actual del widget
 *
 * @example
 * const { locale, setLocale } = useLanguage()
 * setLocale('en') // Cambiar a inglés
 */
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage debe usarse dentro de un LanguageProvider')
  }
  return context
}
