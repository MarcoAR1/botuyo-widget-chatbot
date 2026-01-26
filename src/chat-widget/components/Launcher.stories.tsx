import type { Meta, StoryObj } from '@storybook/react-vite'
import { Launcher } from './Launcher'

/**
 * El componente Launcher es el botón flotante que permite abrir el chat.
 * Se muestra en la esquina inferior derecha de la pantalla.
 */
const meta = {
  title: 'ChatWidget/Launcher',
  component: Launcher,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Estado de apertura del chat',
    },
    onClick: {
      action: 'clicked',
      description: 'Callback al hacer clic en el launcher',
    },
    unreadCount: {
      control: { type: 'number', min: 0, max: 99 },
      description: 'Número de mensajes no leídos',
    },
    primaryColor: {
      control: 'color',
      description: 'Color primario del tema',
    },
    emotion: {
      control: 'select',
      options: ['happy', 'thinking', 'sorry', 'confused', 'default'],
      description: 'Emoción actual del bot',
      table: {
        category: 'Appearance',
      },
    },
  },
} satisfies Meta<typeof Launcher>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Estado cerrado sin mensajes no leídos
 */
export const Closed: Story = {
  args: {
    isOpen: false,
    unreadCount: 0,
    primaryColor: '#10b981',
    emotion: 'happy',
    onClick: () => console.log('Launcher clicked'),
  },
}

/**
 * Estado cerrado con mensajes no leídos
 */
export const ClosedWithUnread: Story = {
  args: {
    isOpen: false,
    unreadCount: 3,
    primaryColor: '#10b981',
    emotion: 'thinking',
    onClick: () => console.log('Launcher clicked'),
  },
}

/**
 * Estado cerrado con muchos mensajes no leídos
 */
export const ClosedWithManyUnread: Story = {
  args: {
    isOpen: false,
    unreadCount: 99,
    primaryColor: '#10b981',
    emotion: 'happy',
    onClick: () => console.log('Launcher clicked'),
  },
}

/**
 * Estado abierto
 */
export const Open: Story = {
  args: {
    isOpen: true,
    unreadCount: 0,
    primaryColor: '#10b981',
    emotion: 'happy',
    onClick: () => console.log('Launcher clicked'),
  },
}

/**
 * Con color personalizado
 */
export const CustomColor: Story = {
  args: {
    isOpen: false,
    unreadCount: 0,
    primaryColor: '#3b82f6',
    emotion: 'happy',
    onClick: () => console.log('Launcher clicked'),
  },
}

/**
 * Bot pensando
 */
export const BotThinking: Story = {
  args: {
    isOpen: false,
    unreadCount: 0,
    primaryColor: '#10b981',
    emotion: 'thinking',
    onClick: () => console.log('Launcher clicked'),
  },
}

/**
 * Bot confundido
 */
export const BotConfused: Story = {
  args: {
    isOpen: false,
    unreadCount: 1,
    primaryColor: '#10b981',
    emotion: 'confused',
    onClick: () => console.log('Launcher clicked'),
  },
}
