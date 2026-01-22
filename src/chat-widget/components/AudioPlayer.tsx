'use client'

import { useState, useRef, useMemo } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSolidStyles, getPrimaryColor } from '../utils/theme'

interface AudioPlayerProps {
  url: string
  isBot: boolean
  primaryColor?: string
}

export function AudioPlayer({ url, isBot, primaryColor }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const solidStyles = useMemo(() => getSolidStyles(), [])
  const brandColor = useMemo(() => getPrimaryColor({ primaryColor }), [primaryColor])

  const togglePlay = () => {
    if (isPlaying) audioRef.current?.pause()
    else audioRef.current?.play()
    setIsPlaying(!isPlaying)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 py-1 min-w-[200px]',
        isBot ? 'text-foreground' : 'text-primary-foreground'
      )}
    >
      <audio
        ref={audioRef}
        src={url}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration || 0)
          setIsLoading(false)
        }}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{
          backgroundColor: isBot ? brandColor : solidStyles.card,
          color: isBot ? 'white' : brandColor,
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
      <div className="flex-1 space-y-1">
        <div className="relative h-1 w-full bg-current/20 rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-current rounded-full"
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
            {Math.floor(duration / 60)}:
            {Math.floor(duration % 60)
              .toString()
              .padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  )
}
