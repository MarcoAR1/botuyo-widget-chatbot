# 🎨 Guía de Personalización del Tema

Esta guía te ayudará a personalizar completamente la apariencia del widget de chat para que coincida con la identidad visual de tu marca.

## 📋 Tabla de Contenidos

- [Configuración Básica](#configuración-básica)
- [Variables CSS Disponibles](#variables-css-disponibles)
- [Temas Predefinidos](#temas-predefinidos)
- [Modo Oscuro](#modo-oscuro)
- [Ejemplos Prácticos](#ejemplos-prácticos)

---

## Configuración Básica

El widget acepta una prop `theme` con la siguiente estructura:

```typescript
interface ChatTheme {
  // Colores básicos (formato: cualquier color CSS válido)
  primaryColor?: string        // Color principal de la marca
  backgroundColor?: string     // Color de fondo (usado como fallback)
  textColor?: string          // Color del texto (usado como fallback)
  
  // Posición del widget
  position?: 'bottom-right' | 'bottom-left'
  
  // Textos personalizables
  botName?: string
  logoUrl?: string
  welcomeMessage?: string
  inputPlaceholder?: string
  
  // Variables CSS del sistema de diseño (formato HSL sin "hsl()")
  cssVariables?: {
    background?: string          // Fondo principal (ej: "0 0% 100%")
    foreground?: string          // Texto principal
    card?: string                // Fondo de tarjetas
    cardForeground?: string      // Texto de tarjetas
    primary?: string             // Color primario
    primaryForeground?: string   // Texto sobre primario
    muted?: string               // Color atenuado
    mutedForeground?: string     // Texto atenuado
    border?: string              // Color de bordes
    destructive?: string         // Color de error/peligro
    radius?: string              // Radio de bordes (ej: "0.5rem")
  }
}
```

---

## Variables CSS Disponibles

### 🎨 Sistema de Colores (formato HSL)

Todas las variables de color usan el formato HSL **sin** la función `hsl()`:

```typescript
// ✅ CORRECTO
background: "0 0% 100%"         // Blanco
primary: "160 84% 39%"          // Verde Paseo Libre

// ❌ INCORRECTO
background: "hsl(0, 0%, 100%)"
primary: "#10B981"
```

### 📐 Variables Principales

| Variable | Descripción | Por Defecto (Light) |
|----------|-------------|---------------------|
| `background` | Fondo principal del chat | `0 0% 100%` (Blanco) |
| `foreground` | Color del texto principal | `240 10% 3.9%` (Negro azulado) |
| `card` | Fondo de tarjetas y mensajes | `0 0% 100%` (Blanco) |
| `cardForeground` | Texto dentro de tarjetas | `240 10% 3.9%` |
| `primary` | Color primario de la marca | `160 84% 39%` (Verde) |
| `primaryForeground` | Texto sobre color primario | `0 0% 100%` (Blanco) |
| `muted` | Fondos atenuados | `240 4.8% 95.9%` (Gris claro) |
| `mutedForeground` | Texto atenuado | `240 3.8% 46.1%` (Gris) |
| `border` | Bordes y divisores | `240 5.9% 90%` (Gris borde) |
| `destructive` | Errores y acciones peligrosas | `0 84.2% 60.2%` (Rojo) |
| `radius` | Radio de bordes | `0.5rem` |

---

## Temas Predefinidos

### 🌟 Tema Por Defecto (Paseo Libre)

```tsx
<ChatWidget
  apiKey="tu-api-key"
  theme={{
    primaryColor: 'hsl(160, 84%, 39%)',
    botName: 'Asistente Paseo Libre',
    logoUrl: '/logo.png',
    cssVariables: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      primary: '160 84% 39%',
      primaryForeground: '0 0% 100%',
      muted: '240 4.8% 95.9%',
      border: '240 5.9% 90%',
      radius: '0.5rem',
    }
  }}
/>
```

### 💼 Tema Corporativo (Azul)

```tsx
<ChatWidget
  apiKey="tu-api-key"
  theme={{
    primaryColor: 'hsl(221, 83%, 53%)',
    botName: 'Asistente Corporativo',
    cssVariables: {
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      card: '0 0% 98%',
      cardForeground: '222 47% 11%',
      primary: '221 83% 53%',        // Azul corporativo
      primaryForeground: '0 0% 100%',
      muted: '210 40% 96%',
      mutedForeground: '215 16% 47%',
      border: '214 32% 91%',
      destructive: '0 84% 60%',
      radius: '0.375rem',             // Bordes más cuadrados
    }
  }}
/>
```

### 🌙 Tema Oscuro

```tsx
<ChatWidget
  apiKey="tu-api-key"
  theme={{
    primaryColor: 'hsl(160, 84%, 39%)',
    botName: 'Asistente',
    cssVariables: {
      background: '240 10% 3.9%',      // Fondo oscuro
      foreground: '0 0% 98%',          // Texto claro
      card: '240 10% 10%',
      cardForeground: '0 0% 98%',
      primary: '160 84% 39%',
      primaryForeground: '0 0% 100%',
      muted: '240 3.7% 15.9%',
      mutedForeground: '240 5% 64.9%',
      border: '240 3.7% 15.9%',
      destructive: '0 63% 31%',
      radius: '0.5rem',
    }
  }}
/>
```

### 🎨 Tema Minimalista (Gris)

```tsx
<ChatWidget
  apiKey="tu-api-key"
  theme={{
    primaryColor: 'hsl(0, 0%, 9%)',
    botName: 'Asistente',
    cssVariables: {
      background: '0 0% 100%',
      foreground: '0 0% 9%',
      card: '0 0% 97%',
      cardForeground: '0 0% 9%',
      primary: '0 0% 9%',              // Negro
      primaryForeground: '0 0% 100%',
      muted: '0 0% 96%',
      mutedForeground: '0 0% 45%',
      border: '0 0% 90%',
      destructive: '0 84% 60%',
      radius: '1rem',                   // Bordes muy redondeados
    }
  }}
/>
```

---

## Modo Oscuro

Para implementar modo oscuro automático, puedes usar el hook de React:

```tsx
import { useState, useEffect } from 'react'

function App() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Detectar preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(mediaQuery.matches)

    const handler = (e) => setIsDark(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  const lightTheme = {
    background: '0 0% 100%',
    foreground: '240 10% 3.9%',
    primary: '160 84% 39%',
    // ... resto de variables
  }

  const darkTheme = {
    background: '240 10% 3.9%',
    foreground: '0 0% 98%',
    primary: '160 84% 39%',
    // ... resto de variables
  }

  return (
    <ChatWidget
      apiKey="tu-api-key"
      theme={{
        cssVariables: isDark ? darkTheme : lightTheme
      }}
    />
  )
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Solo Cambiar Color Principal

```tsx
<ChatWidget
  apiKey="tu-api-key"
  theme={{
    primaryColor: 'hsl(280, 100%, 50%)',  // Morado
    cssVariables: {
      primary: '280 100% 50%',
    }
  }}
/>
```

### Ejemplo 2: Tema Personalizado Completo

```tsx
<ChatWidget
  apiKey="tu-api-key"
  theme={{
    primaryColor: 'hsl(340, 82%, 52%)',
    botName: 'Mi Asistente',
    logoUrl: 'https://mi-sitio.com/logo.png',
    welcomeMessage: '¡Bienvenido! ¿Cómo puedo ayudarte?',
    inputPlaceholder: 'Pregúntame lo que quieras...',
    position: 'bottom-left',
    cssVariables: {
      background: '330 100% 98%',       // Fondo rosado muy claro
      foreground: '340 90% 10%',        // Texto oscuro rosado
      card: '0 0% 100%',
      cardForeground: '340 90% 10%',
      primary: '340 82% 52%',           // Rosa vibrante
      primaryForeground: '0 0% 100%',
      muted: '330 40% 95%',
      mutedForeground: '340 10% 40%',
      border: '330 30% 90%',
      destructive: '0 84% 60%',
      radius: '1.5rem',                 // Muy redondeado
    }
  }}
/>
```

### Ejemplo 3: Convertir HEX a HSL

Si tienes colores en formato HEX, puedes convertirlos:

```typescript
function hexToHSL(hex: string): string {
  // Quitar el #
  hex = hex.replace('#', '')
  
  // Convertir a RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  
  h = Math.round(h * 360)
  s = Math.round(s * 100)
  l = Math.round(l * 100)
  
  return `${h} ${s}% ${l}%`
}

// Uso:
const myBrandColor = hexToHSL('#10B981')  // "160 84% 39%"
```

---

## 🚀 Mejores Prácticas

1. **Contraste de Accesibilidad**: Asegúrate de que `foreground` y `background` tengan suficiente contraste (mínimo 4.5:1)

2. **Consistencia**: Usa el mismo `primaryColor` tanto en formato `hsl()` completo como en las `cssVariables`

3. **Prueba en Modo Oscuro**: Si ofreces modo oscuro, verifica que todos los colores se vean bien

4. **Radio de Bordes**: Mantén `radius` entre `0.25rem` (4px) y `1.5rem` (24px) para mejor usabilidad

5. **Colores Destructivos**: Usa rojos para acciones peligrosas, pero asegúrate de que sean visibles

---

## 📚 Recursos Adicionales

- [HSL Color Picker](https://hslpicker.com/)
- [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Tailwind CSS Colors](https://tailwindcss.com/docs/customizing-colors) (para inspiración)

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo usar colores HEX o RGB?**  
R: No directamente en `cssVariables`. Debes convertirlos a formato HSL sin `hsl()`. Usa la función `hexToHSL()` del ejemplo anterior.

**P: ¿Por qué no se aplican mis colores?**  
R: Verifica que estés usando el formato correcto: `"160 84% 39%"` (sin `hsl()` ni comas extra)

**P: ¿Puedo cambiar el tema dinámicamente?**  
R: Sí, el widget reacciona a cambios en la prop `theme`. Solo actualiza el estado de React.

**P: ¿Cómo hago que coincida con mi sitio web?**  
R: Extrae los colores principales de tu sitio, conviértelos a HSL, y úsalos en `cssVariables`.

---

**¿Necesitas más ayuda?** Revisa los ejemplos en la carpeta `examples/` del repositorio.
