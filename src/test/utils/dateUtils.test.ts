/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import {
  formatShort,
  formatTime,
  formatFull,
  formatRelative,
  isToday,
  isYesterday,
  differenceInMinutes,
} from '../../chat-widget/utils/dateUtils'

describe('dateUtils', () => {
  describe('formatShort', () => {
    it('should format date with day, month and time', () => {
      const date = new Date('2026-01-15T14:30:00')
      const formatted = formatShort(date)

      // Debe contener el día, mes y hora
      expect(formatted).toContain('15')
      expect(formatted).toContain('enero')
      expect(formatted).toContain('14:30')
    })

    it('should use Spanish locale', () => {
      const date = new Date('2026-03-01T10:00:00')
      const formatted = formatShort(date)

      expect(formatted).toContain('marzo')
    })
  })

  describe('formatTime', () => {
    it('should format time as HH:mm', () => {
      const date = new Date('2026-01-15T14:30:00')
      const formatted = formatTime(date)

      expect(formatted).toBe('14:30')
    })

    it('should pad single digits with zero', () => {
      const date = new Date('2026-01-15T09:05:00')
      const formatted = formatTime(date)

      expect(formatted).toBe('09:05')
    })
  })

  describe('formatFull', () => {
    it('should format full date with year', () => {
      const date = new Date('2026-01-15T14:30:00')
      const formatted = formatFull(date)

      expect(formatted).toContain('15')
      expect(formatted).toContain('enero')
      expect(formatted).toContain('2026')
      expect(formatted).toContain('14:30')
    })
  })

  describe('isToday', () => {
    it('should return true for current date', () => {
      const now = new Date()

      expect(isToday(now)).toBe(true)
    })

    it('should return true for same day but different time', () => {
      const now = new Date()
      const sameDay = new Date(now)
      sameDay.setHours(0, 0, 0, 0)

      expect(isToday(sameDay)).toBe(true)
    })

    it('should return false for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      expect(isToday(yesterday)).toBe(false)
    })

    it('should return false for tomorrow', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      expect(isToday(tomorrow)).toBe(false)
    })

    it('should return false for different month', () => {
      const differentMonth = new Date()
      differentMonth.setMonth(differentMonth.getMonth() - 1)

      expect(isToday(differentMonth)).toBe(false)
    })
  })

  describe('isYesterday', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      expect(isYesterday(yesterday)).toBe(true)
    })

    it('should return false for today', () => {
      const today = new Date()

      expect(isYesterday(today)).toBe(false)
    })

    it('should return false for two days ago', () => {
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

      expect(isYesterday(twoDaysAgo)).toBe(false)
    })

    it('should handle month boundary', () => {
      // Si hoy es 1 de enero, ayer es 31 de diciembre del año anterior
      const date = new Date('2026-01-01T10:00:00')
      const yesterday = new Date('2025-12-31T10:00:00')

      // Mockear la fecha actual
      vi.setSystemTime(date)

      expect(isYesterday(yesterday)).toBe(true)

      vi.useRealTimers()
    })
  })

  describe('differenceInMinutes', () => {
    it('should calculate difference in minutes', () => {
      const earlier = new Date('2026-01-15T14:00:00')
      const later = new Date('2026-01-15T14:30:00')

      expect(differenceInMinutes(later, earlier)).toBe(30)
    })

    it('should return 0 for same time', () => {
      const date = new Date('2026-01-15T14:00:00')

      expect(differenceInMinutes(date, date)).toBe(0)
    })

    it('should handle hours difference', () => {
      const earlier = new Date('2026-01-15T10:00:00')
      const later = new Date('2026-01-15T12:00:00')

      expect(differenceInMinutes(later, earlier)).toBe(120)
    })

    it('should handle negative difference (later date first)', () => {
      const earlier = new Date('2026-01-15T14:00:00')
      const later = new Date('2026-01-15T14:30:00')

      expect(differenceInMinutes(earlier, later)).toBe(-30)
    })

    it('should floor fractional minutes', () => {
      const earlier = new Date('2026-01-15T14:00:00')
      const later = new Date('2026-01-15T14:00:45') // 45 segundos

      expect(differenceInMinutes(later, earlier)).toBe(0)
    })

    it('should handle days difference', () => {
      const earlier = new Date('2026-01-15T14:00:00')
      const later = new Date('2026-01-16T14:00:00')

      expect(differenceInMinutes(later, earlier)).toBe(1440) // 24 * 60
    })
  })

  describe('formatRelative', () => {
    it('should format today with "Hoy" prefix', () => {
      const now = new Date()
      const formatted = formatRelative(now)

      expect(formatted).toContain('Hoy')
      expect(formatted).toMatch(/\d{2}:\d{2}/)
    })

    it('should format yesterday with "Ayer" prefix', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const formatted = formatRelative(yesterday)

      expect(formatted).toContain('Ayer')
      expect(formatted).toMatch(/\d{2}:\d{2}/)
    })

    it('should format older dates with full date', () => {
      const oldDate = new Date('2025-12-01T14:30:00')
      const formatted = formatRelative(oldDate)

      // No debe contener "Hoy" ni "Ayer"
      expect(formatted).not.toContain('Hoy')
      expect(formatted).not.toContain('Ayer')

      // Debe contener el mes
      expect(formatted).toContain('diciembre')
    })

    it('should handle edge case at midnight', () => {
      const midnight = new Date()
      midnight.setHours(0, 0, 0, 0)

      const formatted = formatRelative(midnight)

      expect(formatted).toContain('Hoy')
      expect(formatted).toBe('Hoy, 00:00')
    })
  })

  describe('Edge Cases', () => {
    it('should handle leap year dates', () => {
      const leapDay = new Date('2024-02-29T12:00:00')
      const formatted = formatShort(leapDay)

      expect(formatted).toContain('29')
      expect(formatted).toContain('febrero')
    })

    it('should handle year boundaries', () => {
      const newYear = new Date('2026-01-01T00:00:00')
      const formatted = formatFull(newYear)

      expect(formatted).toContain('2026')
      expect(formatted).toContain('enero')
    })

    it('should handle dates far in the future', () => {
      const future = new Date('2050-12-31T23:59:59')
      const formatted = formatTime(future)

      expect(formatted).toBe('23:59')
    })

    it('should handle dates far in the past', () => {
      const past = new Date('2000-01-01T00:00:00')
      const formatted = formatFull(past)

      expect(formatted).toContain('2000')
    })
  })
})
