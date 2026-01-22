# 📦 Guía de Instalación - Paseo Libre Chat Widget

Este documento describe las diferentes formas de instalar y usar el Chat Widget de Paseo Libre.

## 🎯 Métodos de Instalación

### 1. 🌐 Instalación CDN (JavaScript Vanilla)

La forma más simple para sitios web estáticos sin frameworks.

#### Instalación Básica

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi Sitio Web</title>
</head>
<body>
  <!-- Tu contenido aquí -->
  <h1>Bienvenido</h1>

  <!-- Widget de Chat - Agregar antes del cierre de </body> -->
  <script src="https://cdn.paseolibre.com/chat-widget.js"></script>
  <script>
    // Inicializar el widget
    PaseoLibreChat.init({
      apiKey: 'your-api-key-here',
      apiBaseUrl: 'https://api.paseolibre.com',
      theme: {
        primaryColor: '#10b981',
        botName: 'Asistente Paseo Libre',
        position: 'bottom-right',
        welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?'
      }
    });
  </script>
</body>
</html>
```

#### Configuración Avanzada CDN

```html
<script src="https://cdn.paseolibre.com/chat-widget.js"></script>
<script>
  const widget = PaseoLibreChat.init({
    apiKey: 'your-api-key-here',
    apiBaseUrl: 'https://api.paseolibre.com',
    
    // Tema personalizado
    theme: {
      primaryColor: '#10b981',
      botName: 'Mi Asistente',
      logoUrl: '/logo.png',
      position: 'bottom-right',
      welcomeMessage: 'Hola, ¿cómo te puedo ayudar?',
      inputPlaceholder: 'Escribe aquí...',
      borderRadius: '1rem',
      launcherBorderRadius: '50%',
      starterPrompt: '¿Necesitas ayuda?'
    },
    
    // Contexto de usuario (si está autenticado)
    userContext: {
      token: 'user-jwt-token',
      metadata: {
        userId: '12345',
        plan: 'premium'
      }
    },
    
    // Contexto de página
    pageContext: {
      page: 'Homepage',
      url: window.location.href,
      title: document.title
    },
    
    // Callbacks
    onStateChange: (isOpen) => {
      console.log('Widget está:', isOpen ? 'abierto' : 'cerrado');
    },
    
    onNavigate: (url) => {
      console.log('Navegar a:', url);
      window.location.href = url;
    },
    
    onLogin: (userData) => {
      console.log('Usuario autenticado:', userData);
    },
    
    onEvent: (eventName, data) => {
      console.log('Evento:', eventName, data);
    }
  });

  // Métodos disponibles
  // widget.open();          // Abrir chat
  // widget.close();         // Cerrar chat
  // widget.toggle();        // Toggle abrir/cerrar
  // widget.sendMessage('Hola'); // Enviar mensaje
  // widget.clearChat();     // Limpiar historial
  // widget.destroy();       // Destruir widget
</script>
```

#### TypeScript Support con CDN

```typescript
// types.d.ts
/// <reference types="@paseolibre/chat-widget-standalone" />

// Uso
const widget = window.PaseoLibreChat.init({
  apiKey: 'your-api-key',
  apiBaseUrl: 'https://api.paseolibre.com',
  theme: {
    primaryColor: '#10b981'
  }
});

widget.open();
```

---

### 2. 📦 Instalación NPM (React/Next.js)

Para aplicaciones React, Next.js o cualquier proyecto con npm.

#### Instalación

```bash
npm install @paseolibre/chat-widget-standalone
# o
yarn add @paseolibre/chat-widget-standalone
# o
pnpm add @paseolibre/chat-widget-standalone
```

#### Opción A: Uso con Provider (Recomendado ✅)

El Provider te da acceso al estado del chat desde cualquier componente.

```tsx
// app/layout.tsx o _app.tsx
import { ChatWidgetProvider } from '@paseolibre/chat-widget-standalone';
import type { ChatWidgetProviderProps } from '@paseolibre/chat-widget-standalone';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ChatWidgetProvider
          apiKey={process.env.NEXT_PUBLIC_CHAT_API_KEY!}
          apiBaseUrl={process.env.NEXT_PUBLIC_CHAT_API_URL!}
          theme={{
            primaryColor: '#10b981',
            botName: 'Asistente Paseo Libre',
            position: 'bottom-right',
            welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?'
          }}
          onNavigate={(url) => {
            // Usar Next.js router
            window.location.href = url;
          }}
        >
          {children}
        </ChatWidgetProvider>
      </body>
    </html>
  );
}
```

**Uso del Hook en Componentes:**

```tsx
// components/CustomChatButton.tsx
'use client';

import { useChatWidget } from '@paseolibre/chat-widget-standalone';

export function CustomChatButton() {
  const chat = useChatWidget();

  return (
    <div>
      <button onClick={chat.toggle}>
        Chat {chat.unreadCount > 0 && `(${chat.unreadCount})`}
      </button>
      
      <button onClick={chat.open}>
        Abrir Soporte
      </button>
      
      <button onClick={() => chat.sendMessage('Hola, necesito ayuda')}>
        Mensaje Rápido
      </button>
      
      {chat.isOpen && <p>El chat está abierto</p>}
    </div>
  );
}
```

#### Opción B: Componente Directo (Sin Provider)

```tsx
'use client';

import { ChatWidget } from '@paseolibre/chat-widget-standalone';
import type { ChatWidgetProps } from '@paseolibre/chat-widget-standalone';

export default function App() {
  return (
    <div>
      <h1>Mi Aplicación</h1>
      
      <ChatWidget
        apiKey={process.env.NEXT_PUBLIC_CHAT_API_KEY!}
        apiBaseUrl={process.env.NEXT_PUBLIC_CHAT_API_URL!}
        theme={{
          primaryColor: '#10b981',
          botName: 'Asistente',
        }}
        pageContext={{
          page: 'Homepage',
          url: window.location.href,
        }}
        onStateChange={(isOpen) => {
          console.log('Chat:', isOpen ? 'abierto' : 'cerrado');
        }}
      />
    </div>
  );
}
```

#### Configuración con TypeScript Completo

```tsx
import { 
  ChatWidgetProvider, 
  useChatWidget,
  type ChatWidgetProviderProps,
  type ChatTheme,
  type UserContext 
} from '@paseolibre/chat-widget-standalone';

const theme: ChatTheme = {
  primaryColor: '#10b981',
  botName: 'Mi Bot',
  position: 'bottom-right',
  welcomeMessage: 'Hola 👋',
  bubbleStyles: {
    radius: {
      bubble: 'rounded-2xl',
      button: 'rounded-full'
    },
    bot: {
      bg: 'bg-gray-100',
      text: 'text-gray-900'
    }
  }
};

const userContext: UserContext = {
  token: 'jwt-token',
  metadata: {
    userId: '123',
    name: 'Juan'
  }
};

function App() {
  return (
    <ChatWidgetProvider
      apiKey="your-key"
      apiBaseUrl="https://api.example.com"
      theme={theme}
      userContext={userContext}
    >
      <YourApp />
    </ChatWidgetProvider>
  );
}
```

---

### 3. 🎨 Ejemplos de Temas Personalizados

#### Tema Oscuro

```typescript
theme: {
  primaryColor: '#8b5cf6',
  botName: 'NightBot',
  bubbleStyles: {
    bot: {
      bg: 'bg-slate-800',
      text: 'text-white',
      border: 'border-slate-700'
    },
    launcher: {
      bg: 'bg-purple-600 hover:bg-purple-700',
      pulse: true
    }
  }
}
```

#### Tema Minimalista

```typescript
theme: {
  primaryColor: '#000000',
  botName: 'Assistant',
  borderRadius: '0.5rem',
  launcherBorderRadius: '0.5rem',
  bubbleStyles: {
    radius: {
      bubble: 'rounded-md',
      button: 'rounded-md'
    }
  }
}
```

#### Tema Colorido

```typescript
theme: {
  primaryColor: '#f59e0b',
  botName: 'Sunny Bot ☀️',
  welcomeMessage: '¡Hola! Soy Sunny, tu asistente virtual 🌞',
  bubbleStyles: {
    bot: {
      bg: 'bg-amber-50',
      text: 'text-amber-900',
      border: 'border-amber-200'
    },
    launcher: {
      pulse: true
    }
  }
}
```

---

### 4. 🔧 Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_CHAT_API_KEY=your-api-key-here
NEXT_PUBLIC_CHAT_API_URL=https://api.paseolibre.com
```

---

### 5. 📱 Responsive & Mobile

El widget es completamente responsive y se adapta automáticamente a dispositivos móviles.

```typescript
// Se detecta automáticamente el dispositivo
// En móvil, el chat ocupa toda la pantalla
// En desktop, aparece como ventana flotante
```

---

### 6. 🧪 Testing Local

Para probar localmente:

```bash
# Clonar el repositorio
git clone https://github.com/paseolibre/chat-widget.git
cd chat-widget

# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

---

### 7. ✅ Verificación de Instalación

Checklist para verificar que todo funciona:

- [ ] El widget aparece en la esquina configurada
- [ ] El botón se puede clickear y abre el chat
- [ ] Se pueden enviar y recibir mensajes
- [ ] Los tipos TypeScript están funcionando (no hay errores)
- [ ] El tema personalizado se aplica correctamente
- [ ] Los callbacks (onNavigate, onLogin, etc.) se ejecutan
- [ ] En React: el hook `useChatWidget()` funciona
- [ ] En CDN: el objeto `window.PaseoLibreChat` está disponible

---

## 🆘 Troubleshooting

### Error: "PaseoLibreChat is not defined"
- Verifica que el script CDN se cargue antes de llamar a `init()`
- Asegúrate de que la URL del CDN es correcta

### Error: "useChatWidget must be used within a ChatWidgetProvider"
- Envuelve tu app con `<ChatWidgetProvider>`
- Verifica que estés usando el hook dentro del provider

### El widget no aparece
- Verifica que `apiKey` y `apiBaseUrl` sean correctos
- Revisa la consola del navegador para errores
- Asegúrate de que no haya conflictos de z-index CSS

### TypeScript: tipos no reconocidos
- Ejecuta `npm install` para instalar tipos
- Verifica que `tsconfig.json` incluya `"moduleResolution": "node"`
- Importa los tipos: `import type { ChatWidgetProps } from '@paseolibre/chat-widget-standalone'`

---

## 📚 Recursos Adicionales

- [Documentación Completa](README.md)
- [Changelog](CHANGELOG.md)
- [Ejemplos](./examples/)
- [Migración](MIGRATION_GUIDE.md)

---

## 📄 Licencia

MIT © Paseo Libre
