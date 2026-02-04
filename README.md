# BotUyo Chat Widget

Widget de chat AI embebible enterprise-ready. Disponible via **NPM** y **CDN** para cualquier sitio web.

[![npm version](https://badge.fury.io/js/%40botuyo%2Fchat-widget-standalone.svg)](https://www.npmjs.com/package/@botuyo/chat-widget-standalone)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Instalación Rápida

### Opción 1: CDN (JavaScript Vanilla)

Agrega este código antes del cierre de `</body>`:

```html
<!-- BotUyo Chat Widget -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@botuyo/chat-widget-standalone@1.0.0/dist/botuyo-chat.js"></script>
<script type="module">
  BotUyoChat.init({
    apiKey: 'tu-api-key-aqui',
    apiBaseUrl: 'https://api.botuyo.com',
    theme: {
      primaryColor: '#10b981',
      botName: 'Asistente BotUyo',
      position: 'bottom-right'
    }
  });
</script>
```

**CDN Alternativo (unpkg):**
```html
<script type="module" src="https://unpkg.com/@botuyo/chat-widget-standalone@1.0.0/dist/botuyo-chat.js"></script>
```

### Opción 2: NPM Package (React/Next.js)

```bash
npm install @botuyo/chat-widget-standalone
```

**Uso directo:**
```tsx
import BotUyoChat from '@botuyo/chat-widget-standalone';

// En tu componente o useEffect
BotUyoChat.init({
  apiKey: 'tu-api-key-aqui',
  apiBaseUrl: 'https://api.botuyo.com',
  theme: {
    primaryColor: '#10b981',
    botName: 'Asistente Virtual'
  }
});
```

---

## ⚙️ Configuración Completa

```typescript
interface StandaloneConfig {
  // ═══════════════════════════════════════════
  // REQUERIDO
  // ═══════════════════════════════════════════
  apiKey: string;              // Tu API key de BotUyo
  apiBaseUrl: string;          // URL del backend (ej: https://api.botuyo.com)

  // ═══════════════════════════════════════════
  // TEMA (opcional)
  // ═══════════════════════════════════════════
  theme?: {
    primaryColor?: string;         // Color principal (default: '#10b981')
    botName?: string;              // Nombre del bot (default: 'Asistente Virtual')
    logoUrl?: string;              // URL del avatar del bot
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    welcomeMessage?: string;       // Mensaje de bienvenida inicial
    inputPlaceholder?: string;     // Placeholder del input (default: 'Escribe tu mensaje...')
    borderRadius?: string;         // Border radius ventana (default: '0.75rem')
    launcherBorderRadius?: string; // Border radius botón (default: '50%')
    starterPrompt?: string;        // Prompt inicial sugerido
    avatarScale?: number;          // Escala del avatar (default: 1)
    
    // Variables CSS para control total del tema
    cssVariables?: {
      background?: string;         // HSL sin paréntesis: '0 0% 100%'
      foreground?: string;         // Color del texto
      card?: string;               // Fondo de cards
      cardForeground?: string;     // Texto en cards
      primary?: string;            // Color primario
      primaryForeground?: string;  // Texto sobre primario
      muted?: string;              // Color muted
      mutedForeground?: string;    // Texto muted
      border?: string;             // Color de bordes
      destructive?: string;        // Color de errores
      radius?: string;             // Border radius global
    };
    
    // Estilos de burbujas
    bubbleStyles?: {
      radius?: {
        bubble?: string;
        image?: string;
        button?: string;
        card?: string;
      };
      bot?: {
        bg?: string;
        text?: string;
        border?: string;
      };
      user?: {
        text?: string;
      };
      launcher?: {
        bg?: string;
        pulse?: boolean;
      };
    };
  };

  // ═══════════════════════════════════════════
  // CONTEXTO DEL USUARIO (opcional)
  // ═══════════════════════════════════════════
  userContext?: {
    token?: string;            // Token de autenticación del usuario
    metadata?: {               // Metadata adicional del usuario
      userId?: string;
      email?: string;
      name?: string;
      [key: string]: any;
    };
  };

  // ═══════════════════════════════════════════
  // CONTEXTO DE LA PÁGINA (opcional)
  // ═══════════════════════════════════════════
  pageContext?: {
    page?: string;             // Identificador de la página
    id?: string | number;      // ID del recurso actual
    url?: string;              // URL actual
    title?: string;            // Título de la página
    path?: string;             // Path de la URL
    referrer?: string;         // Página de origen
    [key: string]: any;        // Metadata adicional
  };

  // ═══════════════════════════════════════════
  // SEO (opcional)
  // ═══════════════════════════════════════════
  includeSEOMetadata?: boolean; // Incluir metadata SEO (default: false)

  // ═══════════════════════════════════════════
  // CALLBACKS (opcional)
  // ═══════════════════════════════════════════
  onNavigate?: (url: string) => void;        // Cuando el bot sugiere navegar
  onLogin?: (userData: any) => void;         // Cuando el usuario se autentica
  onEvent?: (eventName: string, data: any) => void; // Eventos personalizados
  onStateChange?: (isOpen: boolean) => void; // Cuando el chat se abre/cierra
}
```

---

## 📚 Ejemplos

### Ejemplo Básico

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mi Sitio Web</title>
</head>
<body>
  <h1>Bienvenido</h1>
  
  <script type="module" src="https://cdn.jsdelivr.net/npm/@botuyo/chat-widget-standalone@1.0.0/dist/botuyo-chat.js"></script>
  <script type="module">
    BotUyoChat.init({
      apiKey: 'demo-key-12345',
      apiBaseUrl: 'https://api.botuyo.com'
    });
  </script>
</body>
</html>
```

### Ejemplo con Personalización Completa

```html
<script type="module">
  BotUyoChat.init({
    apiKey: 'mi-api-key',
    apiBaseUrl: 'https://api.botuyo.com',
    
    theme: {
      primaryColor: '#6366f1',
      botName: 'Asistente de Mi Empresa',
      logoUrl: 'https://mi-sitio.com/logo.png',
      position: 'bottom-left',
      welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte hoy?',
      inputPlaceholder: 'Pregúntame lo que quieras...',
      cssVariables: {
        background: '0 0% 100%',
        foreground: '240 10% 3.9%',
        primary: '239 84% 67%',
        card: '0 0% 100%',
        border: '240 6% 90%'
      }
    },

    userContext: {
      token: 'user-auth-token-jwt',
      metadata: {
        userId: '12345',
        email: 'usuario@ejemplo.com',
        plan: 'premium'
      }
    },

    pageContext: {
      page: 'producto',
      id: 'SKU-12345',
      url: window.location.href,
      title: document.title
    },

    onNavigate: (url) => {
      console.log('Navegando a:', url);
      window.location.href = url;
    },

    onEvent: (eventName, data) => {
      console.log('Evento:', eventName, data);
      
      if (eventName === 'lead_captured') {
        // Enviar a tu CRM
        sendToCRM(data);
      }
    },

    onStateChange: (isOpen) => {
      console.log('Chat:', isOpen ? 'abierto' : 'cerrado');
      // Analytics
      gtag('event', isOpen ? 'chat_opened' : 'chat_closed');
    }
  });
</script>
```

### Control Programático

```javascript
// Inicializar
BotUyoChat.init({
  apiKey: 'mi-api-key',
  apiBaseUrl: 'https://api.botuyo.com'
});

// Abrir el chat
document.getElementById('btn-ayuda').onclick = () => {
  BotUyoChat.open();
};

// Cerrar el chat
BotUyoChat.close();

// Enviar mensaje programáticamente
BotUyoChat.sendMessage('Necesito ayuda con mi pedido #12345');

// Actualizar configuración en tiempo real
BotUyoChat.update({
  theme: {
    primaryColor: '#ef4444',
    botName: 'Soporte Urgente'
  }
});

// Destruir el widget
BotUyoChat.destroy();
```

---

## 🛠️ API Pública

| Método | Descripción |
|--------|-------------|
| `BotUyoChat.init(config)` | Inicializa el widget. Retorna la instancia. |
| `BotUyoChat.open()` | Abre la ventana del chat |
| `BotUyoChat.close()` | Cierra la ventana del chat |
| `BotUyoChat.sendMessage(message)` | Envía un mensaje programáticamente |
| `BotUyoChat.update(config)` | Actualiza la configuración sin reiniciar |
| `BotUyoChat.destroy()` | Destruye el widget y limpia recursos |

---

## 🎨 Temas Predefinidos

### Tema Claro (Default)
```javascript
cssVariables: {
  background: '0 0% 100%',
  foreground: '240 10% 3.9%',
  primary: '160 84% 39%',
  card: '0 0% 100%',
  border: '240 6% 90%'
}
```

### Tema Oscuro
```javascript
cssVariables: {
  background: '240 10% 3.9%',
  foreground: '0 0% 98%',
  primary: '160 84% 39%',
  card: '240 4% 16%',
  border: '240 4% 20%'
}
```

### Tema Ocean
```javascript
theme: {
  primaryColor: '#0ea5e9',
  cssVariables: {
    background: '200 50% 98%',
    foreground: '200 50% 10%',
    primary: '199 89% 48%'
  }
}
```

---

## 🌐 Compatibilidad

| Navegador | Versión Mínima |
|-----------|----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |
| iOS Safari | 14+ |
| Chrome Mobile | 90+ |

---

## 📦 Build Local

```bash
# Clonar repositorio
git clone https://github.com/botuyo/chat-widget.git
cd chat-widget

# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Tests
npm test
```

**Archivos generados:**
- `dist/botuyo-chat.js` - Bundle principal (~3KB, carga chunks lazy)
- `dist/botuyo-chat.css` - Estilos (~25KB)
- `dist/vendor-react-*.js` - React (~194KB, lazy)
- `dist/chunk-chat-ui-*.js` - UI del chat (~89KB, lazy)

---

## 📄 Licencia

MIT License - © 2026 BotUyo

---

## 🔗 Links

- **NPM**: [npmjs.com/package/@botuyo/chat-widget-standalone](https://www.npmjs.com/package/@botuyo/chat-widget-standalone)
- **CDN jsDelivr**: `https://cdn.jsdelivr.net/npm/@botuyo/chat-widget-standalone@1.0.0/dist/botuyo-chat.js`
- **CDN unpkg**: `https://unpkg.com/@botuyo/chat-widget-standalone@1.0.0/dist/botuyo-chat.js`
- **Documentación**: [docs.botuyo.com](https://docs.botuyo.com)
- **Soporte**: soporte@botuyo.com
