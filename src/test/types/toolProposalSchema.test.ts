import { describe, it, expect } from 'vitest'
import {
  ToolProposalSchema,
  ToolProposalResolvedSchema,
} from '@/chat-widget/types/socket'

/**
 * OC-WD-01 — the `tool_proposal` Zod schema MUST drop malformed payloads before they
 * ever reach the UI (RULE 8: validate bot messages). These tests pin that contract.
 */
describe('ToolProposalSchema (OC-WD-01)', () => {
  it('accepts a well-formed proposal', () => {
    const result = ToolProposalSchema.safeParse({
      proposalId: 'prop-1',
      tool: 'create_vacancy',
      title: 'Crear vacante',
      summary: 'Se creará la vacante "Cajero".',
      args: { title: 'Cajero' },
      ownerOnly: false,
    })
    expect(result.success).toBe(true)
  })

  it('accepts a minimal proposal (only proposalId + tool)', () => {
    expect(ToolProposalSchema.safeParse({ proposalId: 'prop-1', tool: 'x' }).success).toBe(true)
  })

  it('drops a payload missing proposalId', () => {
    expect(ToolProposalSchema.safeParse({ tool: 'create_vacancy' }).success).toBe(false)
  })

  it('drops a payload with an empty proposalId', () => {
    expect(ToolProposalSchema.safeParse({ proposalId: '', tool: 'x' }).success).toBe(false)
  })

  it('drops a payload with a non-string tool', () => {
    expect(ToolProposalSchema.safeParse({ proposalId: 'prop-1', tool: 123 }).success).toBe(false)
  })

  it('drops a payload with a non-boolean ownerOnly', () => {
    const result = ToolProposalSchema.safeParse({ proposalId: 'p', tool: 'x', ownerOnly: 'yes' })
    expect(result.success).toBe(false)
  })
})

describe('ToolProposalResolvedSchema (OC-WD-01)', () => {
  it('accepts a resolution with a known status', () => {
    expect(
      ToolProposalResolvedSchema.safeParse({ proposalId: 'p', status: 'confirmed' }).success
    ).toBe(true)
  })

  it('accepts a resolution without a status', () => {
    expect(ToolProposalResolvedSchema.safeParse({ proposalId: 'p' }).success).toBe(true)
  })

  it('drops a resolution with an unknown status', () => {
    expect(
      ToolProposalResolvedSchema.safeParse({ proposalId: 'p', status: 'maybe' }).success
    ).toBe(false)
  })

  it('drops a resolution missing proposalId', () => {
    expect(ToolProposalResolvedSchema.safeParse({ status: 'expired' }).success).toBe(false)
  })
})
