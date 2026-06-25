'use client'

import { useState } from 'react'
import { useTranslations } from '@/chat-widget/i18n'
import { Check, X, ShieldCheck, Sparkles } from './Icons'
import { getPrimaryColor } from '../utils/theme'
import type { ToolProposalMessage, ToolProposalCardStatus } from '../types'

export interface ToolProposalCardProps {
  message: ToolProposalMessage
  primaryColor?: string
  /**
   * Whether the current user may confirm. Defaults to `true` — the SERVER is the authority and
   * re-validates `ownerOnly` at confirm. A host that knows the user's role can pass `false` to
   * pre-disable confirm for owner-only actions (so the user isn't sent on a doomed round-trip).
   */
  canConfirm?: boolean
  /** Confirm the proposal (host emits `tool_confirm` with the proposalId). */
  onConfirm?: (proposalId: string) => void
  /** Cancel the proposal (host emits `tool_reject` with the proposalId). */
  onCancel?: (proposalId: string) => void
}

/**
 * Inline tool-approval card (authenticated agents). Renders the localized title/summary of a
 * pending mutating tool call and Confirm/Cancel actions. The client sends ONLY the `proposalId`;
 * the server re-derives args + re-validates `ownerOnly`. Mirrors the quiz buttons' local-state
 * pattern for instant feedback, seeded from `message.status` (history restore / server expiry).
 */
export function ToolProposalCard({
  message,
  primaryColor,
  canConfirm = true,
  onConfirm,
  onCancel,
}: ToolProposalCardProps) {
  const { t } = useTranslations('copilot')
  const brandColor = getPrimaryColor({ primaryColor })

  const [localStatus, setLocalStatus] = useState<ToolProposalCardStatus>(message.status ?? 'pending')
  // The message status (server-driven) wins once terminal; otherwise the local optimistic state.
  const status: ToolProposalCardStatus =
    message.status && message.status !== 'pending' ? message.status : localStatus
  const resolved = status !== 'pending'
  const confirmDisabled = resolved || (!!message.ownerOnly && canConfirm === false)

  const handleConfirm = () => {
    if (confirmDisabled) return
    setLocalStatus('confirmed')
    onConfirm?.(message.proposalId)
  }

  const handleCancel = () => {
    if (resolved) return
    setLocalStatus('cancelled')
    onCancel?.(message.proposalId)
  }

  const title = message.title?.trim() || message.toolName

  return (
    <div
      className="w-full my-2 rounded-2xl border shadow-sm overflow-hidden animate-in fade-in zoom-in-95"
      style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      data-testid="tool-proposal-card"
      data-status={status}
    >
      {/* Header: label + owner-only badge */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <span
          className="flex items-center justify-center w-6 h-6 rounded-full shrink-0"
          style={{ backgroundColor: `${brandColor}1a`, color: brandColor }}
        >
          <Sparkles size={13} strokeWidth={2.5} />
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          {t('proposalLabel')}
        </span>
        {message.ownerOnly && (
          <span
            data-testid="tool-proposal-owner-badge"
            className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
            style={{ backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
          >
            <ShieldCheck size={10} strokeWidth={2.5} />
            {t('ownerOnly')}
          </span>
        )}
      </div>

      {/* Body: localized title + summary */}
      <div className="px-4 pb-3">
        <p className="text-sm font-bold text-foreground leading-snug">{title}</p>
        {message.summary && (
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{message.summary}</p>
        )}
      </div>

      {/* Actions, or the resolved status once acted on / expired */}
      {resolved ? (
        <div
          data-testid="tool-proposal-status"
          className="px-4 py-2.5 border-t text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5"
          style={{
            borderColor: 'hsl(var(--border))',
            color: status === 'confirmed' ? brandColor : 'hsl(var(--muted-foreground))',
          }}
        >
          {status === 'confirmed' && <Check size={13} strokeWidth={3} />}
          {t(status)}
        </div>
      ) : (
        <div className="flex border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <button
            type="button"
            onClick={handleCancel}
            data-testid="tool-proposal-cancel"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors hover:bg-muted/50 active:scale-[0.98]"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <X size={14} strokeWidth={2.5} />
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            data-testid="tool-proposal-confirm"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            style={{ backgroundColor: brandColor }}
          >
            <Check size={14} strokeWidth={3} />
            {t('confirm')}
          </button>
        </div>
      )}
    </div>
  )
}
