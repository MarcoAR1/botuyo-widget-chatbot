/**
 * @package @botuyo/chat-widget
 * Voice Input Area Component
 *
 * Extends InputArea with voice chat functionality.
 * This is a wrapper that adds voice button and overlay to the standard InputArea.
 */

'use client'

import { useState, useCallback } from 'react'
import { InputArea, type InputAreaProps } from './InputArea'
import { VoiceButton, VoiceChatOverlay, useVoiceChat, type VoiceConfig } from '../voice'
import { cn } from '@/lib/utils'

export interface VoiceInputAreaProps extends InputAreaProps {
  /** Voice chat configuration (Enterprise tier) */
  voiceConfig?: VoiceConfig
  /** API base URL for voice WebSocket */
  apiBaseUrl: string
  /** Tenant ID for voice authentication */
  tenantId: string
  /** Session ID for voice authentication */
  sessionId: string
  /** Callback when voice message transcription is complete */
  onVoiceTranscription?: (text: string) => void
}

/**
 * InputArea with integrated voice chat functionality
 */
export function VoiceInputArea({
  voiceConfig,
  apiBaseUrl,
  tenantId,
  sessionId,
  onVoiceTranscription,
  onSendMessage,
  primaryColor,
  isConnected,
  ...inputAreaProps
}: VoiceInputAreaProps) {
  const [showOverlay, setShowOverlay] = useState(false)
  const [botResponse, setBotResponse] = useState<string>()
  const [finalTranscription, setFinalTranscription] = useState<string>()

  // Initialize voice chat hook
  const voiceChat = useVoiceChat({
    apiBaseUrl,
    tenantId,
    sessionId,
    config: voiceConfig,
    onTranscription: (text: string, isFinal: boolean) => {
      if (isFinal) {
        setFinalTranscription(text)
        onVoiceTranscription?.(text)
        // Auto-send the transcribed message
        onSendMessage(text)
      }
    },
    onBotResponse: (text: string) => {
      setBotResponse(text)
    },
    onBotAudioPlayed: () => {
      // Reset after bot finishes speaking
      setTimeout(() => {
        setShowOverlay(false)
        setBotResponse(undefined)
        setFinalTranscription(undefined)
      }, 500)
    },
    onError: (error: { code: string; message: string }) => {
      console.error('Voice error:', error)
      setShowOverlay(false)
    },
    onStateChange: (state: 'idle' | 'listening' | 'processing' | 'speaking') => {
      // Show overlay when voice interaction starts
      if (state !== 'idle') {
        setShowOverlay(true)
      }
    },
  })

  // Handle voice button press
  const handleVoicePress = useCallback(() => {
    setShowOverlay(true)
    setBotResponse(undefined)
    setFinalTranscription(undefined)
    voiceChat.startRecording()
  }, [voiceChat])

  // Handle voice button release
  const handleVoiceRelease = useCallback(() => {
    voiceChat.stopRecording()
  }, [voiceChat])

  // Handle cancel
  const handleVoiceCancel = useCallback(() => {
    voiceChat.cancelRecording()
    setShowOverlay(false)
    setBotResponse(undefined)
    setFinalTranscription(undefined)
  }, [voiceChat])

  // Handle overlay close
  const handleOverlayClose = useCallback(() => {
    if (voiceChat.state === 'listening') {
      voiceChat.cancelRecording()
    } else if (voiceChat.state === 'speaking') {
      voiceChat.stopPlayback()
    }
    setShowOverlay(false)
    setBotResponse(undefined)
    setFinalTranscription(undefined)
  }, [voiceChat])

  // Check if voice is enabled
  const isVoiceEnabled = voiceConfig?.enabled && voiceChat.isSupported

  return (
    <div className="relative">
      {/* Voice Chat Overlay */}
      {isVoiceEnabled && (
        <VoiceChatOverlay
          isOpen={showOverlay}
          state={voiceChat.state}
          partialTranscription={voiceChat.partialTranscription}
          finalTranscription={finalTranscription}
          botResponse={botResponse}
          recordingDuration={voiceChat.recordingDuration}
          maxDuration={voiceConfig?.maxDurationSeconds}
          onClose={handleOverlayClose}
          onCancel={handleVoiceCancel}
        />
      )}

      {/* Input Area with Voice Button */}
      <div className={cn('flex items-end gap-2')}>
        {/* Voice Button - before input when enabled */}
        {isVoiceEnabled && voiceChat.state === 'idle' && (
          <VoiceButton
            state={voiceChat.state}
            isSupported={voiceChat.isSupported}
            primaryColor={primaryColor}
            onPress={handleVoicePress}
            onRelease={handleVoiceRelease}
            onCancel={handleVoiceCancel}
            disabled={!isConnected}
          />
        )}

        {/* Standard Input Area */}
        <div className="flex-1">
          <InputArea
            {...inputAreaProps}
            primaryColor={primaryColor}
            isConnected={isConnected}
            onSendMessage={onSendMessage}
          />
        </div>
      </div>
    </div>
  )
}
