import type { Meta, StoryObj } from '@storybook/react-vite'
import { TypingIndicator } from './TypingIndicator'

/**
 * TypingIndicator muestra una animación cuando el bot está escribiendo.
 * Proporciona feedback visual al usuario de que el bot está procesando.
 */
const meta = {
  title: 'ChatWidget/TypingIndicator',
  component: TypingIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    primaryColor: {
      control: 'color',
      description: 'Color primario del tema',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '300px', padding: '20px', background: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TypingIndicator>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Indicador de escritura con color por defecto
 */
export const Default: Story = {
  args: {
    primaryColor: '#10b981',
  },
}

/**
 * Indicador con color azul
 */
export const Blue: Story = {
  args: {
    primaryColor: '#3b82f6',
  },
}

/**
 * Indicador con color púrpura
 */
export const Purple: Story = {
  args: {
    primaryColor: '#8b5cf6',
  },
}

/**
 * Indicador con color rojo
 */
export const Red: Story = {
  args: {
    primaryColor: '#ef4444',
  },
}
