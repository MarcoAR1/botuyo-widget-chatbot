# BotUyo Chat Widget - Standalone/CDN Version

Widget de chat embebible enterprise-ready que puede ser usado en cualquier sitio web sin necesidad de React, Next.js u otros frameworks. También disponible como componente React con Provider y hooks.

## 🎉 Última Actualización (25 Enero 2026)

**Stack Modernizado + Optimización en Progreso**

### ✅ Completado
- 🚀 **React 19.2.3** - Última versión estable con concurrent features
- ⚡ **Vite 7.3.1** - Build tool más rápido y optimizado
- 📏 **ESLint 9.39.2** - Migrado a flat config (eslint.config.js)
- 🟢 **Node.js 22.22.0** - LTS actual
- 🔧 **TypeScript ESLint 8.53.1** - Mejores reglas de linting

### ✅ Code Splitting Completado (26 Ene 2026)
- ✅ **Code Splitting Implementado**: 7 chunks separados
- ✅ **33% Reducción**: Carga inicial de 306KB → 208KB gzip
- ✅ **ES Module Format**: Lazy loading real con chunks
- ✅ **React.lazy() + Suspense**: ChatWidget bajo demanda
- 📦 **Bundle**: 683KB inicial + 324KB lazy (total 1,007KB)

### 🔄 En Optimización (Semana 4)
- ⏳ **Lazy Loading Adicional**: Gallery y AudioPlayer
- 📋 **CSS Optimization**: cssnano compression
- 📋 **Preload Hints**: Recursos críticos

### 📊 Estado del Proyecto
- ✅ **Build**: Exitoso (Vite 7.3.1)
- ✅ **Tests**: 616/626 pasando (98.4%)
- 📦 **Bundle**: 1,021 kB JS (306 kB gzip), 45 kB CSS (8.7 kB gzip)
- ⏳ **Optimización**: Code splitting en implementación
- ✅ **Lint**: 0 errores, 9 warnings informativos
- ✅ **TypeScript**: Tipos generados correctamente

### 🔧 Cambios Técnicos Recientes
- Creado `vite.config.mjs` (JavaScript puro, evita transpilación)
- Migrado a `eslint.config.js` (flat config ESLint 9)
- Agregado `.nvmrc` para fijar Node 22
- Actualizado `tsconfig.json` con `esModuleInterop`
- Test fixes para React 19 concurrent rendering
- Instalado `rollup-plugin-visualizer` para análisis de bundle

📖 **[Ver roadmap completo en MEJORAS_PROPUESTAS.md](./MEJORAS_PROPUESTAS.md)**  
🎯 **[Ver plan de optimización en OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)**  
📊 **[Ver estado actual en STATUS.md](./STATUS.md)**

---

## 🎨 Theme Builder (Herramienta de Configuración)

**[Abre el Theme Builder](./theme-builder.html)** - Herramienta visual para crear y personalizar temas en tiempo real.

Características:
- 🎨 **5 Temas Predefinidos**: Default, Ocean, Sunset, Midnight, Nature
- 🖌️ **Editor Visual**: Personaliza colores, espaciado, dimensiones
- 👁️ **Preview en Vivo**: Ve los cambios en tiempo real
- 📋 **Copiar Config**: Exporta la configuración lista para usar
- 🎯 **Para Dashboard**: Herramienta oficial para generar configs de clientes

## 📚 Documentación
- **[🎯 Roadmap y Mejoras](./MEJORAS_PROPUESTAS.md)** - Estado actual y próximos pasos
- **[✅ Cobertura de Personalización](./CUSTOMIZATION_COVERAGE.md)** - ¡TODO lo que puedes personalizar!
- **[🎯 Guía Rápida de Temas](./QUICK_THEME_SETUP.md)** - ¡Empieza aquí si el widget se ve transparente!
- **[🎨 Guía Completa de Personalización](./THEME_GUIDE.md)** - Temas, colores y ejemplos avanzados
- **[📖 Documentación CSS Variables](./CSS_CUSTOMIZATION.md)** - Detalles técnicos del sistema de diseño

## 🚀 Instalación Rápida

### Opción 1: CDN (JavaScript Vanilla)

Agrega este código antes del cierre del `</body>` en tu HTML:

```html
<!-- BotUyo Chat Widget -->
<script src="https://cdn.botuyo.com/chat-widget.js"></script>
<script>
  BotUyoChat.init({
    apiKey: 'tu-api-key-aqui',
    apiBaseUrl: 'https://api.botuyo.com',
    theme: {
      primaryColor: 'hsl(160, 84%, 39%)',
      botName: 'Asistente BotUyo',
      position: 'bottom-right',
      // ⚠️ IMPORTANTE: Variables CSS necesarias
      cssVariables: {
        background: '0 0% 100%',           // Fondo blanco
        foreground: '240 10% 3.9%',        // Texto oscuro
        primary: '160 84% 39%',            // Color principal
        // ... Ver QUICK_THEME_SETUP.md para más opciones
      }
    }
  });
</script>
```

### Opción 2: NPM Package (React/Next.js)

**Instalación:**
```bash
npm install @botuyo/chat-widget-standalone
```

**Uso con Provider:**
```tsx
import { ChatWidgetProvider, useChatWidget } from '@botuyo/chat-widget-standalone';

function App() {
  return (
    <ChatWidgetProvider
      apiKey="tu-api-key-aqui"
      apiBaseUrl="https://api.botuyo.com"
      theme={{ 
        primaryColor: 'hsl(160, 84%, 39%)',
        // ⚠️ IMPORTANTE: Variables CSS necesarias
        cssVariables: {
          background: '0 0% 100%',
          foreground: '240 10% 3.9%',
          primary: '160 84% 39%',
          // ... Ver QUICK_THEME_SETUP.md para configuración completa
        }
      }}
    >
      <YourApp />
    </ChatWidgetProvider>
  );
}

// En cualquier componente:
function MyComponent() {
  const chat = useChatWidget();
  return <button onClick={chat.open}>Abrir Chat</button>;
}
```

**Uso directo:**
```tsx
import { ChatWidget } from '@botuyo/chat-widget-standalone';

function App() {
  return (
    <ChatWidget
      apiKey="tu-api-key-aqui"
      apiBaseUrl="https://api.botuyo.com"
      theme={{ 
        primaryColor: 'hsl(160, 84%, 39%)',
        cssVariables: {
          background: '0 0% 100%',
          foreground: '240 10% 3.9%',
          primary: '160 84% 39%',
        }
      }}
    />
  );
}
```

## ⚙️ Configuración

### Opciones Disponibles

```typescript
interface StandaloneConfig {
  // Requerido
  apiKey: string;              // Tu API key de BotUyo
  apiBaseUrl: string;          // URL del backend Socket.IO

  // Tema (opcional)
  theme?: {
    primaryColor?: string;     // Color principal (default: '#10b981')
    botName?: string;          // Nombre del bot (default: 'Asistente Virtual')
    logoUrl?: string;          // URL del logo (default: '/avatar/mar_default.webp')
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    welcomeMessage?: string;   // Mensaje de bienvenida
    inputPlaceholder?: string; // Placeholder del input
    borderRadius?: string;     // Border radius (default: '0.75rem')
    launcherBorderRadius?: string; // Border radius del botón (default: '50%')
  };

  // Contexto del usuario (opcional)
  userContext?: {
    token?: string;            // Token de autenticación
    metadata?: any;            // Metadata adicional
  };

  // Contexto de la página (opcional)
  pageContext?: {
    url?: string;
    title?: string;
    path?: string;
    referrer?: string;
  };

  // SEO (opcional)
  includeSEOMetadata?: boolean; // Incluir metadata SEO (default: false)

  // Callbacks (opcional)
  onNavigate?: (url: string) => void;
  onLogin?: (loginUrl: string) => void;
  onEvent?: (eventName: string, data: any) => void;
  onStateChange?: (isOpen: boolean) => void;
}
```

## 📚 Ejemplos de Uso

### Ejemplo Básico

```html
<!DOCTYPE html>
<html>
<head>
  <title>Mi Sitio Web</title>
</head>
<body>
  <h1>Bienvenido a mi sitio</h1>
  
  <script src="https://cdn.botuyo.com/chat-widget.js"></script>
  <script>
    BotUyoChat.init({
      apiKey: 'demo-key-12345',
      apiBaseUrl: 'http://localhost:4000'
    });
  </script>
</body>
</html>
```

### Ejemplo con Personalización Completa

```html
<script>
  BotUyoChat.init({
    apiKey: 'mi-api-key',
    apiBaseUrl: 'https://api.botuyo.com',
    
    theme: {
      primaryColor: '#ff6b6b',
      botName: 'Asistente Virtual de Mi Empresa',
      logoUrl: 'https://mi-sitio.com/logo.png',
      position: 'bottom-left',
      welcomeMessage: '¡Hola! ¿Necesitas ayuda?',
      inputPlaceholder: 'Pregúntame lo que quieras...',
    },

    userContext: {
      token: 'user-auth-token',
      metadata: {
        userId: '12345',
        email: 'user@example.com'
      }
    },

    pageContext: {
      url: window.location.href,
      title: document.title,
      path: window.location.pathname,
      referrer: document.referrer
    },

    onNavigate: (url) => {
      console.log('Navegando a:', url);
      window.location.href = url;
    },

    onEvent: (eventName, data) => {
      console.log('Evento recibido:', eventName, data);
      
      // Manejo de eventos personalizados
      if (eventName === 'reservation_created') {
        alert('¡Reserva creada! ID: ' + data.reservationId);
      }
    },

    onStateChange: (isOpen) => {
      console.log('Chat está', isOpen ? 'abierto' : 'cerrado');
    }
  });
</script>
```

### Ejemplo con Control Programático

```html
<script>
  // Inicializar
  const chat = BotUyoChat.init({
    apiKey: 'demo-key',
    apiBaseUrl: 'http://localhost:4000'
  });

  // Abrir el chat programáticamente
  document.getElementById('btnAbrir').addEventListener('click', () => {
    BotUyoChat.open();
  });

  // Cerrar el chat programáticamente
  document.getElementById('btnCerrar').addEventListener('click', () => {
    BotUyoChat.close();
  });

  // Enviar un mensaje programáticamente
  document.getElementById('btnEnviar').addEventListener('click', () => {
    BotUyoChat.sendMessage('Hola, necesito ayuda');
  });

  // Destruir el widget
  document.getElementById('btnDestruir').addEventListener('click', () => {
    BotUyoChat.destroy();
  });

  // Actualizar configuración
  document.getElementById('btnActualizar').addEventListener('click', () => {
    BotUyoChat.update({
      theme: {
        primaryColor: '#ff6b6b',
        botName: 'Nuevo Nombre'
      }
    });
  });
</script>
```

## 🛠️ API Pública

### `BotUyoChat.init(config)`

Inicializa el widget con la configuración proporcionada.

**Retorna**: Instancia del widget para encadenamiento.

### `BotUyoChat.open()`

Abre la ventana del chat programáticamente.

### `BotUyoChat.close()`

Cierra la ventana del chat programáticamente.

### `BotUyoChat.sendMessage(message)`

Envía un mensaje al chat programáticamente.

**Parámetros**:
- `message` (string): El mensaje a enviar.

### `BotUyoChat.update(config)`

Actualiza la configuración del widget sin reiniciarlo.

**Parámetros**:
- `config` (Partial<StandaloneConfig>): Configuración parcial a actualizar.

### `BotUyoChat.destroy()`

Destruye el widget y limpia todos los recursos.

## 🎨 Personalización de Estilos

El widget utiliza variables CSS que puedes sobrescribir:

```html
<style>
  /* Sobrescribir estilos del widget */
  #botuyo-chat-widget-root {
    /* Tus estilos personalizados */
  }

  /* Variables CSS globales */
  :root {
    --paseo-chat-primary: #10b981;
    --paseo-chat-background: #ffffff;
    --paseo-chat-text: #1f2937;
    --paseo-chat-border: #e5e7eb;
  }
</style>
```

## 🧪 Testing Local

Para probar el widget localmente:

1. Clona el repositorio
2. Instala dependencias:
   ```bash
   c� Documentación

- **[Guía de Inicio Rápido](QUICK_START.md)** - Comienza en 5 minutos
- **[Guía de Instalación Completa](INSTALLATION_GUIDE.md)** - Instrucciones detalladas para CDN y React
- **[Checklist de Verificación](VERIFICATION_CHECKLIST.md)** - Verifica que todo funcione correctamente
- **[Resumen de Implementación](INSTALLATION_SUMMARY.md)** - Resumen técnico completo
- **[Ejemplos](examples/)** - Ejemplos funcionales (CDN, React, Next.js)

## �d standalone-widget
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre `http://localhost:3001` en tu navegador

## 📦 Build para Producción

```bash
npm run build
```

Esto generará:
- `dist/botuyo-chat.js` - Bundle minificado para CDN
- `dist/botuyo-chat.css` - Estilos del widget
- `dist/botuyo-chat.js.map` - Source map para debugging

## 🌐 Compatibilidad

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 Licencia

MIT License - © 2025 BotUyo

## 🆘 Soporte

- 📧 Email: soporte@botuyo.com
- 💬 Chat: https://botuyo.com/soporte
- 📖 Docs: https://docs.botuyo.com/chat-widget

## 🔗 Links

- [Documentación completa](https://docs.botuyo.com)
- [Ejemplos en vivo](https://botuyo.com/widget-demo)
- [Repositorio GitHub](https://github.com/botuyo/chat-widget)
