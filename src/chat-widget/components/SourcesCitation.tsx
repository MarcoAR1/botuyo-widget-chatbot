'use client'

import { useState, memo } from 'react'
import { FileIcon } from './Icons'

interface SourcesCitationProps {
  sources: string[]
}

/**
 * SourcesCitation — Non-invasive RAG source chips below bot messages.
 * Collapsed by default, expands on click to show document names.
 */
export const SourcesCitation = memo(function SourcesCitation({ sources }: SourcesCitationProps) {
  const [expanded, setExpanded] = useState(false)

  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-1.5 ml-11">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full transition-all duration-200 border"
        style={{
          color: 'hsl(var(--muted-foreground))',
          backgroundColor: expanded ? 'hsl(var(--muted) / 0.6)' : 'transparent',
          borderColor: 'hsl(var(--border) / 0.5)',
        }}
        aria-expanded={expanded}
        aria-label={`${sources.length} fuente${sources.length > 1 ? 's' : ''} consultada${sources.length > 1 ? 's' : ''}`}
      >
        <FileIcon size={10} />
        <span>{sources.length} fuente{sources.length > 1 ? 's' : ''}</span>
        <span
          className="transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="flex flex-wrap gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {sources.map((source, i) => (
            <span
              key={`${source}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md"
              style={{
                backgroundColor: 'hsl(var(--muted) / 0.4)',
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              <FileIcon size={9} />
              {source}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})
