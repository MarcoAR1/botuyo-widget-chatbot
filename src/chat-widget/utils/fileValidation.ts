/**
 * @package @botuyo/chat-widget
 * File validation utilities with magic bytes verification
 *
 * Validates file types by checking magic bytes (file signatures)
 * to prevent MIME type spoofing and detect corrupted files.
 */

/**
 * Magic bytes (file signatures) for common file types
 * First few bytes that identify the file format
 */
const MAGIC_BYTES = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
  'image/gif': [0x47, 0x49, 0x46, 0x38], // GIF8
  'audio/mpeg': [0xff, 0xfb], // MP3
  'audio/wav': [0x52, 0x49, 0x46, 0x46], // RIFF
  'audio/webm': [0x1a, 0x45, 0xdf, 0xa3],
  'audio/ogg': [0x4f, 0x67, 0x67, 0x53], // OggS
} as const

/**
 * Validates a file by checking its magic bytes against expected signature
 *
 * @param file - File to validate
 * @returns Promise<boolean> - true if file matches expected type, false otherwise
 *
 * @example
 * const isValid = await validateFileType(file)
 * if (!isValid) {
 *   alert('El archivo está corrupto o no es del tipo indicado')
 * }
 */
export async function validateFileType(file: File): Promise<boolean> {
  try {
    // Get magic bytes for expected MIME type
    const expectedBytes = MAGIC_BYTES[file.type as keyof typeof MAGIC_BYTES]

    if (!expectedBytes) {
      // Type not in our validation list, allow it
      return true
    }

    // Read first 12 bytes of the file
    const buffer = await file.slice(0, 12).arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // Compare with expected magic bytes
    return expectedBytes.every((byte, index) => bytes[index] === byte)
  } catch (error) {
    // If validation fails, reject the file for security
    console.error('File validation error:', error)
    return false
  }
}

/**
 * Validates file size against maximum allowed
 *
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in megabytes (default: 10MB)
 * @returns boolean - true if file is within size limit
 *
 * @example
 * if (!validateFileSize(file, 5)) {
 *   alert('El archivo es demasiado grande. Máximo 5MB')
 * }
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Validates file extension matches allowed list
 *
 * @param file - File to validate
 * @param allowedExtensions - Array of allowed extensions (e.g., ['jpg', 'png'])
 * @returns boolean - true if extension is allowed
 *
 * @example
 * if (!validateFileExtension(file, ['jpg', 'png', 'webp'])) {
 *   alert('Solo se permiten imágenes JPG, PNG o WebP')
 * }
 */
export function validateFileExtension(file: File, allowedExtensions: string[]): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension) return false

  return allowedExtensions.includes(extension)
}

/**
 * Comprehensive file validation combining all checks
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Promise<ValidationResult> - Validation result with details
 *
 * @example
 * const result = await validateFile(file, {
 *   maxSizeMB: 5,
 *   allowedExtensions: ['jpg', 'png'],
 *   checkMagicBytes: true
 * })
 *
 * if (!result.valid) {
 *   alert(result.error)
 * }
 */
export interface FileValidationOptions {
  maxSizeMB?: number
  allowedExtensions?: string[]
  checkMagicBytes?: boolean
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

export async function validateFile(
  file: File,
  options: FileValidationOptions = {}
): Promise<ValidationResult> {
  const { maxSizeMB = 10, allowedExtensions, checkMagicBytes = true } = options

  // Check file size
  if (!validateFileSize(file, maxSizeMB)) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Máximo ${maxSizeMB}MB`,
    }
  }

  // Check file extension
  if (allowedExtensions && !validateFileExtension(file, allowedExtensions)) {
    return {
      valid: false,
      error: `Extensión no permitida. Solo: ${allowedExtensions.join(', ')}`,
    }
  }

  // Check magic bytes
  if (checkMagicBytes) {
    const isValid = await validateFileType(file)
    if (!isValid) {
      return {
        valid: false,
        error: 'El archivo está corrupto o no es del tipo indicado',
      }
    }
  }

  return { valid: true }
}
