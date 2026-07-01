/**
 * @package @botuyo/chat-widget
 * Voice Module Types
 *
 * Audio format configuration shared by the live realtime-call path
 * (components/VoiceCallOverlay.tsx over socket.io + voice/audioEnhancement.ts).
 */

/**
 * Audio format configuration
 */
export const VOICE_AUDIO_CONFIG = {
  input: {
    sampleRate: 16000, // 16kHz
    bitDepth: 16, // 16-bit PCM
    channels: 1, // Mono
    chunkSize: 320, // ~20ms at 16kHz for low latency
  },
  output: {
    sampleRate: 24000, // 24kHz
    bitDepth: 16,
    channels: 1,
  },
} as const
