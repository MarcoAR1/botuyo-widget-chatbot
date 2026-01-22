'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getSolidStyles } from '../utils/theme'

export function TypingIndicator() {
  const solidStyles = useMemo(() => getSolidStyles(), [])
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        'flex items-center self-start',
        'max-w-[85%] sm:max-w-[75%]'
      )}
    >
      <div 
        className="border rounded-[18px] rounded-tl-[4px] px-4 py-3 shadow-soft-sm"
        style={{
          backgroundColor: solidStyles.card,
          borderColor: solidStyles.border,
        }}
      >
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: `${solidStyles.primary}66` }}
              animate={{
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
