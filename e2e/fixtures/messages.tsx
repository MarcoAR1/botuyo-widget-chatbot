import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MessageList } from '../../src/chat-widget/components/MessageList'
import type { ChatMessage } from '../../src/chat-widget/types'
import '../../src/chat-widget/compiled-tailwind.css'
import '../../src/chat-widget/styles/premium-animations.css'

const start = new Date('2026-09-09T12:00:00Z').getTime()
const message = (index: number, idle = false): ChatMessage => ({
  id: `message-${index}`,
  type: 'text',
  sender: index % 2 ? 'user' : 'bot',
  timestamp: new Date(start + index * 1000 + (idle ? 20 * 60 * 1000 : 0)),
  content:
    `Mensaje ${index}. ` +
    'Texto largo para comprobar que las burbujas conservan su espacio. '.repeat(8),
})

export function Fixture() {
  const count = Number(new URLSearchParams(location.search).get('count') || 100)
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    Array.from({ length: count }, (_, i) => message(i))
  )
  const [open, setOpen] = useState(true)
  const [narrow, setNarrow] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [typing, setTyping] = useState(false)
  return (
    <>
      <button onClick={() => setMessages(prev => [...prev, message(prev.length, true)])}>
        Enviar tras inactividad
      </button>
      <button onClick={() => setOpen(prev => !prev)}>Abrir/cerrar</button>
      <button onClick={() => setNarrow(prev => !prev)}>Cambiar ancho</button>
      <button onClick={() => setHidden(prev => !prev)}>Ocultar contenedor</button>
      <button onClick={() => setTyping(prev => !prev)}>Escribiendo</button>
      <button onClick={() => setMessages(prev => prev.slice(-50))}>Historial parcial</button>
      <button
        onClick={() =>
          setMessages(prev => [...prev, { ...message(prev.length), content: 'x'.repeat(500) }])
        }
      >
        Texto sin espacios
      </button>
      <button
        onClick={() =>
          setMessages(prev =>
            prev.map((m, i) =>
              i === prev.length - 2
                ? ({
                    ...m,
                    content: 'Imagen pendiente ![Prueba de carga](/delayed.svg)',
                  } as ChatMessage)
                : m
            )
          )
        }
      >
        Cargar imagen
      </button>
      <button
        onClick={() =>
          setMessages(prev =>
            prev.map(m =>
              m.id === prev[prev.length - 2].id
                ? ({
                    ...m,
                    content: 'Historial actualizado. ' + 'Contenido nuevo más alto. '.repeat(40),
                  } as ChatMessage)
                : m
            )
          )
        }
      >
        Recuperar historial
      </button>
      <button onClick={() => setMessages(prev => [message(-1), ...prev])}>
        Anteponer historial
      </button>
      <div
        data-testid="chat"
        id="botuyo-chat-widget-root"
        style={
          {
            display: hidden ? 'none' : 'flex',
            flexDirection: 'column',
            width: narrow ? 260 : 350,
            height: 500,
            '--spacing-3': '12px',
            '--spacing-4': '16px',
            '--spacing-5': '20px',
            '--duration-slower': '500ms',
          } as React.CSSProperties
        }
      >
        {open && <MessageList messages={messages} isTyping={typing} />}
      </div>
    </>
  )
}
createRoot(document.getElementById('root')!).render(<Fixture />)
