# 🎯 Guía Rápida de Personalización

## ¿Por qué no veo colores en el widget?

El widget de Paseo Libre usa un **sistema de temas personalizable** mediante variables CSS. Para que el widget se vea correctamente, **debes proporcionar un tema** con las variables CSS necesarias.

---

## ✅ Solución Rápida: Usar el Tema Por Defecto

### React / Next.js

```tsx
import { ChatWidgetProvider } from '@paseolibre/chat-widget'

function App() {
  return (
    <ChatWidgetProvider
      apiKey="tu-api-key"
      apiBaseUrl="http://localhost:4000"
      theme={{
        primaryColor: 'hsl(160, 84%, 39%)',  // Verde Paseo Libre
        botName: 'Asistente',
        cssVariables: {
          background: '0 0% 100%',           // ⚠️ IMPORTANTE: Fondo blanco
          foreground: '240 10% 3.9%',        // Texto oscuro
          card: '0 0% 100%',                 // Tarjetas blancas
          cardForeground: '240 10% 3.9%',    // Texto de tarjetas
          primary: '160 84% 39%',            // Color primario
          primaryForeground: '0 0% 100%',    // Texto sobre primario
          muted: '240 4.8% 95.9%',           // Gris claro
          mutedForeground: '240 3.8% 46.1%', // Gris texto
          border: '240 5.9% 90%',            // Bordes
          destructive: '0 84.2% 60.2%',      // Rojo errores
          radius: '0.5rem',                  // Bordes redondeados
        }
      }}
    />
  )
}
```

### CDN / HTML puro

```html
<script>
  window.PaseoLibreChat.init({
    apiKey: 'tu-api-key',
    apiBaseUrl: 'http://localhost:4000',
    theme: {
      primaryColor: 'hsl(160, 84%, 39%)',
      botName: 'Asistente',
      cssVariables: {
        background: '0 0% 100%',           // ⚠️ IMPORTANTE
        foreground: '240 10% 3.9%',
        card: '0 0% 100%',
        cardForeground: '240 10% 3.9%',
        primary: '160 84% 39%',
        primaryForeground: '0 0% 100%',
        muted: '240 4.8% 95.9%',
        mutedForeground: '240 3.8% 46.1%',
        border: '240 5.9% 90%',
        destructive: '0 84.2% 60.2%',
        radius: '0.5rem',
      }
    }
  })
</script>
```

---

## 🎨 Personalizar Colores

### Formato HSL (MUY IMPORTANTE ⚠️)

Las variables CSS **DEBEN** usar formato HSL **SIN** la función `hsl()`:

```typescript
// ✅ CORRECTO
background: "0 0% 100%"         // Blanco
primary: "160 84% 39%"          // Verde

// ❌ INCORRECTO
background: "hsl(0, 0%, 100%)"  // ❌ No uses hsl()
background: "#FFFFFF"            // ❌ No uses HEX
background: "rgb(255,255,255)"   // ❌ No uses RGB
```

### Convertir HEX a HSL

Si tienes un color en formato HEX (ej: `#3B82F6`), conviértelo:

1. **Herramienta Online**: [hslpicker.com](https://hslpicker.com/)
2. **JavaScript**:

```javascript
function hexToHSL(hex) {
  hex = hex.replace('#', '')
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

// Ejemplo:
hexToHSL('#3B82F6')  // "217 91% 60%"
```

---

## 📚 Variables Disponibles

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `background` | **OBLIGATORIO** - Fondo principal del chat | `"0 0% 100%"` (blanco) |
| `foreground` | **OBLIGATORIO** - Color del texto | `"240 10% 3.9%"` (negro) |
| `card` | Fondo de tarjetas/burbujas | `"0 0% 100%"` |
| `cardForeground` | Texto dentro de tarjetas | `"240 10% 3.9%"` |
| `primary` | Color principal de tu marca | `"160 84% 39%"` (verde) |
| `primaryForeground` | Texto sobre color primario | `"0 0% 100%"` (blanco) |
| `muted` | Fondos atenuados | `"240 4.8% 95.9%"` |
| `mutedForeground` | Texto atenuado | `"240 3.8% 46.1%"` |
| `border` | Color de bordes | `"240 5.9% 90%"` |
| `destructive` | Color de error | `"0 84.2% 60.2%"` (rojo) |
| `radius` | Radio de bordes | `"0.5rem"` |

---

## 🌙 Modo Oscuro

```tsx
<ChatWidgetProvider
  theme={{
    cssVariables: {
      background: '240 10% 3.9%',      // ⚠️ Fondo oscuro
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

---

## 🚀 Temas Predefinidos Completos

### Tema Azul Corporativo

```typescript
const temaAzul = {
  primaryColor: 'hsl(221, 83%, 53%)',
  cssVariables: {
    background: '0 0% 100%',
    foreground: '222 47% 11%',
    card: '0 0% 98%',
    cardForeground: '222 47% 11%',
    primary: '221 83% 53%',           // Azul
    primaryForeground: '0 0% 100%',
    muted: '210 40% 96%',
    mutedForeground: '215 16% 47%',
    border: '214 32% 91%',
    destructive: '0 84% 60%',
    radius: '0.375rem',
  }
}
```

### Tema Morado Vibrante

```typescript
const temaMorado = {
  primaryColor: 'hsl(280, 100%, 50%)',
  cssVariables: {
    background: '0 0% 100%',
    foreground: '280 90% 10%',
    card: '0 0% 100%',
    cardForeground: '280 90% 10%',
    primary: '280 100% 50%',          // Morado
    primaryForeground: '0 0% 100%',
    muted: '280 40% 95%',
    mutedForeground: '280 10% 40%',
    border: '280 30% 90%',
    destructive: '0 84% 60%',
    radius: '1rem',
  }
}
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué el widget se ve transparente?

**Causa**: Falta la variable `background` o está en formato incorrecto.

**Solución**: Asegúrate de incluir `background: '0 0% 100%'` en `cssVariables`.

---

### ¿Cómo sé qué colores usar?

1. **Usa tu marca**: Extrae los colores de tu logo/sitio web
2. **Herramienta online**: [coolors.co](https://coolors.co/) para generar paletas
3. **Copia ejemplos**: Usa los temas predefinidos de arriba

---

### ¿Puedo cambiar solo el color principal?

Sí, pero **debes** incluir las variables obligatorias (`background`, `foreground`):

```tsx
<ChatWidgetProvider
  theme={{
    primaryColor: 'hsl(340, 82%, 52%)',  // Rosa
    cssVariables: {
      background: '0 0% 100%',           // ⚠️ OBLIGATORIO
      foreground: '240 10% 3.9%',        // ⚠️ OBLIGATORIO
      primary: '340 82% 52%',            // Tu color
      // ... resto de valores por defecto
    }
  }}
/>
```

---

## 📖 Recursos Adicionales

- **Guía Completa**: Ver [THEME_GUIDE.md](./THEME_GUIDE.md)
- **Convertidor HSL**: [hslpicker.com](https://hslpicker.com/)
- **Paletas de Color**: [coolors.co](https://coolors.co/)
- **Verificar Contraste**: [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/)

---

## 💡 Ejemplo Mínimo Funcional

El **mínimo indispensable** para que el widget funcione:

```tsx
<ChatWidgetProvider
  apiKey="tu-api-key"
  theme={{
    cssVariables: {
      background: '0 0% 100%',        // ⚠️ OBLIGATORIO
      foreground: '240 10% 3.9%',     // ⚠️ OBLIGATORIO
      primary: '160 84% 39%',         // Recomendado
    }
  }}
/>
```

El resto de variables tendrán valores por defecto razonables.

---

**¿Necesitas más ayuda?** Consulta [THEME_GUIDE.md](./THEME_GUIDE.md) para ejemplos avanzados.
