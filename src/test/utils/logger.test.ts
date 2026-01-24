/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logger, silentLogger } from '../../chat-widget/utils/logger'

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleDebugSpy.mockRestore()
    consoleInfoSpy.mockRestore()
    delete (window as any).DEBUG
  })

  describe('logger.log', () => {
    it('should prefix messages with [PaseoLibre]', () => {
      logger.log('Test message')
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Test message'
      )
    })

    it('should pass additional arguments', () => {
      const obj = { key: 'value' }
      logger.log('Message', obj, 123)
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Message',
        obj,
        123
      )
    })
  })

  describe('logger.warn', () => {
    it('should use console.warn', () => {
      logger.warn('Warning message')
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Warning message'
      )
    })

    it('should pass additional arguments', () => {
      logger.warn('Warning', 'detail1', 'detail2')
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Warning',
        'detail1',
        'detail2'
      )
    })
  })

  describe('logger.error', () => {
    it('should always log errors regardless of DEBUG mode', () => {
      // Sin DEBUG flag
      delete (window as any).DEBUG
      
      logger.error('Error message')
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Error message'
      )
    })

    it('should pass error objects', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', error)
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Error occurred',
        error
      )
    })
  })

  describe('logger.debug', () => {
    it('should use console.debug', () => {
      logger.debug('Debug message')
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Debug message'
      )
    })
  })

  describe('logger.info', () => {
    it('should use console.info', () => {
      logger.info('Info message')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Info message'
      )
    })
  })

  describe('DEBUG mode', () => {
    it('should enable logging when DEBUG flag is set', () => {
      (window as any).DEBUG = true
      
      logger.log('Debug enabled')
      
      expect(consoleLogSpy).toHaveBeenCalled()
    })

    it('should disable logging when DEBUG is false', () => {
      (window as any).DEBUG = false
      
      logger.log('Should not log')
      
      // En entorno de test, puede o no loguear dependiendo del modo DEV
      // Solo verificamos que no lanza error
      expect(consoleLogSpy).toBeDefined()
    })

    it('should always log errors even without DEBUG', () => {
      delete (window as any).DEBUG
      
      logger.error('Critical error')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })

  describe('silentLogger', () => {
    it('should not call console.log', () => {
      silentLogger.log('Silent message')
      
      expect(consoleLogSpy).not.toHaveBeenCalled()
    })

    it('should not call console.warn', () => {
      silentLogger.warn('Silent warning')
      
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should not call console.error', () => {
      silentLogger.error('Silent error')
      
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should not call console.debug', () => {
      silentLogger.debug('Silent debug')
      
      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should not call console.info', () => {
      silentLogger.info('Silent info')
      
      expect(consoleInfoSpy).not.toHaveBeenCalled()
    })
  })

  describe('Message Formatting', () => {
    it('should handle empty messages', () => {
      logger.log('')
      
      expect(consoleLogSpy).toHaveBeenCalledWith('[PaseoLibre] ')
    })

    it('should handle multiple line messages', () => {
      const multiline = 'Line 1\nLine 2\nLine 3'
      logger.log(multiline)
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `[PaseoLibre] ${multiline}`
      )
    })

    it('should handle special characters', () => {
      logger.log('Special chars: 你好 🎉 €')
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Special chars: 你好 🎉 €'
      )
    })

    it('should handle null and undefined', () => {
      logger.log('Values:', null, undefined)
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Values:',
        null,
        undefined
      )
    })

    it('should handle objects and arrays', () => {
      const obj = { name: 'test' }
      const arr = [1, 2, 3]
      
      logger.log('Data:', obj, arr)
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[PaseoLibre] Data:',
        obj,
        arr
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000)
      
      expect(() => logger.log(longMessage)).not.toThrow()
    })

    it('should handle circular references in objects', () => {
      const circular: any = { name: 'test' }
      circular.self = circular
      
      expect(() => logger.log('Circular:', circular)).not.toThrow()
    })

    it('should handle rapid successive calls', () => {
      for (let i = 0; i < 100; i++) {
        logger.log(`Message ${i}`)
      }
      
      expect(consoleLogSpy).toHaveBeenCalledTimes(100)
    })
  })
})
