import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToolProposalCard } from './ToolProposalCard'
import { LanguageProvider } from '../i18n/LanguageContext'
import type { ToolProposalMessage } from '../types'

const baseMessage: ToolProposalMessage = {
  id: 'm1',
  type: 'tool_proposal',
  sender: 'bot',
  timestamp: new Date(),
  proposalId: 'prop-1',
  toolName: 'create_vacancy',
  title: 'Crear vacante "Cajero/a — Sucursal Centro"',
  summary: 'Se creará una vacante en estado borrador. Podrás completar los detalles luego.',
}

/**
 * ToolProposalCard — the inline tool-approval card for authenticated agents. The agent proposes a
 * mutating action; the user confirms or cancels. The client sends only the proposalId; the server
 * re-derives args and re-validates `ownerOnly`. Confirm/Cancel are interactive in these stories
 * (the card tracks its own resolved state for instant feedback).
 */
const meta = {
  title: 'ChatWidget/ToolProposalCard',
  component: ToolProposalCard,
  parameters: { layout: 'padded' },
  decorators: [
    Story => (
      <LanguageProvider defaultLocale="es">
        <div style={{ maxWidth: 340 }}>
          <Story />
        </div>
      </LanguageProvider>
    ),
  ],
} satisfies Meta<typeof ToolProposalCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { message: baseMessage },
}

export const OwnerOnly: Story = {
  args: { message: { ...baseMessage, ownerOnly: true } },
}

export const OwnerOnlyDisabled: Story = {
  args: { message: { ...baseMessage, ownerOnly: true }, canConfirm: false },
}

export const Confirmed: Story = {
  args: { message: { ...baseMessage, status: 'confirmed' } },
}

export const Cancelled: Story = {
  args: { message: { ...baseMessage, status: 'cancelled' } },
}

export const Expired: Story = {
  args: { message: { ...baseMessage, status: 'expired' } },
}
