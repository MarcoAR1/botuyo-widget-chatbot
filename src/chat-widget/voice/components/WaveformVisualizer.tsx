/**
 * @package @botuyo/chat-widget
 * Waveform Visualizer Component
 *
 * Animated audio waveform visualization for voice recording feedback.
 */

'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { WaveformVisualizerProps } from '../types'

/**
 * Animated waveform bars for audio visualization
 */
export function WaveformVisualizer({
  isActive,
  className,
  barCount = 5,
  color,
}: WaveformVisualizerProps) {
  // Generate animation delays for natural movement (deterministic)
  const bars = useMemo(() => {
    // Use a simple deterministic sequence instead of Math.random()
    const durations = [0.4, 0.55, 0.45, 0.6, 0.5, 0.65, 0.42, 0.58]
    return Array.from({ length: barCount }, (_, i) => ({
      id: i,
      delay: `${i * 0.1}s`,
      duration: `${durations[i % durations.length]}s`,
    }))
  }, [barCount])

  return (
    <div
      className={cn('flex items-center justify-center gap-1', className)}
      role="img"
      aria-label={isActive ? 'Recording audio' : 'Audio visualization'}
    >
      {bars.map(bar => (
        <span
          key={bar.id}
          className={cn('w-1 rounded-full transition-all', isActive ? 'animate-waveform' : 'h-1')}
          style={{
            backgroundColor: color || 'hsl(var(--primary))',
            animationDelay: bar.delay,
            animationDuration: bar.duration,
            height: isActive ? undefined : '4px',
          }}
        />
      ))}

      {/* CSS Animation - injected inline for isolation */}
      <style>{`
        @keyframes waveform {
          0%, 100% {
            height: 4px;
          }
          50% {
            height: 20px;
          }
        }
        .animate-waveform {
          animation-name: waveform;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>
    </div>
  )
}
