# Cambios Realizados - Sistema de Temas

## ✅ Completado

### 1. Temas Únicos y Diferenciados

**Archivo**: `src/chat-widget/utils/theme.ts`

Eliminé los 12 temas anteriores y creé **5 temas únicos** muy diferenciados:

1. **DEFAULT** (Paseo Libre) - Verde fresco `hsl(160, 84%, 39%)`
   - Tema base del sistema
   - Usado cuando no se envía configuración

2. **OCEAN** - Azul profesional `hsl(211, 100%, 50%)`
   - Diseño corporativo
   - Spacing más amplio (spacing5: 16px)
   - Tonos azules en todo el UI

3. **SUNSET** - Naranja energético `hsl(24, 95%, 53%)`
   - Diseño cálido y amigable
   - Bordes muy redondeados (radius: 1.25rem)
   - Spacing generoso (spacing5: 20px, spacing3: 16px)

4. **MIDNIGHT** - Negro premium `hsl(0, 0%, 100%)` (blanco sobre negro)
   - Diseño oscuro minimalista
   - Bordes cuadrados (radius: 0.25rem)
   - Muy compacto (spacing5: 10px)

5. **NATURE** - Verde bosque `hsl(142, 71%, 45%)`
   - Diseño natural y relajante
   - Tonos verdes en todo el UI

### 2. Sistema de Prioridades de Merge

**Archivo**: `src/chat-widget/utils/theme.ts`

Implementé el sistema de merge con **3 niveles de prioridad**:

```typescript
function mergeThemeWithDefaults(
  userTheme?: Partial<ChatTheme>,    // 1️⃣ Mayor prioridad (proyecto)
  socketTheme?: Partial<ChatTheme>   // 2️⃣ Prioridad media (socket)
): ChatTheme {                        // 3️⃣ DEFAULT_THEME (menor prioridad)
  // Merge de cssVariables con prioridad: user > socket > default
  const mergedCssVariables = {
    ...DEFAULT_CSS_VARIABLES,
    ...(socketTheme?.cssVariables || {}),
    ...(userTheme?.cssVariables || {}),
  }
  
  return {
    primaryColor: userTheme?.primaryColor || socketTheme?.primaryColor || DEFAULT_THEME.primaryColor,
    // ... resto de propiedades con mismo patrón
  }
}
```

**Flujo**:
- Si el usuario define `primaryColor` en su proyecto → se usa ese
- Si no, pero el socket envía `primaryColor` → se usa del socket
- Si ninguno lo define → se usa `DEFAULT_THEME.primaryColor`

### 3. Soporte para Temas desde Socket

**Archivos modificados**:
- `src/chat-widget/types/socket.ts`
- `src/chat-widget/hooks/useChatSocket.ts`
- `src/chat-widget/hooks/useChatWidget.ts`
- `src/chat-widget/hooks/useWidgetTheme.ts`
- `src/chat-widget/ChatWidget.tsx`

**Implementación**:

1. **Tipo `AuthSuccessPayload`** ahora incluye `theme?`:
```typescript
export interface AuthSuccessPayload {
  token: string
  user: { ... }
  message?: string
  theme?: ChatTheme  // 🆕 Tema desde el servidor
}
```

2. **Socket detecta y envía tema**:
```typescript
socket.on('auth_success', (data) => {
  if (data.theme && onThemeUpdate) {
    onThemeUpdate(data.theme)  // Notificar al componente
  }
})
```

3. **ChatWidget maneja tema del socket**:
```typescript
const [socketTheme, setSocketTheme] = useState()

const { mergedTheme } = useWidgetTheme(
  theme,        // Tema del proyecto (mayor prioridad)
  socketTheme   // Tema del socket (prioridad media)
)

useChatWidget({
  ...props,
  onThemeUpdate: setSocketTheme  // Callback para recibir tema
})
```

### 4. Demo Actualizada

**Archivo**: `demo-dev.html`

- ✅ Selector simplificado con 5 temas únicos
- ✅ Contador actualizado: 5 temas (antes 12)
- ✅ Sección placeholder para "Generador de Temas" (próximamente)
- ✅ Definiciones de temas actualizadas con los 5 nuevos
- ✅ Tema inicial cambiado a `'default'`

### 5. Documentación

**Archivo nuevo**: `THEME_SYSTEM.md`

Documentación completa que incluye:
- 📋 Resumen del sistema
- 🎯 Explicación de prioridades
- 🎨 Guía de cada tema predefinido
- 🔧 Ejemplos de personalización
- 📐 Referencia de variables CSS
- 🌐 Configuración desde socket
- 🎛️ Dimensiones (height/bottom)
- 🔍 Ejemplo completo
- 📚 Referencia de API
- 🎯 Mejores prácticas

## 🎨 Generador de Temas (Pendiente)

Dejé preparado un placeholder en la demo para el **Generador de Temas**:

```html
<div class="theme-generator-placeholder">
  <h4>🎨 Generador de Temas</h4>
  <p>Próximamente: Crea y guarda tus propios temas personalizados</p>
</div>
```

### Funcionalidades planificadas:
- ✨ Editor visual de colores
- 🎨 Selector de colores en tiempo real
- 📏 Sliders para spacing
- 💾 Guardar configuraciones
- 📋 Copiar código generado
- 🔄 Previsualización en vivo

## 📊 Resumen de Cambios por Archivo

| Archivo | Cambios |
|---------|---------|
| `theme.ts` | 5 temas nuevos, merge con prioridades |
| `socket.ts` | Añadido `theme?` a `AuthSuccessPayload` |
| `useChatSocket.ts` | Detecta y envía tema del socket |
| `useChatWidget.ts` | Callback `onThemeUpdate` |
| `useWidgetTheme.ts` | Acepta `projectTheme` y `socketTheme` |
| `ChatWidget.tsx` | Estado `socketTheme` y callback |
| `demo-dev.html` | 5 temas únicos + placeholder generador |
| `THEME_SYSTEM.md` | Documentación completa (nuevo) |

## 🚀 Cómo Usar

### Opción 1: Tema Predefinido
```typescript
import { OCEAN_THEME } from '@paseolibre/chat-widget/utils/theme'

PaseoLibreChat.init({
  apiKey: 'your-key',
  theme: OCEAN_THEME
})
```

### Opción 2: Personalización Parcial
```typescript
PaseoLibreChat.init({
  apiKey: 'your-key',
  theme: {
    primaryColor: 'hsl(271, 76%, 53%)',  // Solo cambias esto
    // Resto usa DEFAULT_THEME
  }
})
```

### Opción 3: Combinación
```typescript
import { SUNSET_THEME } from '@paseolibre/chat-widget/utils/theme'

PaseoLibreChat.init({
  apiKey: 'your-key',
  theme: {
    ...SUNSET_THEME,
    botName: 'Mi Bot',  // Sobrescribir solo algunas propiedades
    height: '700px'
  }
})
```

### Opción 4: Desde Socket (Automático)
```json
// El servidor envía en auth_success:
{
  "theme": {
    "primaryColor": "hsl(211, 100%, 50%)",
    "botName": "Bot Remoto",
    "cssVariables": {
      "spacing5": "1rem"
    }
  }
}
```

El widget lo recibe automáticamente y hace merge con prioridades.

## ✨ Próximos Pasos

1. Implementar generador visual de temas en la demo
2. Añadir más temas predefinidos si es necesario
3. Documentar casos de uso específicos
4. Crear galería de temas de la comunidad
