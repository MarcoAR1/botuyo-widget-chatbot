# 🎯 Guía Rápida de Uso - Chat Widget

## ✅ El widget está listo para usar de 2 formas:

---

## 1️⃣ **CDN (JavaScript Vanilla)** - Para sitios web simples

### Instalación en 2 pasos:

**Paso 1:** Agrega el script antes del cierre de `</body>`:

```html
<script src="https://cdn.paseolibre.com/chat-widget.js"></script>
```

**Paso 2:** Inicializa el widget:

```html
<script>
  PaseoLibreChat.init({
    apiKey: 'tu-api-key-aqui',
    apiBaseUrl: 'https://api.paseolibre.com',
    theme: {
      primaryColor: '#10b981',
      botName: 'Mi Asistente',
      position: 'bottom-right'
    }
  });
</script>
```

### Ejemplo completo:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <title>Mi Sitio</title>
</head>
<body>
  <h1>Mi Sitio Web</h1>
  
  <!-- Widget de Chat -->
  <script src="https://cdn.paseolibre.com/chat-widget.js"></script>
  <script>
    PaseoLibreChat.init({
      apiKey: 'demo-key',
      apiBaseUrl: 'https://api.paseolibre.com'
    });
  </script>
</body>
</html>
```

### Métodos disponibles:

```javascript
const widget = PaseoLibreChat.init({ ... });

widget.open();                    // Abrir chat
widget.close();                   // Cerrar chat
widget.toggle();                  // Toggle abrir/cerrar
widget.sendMessage('Hola');       // Enviar mensaje
widget.clearChat();               // Limpiar historial
widget.destroy();                 // Destruir widget
const state = widget.getState();  // Obtener estado
```

---

## 2️⃣ **NPM/React** - Para aplicaciones React/Next.js

### Instalación:

```bash
npm install @paseolibre/chat-widget-standalone
```

### Uso con Provider (Recomendado):

**1. Envuelve tu app con el Provider:**

```tsx
// app/layout.tsx (Next.js) o App.tsx (React)
import { ChatWidgetProvider } from '@paseolibre/chat-widget-standalone';

export default function App() {
  return (
    <ChatWidgetProvider
      apiKey="tu-api-key"
      apiBaseUrl="https://api.paseolibre.com"
      theme={{ primaryColor: '#10b981' }}
    >
      <YourApp />
    </ChatWidgetProvider>
  );
}
```

**2. Usa el hook en cualquier componente:**

```tsx
import { useChatWidget } from '@paseolibre/chat-widget-standalone';

function MyComponent() {
  const chat = useChatWidget();
  
  return (
    <div>
      <button onClick={chat.open}>Abrir Chat</button>
      <button onClick={chat.toggle}>Toggle Chat</button>
      <button onClick={() => chat.sendMessage('Hola')}>
        Enviar Mensaje
      </button>
      
      {chat.unreadCount > 0 && (
        <span>Tienes {chat.unreadCount} mensajes</span>
      )}
    </div>
  );
}
```

### Tipos TypeScript:

```typescript
import type { 
  ChatWidgetProps,
  ChatWidgetProviderProps,
  ChatTheme,
  UserContext,
  PageContext 
} from '@paseolibre/chat-widget-standalone';

const theme: ChatTheme = {
  primaryColor: '#10b981',
  botName: 'Mi Bot',
  position: 'bottom-right'
};
```

---

## 🎨 Configuración del Tema

```typescript
theme: {
  // Colores
  primaryColor: '#10b981',        // Color principal (botón, burbujas usuario)
  
  // Identidad
  botName: 'Asistente Virtual',   // Nombre del bot
  logoUrl: '/logo.png',           // URL del logo
  
  // Posición
  position: 'bottom-right',       // bottom-right, bottom-left, top-right, top-left
  
  // Mensajes
  welcomeMessage: '¡Hola! 👋',
  inputPlaceholder: 'Escribe...',
  starterPrompt: '¿Necesitas ayuda?',
  
  // Estilos
  borderRadius: '1rem',
  launcherBorderRadius: '50%',
  
  // Burbujas personalizadas
  bubbleStyles: {
    radius: {
      bubble: 'rounded-2xl',
      button: 'rounded-full'
    },
    bot: {
      bg: 'bg-gray-100',
      text: 'text-gray-900'
    },
    launcher: {
      pulse: true  // Animación de pulso
    }
  }
}
```

---

## 🔧 Configuración Avanzada

```typescript
{
  // ⚡ REQUERIDO
  apiKey: 'tu-api-key',
  apiBaseUrl: 'https://api.paseolibre.com',
  
  // 🎨 Tema (opcional)
  theme: { ... },
  
  // 👤 Usuario autenticado (opcional)
  userContext: {
    token: 'jwt-token',
    metadata: {
      userId: '123',
      name: 'Juan',
      email: 'juan@example.com'
    }
  },
  
  // 📄 Contexto de página (opcional)
  pageContext: {
    page: 'ProductPage',
    productId: '456',
    url: window.location.href
  },
  
  // 🔍 SEO automático (opcional)
  includeSEOMetadata: true,
  
  // 📡 Callbacks (opcional)
  onStateChange: (isOpen) => {
    console.log('Chat:', isOpen ? 'abierto' : 'cerrado');
  },
  
  onNavigate: (url) => {
    // Navegar a URL
    window.location.href = url;
  },
  
  onLogin: (userData) => {
    // Usuario autenticado
    console.log('Usuario:', userData);
  },
  
  onEvent: (eventName, data) => {
    // Eventos del widget
    console.log('Evento:', eventName, data);
  }
}
```

---

## 📱 Responsive Automático

El widget es **100% responsive**:
- **Desktop:** Ventana flotante en la esquina
- **Mobile:** Pantalla completa al abrir
- **Detección automática** de dispositivo

---

## 🚀 Comenzar Ahora

### Desarrollo local:

```bash
# Clonar o navegar al proyecto
cd paseo-widget-chatbot

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Abrir en navegador
open http://localhost:3001
```

### Build para producción:

```bash
# Build completo
npm run build

# Los archivos generados estarán en:
# - dist/paseo-libre-chat.js (905KB minificado)
# - dist/paseo-libre-chat.css (6.8KB)
```

---

## 📚 Más Información

- **Instalación completa:** Ver [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
- **Ejemplos:** Ver carpeta [examples/](examples/)
- **Verificación:** Ver [VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)
- **Resumen técnico:** Ver [INSTALLATION_SUMMARY.md](INSTALLATION_SUMMARY.md)

---

## ✅ Checklist Rápido

Antes de usar en producción:

- [ ] Reemplazar `apiKey` con tu API key real
- [ ] Reemplazar `apiBaseUrl` con tu URL de backend
- [ ] Personalizar el tema (colores, logo, nombre)
- [ ] Probar en desktop y móvil
- [ ] Configurar callbacks si es necesario
- [ ] Verificar que el backend Socket.IO esté corriendo

---

## 🆘 Ayuda

¿Problemas? Revisa:

1. **Consola del navegador** - Errores de JavaScript
2. **Network tab** - Conexión al backend
3. **[VERIFICATION_CHECKLIST.md](VERIFICATION_CHECKLIST.md)** - Tests de verificación

---

**¡Listo para usar! 🎉**
