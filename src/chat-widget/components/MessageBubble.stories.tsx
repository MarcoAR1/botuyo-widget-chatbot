import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageBubble } from './MessageBubble'
import type { Message } from '../types'

/**
 * MessageBubble muestra un mensaje individual en el chat.
 * Soporta texto, markdown, imágenes, audio, enlaces y archivos.
 */
const meta = {
  title: 'ChatWidget/MessageBubble',
  component: MessageBubble,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '600px', padding: '20px', background: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageBubble>

export default meta
type Story = StoryObj<typeof meta>

const baseMessage: Message = {
  id: '1',
  sessionId: 'session-1',
  sender: 'bot',
  text: 'Hola, ¿en qué puedo ayudarte hoy?',
  timestamp: new Date().toISOString(),
  status: 'sent',
}

/**
 * Mensaje simple del bot
 */
export const BotMessage: Story = {
  args: {
    message: baseMessage,
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}

/**
 * Mensaje del usuario
 */
export const UserMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '2',
      sender: 'user',
      text: '¿Cuáles son tus horarios de atención?',
    },
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}

/**
 * Mensaje con markdown
 */
export const MessageWithMarkdown: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '3',
      text: `# Título importante

**Texto en negrita** y *texto en cursiva*.

Lista de items:
- Item 1
- Item 2
- Item 3

\`\`\`javascript
const hello = "world";
console.log(hello);
\`\`\`

[Enlace a documentación](https://docs.example.com)`,
    },
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}

/**
 * Mensaje con enlace
 */
export const MessageWithLink: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '4',
      text: 'Aquí está el enlace que solicitaste',
      links: [
        {
          url: 'https://example.com',
          title: 'Documentación Completa',
          description: 'Guía paso a paso para comenzar',
        },
      ],
    },
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}

/**
 * Mensaje con galería de imágenes
 */
export const MessageWithGallery: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '5',
      text: 'Aquí están las imágenes que solicitaste:',
      gallery: [
        { url: 'https://via.placeholder.com/400x300', title: 'Imagen 1' },
        { url: 'https://via.placeholder.com/400x300', title: 'Imagen 2' },
        { url: 'https://via.placeholder.com/400x300', title: 'Imagen 3' },
      ],
    },
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}

/**
 * Mensaje con ubicación
 */
export const MessageWithLocation: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '6',
      text: 'Nuestra ubicación:',
      locations: [
        {
          address: 'Av. Libertador 1234, Buenos Aires, Argentina',
          latitude: -34.5875,
          longitude: -58.3974,
        },
      ],
    },
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}

/**
 * Mensaje con archivo adjunto
 */
export const MessageWithFile: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '7',
      text: 'Aquí está el documento que solicitaste',
      files: [
        {
          url: 'https://example.com/document.pdf',
          filename: 'Informe_Mensual.pdf',
          size: 2456789,
        },
      ],
    },
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}

/**
 * Mensaje con audio
 */
export const MessageWithAudio: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '8',
      text: 'Mensaje de audio',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}

/**
 * Mensaje con estado "enviando"
 */
export const MessageSending: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '9',
      sender: 'user',
      text: 'Este mensaje se está enviando...',
      status: 'sending',
    },
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}

/**
 * Mensaje con error
 */
export const MessageError: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '10',
      sender: 'user',
      text: 'Este mensaje falló al enviarse',
      status: 'error',
    },
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}

/**
 * Mensaje largo
 */
export const LongMessage: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '11',
      text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    },
    primaryColor: '#10b981',
    emotionAvatars: {},
  },
}
