/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getOrCreateDeviceId,
  clearDeviceId,
  getDeviceId,
} from '../../chat-widget/utils/deviceId'

describe('deviceId', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('getOrCreateDeviceId', () => {
    it('should create a new device ID if none exists', () => {
      const deviceId = getOrCreateDeviceId()
      
      expect(deviceId).toBeDefined()
      expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should persist device ID to localStorage', () => {
      const deviceId = getOrCreateDeviceId()
      
      const stored = localStorage.getItem('chat_device_id')
      expect(stored).toBe(deviceId)
    })

    it('should return existing device ID if already created', () => {
      const firstId = getOrCreateDeviceId()
      const secondId = getOrCreateDeviceId()
      
      expect(firstId).toBe(secondId)
    })

    it('should return the same ID across multiple calls', () => {
      const id1 = getOrCreateDeviceId()
      const id2 = getOrCreateDeviceId()
      const id3 = getOrCreateDeviceId()
      
      expect(id1).toBe(id2)
      expect(id2).toBe(id3)
    })

    it('should generate UUID v4 format', () => {
      const deviceId = getOrCreateDeviceId()
      
      // UUID v4: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      // El tercer grupo debe empezar con 4
      const parts = deviceId.split('-')
      expect(parts).toHaveLength(5)
      expect(parts[2][0]).toBe('4')
      
      // El cuarto grupo debe empezar con 8, 9, a, o b
      expect(['8', '9', 'a', 'b']).toContain(parts[3][0])
    })

    it('should handle localStorage not available gracefully', () => {
      // Simular que localStorage no está disponible
      const originalSetItem = Storage.prototype.setItem
      const originalGetItem = Storage.prototype.getItem
      
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('localStorage not available')
      })
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage not available')
      })
      
      const deviceId = getOrCreateDeviceId()
      
      // Debe generar un ID válido aunque localStorage falle
      expect(deviceId).toBeDefined()
      expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      
      // Restaurar
      Storage.prototype.setItem = originalSetItem
      Storage.prototype.getItem = originalGetItem
    })
  })

  describe('clearDeviceId', () => {
    it('should remove device ID from localStorage', () => {
      // Crear un device ID
      getOrCreateDeviceId()
      expect(localStorage.getItem('chat_device_id')).not.toBeNull()
      
      // Limpiarlo
      clearDeviceId()
      expect(localStorage.getItem('chat_device_id')).toBeNull()
    })

    it('should allow creating new ID after clearing', () => {
      const firstId = getOrCreateDeviceId()
      clearDeviceId()
      const secondId = getOrCreateDeviceId()
      
      expect(firstId).not.toBe(secondId)
    })

    it('should not throw if localStorage is not available', () => {
      const originalRemoveItem = Storage.prototype.removeItem
      Storage.prototype.removeItem = vi.fn(() => {
        throw new Error('localStorage not available')
      })
      
      expect(() => clearDeviceId()).not.toThrow()
      
      Storage.prototype.removeItem = originalRemoveItem
    })
  })

  describe('getDeviceId', () => {
    it('should return null if no device ID exists', () => {
      const deviceId = getDeviceId()
      
      expect(deviceId).toBeNull()
    })

    it('should return existing device ID without creating new one', () => {
      const createdId = getOrCreateDeviceId()
      const retrievedId = getDeviceId()
      
      expect(retrievedId).toBe(createdId)
    })

    it('should not create new ID if none exists', () => {
      getDeviceId()
      
      expect(localStorage.getItem('chat_device_id')).toBeNull()
    })

    it('should return null if localStorage is not available', () => {
      const originalGetItem = Storage.prototype.getItem
      Storage.prototype.getItem = vi.fn(() => {
        throw new Error('localStorage not available')
      })
      
      const deviceId = getDeviceId()
      
      expect(deviceId).toBeNull()
      
      Storage.prototype.getItem = originalGetItem
    })
  })

  describe('UUID Generation', () => {
    it('should generate unique IDs on different calls after clearing', () => {
      const ids = new Set<string>()
      
      for (let i = 0; i < 10; i++) {
        clearDeviceId()
        const id = getOrCreateDeviceId()
        ids.add(id)
      }
      
      // Todos los IDs deben ser únicos
      expect(ids.size).toBe(10)
    })

    it('should generate valid hexadecimal characters', () => {
      const deviceId = getOrCreateDeviceId()
      const withoutDashes = deviceId.replace(/-/g, '')
      
      // Todos los caracteres deben ser hexadecimales válidos
      expect(withoutDashes).toMatch(/^[0-9a-f]+$/i)
    })

    it('should generate correct UUID length', () => {
      const deviceId = getOrCreateDeviceId()
      
      // UUID sin guiones: 32 caracteres
      const withoutDashes = deviceId.replace(/-/g, '')
      expect(withoutDashes).toHaveLength(32)
      
      // UUID con guiones: 36 caracteres
      expect(deviceId).toHaveLength(36)
    })
  })

  describe('Edge Cases', () => {
    it('should handle manual localStorage manipulation', () => {
      localStorage.setItem('chat_device_id', 'manual-id-123')
      
      const deviceId = getOrCreateDeviceId()
      
      expect(deviceId).toBe('manual-id-123')
    })

    it('should handle empty string in localStorage', () => {
      localStorage.setItem('chat_device_id', '')
      
      const deviceId = getOrCreateDeviceId()
      
      // Debe crear un nuevo ID porque el existente está vacío
      expect(deviceId).not.toBe('')
      expect(deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should preserve device ID across page reloads simulation', () => {
      // Primera "sesión"
      const id1 = getOrCreateDeviceId()
      
      // Simular reload (nuevo contexto pero mismo localStorage)
      const id2 = getOrCreateDeviceId()
      
      expect(id1).toBe(id2)
    })
  })
})
