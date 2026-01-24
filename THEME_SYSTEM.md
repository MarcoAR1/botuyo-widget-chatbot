# Sistema de Temas del Chat Widget

## 📋 Resumen

El widget implementa un **sistema de temas en cascada** con tres niveles de prioridad que permite una personalización completa y flexible.

## 🎯 Prioridades de Configuración

El sistema de merge sigue esta jerarquía (de mayor a menor prioridad):

```
1️⃣ PROYECTO (userTheme) - Lo que el desarrollador configura en su código
                ⬇️
2️⃣ SOCKET (socketTheme) - Lo que viene de la API/configuración remota
                ⬇️
3️⃣ DEFAULT - Valores por defecto del sistema
```

### Cómo Funciona

```typescript
// 1. Tema del PROYECTO (mayor prioridad)
PaseoLibreChat.init({
  apiKey: 'your-key',
  theme: {
    primaryColor: 'hsl(211, 100%, 50%)',  // 🔵 Este valor SIEMPRE se usará
    botName: 'Mi Bot Personalizado',
    cssVariables: {
      spacing5: '1rem',  // Padding personalizado
    }
  }
})

// 2. Tema del SOCKET (prioridad media)
// El servidor puede enviar configuración vía WebSocket
{
  theme: {
    primaryColor: 'hsl(160, 84%, 39%)',  // ⚠️ Ignorado si el proyecto lo define
    welcomeMessage: 'Hola desde el servidor', // ✅ Se usa si el proyecto no lo define
    cssVariables: {
      spacing3: '0.5rem',  // ✅ Se usa si el proyecto no lo define
    }
  }
}

// 3. Tema DEFAULT (menor prioridad)
// Valores fallback definidos en theme.ts
{
  primaryColor: 'hsl(160, 84%, 39%)',
  botName: 'Asistente',
  welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?',
  // ... más valores por defecto
}
```

## 🎨 Temas Predefinidos

El widget incluye **5 temas únicos** listos para usar:

### 1. Default (Paseo Libre)
```typescript
import { DEFAULT_THEME } from '@paseolibre/chat-widget/utils/theme'

PaseoLibreChat.init({
  theme: DEFAULT_THEME
})
```
- **Color**: Verde fresco (`hsl(160, 84%, 39%)`)
- **Estilo**: Limpio y profesional
- **Uso**: Aplicaciones generales

### 2. Ocean (Azul Profesional)
```typescript
import { OCEAN_THEME } from '@paseolibre/chat-widget/utils/theme'

PaseoLibreChat.init({
  theme: OCEAN_THEME
})
```
- **Color**: Azul corporativo (`hsl(211, 100%, 50%)`)
- **Estilo**: Profesional y confiable
- **Uso**: Aplicaciones empresariales

### 3. Sunset (Naranja Energético)
```typescript
import { SUNSET_THEME } from '@paseolibre/chat-widget/utils/theme'

PaseoLibreChat.init({
  theme: SUNSET_THEME
})
```
- **Color**: Naranja cálido (`hsl(24, 95%, 53%)`)
- **Estilo**: Enérgico y amigable
- **Uso**: Aplicaciones creativas y marketplaces

### 4. Midnight (Negro Premium)
```typescript
import { MIDNIGHT_THEME } from '@paseolibre/chat-widget/utils/theme'

PaseoLibreChat.init({
  theme: MIDNIGHT_THEME
})
```
- **Color**: Blanco sobre negro (`hsl(0, 0%, 100%)`)
- **Estilo**: Minimalista y sofisticado
- **Uso**: Aplicaciones premium y tech

### 5. Nature (Verde Bosque)
```typescript
import { NATURE_THEME } from '@paseolibre/chat-widget/utils/theme'

PaseoLibreChat.init({
  theme: NATURE_THEME
})
```
- **Color**: Verde natural (`hsl(142, 71%, 45%)`)
- **Estilo**: Relajante y orgánico
- **Uso**: Aplicaciones eco-friendly y wellness

## 🔧 Personalización Avanzada

### Merge Parcial

Puedes personalizar **solo las propiedades que necesitas**, el resto se completa automáticamente:

```typescript
PaseoLibreChat.init({
  theme: {
    // Solo cambias el color primario
    primaryColor: 'hsl(271, 76%, 53%)',
    
    // El resto usa valores por defecto:
    // botName: 'Asistente'
    // welcomeMessage: '¡Hola! ¿En qué puedo ayudarte?'
    // cssVariables: { ...DEFAULT_CSS_VARIABLES }
  }
})
```

### CSS Variables Personalizadas

Sobrescribe variables CSS individuales sin afectar el resto:

```typescript
PaseoLibreChat.init({
  theme: {
    primaryColor: 'hsl(211, 100%, 50%)',
    cssVariables: {
      // Solo cambias spacing, el resto usa defaults
      spacing5: '1.5rem',  // Padding más grande
      spacing3: '1rem',    // Gaps más amplios
      radius: '1.25rem',   // Bordes más redondeados
      
      // Resto de variables usa DEFAULT_CSS_VARIABLES:
      // background, foreground, card, etc.
    }
  }
})
```

## 📐 Variables CSS Disponibles

### Colores
```typescript
{
  background: '0 0% 100%',           // Fondo principal
  foreground: '240 10% 3.9%',        // Texto principal
  card: '0 0% 100%',                 // Fondo de tarjetas
  cardForeground: '240 10% 3.9%',    // Texto en tarjetas
  primary: '160 84% 39%',            // Color primario
  primaryForeground: '0 0% 100%',    // Texto sobre primario
  muted: '240 4.8% 95.9%',           // Fondos atenuados
  mutedForeground: '240 3.8% 46.1%', // Texto atenuado
  border: '240 5.9% 90%',            // Bordes
  destructive: '0 84.2% 60.2%',      // Color de error
}
```

### Espaciado (Design System)
```typescript
{
  spacing1: '0.25rem',  // 4px - Extra small
  spacing2: '0.5rem',   // 8px - Small
  spacing3: '0.75rem',  // 12px - Medium small (gaps entre elementos)
  spacing4: '1rem',     // 16px - Medium
  spacing5: '0.75rem',  // 12px - DEFAULT PADDING
  spacing6: '1.5rem',   // 24px - Large
  spacing8: '2rem',     // 32px - Extra large
}
```

### Otros
```typescript
{
  radius: '0.5rem',  // 8px - Border radius
}
```

## 🌐 Configuración desde el Servidor (Socket)

El servidor puede enviar configuración de tema vía WebSocket al conectarse:

```json
{
  "event": "theme:update",
  "data": {
    "primaryColor": "hsl(211, 100%, 50%)",
    "botName": "Asistente Remoto",
    "cssVariables": {
      "primary": "211 100% 50%",
      "spacing5": "1rem"
    }
  }
}
```

Esta configuración se **mergea automáticamente** con el tema del proyecto usando el sistema de prioridades.

## 🎛️ Dimensiones del Widget

Controla el tamaño y posición del widget:

```typescript
PaseoLibreChat.init({
  theme: {
    height: '600px',    // Altura del widget ('400px', '80vh', etc.)
    bottom: '24px',     // Distancia desde el fondo
    primaryColor: 'hsl(211, 100%, 50%)',
  }
})
```

## 🔍 Ejemplo Completo

```typescript
import { OCEAN_THEME } from '@paseolibre/chat-widget/utils/theme'

// Combinar tema predefinido con personalizaciones
PaseoLibreChat.init({
  apiKey: 'your-api-key',
  theme: {
    // Partir de un tema base
    ...OCEAN_THEME,
    
    // Personalizar solo lo necesario
    botName: 'Mi Asistente Personalizado',
    welcomeMessage: '¡Bienvenido a nuestro chat!',
    height: '700px',
    bottom: '32px',
    
    // Ajustar CSS variables específicas
    cssVariables: {
      ...OCEAN_THEME.cssVariables,
      spacing5: '1.25rem',  // Más espacioso
      radius: '1rem',       // Más redondeado
    }
  }
})
```

## 🛠️ Generador de Temas (Próximamente)

En una futura actualización, la demo incluirá un **generador visual de temas** que permitirá:

- ✨ Crear temas personalizados en tiempo real
- 🎨 Selector de colores visual
- 📏 Ajuste de spacing con sliders
- 💾 Guardar y exportar configuraciones
- 📋 Copiar código listo para usar

## 📚 Referencia de API

### `mergeThemeWithDefaults(userTheme?, socketTheme?)`

Función interna que realiza el merge de temas con prioridades.

**Parámetros:**
- `userTheme`: Tema definido en el proyecto (mayor prioridad)
- `socketTheme`: Tema recibido del servidor (prioridad media)

**Retorna:** Tema completo con todos los valores definidos

**Ejemplo:**
```typescript
const finalTheme = mergeThemeWithDefaults(
  { primaryColor: 'hsl(211, 100%, 50%)' },  // Proyecto
  { botName: 'Bot Remoto' }                  // Socket
)
// Resultado: { 
//   primaryColor: 'hsl(211, 100%, 50%)',  ← Del proyecto
//   botName: 'Bot Remoto',                 ← Del socket
//   welcomeMessage: '¡Hola!...',           ← Default
//   ...resto de defaults
// }
```

## 🎯 Mejores Prácticas

1. **Usa temas predefinidos como base**: Parti de `OCEAN_THEME`, `SUNSET_THEME`, etc. y personaliza
2. **Solo define lo necesario**: El sistema completa el resto automáticamente
3. **Mantén consistencia**: Usa el design system de spacing en lugar de valores arbitrarios
4. **Testing**: Prueba tu tema en modo claro y oscuro
5. **Accesibilidad**: Asegura contraste suficiente entre colores

## 📝 Notas

- Los colores usan formato **HSL** sin `hsl()`: `'160 84% 39%'` en lugar de `'hsl(160, 84%, 39%)'`
- El spacing usa **rem** para mejor accesibilidad
- El merge es **profundo** para `cssVariables`, garantizando que cada propiedad tenga fallback
- Los temas se pueden actualizar en **tiempo real** destruyendo y reinicializando el widget
