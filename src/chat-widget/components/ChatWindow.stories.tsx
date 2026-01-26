import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatWindow } from './ChatWindow'
import type { ChatMessage, TextMessage, ImageMessage, LocationMessage, FileMessage, AudioMessage } from '../types'

const meta = {
  title: 'Components/ChatWindow',
  component: ChatWindow,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the chat window is open',
    },
    isConnected: {
      control: 'boolean',
      description: 'Whether the socket is connected',
    },
    isTyping: {
      control: 'boolean',
      description: 'Whether the bot is typing',
    },
    botName: {
      control: 'text',
      description: 'Name of the bot',
    },
    welcomeMessage: {
      control: 'text',
      description: 'Welcome message shown at the top',
    },
    inputPlaceholder: {
      control: 'text',
      description: 'Placeholder text for the input field',
    },
    primaryColor: {
      control: 'color',
      description: 'Primary color for branding',
    },
    position: {
      control: 'select',
      options: ['bottom-right', 'bottom-left'],
      description: 'Position of the chat window',
    },
    onClose: { action: 'closed' },
    onSendMessage: { action: 'message sent' },
    onSendAttachment: { action: 'attachment sent' },
    onSendLocation: { action: 'location sent' },
  },
} satisfies Meta<typeof ChatWindow>

export default meta
type Story = StoryObj<typeof meta>

const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'text',
    content: '¡Hola! ¿En qué puedo ayudarte hoy?',
    sender: 'bot',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  } as TextMessage,
  {
    id: '2',
    type: 'text',
    content: 'Hola, necesito información sobre sus servicios',
    sender: 'user',
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
  } as TextMessage,
  {
    id: '3',
    type: 'text',
    content: 'Con gusto te ayudo. Ofrecemos varios servicios:\n\n1. **Consultoría**\n2. **Desarrollo**\n3. **Soporte técnico**\n\n¿Cuál te interesa más?',
    sender: 'bot',
    timestamp: new Date(Date.now() - 3 * 60 * 1000),
  } as TextMessage,
]

export const Default: Story = {
  args: {
    isOpen: true,
    isConnected: true,
    isTyping: false,
    messages: sampleMessages,
    botName: 'BotUyo',
    welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
    inputPlaceholder: 'Escribe un mensaje...',
    primaryColor: '#10b981',
    position: 'bottom-right',
    onClose: () => console.log('Chat closed'),
    onSendMessage: (msg: string) => console.log('Message sent:', msg),
  },
}

export const EmptyChat: Story = {
  args: {
    ...Default.args,
    messages: [],
  },
}

export const BotTyping: Story = {
  args: {
    ...Default.args,
    isTyping: true,
  },
}

export const Disconnected: Story = {
  args: {
    ...Default.args,
    isConnected: false,
  },
}

export const WithGallery: Story = {
  args: {
    ...Default.args,
    messages: [
      ...sampleMessages,
      {
        id: '4',
        type: 'image',
        imageUrl: 'https://picsum.photos/400/300?random=1',
        altText: 'Producto',
        sender: 'bot',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      } as ImageMessage,
    ],
  },
}

export const WithLocation: Story = {
  args: {
    ...Default.args,
    messages: [
      ...sampleMessages,
      {
        id: '4',
        type: 'location',
        latitude: 40.7128,
        longitude: -74.0060,
        name: 'Nueva York, NY',
        sender: 'bot',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      } as LocationMessage,
    ],
  },
}

export const WithFile: Story = {
  args: {
    ...Default.args,
    messages: [
      ...sampleMessages,
      {
        id: '4',
        type: 'file',
        fileUrl: 'https://example.com/document.pdf',
        fileName: 'Propuesta_Comercial.pdf',
        sender: 'bot',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      } as FileMessage,
    ],
  },
}

export const WithAudio: Story = {
  args: {
    ...Default.args,
    messages: [
      ...sampleMessages,
      {
        id: '4',
        type: 'audio',
        content: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
        sender: 'bot',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      } as AudioMessage,
    ],
  },
}

export const LongConversation: Story = {
  args: {
    ...Default.args,
    messages: [
      ...sampleMessages,
      {
        id: '4',
        type: 'text',
        content: 'Me interesa el desarrollo',
        sender: 'user',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
      } as TextMessage,
      {
        id: '5',
        type: 'text',
        content: '¡Excelente! Nuestro equipo de desarrollo puede ayudarte con:\n\n- Aplicaciones web\n- Aplicaciones móviles\n- APIs y backends\n- Integraciones',
        sender: 'bot',
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
      } as TextMessage,
      {
        id: '6',
        type: 'text',
        content: '¿Tienen experiencia con React?',
        sender: 'user',
        timestamp: new Date(Date.now() - 30 * 1000),
      } as TextMessage,
      {
        id: '7',
        type: 'text',
        content: 'Sí, somos expertos en React y todo el ecosistema moderno de JavaScript. También trabajamos con TypeScript, Next.js, y otras tecnologías.',
        sender: 'bot',
        timestamp: new Date(),
      } as TextMessage,
    ],
  },
}

export const CustomColors: Story = {
  args: {
    ...Default.args,
    primaryColor: '#6366f1',
  },
}

export const BottomLeft: Story = {
  args: {
    ...Default.args,
    position: 'bottom-left',
  },
}
