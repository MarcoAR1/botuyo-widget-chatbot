/**
 * @package @botuyo/chat-widget
 * Voice Call Demo Component
 * 
 * Interactive demo overlay with simulated conversation.
 * Clean, natural flow: user speaks → bot responds.
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react'

interface VoiceCallDemoProps {
  isOpen: boolean
  onClose: () => void
  primaryColor?: string
}

type CallState = 'idle' | 'connecting' | 'listening' | 'speaking' | 'muted'

// Simulated bot responses
const BOT_RESPONSES = [
  '¡Hola! Gracias por llamar. ¿En qué puedo ayudarte hoy?',
  'Entendido. Déjame revisar esa información para ti.',
  'Claro, puedo ayudarte con eso. ¿Necesitas algo más?',
  'Perfecto. Tu solicitud ha sido registrada.',
  'No hay problema. ¿Tienes alguna otra consulta?',
]

// Silence threshold in seconds (configurable)
const SILENCE_THRESHOLD = 1

export function VoiceCallDemo({ isOpen, onClose, primaryColor = '#10b981' }: VoiceCallDemoProps) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [callDuration, setCallDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [bars, setBars] = useState<number[]>([0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15])
  const [currentResponse, setCurrentResponse] = useState('')
  const [responseIndex, setResponseIndex] = useState(0)
  const [userSpoke, setUserSpoke] = useState(false)
  
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const speakingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const silenceStartRef = useRef<number>(0)

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Trigger bot response
  const triggerBotResponse = useCallback(() => {
    const response = BOT_RESPONSES[responseIndex % BOT_RESPONSES.length]
    setCurrentResponse(response)
    setResponseIndex(prev => prev + 1)
    setCallState('speaking')
    setUserSpoke(false)
    
    // Speaking duration based on response length
    const speakingDuration = Math.max(2500, response.length * 60)
    speakingTimeoutRef.current = setTimeout(() => {
      setCallState('listening')
      setCurrentResponse('')
      silenceStartRef.current = 0
    }, speakingDuration)
  }, [responseIndex])

  // Start microphone and audio analysis
  const startMicrophone = useCallback(async () => {
    try {
      setCallState('connecting')
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } 
      })
      mediaStreamRef.current = stream

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      const audioContext = new AudioContextClass()
      audioContextRef.current = audioContext

      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.3
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const barCount = 7
      
      const updateLevel = () => {
        if (!analyserRef.current) return
        
        analyserRef.current.getByteTimeDomainData(dataArray)
        
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128
          sum += normalized * normalized
        }
        const rms = Math.sqrt(sum / dataArray.length)
        const level = Math.min(rms * 15, 1)
        
        setAudioLevel(level)
        
        const newBars = Array.from({ length: barCount }, (_, i) => {
          const centerDistance = Math.abs(i - Math.floor(barCount / 2))
          const baseHeight = 0.12
          const randomFactor = 0.05 + Math.random() * 0.1
          const levelInfluence = level * (1 - centerDistance * 0.12)
          return Math.max(baseHeight, Math.min(1, levelInfluence + randomFactor))
        })
        setBars(newBars)
        
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1)
      }, 1000)

      // Start with bot greeting
      setCallState('speaking')
      setCurrentResponse(BOT_RESPONSES[0])
      setResponseIndex(1)
      
      speakingTimeoutRef.current = setTimeout(() => {
        setCallState('listening')
        setCurrentResponse('')
      }, 3500)
      
    } catch (err) {
      console.error('[VoiceCallDemo] Microphone error:', err)
      setError('No se pudo acceder al micrófono')
      setCallState('idle')
    }
  }, [])

  // Detect speech and silence
  useEffect(() => {
    if (callState !== 'listening') {
      silenceStartRef.current = 0
      return
    }

    // User is speaking
    if (audioLevel > 0.08) {
      setUserSpoke(true)
      silenceStartRef.current = 0
    } 
    // Silence after user spoke
    else if (userSpoke && audioLevel < 0.05) {
      if (silenceStartRef.current === 0) {
        silenceStartRef.current = Date.now()
      } else {
        const silenceDuration = (Date.now() - silenceStartRef.current) / 1000
        if (silenceDuration >= SILENCE_THRESHOLD) {
          triggerBotResponse()
        }
      }
    }
  }, [audioLevel, callState, userSpoke, triggerBotResponse])

  // Stop microphone and cleanup
  const stopMicrophone = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current)
      speakingTimeoutRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    setAudioLevel(0)
    setCallDuration(0)
    setBars([0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15])
    setCallState('idle')
    setCurrentResponse('')
    setUserSpoke(false)
    silenceStartRef.current = 0
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!mediaStreamRef.current) return
    
    const audioTrack = mediaStreamRef.current.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setCallState(audioTrack.enabled ? 'listening' : 'muted')
    }
  }, [])

  // Handle end call
  const handleEndCall = useCallback(() => {
    stopMicrophone()
    onClose()
  }, [stopMicrophone, onClose])

  // Start call when overlay opens
  useEffect(() => {
    if (isOpen && callState === 'idle') {
      startMicrophone()
    }
    
    return () => {
      if (!isOpen) {
        stopMicrophone()
      }
    }
  }, [isOpen, callState, startMicrophone, stopMicrophone])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophone()
    }
  }, [stopMicrophone])

  if (!isOpen) return null

  // Speaking animation bars (smooth wave for bot)
  const speakingBars = Array.from({ length: 7 }, (_, i) => {
    const phase = (Date.now() / 120 + i * 0.6) % (Math.PI * 2)
    return 0.25 + Math.sin(phase) * 0.5
  })

  return (
    <div 
      className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl overflow-hidden"
      style={{ 
        background: 'hsl(var(--background) / 0.98)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4" style={{ color: primaryColor }} />
          <span className="text-sm font-medium">Llamada</span>
        </div>
        <span className="text-sm font-mono text-muted-foreground">
          {formatDuration(callDuration)}
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center gap-5 px-4">
        {/* Status icon */}
        <div 
          className={cn(
            'h-20 w-20 rounded-full flex items-center justify-center transition-all duration-150',
            callState === 'connecting' && 'animate-pulse',
          )}
          style={{ 
            backgroundColor: callState === 'muted' 
              ? 'hsl(var(--muted))' 
              : callState === 'speaking'
              ? '#3b82f620'
              : `${primaryColor}20`,
            boxShadow: callState === 'listening' 
              ? `0 0 ${15 + audioLevel * 35}px ${primaryColor}50` 
              : callState === 'speaking'
              ? '0 0 25px #3b82f650'
              : 'none',
            transform: callState === 'listening' ? `scale(${1 + audioLevel * 0.08})` : 'scale(1)',
          }}
        >
          {callState === 'connecting' && (
            <Phone className="h-8 w-8 animate-bounce" style={{ color: primaryColor }} />
          )}
          {callState === 'listening' && (
            <Mic className="h-8 w-8" style={{ color: primaryColor }} />
          )}
          {callState === 'muted' && (
            <MicOff className="h-8 w-8 text-muted-foreground" />
          )}
          {callState === 'speaking' && (
            <Volume2 className="h-8 w-8 text-blue-500" />
          )}
        </div>

        {/* Waveform */}
        {(callState === 'listening' || callState === 'muted' || callState === 'speaking') && (
          <div className="flex items-center gap-1.5 h-12">
            {(callState === 'speaking' ? speakingBars : bars).map((height, i) => (
              <div
                key={i}
                className="w-2 rounded-full"
                style={{
                  height: `${Math.max(5, height * 45)}px`,
                  backgroundColor: callState === 'muted' 
                    ? 'hsl(var(--muted-foreground))' 
                    : callState === 'speaking'
                    ? '#3b82f6'
                    : primaryColor,
                  opacity: callState === 'muted' ? 0.3 : 0.85,
                  transition: 'height 60ms ease-out',
                }}
              />
            ))}
          </div>
        )}

        {/* Bot response text */}
        {callState === 'speaking' && currentResponse && (
          <div 
            className="max-w-[280px] p-3 rounded-xl text-center text-sm leading-relaxed"
            style={{
              backgroundColor: 'hsl(var(--muted))',
              color: 'hsl(var(--foreground))',
            }}
          >
            {currentResponse}
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500 text-center px-4">{error}</p>
        )}
      </div>

      {/* Footer with action buttons */}
      <div className="absolute bottom-6 flex items-center gap-4">
        {/* Mute button */}
        <button
          type="button"
          onClick={toggleMute}
          disabled={callState === 'connecting' || callState === 'speaking'}
          className={cn(
            'h-12 w-12 rounded-full flex items-center justify-center',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            'disabled:opacity-50',
            callState === 'muted' 
              ? 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500' 
              : 'bg-muted hover:bg-muted/80 text-foreground focus:ring-primary'
          )}
          aria-label={callState === 'muted' ? 'Activar micrófono' : 'Silenciar'}
        >
          {callState === 'muted' ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>

        {/* End call button */}
        <button
          type="button"
          onClick={handleEndCall}
          className={cn(
            'h-14 w-14 rounded-full flex items-center justify-center',
            'bg-red-500 hover:bg-red-600 text-white',
            'shadow-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
            'active:scale-95'
          )}
          aria-label="Terminar llamada"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  )
}
