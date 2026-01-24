/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTranslations } from '../../chat-widget/i18n/useTranslations'

describe('useTranslations', () => {
  beforeEach(() => {
    // Mock navigator.language
    Object.defineProperty(navigator, 'language', {
      writable: true,
      value: 'es-ES',
    })
  })

  it('should auto-detect Spanish locale from browser', () => {
    const { result } = renderHook(() => useTranslations())

    expect(result.current.currentLocale).toBe('es')
    expect(result.current.t('online')).toBe('En línea')
  })

  it('should auto-detect English locale from browser', () => {
    Object.defineProperty(navigator, 'language', {
      writable: true,
      value: 'en-US',
    })

    const { result } = renderHook(() => useTranslations())

    expect(result.current.currentLocale).toBe('en')
    expect(result.current.t('online')).toBe('Online')
  })

  it('should fallback to Spanish for unsupported locales', () => {
    Object.defineProperty(navigator, 'language', {
      writable: true,
      value: 'de-DE', // Alemán no soportado
    })

    const { result } = renderHook(() => useTranslations())

    expect(result.current.currentLocale).toBe('es')
  })

  it('should allow manual locale change', () => {
    const { result } = renderHook(() => useTranslations())

    expect(result.current.t('online')).toBe('En línea')

    act(() => {
      result.current.setLocale('en')
    })

    expect(result.current.currentLocale).toBe('en')
    expect(result.current.t('online')).toBe('Online')
  })

  it('should translate all supported languages correctly', () => {
    const { result } = renderHook(() => useTranslations())

    // Español
    expect(result.current.t('online')).toBe('En línea')

    // Inglés
    act(() => result.current.setLocale('en'))
    expect(result.current.t('online')).toBe('Online')

    // Portugués
    act(() => result.current.setLocale('pt'))
    expect(result.current.t('online')).toBe('Online')

    // Francés
    act(() => result.current.setLocale('fr'))
    expect(result.current.t('online')).toBe('En ligne')
  })

  it('should handle nested keys with extracted namespace', () => {
    const { result } = renderHook(() => useTranslations())

    expect(result.current.t('extracted.cerrar_chat')).toBe('Cerrar chat')
  })

  it('should return key if translation not found', () => {
    const { result } = renderHook(() => useTranslations())

    expect(result.current.t('non_existent_key')).toBe('non_existent_key')
  })

  it('should support namespace parameter', () => {
    const { result } = renderHook(() => useTranslations('extracted'))

    expect(result.current.t('cerrar_chat')).toBe('Cerrar chat')
    expect(result.current.t('abrir_chat')).toBe('Abrir chat')
  })

  it('should handle all error messages', () => {
    const { result } = renderHook(() => useTranslations())

    expect(result.current.t('rate_limit_exceeded')).toBe(
      'Has enviado demasiados mensajes. Espera un momento.'
    )
    expect(result.current.t('connection_error')).toBe('Error de conexión')
    expect(result.current.t('file_too_large')).toBe('Archivo demasiado grande')
    expect(result.current.t('invalid_file')).toBe('Tipo de archivo no válido')
  })

  it('should memoize translation function', () => {
    const { result, rerender } = renderHook(() => useTranslations())

    const firstT = result.current.t
    rerender()
    const secondT = result.current.t

    // La función debería ser la misma si no cambia el locale
    expect(firstT).toBe(secondT)
  })

  it('should ignore invalid locale changes', () => {
    const { result } = renderHook(() => useTranslations())

    const initialLocale = result.current.currentLocale

    act(() => {
      // @ts-expect-error - Testing invalid locale
      result.current.setLocale('invalid')
    })

    // Locale no debería cambiar
    expect(result.current.currentLocale).toBe(initialLocale)
  })
})
