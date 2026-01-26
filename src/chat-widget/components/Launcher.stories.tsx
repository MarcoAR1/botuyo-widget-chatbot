import type { Meta, StoryObj } from '@storybook/react'
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
    botName: {
      control: 'text',
      description: 'Nombre del bot',
    },
    botEmotion: {
      control: 'select',
      options: ['happy', 'thinking', 'sad', 'confused', 'surprised'],
      description: 'Emoción actual del bot',
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
    botName: 'BotUyo',
    botEmotion: 'happy',
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
    botName: 'BotUyo',
    botEmotion: 'thinking',
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
    botName: 'BotUyo',
    botEmotion: 'surprised',
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
    botName: 'BotUyo',
    botEmotion: 'happy',
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
    botName: 'BotUyo',
    botEmotion: 'happy',
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
    botName: 'BotUyo',
    botEmotion: 'thinking',
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
    botName: 'BotUyo',
    botEmotion: 'confused',
  },
}
