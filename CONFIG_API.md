# 🔧 BotUyo Chat Widget - API de Configuración

## 📋 Configuración Principal

Con solo proporcionar el `apiKey`, el bot se instanciará automáticamente con la configuración que tenga en el backend.

```typescript
window.BotUyoChat.init({
  apiKey: 'tu-api-key-aqui',
  apiBaseUrl: 'https://api.botuyo.com'
});
```

---

## 🎯 Interface Completa: `ChatWidgetProps`

```typescript
interface ChatWidgetProps {
  // ========== 🔑 CONFIGURACIÓN TÉCNICA (REQUERIDA) ==========
  
  /** Public API Key del tenant/cliente - REQUERIDO */
  apiKey: string;

  /** URL base del backend (Gateway) - REQUERIDO */
  apiBaseUrl: string;

  // ========== 🌐 CONTEXTO VIVO (REACTIVO) ==========
  
  /**
   * Contexto de la página actual que se inyecta en cada mensaje
   * ⚠️ IMPORTANTE: Usa useRef internamente para evitar reconexiones del socket
   * Ejemplo: { page: 'Room', id: 123, price: 100, url: '/habitaciones/123' }
   */
  pageContext?: PageContext;

  /**
   * Incluir metadata SEO automáticamente en el contexto
   * Si es true, captura: title, description, keywords, og:*, twitter:*, structured data
   * Default: false
   */
  includeSEOMetadata?: boolean;

  // ========== 🎨 CONFIGURACIÓN VISUAL (WHITE-LABELING) ==========
  
  /** 
   * Tema visual completo del widget
   * Puede venir configurado desde el backend o sobrescribirse localmente
   */
  theme?: ChatTheme;

  // ========== 🎬 CONFIGURACIÓN DE FUNCIONALIDADES ==========
  
  /** Configuración de funcionalidades multimedia (imágenes, audio, archivos, ubicación) */
  mediaConfig?: MediaConfig;

  // ========== 👤 IDENTIDAD DEL USUARIO (OPCIONAL) ==========
  
  /** Context del usuario si ya está autenticado en la app host */
  userContext?: UserContext;

  // ========== 🔔 CALLBACKS / BRIDGE HACIA APP PADRE ==========
  
  /** Se ejecuta cuando el bot completa un login/autenticación */
  onLogin?: (userData: AuthenticatedUser) => void;

  /** El bot solicita navegación a una ruta específica */
  onNavigate?: (url: string) => void;

  /** Eventos genéricos del widget */
  onEvent?: (eventName: string, data: any) => void;

  /** Callback cuando el widget cambia de estado (abierto/cerrado) */
  onStateChange?: (isOpen: boolean) => void;
}
```

---

## 🎨 Interface de Tema: `ChatTheme`

El tema puede venir **configurado desde el backend** en el evento `connection_ack` o `auth_success`.

```typescript
interface ChatTheme {
  // ========== 🎨 COLORES Y BRANDING ==========
  
  /** Color primario (botón, burbujas del usuario) - Ej: "#10b981" */
  primaryColor?: string;

  /** Nombre del bot que aparece en el header - Ej: "Asistente Virtual" */
  botName?: string;

  /** URL del avatar/logo del bot - Ej: "https://cdn.botuyo.com/avatars/bot1.png" */
  logoUrl?: string;

  /** Mapa de avatares por emoción del bot */
  avatars?: EmotionAvatarMap;

  /** Zoom del avatar (ej: 1.2 para 20% más grande) */
  avatarScale?: number;

  // ========== 📍 POSICIÓN Y DIMENSIONES ==========
  
  /** Posición del launcher - Default: 'bottom-right' */
  position?: 'bottom-right' | 'bottom-left';

  /** Altura del chat window en desktop (CSS value, ej: '600px', '80vh') */
  height?: string;

  /** Distancia desde el bottom en desktop (CSS value, ej: '24px', '1.5rem') */
  bottom?: string;

  // ========== 💬 TEXTOS Y MENSAJES ==========
  
  /** Mensaje de bienvenida personalizado - Ej: "¡Hola! 👋 ¿En qué puedo ayudarte?" */
  welcomeMessage?: string;

  /** Placeholder del input - Ej: "Escribe tu mensaje..." */
  inputPlaceholder?: string;

  /** Texto en el globo flotante cuando el chat está cerrado - Ej: "¿Necesitas ayuda? 💬" */
  starterPrompt?: string;

  /** Estrategia del globo flotante - Default: 'show-once' */
  promptPersistence?: 'show-once' | 'show-always' | 'never';

  // ========== 🎭 ESTILOS Y BORDES ==========
  
  /** Border radius del chat window (CSS value, ej: '24px', '1.5rem') */
  borderRadius?: string;

  /** Border radius del launcher button (CSS value, ej: '50%', '24px') */
  launcherBorderRadius?: string;

  /** Estilos personalizados de burbujas, launcher, etc. */
  bubbleStyles?: BubbleStyles;

  // ========== 🎨 DESIGN SYSTEM - CSS VARIABLES ==========
  
  /** 
   * Variables CSS personalizadas para design system completo
   * Todas en formato HSL sin "hsl()" wrapper
   */
  cssVariables?: {
    // Colores base
    background?: string;          // Ej: "0 0% 100%"
    foreground?: string;          // Ej: "240 10% 3.9%"
    card?: string;                // Ej: "0 0% 100%"
    cardForeground?: string;      // Ej: "240 10% 3.9%"
    primary?: string;             // Ej: "160 84% 39%"
    primaryForeground?: string;   // Ej: "0 0% 100%"
    muted?: string;               // Ej: "240 4.8% 95.9%"
    mutedForeground?: string;     // Ej: "240 3.8% 46.1%"
    border?: string;              // Ej: "240 5.9% 90%"
    destructive?: string;         // Ej: "0 84.2% 60.2%"
    
    // Geometría
    radius?: string;              // Ej: "0.5rem"
    
    // Espaciado
    spacing1?: string;            // Extra small - Ej: "0.25rem"
    spacing2?: string;            // Small - Ej: "0.5rem"
    spacing3?: string;            // Medium small - Ej: "0.75rem"
    spacing4?: string;            // Medium - Ej: "1rem"
    spacing5?: string;            // Default padding - Ej: "0.75rem"
    spacing6?: string;            // Large - Ej: "1.5rem"
    spacing8?: string;            // Extra large - Ej: "2rem"
  };
}
```

---

## 🎭 Interface de Estilos: `BubbleStyles`

```typescript
interface BubbleStyles {
  radius?: {
    bubble?: string;   // Ej: "rounded-2xl", "rounded-none"
    image?: string;    // Ej: "rounded-lg"
    button?: string;   // Ej: "rounded-full"
    card?: string;     // Ej: "rounded-xl"
  };
  
  bot?: {
    bg?: string;       // Ej: "bg-gray-100", "bg-blue-50"
    text?: string;     // Ej: "text-gray-800"
    border?: string;   // Ej: "border-gray-200"
  };
  
  user?: {
    text?: string;     // Ej: "text-white"
  };
  
  mapCard?: {
    iconBg?: string;   // Ej: "bg-red-100"
    iconColor?: string; // Ej: "text-red-600"
  };
  
  launcher?: {
    bg?: string;       // Clase CSS para el fondo del botón flotante
    pulse?: boolean;   // Habilitar animación de pulso
  };
}
```

---

## 📱 Interface de Media: `MediaConfig`

```typescript
interface MediaConfig {
  /** Habilitar envío de imágenes (default: true) */
  enableImages?: boolean;
  
  /** Habilitar grabación y envío de audio (default: true) */
  enableAudio?: boolean;
  
  /** Habilitar envío de archivos (default: true) */
  enableFiles?: boolean;
  
  /** Habilitar compartir ubicación (default: true) */
  enableLocation?: boolean;
  
  /** Tipos de archivos permitidos (default: todos) */
  allowedFileTypes?: string[];
  
  /** Tamaño máximo de archivo en MB (default: 10) */
  maxFileSizeMB?: number;
}
```

---

## 🌐 Interface de Contexto: `PageContext`

```typescript
interface PageContext {
  page?: string;           // Ej: "Room", "Product", "Checkout"
  id?: string | number;    // Ej: 123, "abc-def-ghi"
  url?: string;            // Ej: "/habitaciones/123"
  title?: string;          // Ej: "Habitación Deluxe"
  [key: string]: any;      // Cualquier campo custom
}
```

**Ejemplo:**
```typescript
BotUyoChat.init({
  apiKey: 'xxx',
  apiBaseUrl: 'https://api.botuyo.com',
  pageContext: {
    page: 'Room',
    id: 123,
    name: 'Habitación Deluxe',
    price: 150,
    available: true,
    category: 'premium'
  }
});
```

---

## 👤 Interface de Usuario: `UserContext`

```typescript
interface UserContext {
  /** JWT token para autenticar al usuario real */
  token?: string;

  /** Metadata adicional del usuario */
  metadata?: Record<string, any>;
}
```

**Ejemplo:**
```typescript
BotUyoChat.init({
  apiKey: 'xxx',
  apiBaseUrl: 'https://api.botuyo.com',
  userContext: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    metadata: {
      userId: 'user-123',
      email: 'user@example.com',
      plan: 'premium'
    }
  }
});
```

---

## 🔄 Configuración desde el Backend (Socket)

El backend puede enviar configuración automática en estos eventos:

### 1. **`connection_ack`** - Al conectar

```typescript
interface ConnectionAckPayload {
  sessionId: string;
  deviceId: string;
  
  /** Configuración que el backend puede sobrescribir */
  config?: {
    botName?: string;
    logoUrl?: string;
    primaryColor?: string;
    welcomeMessage?: string;
  };
  
  hasHistory?: boolean;
}
```

### 2. **`auth_success`** - Al autenticarse

```typescript
interface AuthSuccessPayload {
  token: string;
  user: {
    id: string;
    email?: string;
    name?: string;
    [key: string]: any;
  };
  message?: string;
  
  /** ✨ TEMA COMPLETO desde el servidor */
  theme?: ChatTheme;
}
```

---

## 🎯 Ejemplo Completo de Uso

```typescript
// Configuración MÍNIMA - El bot se configura automáticamente desde el backend
window.BotUyoChat.init({
  apiKey: 'tu-api-key',
  apiBaseUrl: 'https://api.botuyo.com'
});

// Configuración COMPLETA - Sobrescribiendo todo localmente
window.BotUyoChat.init({
  // Requerido
  apiKey: 'tu-api-key',
  apiBaseUrl: 'https://api.botuyo.com',
  
  // Contexto de página
  pageContext: {
    page: 'Room',
    id: 123,
    price: 150
  },
  includeSEOMetadata: true,
  
  // Usuario autenticado
  userContext: {
    token: 'jwt-token',
    metadata: {
      userId: 'user-123',
      plan: 'premium'
    }
  },
  
  // Tema personalizado
  theme: {
    primaryColor: '#10b981',
    botName: 'Asistente Virtual',
    logoUrl: 'https://cdn.botuyo.com/logo.png',
    position: 'bottom-right',
    welcomeMessage: '¡Hola! 👋 ¿En qué puedo ayudarte?',
    inputPlaceholder: 'Escribe tu mensaje...',
    starterPrompt: '¿Necesitas ayuda?',
    borderRadius: '1.5rem',
    launcherBorderRadius: '50%',
    height: '600px',
    bottom: '24px',
    
    // CSS Variables
    cssVariables: {
      primary: '160 84% 39%',
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      radius: '0.5rem',
      spacing5: '0.75rem'
    }
  },
  
  // Media
  mediaConfig: {
    enableImages: true,
    enableAudio: true,
    enableFiles: true,
    enableLocation: true,
    maxFileSizeMB: 10
  },
  
  // Callbacks
  onLogin: (userData) => {
    console.log('Usuario autenticado:', userData);
  },
  onNavigate: (url) => {
    window.location.href = url;
  },
  onStateChange: (isOpen) => {
    console.log('Chat', isOpen ? 'abierto' : 'cerrado');
  },
  onEvent: (eventName, data) => {
    console.log('Evento:', eventName, data);
  }
});
```

---

## 📊 Prioridad de Configuración

```
Backend Config (connection_ack) 
    ↓
Local Config (init params) 
    ↓
Server Theme Override (auth_success)
```

1. **Primera carga:** Usa config local de `init()`
2. **`connection_ack`:** Backend puede sobrescribir botName, logoUrl, primaryColor, welcomeMessage
3. **`auth_success`:** Backend puede enviar tema completo que sobrescribe todo

---

## ✅ Resumen

| Campo | Requerido | Configurable desde Backend | Tipo |
|-------|-----------|---------------------------|------|
| `apiKey` | ✅ Sí | ❌ No | `string` |
| `apiBaseUrl` | ✅ Sí | ❌ No | `string` |
| `theme.*` | ❌ No | ✅ Sí | `ChatTheme` |
| `pageContext` | ❌ No | ❌ No (solo cliente) | `PageContext` |
| `userContext` | ❌ No | ❌ No (solo cliente) | `UserContext` |
| `mediaConfig` | ❌ No | ⚠️ Parcial | `MediaConfig` |
| `callbacks` | ❌ No | ❌ No (solo cliente) | `Functions` |

**Con solo `apiKey` y `apiBaseUrl`, el bot se configura automáticamente desde el backend.** 🎉
