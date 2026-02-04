# BotUyo Chat Widget - Guía de Personalización

## 📦 Instalación

### NPM (ESM)
```bash
npm install @botuyo/chat-widget-standalone@1.0.4
```

```tsx
import BotUyoChat from '@botuyo/chat-widget-standalone'

BotUyoChat.init({
  apiKey: 'tu-api-key',
  apiBaseUrl: 'https://api.botuyo.com',
  theme: {...}
})
```

### CDN (UMD)
```html
<!-- CSS OBLIGATORIO -->
<link rel="stylesheet" href="https://cdn-chatbot.botuyo.com/latest/botuyo-chat.css">

<!-- JavaScript -->
<script src="https://cdn-chatbot.botuyo.com/latest/botuyo-chat.js"></script>
<script>
  BotUyoChat.init({
    apiKey: 'tu-api-key',
    apiBaseUrl: 'https://api.botuyo.com',
    theme: {...}
  });
</script>
```

---

## 🎨 Propiedades del Tema

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `primaryColor` | string | `'#10b981'` | Color principal |
| `botName` | string | `'Asistente Virtual'` | Nombre del bot |
| `logoUrl` | string | - | URL del avatar |
| `position` | `'bottom-right'` \| `'bottom-left'` | `'bottom-right'` | Posición |
| `welcomeMessage` | string | - | Mensaje de bienvenida |
| `inputPlaceholder` | string | `'Escribe tu mensaje...'` | Placeholder input |
| `borderRadius` | string | `'1.5rem'` | Border radius ventana |
| `height` | string | `'600px'` | Altura del chat |
| `bottom` | string | `'24px'` | Distancia desde abajo |

---

## 🎬 AnimationConfig

```javascript
animations: {
  enabled: true,           // Toggle maestro
  messageEntry: 'spring',  // 'slide' | 'fade' | 'scale' | 'spring' | 'none'
  typingIndicator: 'wave', // 'dots' | 'wave' | 'pulse' | 'none'
  buttonEffects: true,     // Efectos en botones
  smoothScroll: true,      // Scroll suave
  speedMultiplier: 1,      // Velocidad (0.5=rápido, 2=lento)
  staggerDelay: 50,        // Delay entre mensajes (ms)
  windowTransitions: true, // Animación apertura/cierre
  launcherPulse: true,     // Pulso del launcher
}
```

---

## ✨ EffectsConfig

```javascript
effects: {
  glassmorphism: true,   // Blur en headers
  gradients: true,       // Fondos degradados
  softShadows: true,     // Sombras suaves
  glowEffects: true,     // Glow en focus/hover
  particles: false,      // Partículas (performance)
  soundEffects: false,   // Sonidos UI
  hapticFeedback: true,  // Vibración móvil
  shimmerLoading: true,  // Shimmer en carga
  hoverLift: true,       // Elevación en hover
}
```

---

## 📹 MediaConfig

```javascript
mediaConfig: {
  enableVoice: true,       // Notas de voz
  enableAttachments: true, // Adjuntos (imágenes, PDFs)
  enableLocation: true,    // Compartir ubicación
}
```

---

## 📞 Llamada de Voz

El widget incluye un demo de llamada de voz que:
- Accede al micrófono real
- Muestra waveform animado
- Simula respuestas del bot

```javascript
BotUyoChat.init({
  apiKey: 'tu-api-key',
  apiBaseUrl: 'https://api.botuyo.com',
  onVoiceCall: () => {
    console.log('Demo de voz iniciado');
  }
});
```

---

## 🛠️ Theme Builder

Usa el builder visual para personalizar:

```
/builder.html
```

Características:
- Vista previa en tiempo real
- Presets: Default, Dark, Ocean, Sunset, Forest
- Copiar código listo para usar

---

## 📝 Ejemplo Completo

```javascript
BotUyoChat.init({
  apiKey: 'demo-key',
  apiBaseUrl: 'https://api.botuyo.com',
  
  theme: {
    primaryColor: '#6366f1',
    botName: 'Asistente Virtual',
    logoUrl: 'https://ejemplo.com/logo.png',
    position: 'bottom-right',
    welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?',
    borderRadius: '1.5rem',
    height: '550px',
    
    animations: {
      enabled: true,
      messageEntry: 'spring',
      launcherPulse: true,
      windowTransitions: true,
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
});
```

---

## 🔧 API Programática

```javascript
BotUyoChat.open()       // Abrir
BotUyoChat.close()      // Cerrar
BotUyoChat.toggle()     // Toggle
BotUyoChat.destroy()    // Destruir
BotUyoChat.update({...}) // Actualizar config
```

---

## 🌐 CDN URLs

| Recurso | URL |
|---------|-----|
| CSS | `https://cdn-chatbot.botuyo.com/latest/botuyo-chat.css` |
| JS | `https://cdn-chatbot.botuyo.com/latest/botuyo-chat.js` |
| NPM | `@botuyo/chat-widget-standalone@1.0.4` |
