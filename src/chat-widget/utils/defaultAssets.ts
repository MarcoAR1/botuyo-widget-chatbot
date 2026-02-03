/**
 * @package @botuyo/chat-widget
 * Default assets bundled inline to avoid external dependencies
 *
 * These are fallback values when the client doesn't provide custom assets.
 * All assets are embedded as data URLs or inline content to work regardless
 * of the hosting environment.
 */

/**
 * Default bot avatar as an inline SVG data URL
 * Simple friendly bot icon in a circular format
 */
export const DEFAULT_AVATAR_URL = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="32" fill="url(#bg)"/>
  <rect x="16" y="20" width="32" height="24" rx="4" fill="white"/>
  <circle cx="24" cy="30" r="3" fill="#10b981"/>
  <circle cx="40" cy="30" r="3" fill="#10b981"/>
  <rect x="22" y="36" width="20" height="3" rx="1.5" fill="#10b981"/>
  <rect x="28" y="12" width="8" height="8" rx="2" fill="white"/>
</svg>
`)}`

/**
 * Notification sound as base64-encoded WAV
 * Simple short "ding" sound (minimal file size)
 * Generated programmatically - a brief 440Hz tone
 */
export const DEFAULT_NOTIFICATION_SOUND_URL = createNotificationSoundDataUrl()

/**
 * Creates a simple notification beep sound as a data URL
 * Uses Web Audio API compatible format
 */
function createNotificationSoundDataUrl(): string {
  // Simple WAV header + 440Hz sine wave for 150ms at 8kHz sample rate
  // This creates a ~1.2KB audio file
  const sampleRate = 8000
  const duration = 0.15
  const frequency = 880 // Higher pitched, pleasant "ding"
  const numSamples = Math.floor(sampleRate * duration)

  // WAV file structure
  const bytesPerSample = 2
  const dataSize = numSamples * bytesPerSample
  const fileSize = 44 + dataSize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  // RIFF header
  writeString(view, 0, 'RIFF')
  view.setUint32(4, fileSize - 8, true)
  writeString(view, 8, 'WAVE')

  // fmt chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * bytesPerSample, true) // byte rate
  view.setUint16(32, bytesPerSample, true) // block align
  view.setUint16(34, 16, true) // bits per sample

  // data chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)

  // Generate sine wave with fade out
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const fadeOut = 1 - i / numSamples // Linear fade out
    const sample = Math.sin(2 * Math.PI * frequency * t) * fadeOut * 0.5 * 32767
    view.setInt16(44 + i * bytesPerSample, sample, true)
  }

  // Convert to base64
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }

  return `data:audio/wav;base64,${btoa(binary)}`
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
