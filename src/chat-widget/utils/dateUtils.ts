/**
 * Utilidades de formateo de fechas usando Intl nativo
 * Reemplaza date-fns para reducir el bundle
 */

/**
 * Formatea una fecha en formato corto (día de mes, HH:mm)
 */
export function formatShort(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Verifica si una fecha es hoy
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Verifica si una fecha fue ayer
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
}

/**
 * Calcula la diferencia en minutos entre dos fechas
 */
export function differenceInMinutes(laterDate: Date, earlierDate: Date): number {
  const diffMs = laterDate.getTime() - earlierDate.getTime()
  return Math.floor(diffMs / 1000 / 60)
}

/**
 * Formatea la hora en formato HH:mm
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Formatea fecha completa con día, mes y hora
 */
export function formatFull(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Formatea fecha relativa (Hoy, Ayer, o fecha)
 */
export function formatRelative(date: Date): string {
  if (isToday(date)) {
    return `Hoy, ${formatTime(date)}`
  }
  if (isYesterday(date)) {
    return `Ayer, ${formatTime(date)}`
  }
  return formatShort(date)
}
