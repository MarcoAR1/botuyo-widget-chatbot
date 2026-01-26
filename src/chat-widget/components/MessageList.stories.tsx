import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageList } from './MessageList'
import type { ChatMessage } from '../types'

const meta = {
  title: 'Components/MessageList',
  component: MessageList,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px', height: '500px', backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    isTyping: {
      control: 'boolean',
      description: 'Whether the bot is typing',
    },
    welcomeMessage: {
      control: 'text',
      description: 'Welcome message shown at the top',
    },
    primaryColor: {
      control: 'color',
      description: 'Primary color for branding',
    },
    botName: {
      control: 'text',
      description: 'Name of the bot',
    },
  },
} satisfies Meta<typeof MessageList>

export default meta
type Story = StoryObj<typeof meta>

const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    text: '¡Hola! ¿En qué puedo ayudarte?',
    sender: 'bot',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: '2',
    text: 'Hola, necesito información',
    sender: 'user',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
  },
  {
    id: '3',
    text: 'Con gusto te ayudo. ¿Qué necesitas saber?',
    sender: 'bot',
    timestamp: new Date(Date.now() - 7 * 60 * 1000),
  },
]

export const Default: Story = {
  args: {
    messages: sampleMessages,
    isTyping: false,
    welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
    primaryColor: '#10b981',
    botName: 'BotUyo',
  },
}

export const Empty: Story = {
  args: {
    messages: [],
    isTyping: false,
    welcomeMessage: '¡Bienvenido! Escribe un mensaje para comenzar.',
    primaryColor: '#10b981',
    botName: 'BotUyo',
  },
}

export const BotTyping: Story = {
  args: {
    ...Default.args,
    isTyping: true,
  },
}

export const WithMarkdown: Story = {
  args: {
    messages: [
      {
        id: '1',
        text: 'Aquí tienes información sobre nuestros **servicios**:\n\n1. Consultoría\n2. Desarrollo\n3. Soporte\n\nVisita [nuestro sitio](https://example.com)',
        sender: 'bot',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
    ],
    isTyping: false,
    primaryColor: '#10b981',
  },
}

export const WithGallery: Story = {
  args: {
    messages: [
      {
        id: '1',
        text: 'Aquí están las imágenes:',
        sender: 'bot',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        gallery: [
          { url: 'https://picsum.photos/400/300?random=1', alt: 'Imagen 1' },
          { url: 'https://picsum.photos/400/300?random=2', alt: 'Imagen 2' },
          { url: 'https://picsum.photos/400/300?random=3', alt: 'Imagen 3' },
        ],
      },
    ],
    isTyping: false,
    primaryColor: '#10b981',
  },
}

export const WithLocation: Story = {
  args: {
    messages: [
      {
        id: '1',
        text: 'Nuestra ubicación:',
        sender: 'bot',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: 'Nueva York, NY',
        },
      },
    ],
    isTyping: false,
    primaryColor: '#10b981',
  },
}

export const WithAudio: Story = {
  args: {
    messages: [
      {
        id: '1',
        text: 'Mensaje de voz:',
        sender: 'bot',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        audioUrl: 'https://www2.cs.uic.edu/~i101/SoundFiles/BabyElephantWalk60.wav',
      },
    ],
    isTyping: false,
    primaryColor: '#10b981',
  },
}

export const LongConversation: Story = {
  args: {
    messages: Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      text: i % 2 === 0 ? `Mensaje del bot #${i / 2 + 1}` : `Mensaje del usuario #${(i + 1) / 2}`,
      sender: (i % 2 === 0 ? 'bot' : 'user') as 'bot' | 'user',
      timestamp: new Date(Date.now() - (20 - i) * 60 * 1000),
    })),
    isTyping: false,
    primaryColor: '#10b981',
  },
}

export const VirtualizedList: Story = {
  args: {
    messages: Array.from({ length: 150 }, (_, i) => ({
      id: `${i + 1}`,
      text: `Mensaje #${i + 1} - Esta es una conversación muy larga para demostrar la virtualización`,
      sender: (i % 3 === 0 ? 'bot' : 'user') as 'bot' | 'user',
      timestamp: new Date(Date.now() - (150 - i) * 60 * 1000),
    })),
    isTyping: false,
    primaryColor: '#10b981',
  },
}

export const CustomColor: Story = {
  args: {
    ...Default.args,
    primaryColor: '#8b5cf6',
  },
}

export const WithLogo: Story = {
  args: {
    ...Default.args,
    logoUrl: 'https://via.placeholder.com/40',
  },
}
