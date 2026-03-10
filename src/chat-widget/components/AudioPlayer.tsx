'use client'

import { useState, useRef, useMemo, memo, useCallback } from 'react'
import { Play, Pause, Loader2, AlertCircle, RotateCw } from './Icons'
import { cn } from '@/lib/utils'
import { getPrimaryColor } from '../utils/theme'

interface AudioPlayerProps {
  url: string
  isBot: boolean
  primaryColor?: string
}

export type { AudioPlayerProps }

export const AudioPlayer = memo(function AudioPlayer({
  url,
  isBot,
  primaryColor,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  // Blob URLs from URL.createObjectURL() are valid during the current session
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const brandColor = useMemo(() => getPrimaryColor({ primaryColor }), [primaryColor])

  const togglePlay = useCallback(() => {
    if (error) return
    if (isPlaying) audioRef.current?.pause()
    else audioRef.current?.play().catch((e) => {
      console.error('[AudioPlayer] Play error:', e)
      setError('Error al reproducir')
    })
    setIsPlaying(!isPlaying)
  }, [isPlaying, error])

  const handleLoadedMetadata = useCallback(() => {
    setDuration(audioRef.current?.duration || 0)
  }, [])

  const handleCanPlayThrough = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  const handleError = useCallback(() => {
    console.error('[AudioPlayer] Failed to load audio:', url)
    setIsLoading(false)
    setError('No se pudo cargar')
  }, [url])

  const handleRetry = useCallback(() => {
    setIsLoading(true)
    setError(null)
    if (audioRef.current) {
      audioRef.current.load()
    }
  }, [])

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-1 min-w-[200px]',
        isBot ? 'text-foreground' : 'text-primary-foreground'
      )}
    >
      {/* Always render <audio> — onError handles expired URLs naturally */}
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlayThrough={handleCanPlayThrough}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
        onError={handleError}
      />
      
      {error ? (
        // Error state - show retry button
        <button
          onClick={handleRetry}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
          title="Reintentar"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      ) : (
        // Normal play/pause button
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-opacity"
          style={{
            backgroundColor: isBot ? brandColor : 'hsl(var(--card))',
            color: isBot ? 'white' : brandColor,
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
      )}
      
      <div className="flex-1 space-y-1">
        {error ? (
          <div className="flex items-center gap-1.5 text-red-500">
            <AlertCircle className="w-3 h-3" />
            <span className="text-[9px] font-bold">{error}</span>
          </div>
        ) : (
          <>
            <div className="relative h-1 w-full bg-current/20 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-current rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold opacity-60">
              <span>
                {Math.floor(currentTime / 60)}:
                {Math.floor(currentTime % 60)
                  .toString()
                  .padStart(2, '0')}
              </span>
              <span>
                {isLoading ? '--:--' : `${Math.floor(duration / 60)}:${Math.floor(duration % 60).toString().padStart(2, '0')}`}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
})
