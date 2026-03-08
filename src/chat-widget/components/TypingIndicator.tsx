'use client'

import { memo } from 'react'

export const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
        maxWidth: '85%',
        animation: 'message-fade 0.2s ease-out forwards',
      }}
    >
      <div
        style={{
          backgroundColor: 'hsl(var(--card, 0 0% 100%))',
          border: '1px solid hsl(var(--border, 0 0% 90%))',
          borderRadius: '18px',
          borderTopLeftRadius: '4px',
          padding: '14px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="animate-typing-dots"
              style={{
                display: 'inline-block',
                height: '8px',
                width: '8px',
                borderRadius: '50%',
                backgroundColor: 'hsl(var(--primary, 250 84% 54%) / 0.6)',
                animationDelay: `${i * 200}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
})
