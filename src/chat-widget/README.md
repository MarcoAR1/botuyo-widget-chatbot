# 🤖 ChatWidget - Integración Paseo Libre

## ✅ Integración Completada

El ChatWidget ahora está **activo en todas las pantallas** de Paseo Libre a través del `RootLayout`.

### 📁 Archivos Creados

```
src/
├── chat-widget/                           # 🆕 Widget Independiente
│   ├── index.tsx                         # Entry point
│   ├── ChatWidget.tsx                    # Componente principal
│   ├── types/
│   │   ├── index.ts                      # Props y tipos de mensajes
│   │   └── socket.ts                     # Eventos Socket.IO
│   ├── hooks/
│   │   ├── useChatSocket.ts              # Lógica Socket.IO
│   │   └── useChatState.ts               # Estado interno (useReducer)
│   └── utils/
│       ├── deviceId.ts                   # Persistencia de sesión
│       └── theme.ts                      # Theming CSS Variables
│
├── components/providers/
│   └── ChatbotProvider.tsx               # 🆕 Configuración Paseo Libre
│
└── app/
    └── layout.tsx                        # ✏️ Modificado (agregado ChatbotProvider)
```

### 🔧 Variables de Entorno Necesarias

Agregar a tu `.env.local`:

```bash
# Chat Widget
NEXT_PUBLIC_CHAT_API_KEY=paseolibre-prod-key-aqui
NEXT_PUBLIC_API_URL=https://api.paseolibre.com  # Ya debería existir
```

### 🎨 Configuración Actual

El widget está configurado con:

- **Color Primario**: `#10b981` (Emerald-500, color brand de Paseo Libre)
- **Posición**: Bottom-right
- **Nombre Bot**: "Asistente Paseo Libre"
- **Logo**: `/images/paseo_libre.png`

### 🔌 Callbacks Implementados

#### 1. `onLogin(userData)`
Cuando el bot completa una autenticación:
```typescript
- Guarda el token en localStorage
- Ejecuta router.refresh() para actualizar el estado
```

#### 2. `onNavigate(url)`
Cuando el bot solicita navegación:
```typescript
- Agrega el locale automáticamente (ej: /es/search)
- Ejecuta router.push() para navegar
```

#### 3. `onEvent(eventName, data)`
Eventos custom del bot:

- **`reservation_created`**: Navega a `/pre-reservation/{id}`
- **`search_accommodation`**: Navega a `/search?destination={}`
- **`backend_config`**: Recibe configuración del servidor
- **Otros eventos**: Log en consola

#### 4. `onStateChange(isOpen)`
Trackea analytics cuando se abre/cierra el chat (Google Analytics si está disponible)

### 🚀 Cómo Funciona

1. **Persistencia de Sesión**:
   - Al cargar por primera vez, genera un `UUID v4` y lo guarda en `localStorage` como `chat_device_id`
   - Cada vez que se refresca la página, usa el mismo `device_id` para mantener la conversación

2. **Handshake Socket.IO**:
   ```typescript
   {
     apiKey: 'paseolibre-prod-key',
     deviceId: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx',
     token: undefined // Se envía si el usuario ya está logueado
   }
   ```

3. **Eventos Escuchados**:
   - `connection_ack`: Confirmación + config del backend
   - `bot_message`: Mensajes del bot
   - `bot_typing`: Indicador de escritura
   - `auth_success`: Login completado
   - `navigate`: Solicitud de navegación
   - `chat_history`: Historial de mensajes
   - `custom_event`: Eventos custom

4. **Estado Aislado**:
   - El widget maneja su propio estado con `useReducer`
   - No depende de Redux, Router o Contextos de Paseo Libre
   - Totalmente independiente y portable

### 📦 Próximos Pasos para SaaS

Para extraer a un paquete npm (@paseolibre/chat-widget):

1. **Crear Componentes UI Faltantes**:
   - `Launcher.tsx` (botón flotante)
   - `ChatWindow.tsx` (ventana principal)
   - `MessageList.tsx`, `MessageBubble.tsx`, `InputArea.tsx`

2. **Mover a Repositorio Independiente**:
   ```bash
   mkdir paseolibre-chat-widget
   cd paseolibre-chat-widget
   npm init -y
   # Copiar src/chat-widget/* aquí
   # Configurar build con tsup o rollup
   ```

3. **Configurar Build**:
   ```json
   {
     "name": "@paseolibre/chat-widget",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "exports": {
       ".": {
         "require": "./dist/index.js",
         "import": "./dist/index.mjs"
       },
       "./styles": "./dist/widget.css"
     }
   }
   ```

4. **Instalar en Paseo Libre**:
   ```bash
   npm install @paseolibre/chat-widget
   ```

5. **Inyección vía Script (White-Label)**:
   ```html
   <script src="https://cdn.paseolibre.com/chat-widget.js"></script>
   <script>
     PaseoLibreChat.init({
       apiKey: 'cliente-xyz-key',
       apiBaseUrl: 'https://api.paseolibre.com',
       theme: {
         primaryColor: '#ff6b6b',
         botName: 'Mi Asistente'
       }
     })
   </script>
   ```

### 🎯 Testing

Para probar el widget:

1. Asegúrate de que el backend esté corriendo en `http://localhost:4000`
2. Verifica que las variables de entorno estén configuradas
3. Ejecuta `npm run dev`
4. El widget debería aparecer como un botón flotante en la esquina inferior derecha
5. Al hacer clic, se abre la ventana de chat (cuando los componentes UI estén implementados)

### 🐛 Debug

Para ver logs del widget en la consola:
```javascript
localStorage.setItem('debug', 'ChatSocket:*')
```

Todos los logs del widget tienen el prefijo `[ChatSocket]` o `[ChatWidget]`.

---

**Estado**: ✅ Widget integrado y listo para conectar con el backend
**Pendiente**: Implementar componentes UI (Launcher, ChatWindow, etc.)
