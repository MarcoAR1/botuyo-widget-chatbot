/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ToolProposalCard, type ToolProposalCardProps } from '../../chat-widget/components/ToolProposalCard'
import { LanguageProvider } from '../../chat-widget/i18n/LanguageContext'
import type { ToolProposalMessage } from '../../chat-widget/types'

function makeProposal(overrides: Partial<ToolProposalMessage> = {}): ToolProposalMessage {
  return {
    id: 'm1',
    type: 'tool_proposal',
    sender: 'bot',
    timestamp: new Date(),
    proposalId: 'prop-1',
    toolName: 'create_vacancy',
    title: 'Crear vacante "Cajero"',
    summary: 'Se creará una vacante en borrador.',
    ...overrides,
  }
}

function renderCard(props: Partial<ToolProposalCardProps> = {}) {
  const message = props.message ?? makeProposal()
  // Pin the locale so the asserted labels are deterministic regardless of the test runner's navigator.
  return render(
    <LanguageProvider defaultLocale="es">
      <ToolProposalCard {...props} message={message} />
    </LanguageProvider>
  )
}

describe('ToolProposalCard (OC-WD-03)', () => {
  it('renders the localized title, summary and the Confirm/Cancel actions', () => {
    renderCard()
    expect(screen.getByTestId('tool-proposal-card')).toBeInTheDocument()
    expect(screen.getByText('Crear vacante "Cajero"')).toBeInTheDocument()
    expect(screen.getByText('Se creará una vacante en borrador.')).toBeInTheDocument()
    expect(screen.getByText('Confirmar')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('falls back to the tool name when no title is provided', () => {
    renderCard({ message: makeProposal({ title: undefined }) })
    expect(screen.getByText('create_vacancy')).toBeInTheDocument()
  })

  it('Confirm → calls onConfirm with the proposalId only', () => {
    const onConfirm = vi.fn()
    renderCard({ onConfirm })
    fireEvent.click(screen.getByTestId('tool-proposal-confirm'))
    expect(onConfirm).toHaveBeenCalledWith('prop-1')
  })

  it('Cancel → calls onCancel with the proposalId only', () => {
    const onCancel = vi.fn()
    renderCard({ onCancel })
    fireEvent.click(screen.getByTestId('tool-proposal-cancel'))
    expect(onCancel).toHaveBeenCalledWith('prop-1')
  })

  it('after confirming, swaps to a resolved state and cannot re-fire', () => {
    const onConfirm = vi.fn()
    renderCard({ onConfirm })
    fireEvent.click(screen.getByTestId('tool-proposal-confirm'))

    expect(screen.getByTestId('tool-proposal-status')).toBeInTheDocument()
    expect(screen.getByText('Confirmado')).toBeInTheDocument()
    expect(screen.queryByTestId('tool-proposal-confirm')).not.toBeInTheDocument()
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('renders the owner-only badge when ownerOnly is true (and not otherwise)', () => {
    const { unmount } = renderCard({ message: makeProposal({ ownerOnly: true }) })
    expect(screen.getByTestId('tool-proposal-owner-badge')).toBeInTheDocument()
    expect(screen.getByText('Solo administrador')).toBeInTheDocument()
    unmount()

    renderCard()
    expect(screen.queryByTestId('tool-proposal-owner-badge')).not.toBeInTheDocument()
  })

  it('disables Confirm for an owner-only action when canConfirm is false (server stays the authority)', () => {
    const onConfirm = vi.fn()
    renderCard({ message: makeProposal({ ownerOnly: true }), canConfirm: false, onConfirm })
    const confirmBtn = screen.getByTestId('tool-proposal-confirm')
    expect(confirmBtn).toBeDisabled()
    fireEvent.click(confirmBtn)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('seeds the resolved state from message.status (history restore / server expiry)', () => {
    renderCard({ message: makeProposal({ status: 'expired' }) })
    expect(screen.getByTestId('tool-proposal-status')).toBeInTheDocument()
    expect(screen.getByText('Expirada')).toBeInTheDocument()
    expect(screen.queryByTestId('tool-proposal-confirm')).not.toBeInTheDocument()
  })
})
