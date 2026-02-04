# BotUyo Chat Widget

Widget de chat AI embebible enterprise-ready. Disponible via **NPM** y **CDN** para cualquier sitio web.

[![npm version](https://badge.fury.io/js/%40botuyo%2Fchat-widget-standalone.svg)](https://www.npmjs.com/package/@botuyo/chat-widget-standalone)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

---

## 🚀 Instalación Rápida

### Opción 1: CDN (JavaScript Vanilla)

```html
<!-- CSS (REQUERIDO) -->
<link rel="stylesheet" href="https://cdn-chatbot.botuyo.com/latest/botuyo-chat.css">

<!-- JavaScript -->
<script src="https://cdn-chatbot.botuyo.com/latest/botuyo-chat.js"></script>
<script>
  BotUyoChat.init({
    apiKey: 'tu-api-key',
    apiBaseUrl: 'https://api.botuyo.com',
    theme: {
      primaryColor: '#10b981',
      botName: 'Asistente BotUyo',
      position: 'bottom-right'
    }
  });
</script>
```

**CDN Alternativo (jsDelivr/unpkg):**
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@botuyo/chat-widget-standalone@1.0.4/dist/botuyo-chat.umd.css">
<script src="https://cdn.jsdelivr.net/npm/@botuyo/chat-widget-standalone@1.0.4/dist/botuyo-chat.umd.js"></script>
```

### Opción 2: NPM Package (React/Next.js)

```bash
npm install @botuyo/chat-widget-standalone@1.0.4
```

```tsx
import BotUyoChat from '@botuyo/chat-widget-standalone';

// En useEffect o al cargar
BotUyoChat.init({
  apiKey: 'tu-api-key',
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
  apiBaseUrl: string;          // URL del backend WebSocket

  // ═══════════════════════════════════════════
  // TEMA (opcional)
  // ═══════════════════════════════════════════
  theme?: {
    primaryColor?: string;         // Color principal (default: '#10b981')
    botName?: string;              // Nombre del bot (default: 'Asistente Virtual')
    logoUrl?: string;              // URL del avatar del bot
    position?: 'bottom-right' | 'bottom-left';
    welcomeMessage?: string;       // Mensaje de bienvenida inicial
    inputPlaceholder?: string;     // Placeholder del input
    borderRadius?: string;         // Border radius ventana (default: '1.5rem')
    height?: string;               // Altura del chat (default: '600px')
    bottom?: string;               // Distancia desde abajo (default: '24px')
    
    // Animaciones
    animations?: {
      enabled?: boolean;           // Toggle maestro (default: true)
      messageEntry?: 'spring' | 'slide' | 'fade' | 'scale' | 'none';
      typingIndicator?: 'wave' | 'dots' | 'pulse' | 'none';
      launcherPulse?: boolean;     // Pulso del botón launcher
      windowTransitions?: boolean; // Animación apertura/cierre
    };
    
    // Efectos visuales
    effects?: {
      glassmorphism?: boolean;     // Blur en headers
      gradients?: boolean;         // Fondos degradados
      softShadows?: boolean;       // Sombras suaves
      glowEffects?: boolean;       // Glow en focus/hover
      shimmerLoading?: boolean;    // Shimmer en carga
      hoverLift?: boolean;         // Elevación en hover
    };
  };

  // ═══════════════════════════════════════════
  // MEDIA CONFIG (opcional)
  // ═══════════════════════════════════════════
  mediaConfig?: {
    enableVoice?: boolean;         // Habilitar notas de voz (default: true)
    enableAttachments?: boolean;   // Habilitar adjuntos (default: true)
    enableLocation?: boolean;      // Habilitar ubicación (default: true)
  };

  // ═══════════════════════════════════════════
  // CALLBACKS (opcional)
  // ═══════════════════════════════════════════
  onVoiceCall?: () => void;        // Cuando se presiona el botón de llamada
  onNavigate?: (url: string) => void;
  onStateChange?: (isOpen: boolean) => void;
  onEvent?: (eventName: string, data: any) => void;
}
```

---

## 📞 Llamada de Voz (Demo)

El widget incluye un **demo interactivo de llamada de voz** que:
- Accede al micrófono real del usuario
- Muestra waveform animado según el nivel de audio
- Simula respuestas del bot después de 1 segundo de silencio

```javascript
BotUyoChat.init({
  apiKey: 'tu-api-key',
  apiBaseUrl: 'https://api.botuyo.com',
  onVoiceCall: () => {
    console.log('Llamada de voz iniciada');
    // El demo se abre automáticamente dentro del widget
  }
});
```

> **Nota:** Este es un demo visual. Para integrar llamadas de voz reales, conecta con tu servicio de voz preferido (OpenAI Realtime, LiveKit, Twilio, etc.)

---

## 🎨 Theme Builder

Usa el **Theme Builder** para personalizar visualmente el widget:

```
https://tu-dominio.com/builder.html
```

El builder permite:
- Cambiar colores en tiempo real
- Presets: Default, Dark, Ocean, Sunset, Forest
- Copiar código de integración listo para usar

---

## 🛠️ API Pública

```javascript
// Inicializar
BotUyoChat.init(config);

// Controles
BotUyoChat.open();              // Abrir chat
BotUyoChat.close();             // Cerrar chat
BotUyoChat.toggle();            // Toggle abierto/cerrado
BotUyoChat.destroy();           // Destruir widget

// Actualizar configuración en vivo
BotUyoChat.update({
  theme: { primaryColor: '#ef4444' }
});
```

---

## 📚 Ejemplos

### Ejemplo Mínimo
```html
<link rel="stylesheet" href="https://cdn-chatbot.botuyo.com/latest/botuyo-chat.css">
<script src="https://cdn-chatbot.botuyo.com/latest/botuyo-chat.js"></script>
<script>
  BotUyoChat.init({
    apiKey: 'demo-key',
    apiBaseUrl: 'https://api.botuyo.com'
  });
</script>
```

### Ejemplo Completo
```html
<script>
  BotUyoChat.init({
    apiKey: 'mi-api-key',
    apiBaseUrl: 'https://api.botuyo.com',
    
    theme: {
      primaryColor: '#6366f1',
      botName: 'Asistente Mi Empresa',
      logoUrl: 'https://mi-sitio.com/logo.png',
      position: 'bottom-right',
      welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?',
      borderRadius: '1.5rem',
      height: '550px',
      
      animations: {
        enabled: true,
        messageEntry: 'spring',
        launcherPulse: true,
      },
      
      effects: {
        glassmorphism: true,
        softShadows: true,
        glowEffects: true,
      },
    },

    mediaConfig: {
      enableVoice: true,
      enableAttachments: true,
      enableLocation: false,
    },

    onStateChange: (isOpen) => {
      console.log('Chat:', isOpen ? 'abierto' : 'cerrado');
    },

    onVoiceCall: () => {
      console.log('Llamada de voz iniciada');
    },
  });
</script>
```

---

## 🎭 Temas Predefinidos

### Tema Claro (Default)
```javascript
theme: {
  primaryColor: '#10b981'
}
```

### Tema Oscuro
```javascript
theme: {
  primaryColor: '#8b5cf6',
  cssVariables: {
    background: '240 10% 3.9%',
    foreground: '0 0% 98%',
    card: '240 4% 16%',
    border: '240 4% 20%'
  }
}
```

### Tema Ocean
```javascript
theme: {
  primaryColor: '#0ea5e9'
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
git clone https://github.com/botuyo/chat-widget.git
cd chat-widget

npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Solo UMD bundle
npm run build:umd

# Tests
npm test
```

---

## 🔗 Links

- **NPM**: [npmjs.com/package/@botuyo/chat-widget-standalone](https://www.npmjs.com/package/@botuyo/chat-widget-standalone)
- **CDN BotUyo**: `https://cdn-chatbot.botuyo.com/latest/`
- **CDN jsDelivr**: `https://cdn.jsdelivr.net/npm/@botuyo/chat-widget-standalone@1.0.4/dist/`
- **Documentación**: [docs.botuyo.com](https://docs.botuyo.com)

---

## 📄 Licencia

MIT License - © 2026 BotUyo
