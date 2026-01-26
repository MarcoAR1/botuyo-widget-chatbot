import type { Meta, StoryObj } from '@storybook/react-vite'
import { MessageBubble } from './MessageBubble'
import type { TextMessage, ImageMessage, LocationMessage, FileMessage, AudioMessage } from '../types'

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

const baseMessage: TextMessage = {
  id: '1',
  type: 'text',
  content: 'Hola, ¿en qué puedo ayudarte hoy?',
  sender: 'bot',
  timestamp: new Date(),
}

/**
 * Mensaje simple del bot
 */
export const BotMessage: Story = {
  args: {
    message: baseMessage,
    primaryColor: '#10b981',
    avatars: {},
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
      content: '¿Cuáles son tus horarios de atención?',
    },
    primaryColor: '#10b981',
    avatars: {},
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
      content: `# Título importante

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
    avatars: {},
  },
}

/**
 * Mensaje con enlace en markdown
 */
export const MessageWithLink: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '4',
      content: 'Aquí está el enlace que solicitaste: [Documentación Completa](https://example.com)',
    },
    primaryColor: '#10b981',
    avatars: {},
  },
}

/**
 * Mensaje con imagen
 */
export const MessageWithGallery: Story = {
  args: {
    message: {
      id: '5',
      type: 'image',
      imageUrl: 'https://via.placeholder.com/400x300',
      altText: 'Imagen de ejemplo',
      sender: 'bot',
      timestamp: new Date(),
    } as ImageMessage,
    primaryColor: '#10b981',
    avatars: {},
  },
}

/**
 * Mensaje con ubicación
 */
export const MessageWithLocation: Story = {
  args: {
    message: {
      id: '6',
      type: 'location',
      latitude: -34.5875,
      longitude: -58.3974,
      name: 'Av. Libertador 1234, Buenos Aires, Argentina',
      sender: 'bot',
      timestamp: new Date(),
    } as LocationMessage,
    primaryColor: '#10b981',
    avatars: {},
  },
}

/**
 * Mensaje con archivo adjunto
 */
export const MessageWithFile: Story = {
  args: {
    message: {
      id: '7',
      type: 'file',
      fileUrl: 'https://example.com/document.pdf',
      fileName: 'Informe_Mensual.pdf',
      fileSize: 2456789,
      mimeType: 'application/pdf',
      sender: 'bot',
      timestamp: new Date(),
    } as FileMessage,
    primaryColor: '#10b981',
    avatars: {},
  },
}

/**
 * Mensaje con audio
 */
export const MessageWithAudio: Story = {
  args: {
    message: {
      id: '8',
      type: 'audio',
      content: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      sender: 'bot',
      timestamp: new Date(),
    } as AudioMessage,
    primaryColor: '#10b981',
    avatars: {},
  },
}

/**
 * Mensaje del usuario enviando
 */
export const MessageSending: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '9',
      sender: 'user',
      content: 'Este mensaje se está enviando...',
    },
    primaryColor: '#10b981',
    avatars: {},
  },
}

/**
 * Mensaje con error (ejemplo visual)
 */
export const MessageError: Story = {
  args: {
    message: {
      ...baseMessage,
      id: '10',
      sender: 'user',
      content: 'Este mensaje falló al enviarse ❌',
    },
    primaryColor: '#10b981',
    avatars: {},
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
      content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    },
    primaryColor: '#10b981',
    avatars: {},
  },
}
