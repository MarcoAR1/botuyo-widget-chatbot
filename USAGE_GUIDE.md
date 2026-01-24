# 📚 Guía de Uso del Chat Widget

## 🚀 Instalación Rápida

### Opción 1: CDN (Recomendado para comenzar)

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Sitio Web</title>
  
  <!-- CSS del widget -->
  <link rel="stylesheet" href="https://cdn.paseolibre.com/chat-widget/paseo-libre-chat.css">
</head>
<body>
  <h1>Mi Sitio Web</h1>
  
  <!-- Tu contenido aquí -->
  
  <!-- Script del widget -->
  <script src="https://cdn.paseolibre.com/chat-widget/paseo-libre-chat.js"></script>
  
  <!-- Inicialización -->
  <script>
    window.PaseoLibreChatWidget.mount({
      serverUrl: 'https://tu-servidor.com',
      theme: {
        primaryColor: '#FF6B6B',
        botName: 'Asistente Virtual',
        position: 'bottom-right',
      }
    })
  </script>
</body>
</html>
```

### Opción 2: NPM (Para proyectos React)

```bash
npm install @paseolibre/chat-widget
```

```tsx
import { ChatWidget } from '@paseolibre/chat-widget'
import '@paseolibre/chat-widget/dist/styles.css'

function App() {
  return (
    <ChatWidget
      serverUrl="https://tu-servidor.com"
      theme={{
        primaryColor: '#FF6B6B',
        botName: 'Asistente Virtual',
      }}
    />
  )
}
```

---

## ⚙️ Configuración

### Propiedades Básicas

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `serverUrl` | `string` | **Requerido** | URL del servidor WebSocket |
| `theme` | `ChatTheme` | `{}` | Configuración de tema |
| `onReady` | `() => void` | - | Callback cuando el widget está listo |
| `onError` | `(error: Error) => void` | - | Callback de errores |

### Tema (ChatTheme)

```typescript
interface ChatTheme {
  // 🎨 Colores
  primaryColor?: string          // Color principal (#FF6B6B)
  darkMode?: boolean             // Activar modo oscuro
  
  // 🤖 Bot
  botName?: string               // Nombre del bot
  logoUrl?: string               // URL del avatar
  welcomeMessage?: string        // Mensaje de bienvenida
  
  // 📍 Posición
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  
  // 💬 Textos
  inputPlaceholder?: string      // Placeholder del input
  starterPrompt?: string         // Prompt inicial
  
  // 🎭 Avatars
  avatars?: {
    user?: string                // Avatar del usuario
    bot?: string                 // Avatar del bot
  }
  
  // 🎨 Estilos personalizados
  bubbleStyles?: BubbleStyles
}
```

### Estilos de Burbujas (BubbleStyles)

```typescript
interface BubbleStyles {
  user?: {
    backgroundColor?: string
    textColor?: string
    borderRadius?: string
  }
  bot?: {
    backgroundColor?: string
    textColor?: string
    borderRadius?: string
  }
}
```

---

## 🎨 Ejemplos de Personalización

### Tema Oscuro Completo

```javascript
window.PaseoLibreChatWidget.mount({
  serverUrl: 'https://api.ejemplo.com',
  theme: {
    darkMode: true,
    primaryColor: '#8B5CF6',
    botName: 'NocturnoBot',
    logoUrl: 'https://ejemplo.com/avatar-dark.png',
    welcomeMessage: '🌙 ¡Bienvenido al modo nocturno!',
    position: 'bottom-right',
    bubbleStyles: {
      user: {
        backgroundColor: '#6366F1',
        textColor: '#FFFFFF',
        borderRadius: '16px',
      },
      bot: {
        backgroundColor: '#1E293B',
        textColor: '#F1F5F9',
        borderRadius: '16px',
      }
    }
  }
})
```

### Tema Corporativo

```javascript
window.PaseoLibreChatWidget.mount({
  serverUrl: 'https://api.empresa.com',
  theme: {
    primaryColor: '#0066CC',
    botName: 'Soporte Técnico',
    logoUrl: 'https://empresa.com/logo.png',
    welcomeMessage: '¡Hola! ¿Cómo puedo ayudarte hoy?',
    inputPlaceholder: 'Escribe tu consulta...',
    position: 'bottom-left',
    avatars: {
      user: 'https://empresa.com/user-avatar.png',
      bot: 'https://empresa.com/bot-avatar.png',
    }
  }
})
```

### Minimalista

```javascript
window.PaseoLibreChatWidget.mount({
  serverUrl: 'https://api.simple.com',
  theme: {
    primaryColor: '#000000',
    botName: 'Asistente',
    welcomeMessage: 'Hola',
    position: 'bottom-right',
    bubbleStyles: {
      user: {
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        borderRadius: '4px',
      },
      bot: {
        backgroundColor: '#F5F5F5',
        textColor: '#000000',
        borderRadius: '4px',
      }
    }
  }
})
```

---

## 🔌 Protocolo de Socket

### Eventos del Cliente → Servidor

#### 1. Enviar mensaje de texto

```javascript
socket.emit('user_message', {
  type: 'text',
  content: 'Hola, ¿cómo estás?',
  deviceId: 'abc-123',
  timestamp: new Date().toISOString(),
})
```

#### 2. Enviar imagen (Base64)

```javascript
socket.emit('user_message', {
  type: 'image',
  content: 'data:image/png;base64,iVBORw0KGgo...',
  deviceId: 'abc-123',
  timestamp: new Date().toISOString(),
})
```

#### 3. Enviar audio (Base64)

```javascript
socket.emit('user_message', {
  type: 'audio',
  content: 'data:audio/wav;base64,UklGRiQAAABXQVZF...',
  transcription: 'Hola, necesito ayuda',
  deviceId: 'abc-123',
  timestamp: new Date().toISOString(),
})
```

#### 4. Enviar ubicación

```javascript
socket.emit('user_message', {
  type: 'location',
  content: JSON.stringify({
    latitude: -34.603722,
    longitude: -58.381592,
  }),
  deviceId: 'abc-123',
  timestamp: new Date().toISOString(),
})
```

#### 5. Indicador de escritura

```javascript
socket.emit('typing', {
  deviceId: 'abc-123',
  isTyping: true,
})
```

### Eventos del Servidor → Cliente

#### 1. Mensaje del bot (texto)

```javascript
socket.emit('bot_message', {
  id: 'msg-123',
  type: 'text',
  sender: 'bot',
  content: '¡Hola! ¿En qué puedo ayudarte?',
  timestamp: new Date().toISOString(),
})
```

#### 2. Mensaje con imagen

```javascript
socket.emit('bot_message', {
  id: 'msg-124',
  type: 'image',
  sender: 'bot',
  content: 'Aquí está el mapa que solicitaste',
  imageUrl: 'https://ejemplo.com/mapa.png',
  timestamp: new Date().toISOString(),
})
```

#### 3. Mensaje con audio

```javascript
socket.emit('bot_message', {
  id: 'msg-125',
  type: 'audio',
  sender: 'bot',
  content: 'Te envío un mensaje de voz',
  audioUrl: 'https://ejemplo.com/audio.mp3',
  timestamp: new Date().toISOString(),
})
```

#### 4. Mensaje con ubicación

```javascript
socket.emit('bot_message', {
  id: 'msg-126',
  type: 'location',
  sender: 'bot',
  latitude: -34.603722,
  longitude: -58.381592,
  name: 'Oficina Principal',
  timestamp: new Date().toISOString(),
})
```

#### 5. Bot escribiendo...

```javascript
socket.emit('bot_typing', {
  isTyping: true,
})
```

---

## 🛠️ API Programática

### Métodos Globales

```javascript
// Abrir el chat
window.PaseoLibreChatWidget.open()

// Cerrar el chat
window.PaseoLibreChatWidget.close()

// Alternar estado
window.PaseoLibreChatWidget.toggle()

// Enviar mensaje programáticamente
window.PaseoLibreChatWidget.sendMessage('Hola desde JS')

// Destruir el widget
window.PaseoLibreChatWidget.destroy()

// Actualizar tema dinámicamente
window.PaseoLibreChatWidget.updateTheme({
  primaryColor: '#00FF00',
})
```

### Eventos Personalizados

```javascript
// Escuchar mensajes recibidos
window.addEventListener('chatwidget:message', (event) => {
  console.log('Nuevo mensaje:', event.detail)
})

// Escuchar cambio de estado del chat
window.addEventListener('chatwidget:state', (event) => {
  console.log('Chat abierto:', event.detail.isOpen)
})

// Escuchar errores
window.addEventListener('chatwidget:error', (event) => {
  console.error('Error:', event.detail.error)
})
```

---

## 🧪 Modo Debug

### Habilitar logs en Desarrollo

Los logs están habilitados automáticamente en modo desarrollo (`NODE_ENV=development`).

### Habilitar logs en Producción

```javascript
// Desde la consola del navegador:
window.DEBUG = true

// Ahora todos los logs serán visibles
```

### Ver logs del logger

```javascript
import { logger } from '@paseolibre/chat-widget/logger'

logger.log('Info message')
logger.warn('Warning message')
logger.error('Error message', error)
logger.debug('Debug message', { data: 'extra' })
```

---

## 📱 Responsive & Mobile

El widget es completamente responsive y se adapta automáticamente:

- **Desktop**: Ventana flotante en la esquina especificada
- **Mobile**: Pantalla completa con ajuste dinámico del teclado virtual
- **Tablet**: Comportamiento híbrido según el tamaño

### Comportamiento del Teclado Virtual

El widget usa `visualViewport` API para detectar el teclado virtual y ajustar su altura dinámicamente:

```typescript
// Hook interno (no requiere configuración)
const chatHeight = useDynamicHeight()
```

---

## ♿ Accesibilidad

### Navegación por Teclado

| Tecla | Acción |
|-------|--------|
| `Tab` | Navegar entre elementos |
| `Shift + Tab` | Navegar hacia atrás |
| `Escape` | Cerrar el chat |
| `Enter` | Enviar mensaje |

### Screen Readers

El widget incluye ARIA labels completos:

```html
<div role="dialog" aria-labelledby="chat-title" aria-describedby="chat-desc">
  <h2 id="chat-title">Chat con Asistente Virtual</h2>
  <p id="chat-desc">Ventana de chat interactivo</p>
  <!-- ... -->
</div>
```

### Contraste y Tamaños

- ✅ Cumple WCAG 2.1 Nivel AA
- ✅ Textos mínimo 14px
- ✅ Contraste mínimo 4.5:1

---

## 🔒 Seguridad

### Sanitización de Markdown

El widget sanitiza automáticamente todo el contenido Markdown para prevenir XSS:

```javascript
// ❌ Esto será bloqueado:
const maliciousMessage = {
  content: '<script>alert("XSS")</script>',
}

// ✅ Solo se renderizarán tags seguros:
const safeMessage = {
  content: '**Hola** [mundo](https://ejemplo.com)',
}
```

### Tags Permitidos

- Texto: `p`, `strong`, `em`, `span`
- Listas: `ul`, `ol`, `li`
- Enlaces: `a` (solo http/https/mailto)
- Imágenes: `img` (solo http/https/data)

### Validación de Archivos

```javascript
// El widget valida automáticamente:
// - Tipo de archivo (MIME type)
// - Tamaño máximo (5MB por defecto)
// - Extensión

// Configurar límites personalizados:
window.PaseoLibreChatWidget.mount({
  serverUrl: '...',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/png', 'image/jpeg', 'audio/wav'],
})
```

---

## ⚡ Rendimiento

### Virtualización Automática

Para conversaciones largas (>100 mensajes), el widget activa automáticamente virtualización:

```typescript
// Configuración interna (no requiere acción del usuario)
const VIRTUALIZATION_THRESHOLD = 100

// Solo renderiza ~20 mensajes visibles en lugar de todos
// Mejora significativa en memoria y FPS
```

### Lazy Loading

Componentes pesados se cargan bajo demanda:

```javascript
// Galería de imágenes
const Gallery = React.lazy(() => import('./Gallery'))

// Reproductor de audio
const AudioPlayer = React.lazy(() => import('./AudioPlayer'))
```

### Bundle Size

| Asset | Size | Gzip |
|-------|------|------|
| JS | 1.02 MB | 310 KB |
| CSS | 42 KB | 8.5 KB |

---

## 🐛 Troubleshooting

### El widget no aparece

```javascript
// 1. Verificar que los scripts se cargaron
console.log(window.PaseoLibreChatWidget) // Debe existir

// 2. Verificar errores en consola
// Abrir DevTools → Console

// 3. Verificar que mount() se llamó
window.PaseoLibreChatWidget.mount({
  serverUrl: 'https://tu-servidor.com',
})
```

### No se conecta al servidor

```javascript
// 1. Verificar que serverUrl es correcto
console.log('Server URL:', 'https://tu-servidor.com')

// 2. Verificar CORS en el servidor
// El servidor debe permitir el origen de tu sitio

// 3. Verificar que Socket.IO está corriendo
// Probar manualmente:
const io = require('socket.io-client')
const socket = io('https://tu-servidor.com')
socket.on('connect', () => console.log('Conectado'))
```

### Los mensajes no se envían

```javascript
// 1. Verificar estado de conexión
window.addEventListener('chatwidget:state', (e) => {
  console.log('Conectado:', e.detail.isConnected)
})

// 2. Verificar que el servidor escucha 'user_message'
// En el servidor (Node.js):
io.on('connection', (socket) => {
  socket.on('user_message', (data) => {
    console.log('Mensaje recibido:', data)
  })
})

// 3. Verificar cola offline
// Si no hay conexión, los mensajes se guardan y envían al reconectar
```

### Los estilos se ven mal

```javascript
// 1. Verificar que el CSS se cargó
const link = document.querySelector('link[href*="paseo-libre-chat.css"]')
console.log('CSS cargado:', !!link)

// 2. Verificar conflictos de CSS
// Usar !important o aumentar especificidad:
window.PaseoLibreChatWidget.mount({
  theme: {
    bubbleStyles: {
      user: {
        backgroundColor: '#FF6B6B !important',
      }
    }
  }
})

// 3. Verificar z-index
// El widget usa z-index: 9999 por defecto
```

---

## 📊 Métricas y Analytics

### Trackear eventos

```javascript
window.addEventListener('chatwidget:message', (event) => {
  // Enviar a Google Analytics
  gtag('event', 'chat_message_sent', {
    message_type: event.detail.type,
  })
})

window.addEventListener('chatwidget:state', (event) => {
  if (event.detail.isOpen) {
    gtag('event', 'chat_opened')
  }
})
```

### Performance Monitoring

```javascript
// Medir tiempo de carga del widget
performance.mark('widget-start')
window.PaseoLibreChatWidget.mount({ ... })
performance.mark('widget-end')
performance.measure('widget-load', 'widget-start', 'widget-end')

const measure = performance.getEntriesByName('widget-load')[0]
console.log('Tiempo de carga:', measure.duration, 'ms')
```

---

## 🚀 Despliegue

### Cloudflare R2 (Recomendado)

Ver guía completa: [CLOUDFLARE_R2_SETUP.md](./CLOUDFLARE_R2_SETUP.md)

```bash
# 1. Build
npm run build

# 2. Deploy a R2
./deploy-r2.sh

# 3. Usar en HTML
<script src="https://cdn.tusitio.com/paseo-libre-chat.js"></script>
```

### GitHub Pages

```bash
# 1. Build
npm run build

# 2. Copy a gh-pages branch
cp -r dist/* docs/

# 3. Commit y push
git add docs/
git commit -m "Deploy widget"
git push origin main
```

### Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Usar URL de Vercel en tu HTML
```

---

## 📞 Soporte

- **GitHub**: [github.com/paseolibre/chat-widget](https://github.com/paseolibre/chat-widget)
- **Issues**: [github.com/paseolibre/chat-widget/issues](https://github.com/paseolibre/chat-widget/issues)
- **Email**: soporte@paseolibre.com

---

## 📝 Changelog

Ver historial completo: [CHANGELOG.md](./CHANGELOG.md)

### v1.0.0 (2024-01-15)

- ✨ Lanzamiento inicial
- ✅ Virtualización de listas
- ✅ Error boundaries
- ✅ Offline queue
- ✅ Markdown sanitization
- ✅ ARIA accessibility
- ✅ Modo debug
