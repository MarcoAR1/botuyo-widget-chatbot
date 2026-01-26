/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect } from 'vitest'
import {
  validateFileType,
  validateFileSize,
  validateFileExtension,
  validateFile,
} from '../../chat-widget/utils/fileValidation'

// Helper para crear archivos de test con magic bytes específicos
function createMockFile(
  name: string,
  type: string,
  magicBytes: number[],
  size: number = 1024
): File {
  const buffer = new ArrayBuffer(size)
  const view = new Uint8Array(buffer)

  // Escribir los magic bytes al inicio
  magicBytes.forEach((byte, index) => {
    if (index < view.length) {
      view[index] = byte
    }
  })

  const blob = new Blob([buffer], { type })
  return new File([blob], name, { type })
}

describe('fileValidation', () => {
  describe('validateFileType', () => {
    it('should validate JPEG files with correct magic bytes', async () => {
      const jpegFile = createMockFile('test.jpg', 'image/jpeg', [0xff, 0xd8, 0xff])

      const isValid = await validateFileType(jpegFile)
      expect(isValid).toBe(true)
    })

    it('should validate PNG files with correct magic bytes', async () => {
      const pngFile = createMockFile(
        'test.png',
        'image/png',
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
      )

      const isValid = await validateFileType(pngFile)
      expect(isValid).toBe(true)
    })

    it('should validate WebP files with correct magic bytes', async () => {
      const webpFile = createMockFile('test.webp', 'image/webp', [0x52, 0x49, 0x46, 0x46])

      const isValid = await validateFileType(webpFile)
      expect(isValid).toBe(true)
    })

    it('should validate GIF files with correct magic bytes', async () => {
      const gifFile = createMockFile('test.gif', 'image/gif', [0x47, 0x49, 0x46, 0x38])

      const isValid = await validateFileType(gifFile)
      expect(isValid).toBe(true)
    })

    it('should validate MP3 files with correct magic bytes', async () => {
      const mp3File = createMockFile('test.mp3', 'audio/mpeg', [0xff, 0xfb])

      const isValid = await validateFileType(mp3File)
      expect(isValid).toBe(true)
    })

    it('should reject JPEG files with incorrect magic bytes', async () => {
      const fakeJpeg = createMockFile(
        'fake.jpg',
        'image/jpeg',
        [0x00, 0x00, 0x00] // Magic bytes incorrectos
      )

      const isValid = await validateFileType(fakeJpeg)
      expect(isValid).toBe(false)
    })

    it('should reject PNG files with incorrect magic bytes', async () => {
      const fakePng = createMockFile(
        'fake.png',
        'image/png',
        [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
      )

      const isValid = await validateFileType(fakePng)
      expect(isValid).toBe(false)
    })

    it('should allow files with types not in validation list', async () => {
      const textFile = createMockFile(
        'test.txt',
        'text/plain',
        [0x54, 0x65, 0x73, 0x74] // "Test"
      )

      const isValid = await validateFileType(textFile)
      expect(isValid).toBe(true) // Tipos no validados se permiten
    })

    it('should handle empty files gracefully', async () => {
      const emptyFile = createMockFile('empty.jpg', 'image/jpeg', [], 0)

      const isValid = await validateFileType(emptyFile)
      expect(isValid).toBe(false)
    })
  })

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const smallFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      expect(validateFileSize(smallFile, 10)).toBe(true)
    })

    it('should accept files exactly at size limit', () => {
      const size = 5 * 1024 * 1024 // 5MB
      const buffer = new ArrayBuffer(size)
      const file = new File([buffer], 'test.jpg', { type: 'image/jpeg' })

      expect(validateFileSize(file, 5)).toBe(true)
    })

    it('should reject files over size limit', () => {
      const size = 11 * 1024 * 1024 // 11MB
      const buffer = new ArrayBuffer(size)
      const file = new File([buffer], 'large.jpg', { type: 'image/jpeg' })

      expect(validateFileSize(file, 10)).toBe(false)
    })

    it('should use default 10MB limit when not specified', () => {
      const size = 9 * 1024 * 1024 // 9MB
      const buffer = new ArrayBuffer(size)
      const file = new File([buffer], 'test.jpg', { type: 'image/jpeg' })

      expect(validateFileSize(file)).toBe(true)
    })

    it('should handle custom size limits', () => {
      const size = 3 * 1024 * 1024 // 3MB
      const buffer = new ArrayBuffer(size)
      const file = new File([buffer], 'test.jpg', { type: 'image/jpeg' })

      expect(validateFileSize(file, 5)).toBe(true)
      expect(validateFileSize(file, 2)).toBe(false)
    })

    it('should accept zero-byte files', () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' })

      expect(validateFileSize(emptyFile, 1)).toBe(true)
    })
  })

  describe('validateFileExtension', () => {
    it('should accept files with allowed extensions', () => {
      const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' })

      expect(validateFileExtension(file, ['jpg', 'png', 'gif'])).toBe(true)
    })

    it('should reject files with disallowed extensions', () => {
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' })

      expect(validateFileExtension(file, ['jpg', 'png', 'gif'])).toBe(false)
    })

    it('should be case-insensitive', () => {
      const file1 = new File(['test'], 'image.JPG', { type: 'image/jpeg' })
      const file2 = new File(['test'], 'image.Jpg', { type: 'image/jpeg' })

      expect(validateFileExtension(file1, ['jpg'])).toBe(true)
      expect(validateFileExtension(file2, ['jpg'])).toBe(true)
    })

    it('should handle multiple dots in filename', () => {
      const file = new File(['test'], 'my.photo.backup.jpg', { type: 'image/jpeg' })

      expect(validateFileExtension(file, ['jpg'])).toBe(true)
    })

    it('should reject files without extension', () => {
      const file = new File(['test'], 'noextension', { type: 'text/plain' })

      expect(validateFileExtension(file, ['jpg', 'txt'])).toBe(false)
    })

    it('should handle empty allowed extensions array', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      expect(validateFileExtension(file, [])).toBe(false)
    })
  })

  describe('validateFile', () => {
    it('should pass comprehensive validation for valid file', async () => {
      const jpegFile = createMockFile(
        'valid.jpg',
        'image/jpeg',
        [0xff, 0xd8, 0xff],
        1024 * 1024 // 1MB
      )

      const result = await validateFile(jpegFile, {
        maxSizeMB: 5,
        allowedExtensions: ['jpg', 'png'],
        checkMagicBytes: true,
      })

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should fail validation for oversized file', async () => {
      const size = 11 * 1024 * 1024 // 11MB
      const buffer = new ArrayBuffer(size)
      const largeFile = new File([buffer], 'large.jpg', { type: 'image/jpeg' })

      const result = await validateFile(largeFile, {
        maxSizeMB: 10,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('demasiado grande')
      expect(result.error).toContain('10MB')
    })

    it('should fail validation for disallowed extension', async () => {
      const pdfFile = new File(['test'], 'document.pdf', { type: 'application/pdf' })

      const result = await validateFile(pdfFile, {
        allowedExtensions: ['jpg', 'png'],
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Extensión no permitida')
      expect(result.error).toContain('jpg')
      expect(result.error).toContain('png')
    })

    it('should fail validation for corrupted file (wrong magic bytes)', async () => {
      const corruptedFile = createMockFile('corrupted.jpg', 'image/jpeg', [0x00, 0x00, 0x00])

      const result = await validateFile(corruptedFile, {
        checkMagicBytes: true,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain('corrupto')
    })

    it('should skip magic bytes check when disabled', async () => {
      const fakeFile = createMockFile('fake.jpg', 'image/jpeg', [0x00, 0x00, 0x00])

      const result = await validateFile(fakeFile, {
        checkMagicBytes: false,
      })

      expect(result.valid).toBe(true)
    })

    it('should use default options when none provided', async () => {
      const jpegFile = createMockFile(
        'default.jpg',
        'image/jpeg',
        [0xff, 0xd8, 0xff],
        1024 * 1024 // 1MB
      )

      const result = await validateFile(jpegFile)

      expect(result.valid).toBe(true)
    })

    it('should validate with multiple constraints', async () => {
      const jpegFile = createMockFile(
        'multi.jpg',
        'image/jpeg',
        [0xff, 0xd8, 0xff],
        2 * 1024 * 1024 // 2MB
      )

      const result = await validateFile(jpegFile, {
        maxSizeMB: 3,
        allowedExtensions: ['jpg', 'jpeg', 'png'],
        checkMagicBytes: true,
      })

      expect(result.valid).toBe(true)
    })

    it('should return first error when multiple validations fail', async () => {
      const size = 11 * 1024 * 1024 // 11MB - demasiado grande
      const corruptedFile = createMockFile(
        'bad.pdf', // extensión no permitida
        'image/jpeg',
        [0x00, 0x00, 0x00], // magic bytes incorrectos
        size
      )

      const result = await validateFile(corruptedFile, {
        maxSizeMB: 10,
        allowedExtensions: ['jpg', 'png'],
        checkMagicBytes: true,
      })

      expect(result.valid).toBe(false)
      // Debe fallar primero por tamaño (es la primera validación)
      expect(result.error).toContain('demasiado grande')
    })
  })

  describe('Edge Cases', () => {
    it('should handle file with special characters in name', async () => {
      const file = createMockFile('φωτογραφία.jpg', 'image/jpeg', [0xff, 0xd8, 0xff])

      const result = await validateFile(file, {
        allowedExtensions: ['jpg'],
      })

      expect(result.valid).toBe(true)
    })

    it('should handle very long filenames', async () => {
      const longName = 'a'.repeat(200) + '.jpg'
      const file = createMockFile(longName, 'image/jpeg', [0xff, 0xd8, 0xff])

      const isValid = await validateFileType(file)
      expect(isValid).toBe(true)
    })

    it('should handle files with no name', async () => {
      const file = new File(['test'], '', { type: 'image/jpeg' })

      const result = await validateFile(file, {
        allowedExtensions: ['jpg'],
      })

      expect(result.valid).toBe(false)
    })
  })
})
