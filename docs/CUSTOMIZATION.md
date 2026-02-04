# BotUyo Chat Widget - Documentación Completa

## Instalación

### NPM (ESM)
```bash
npm install @botuyo/chat-widget
```

```tsx
import { BotUyoChat } from '@botuyo/chat-widget'
import '@botuyo/chat-widget/style.css'

<BotUyoChat apiKey="tu-api-key" theme={{...}} />
```

### CDN (UMD)
```html
<!-- CSS OBLIGATORIO -->
<link rel="stylesheet" href="https://cdn.botuyo.com/chat-widget/botuyo-chat.umd.css">

<!-- JavaScript -->
<script src="https://cdn.botuyo.com/chat-widget/botuyo-chat.umd.js"></script>
<script>
  BotUyoChat.init({
    apiKey: 'tu-api-key',
    theme: {...}
  });
</script>
```

---

## Configuración Completa

### Propiedades Principales

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `apiKey` | string | **requerido** | API key de autenticación |
| `apiBaseUrl` | string | production | URL del servidor WebSocket |
| `theme` | ChatTheme | DEFAULT_THEME | Configuración visual completa |
| `onStateChange` | function | - | Callback cuando el chat abre/cierra |

---

## ChatTheme - Personalización Visual

### Propiedades Básicas

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `primaryColor` | string | `hsl(160, 84%, 39%)` | Color principal |
| `botName` | string | `'Asistente'` | Nombre del bot en header |
| `logoUrl` | string | - | URL del avatar del bot |
| `position` | `'bottom-right'` \| `'bottom-left'` | `'bottom-right'` | Posición del widget |

### Propiedades de Layout

| Propiedad | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `height` | string | `'600px'` | Altura del chat (ej: `'500px'`, `'80vh'`) |
| `bottom` | string | `'24px'` | Distancia desde el fondo (ej: `'40px'`, `'2rem'`) |
| `borderRadius` | string | `'32px'` | Border radius del chat window |
| `avatarScale` | number | `1.0` | Escala del avatar (1.2 = 20% más grande) |

---

## 🎬 AnimationConfig

**Todas son toggleables individualmente.**

```tsx
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

```tsx
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

## Ejemplo Completo

```tsx
<BotUyoChat
  apiKey="demo-key"
  theme={{
    primaryColor: '#10B981',
    botName: 'Asistente Virtual',
    position: 'bottom-right',
    height: '550px',
    bottom: '24px',
    animations: {
      enabled: true,
      messageEntry: 'spring',
      launcherPulse: true,
    },
    effects: {
      glassmorphism: true,
      softShadows: true,
    },
  }}
/>
```

## API Programática (CDN)

```javascript
BotUyoChat.open()       // Abrir
BotUyoChat.close()      // Cerrar
BotUyoChat.toggle()     // Toggle
BotUyoChat.destroy()    // Destruir
```
