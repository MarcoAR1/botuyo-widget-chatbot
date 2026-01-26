'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'

export const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div
      className={cn(
        'flex items-center self-start animate-in fade-in duration-200',
        'max-w-[85%] sm:max-w-[75%]'
      )}
    >
      <div
        className="border rounded-[18px] rounded-tl-[4px] px-4 py-3 shadow-soft-sm"
        style={{
          backgroundColor: 'hsl(var(--card))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full animate-bounce"
              style={{
                backgroundColor: 'hsl(var(--primary) / 0.4)',
                animationDelay: `${i * 150}ms`,
                animationDuration: '800ms',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
})
