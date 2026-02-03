/**
 * @package @botuyo/chat-widget
 * Live Call Input Area Component
 *
 * Wrapper around InputArea that adds live call functionality.
 */

'use client'

import { useState, useCallback } from 'react'
import { InputArea, type InputAreaProps } from './InputArea'
import { useLiveCall } from '../voice/useLiveCall'
import { CallButton, LiveCallOverlay } from '../voice/components'
import type { VoiceConfig, LiveCallState, LiveCallErrorMessage } from '../voice/types'

export interface LiveCallInputAreaProps extends InputAreaProps {
  /** API base URL for voice WebSocket */
  apiBaseUrl: string
  /** Tenant ID for authentication */
  tenantId: string
  /** Session ID for the current session */
  sessionId: string
  /** Conversation ID to continue */
  conversationId?: string
  /** Voice configuration */
  voiceConfig?: VoiceConfig
  /** Callback when user transcription is finalized */
  onVoiceTranscription?: (text: string) => void
  /** Callback when bot text response arrives */
  onBotVoiceResponse?: (text: string) => void
}

/**
 * Input area with integrated live call functionality
 */
export function LiveCallInputArea({
  apiBaseUrl,
  tenantId,
  sessionId,
  conversationId,
  voiceConfig,
  onVoiceTranscription,
  onBotVoiceResponse,
  ...inputAreaProps
}: LiveCallInputAreaProps) {
  const [transcription, setTranscription] = useState('')
  const [botResponse, setBotResponse] = useState('')

  const liveCall = useLiveCall({
    apiBaseUrl,
    tenantId,
    sessionId,
    conversationId,
    wsEndpoint: voiceConfig?.wsEndpoint,
    onTranscription: useCallback(
      (text: string) => {
        setTranscription(text)
        onVoiceTranscription?.(text)
      },
      [onVoiceTranscription]
    ),
    onBotResponse: useCallback(
      (text: string) => {
        setBotResponse(text)
        onBotVoiceResponse?.(text)
      },
      [onBotVoiceResponse]
    ),
    onStateChange: useCallback((state: LiveCallState) => {
      // Reset transcription when returning to ready
      if (state === 'ready') {
        setTranscription('')
        setBotResponse('')
      }
    }, []),
    onError: useCallback((error: LiveCallErrorMessage) => {
      console.error('[BotUyo] Live call error:', error.message)
    }, []),
  })

  const isInCall = liveCall.state !== 'idle'

  return (
    <>
      {/* Live call overlay */}
      <LiveCallOverlay
        isOpen={isInCall}
        state={liveCall.state}
        callDuration={liveCall.callDuration}
        transcription={transcription}
        botResponse={botResponse}
        onEndCall={liveCall.endCall}
      />

      {/* Regular input area with call button */}
      <div className="relative">
        <InputArea {...inputAreaProps} />

        {/* Call button overlay (only when voice is enabled and not in call) */}
        {voiceConfig?.enabled && !isInCall && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <CallButton
              state={liveCall.state}
              isSupported={liveCall.isSupported}
              callDuration={liveCall.callDuration}
              primaryColor={inputAreaProps.primaryColor}
              onStartCall={liveCall.startCall}
              onEndCall={liveCall.endCall}
            />
          </div>
        )}
      </div>
    </>
  )
}
