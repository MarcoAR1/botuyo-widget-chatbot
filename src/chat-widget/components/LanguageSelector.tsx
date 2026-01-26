/**
 * Selector de idioma para el Chat Widget
 * Componente opcional que permite cambiar el idioma del widget
 */

import { useLanguage } from '../i18n/LanguageContext'
import { type SupportedLocale } from '../i18n/translations'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  /** Clase CSS adicional */
  className?: string
  /** Mostrar banderas en lugar de códigos */
  showFlags?: boolean
  /** Estilo del selector: 'dropdown' | 'buttons' */
  variant?: 'dropdown' | 'buttons'
}

const LANGUAGE_INFO: Record<
  SupportedLocale,
  {
    name: string
    flag: string
  }
> = {
  es: { name: 'Español', flag: '🇪🇸' },
  en: { name: 'English', flag: '🇬🇧' },
  pt: { name: 'Português', flag: '🇧🇷' },
  fr: { name: 'Français', flag: '🇫🇷' },
}

/**
 * Selector de idioma para el widget
 *
 * @example
 * // Dropdown
 * <LanguageSelector variant="dropdown" showFlags />
 *
 * // Botones
 * <LanguageSelector variant="buttons" />
 */
export function LanguageSelector({
  className,
  showFlags = true,
  variant = 'dropdown',
}: LanguageSelectorProps) {
  const { locale, setLocale } = useLanguage()

  if (variant === 'dropdown') {
    return (
      <div className={cn('relative inline-block', className)}>
        <div className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4" />
          <select
            value={locale}
            onChange={e => setLocale(e.target.value as SupportedLocale)}
            className={cn(
              'bg-transparent border border-border rounded px-2 py-1',
              'focus:outline-none focus:ring-2 focus:ring-primary'
            )}
            aria-label="Select language"
          >
            {Object.entries(LANGUAGE_INFO).map(([code, info]) => (
              <option key={code} value={code}>
                {showFlags && info.flag} {info.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    )
  }

  // Variant: buttons
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Globe className="h-4 w-4 mr-1" />
      {Object.entries(LANGUAGE_INFO).map(([code, info]) => (
        <button
          key={code}
          onClick={() => setLocale(code as SupportedLocale)}
          className={cn(
            'px-2 py-1 text-xs rounded transition-colors',
            locale === code
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
          aria-label={`Switch to ${info.name}`}
        >
          {showFlags ? info.flag : code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
