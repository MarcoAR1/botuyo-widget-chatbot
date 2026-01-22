# Personalización de Diseño del Chat Widget

## Variables CSS del Design System

El widget usa variables CSS basadas en el sistema de diseño de shadcn/ui con soporte para modo oscuro. Estas variables se pueden personalizar mediante la propiedad `theme.cssVariables`.

### Estructura de Variables

```typescript
interface ChatTheme {
  cssVariables?: {
    // Colores base
    background?: string        // Fondo principal
    foreground?: string        // Texto principal
    
    // Tarjetas y contenedores
    card?: string             // Fondo de tarjetas
    cardForeground?: string   // Texto en tarjetas
    
    // Color primario (botones, acciones)
    primary?: string          // Color principal
    primaryForeground?: string // Texto sobre primario
    
    // Elementos silenciados
    muted?: string            // Fondo silenciado
    mutedForeground?: string  // Texto silenciado
    
    // Bordes y errores
    border?: string           // Color de bordes
    destructive?: string      // Color de error/peligro
    
    // Espaciado
    radius?: string           // Border radius base
  }
}
```

### Formato de Colores

**Importante**: Los colores deben estar en formato **HSL sin `hsl()`**

✅ **Correcto**: `"160 84% 39%"`  
❌ **Incorrecto**: `"hsl(160, 84%, 39%)"`

**¿Por qué?** El formato sin `hsl()` permite que Tailwind CSS manipule los valores (opacidad, variantes, etc.)

### Ejemplo de Uso

```typescript
const widget = PaseoLibreChat.init({
  apiKey: 'tu-api-key',
  apiBaseUrl: 'https://api.tudominio.com',
  theme: {
    primaryColor: '#10b981', // Color primario directo
    
    // Variables CSS personalizadas
    cssVariables: {
      // Tema claro
      background: '0 0% 100%',           // Blanco
      foreground: '240 10% 3.9%',        // Casi negro
      card: '0 0% 100%',                 // Blanco
      cardForeground: '240 10% 3.9%',    // Casi negro
      primary: '160 84% 39%',            // Verde esmeralda
      primaryForeground: '0 0% 100%',    // Blanco
      muted: '240 4.8% 95.9%',          // Gris muy claro
      mutedForeground: '240 3.8% 46.1%', // Gris medio
      border: '240 5.9% 90%',           // Gris claro
      destructive: '0 84.2% 60.2%',     // Rojo
      radius: '0.5rem',                  // 8px
    }
  }
});
```

### Valores por Defecto

Si no se especifican, el widget usa estos valores:

```css
/* Modo Claro (por defecto) */
--background: 0 0% 100%;           /* Blanco */
--foreground: 240 10% 3.9%;        /* Gris muy oscuro */
--card: 0 0% 100%;                 /* Blanco */
--primary: 160 84% 39%;            /* Verde Paseo Libre */
--muted: 240 4.8% 95.9%;          /* Gris muy claro */
--border: 240 5.9% 90%;           /* Gris claro */

/* Modo Oscuro (con clase .dark) */
--background: 240 10% 3.9%;        /* Gris muy oscuro */
--foreground: 0 0% 98%;            /* Casi blanco */
--card: 240 10% 3.9%;              /* Gris muy oscuro */
--primary: 160 84% 39%;            /* Verde Paseo Libre */
--muted: 240 3.7% 15.9%;          /* Gris oscuro */
--border: 240 3.7% 15.9%;         /* Gris oscuro */
```

## Dark Mode

El widget es **dark mode compatible** mediante:

### 1. Variables CSS Dinámicas
Las variables cambian automáticamente cuando se agrega la clase `dark` al HTML:

```html
<!-- Activar dark mode -->
<html class="dark">
```

### 2. Configuración en Tailwind
El `tailwind.config.js` usa `darkMode: 'class'`:

```javascript
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ... más colores
      }
    }
  }
}
```

### 3. Colores con HSL
Todos los colores usan `hsl(var(--variable))` para adaptarse dinámicamente.

### Ejemplo: Personalizar Dark Mode

```typescript
const widget = PaseoLibreChat.init({
  apiKey: 'tu-api-key',
  apiBaseUrl: 'https://api.tudominio.com',
  theme: {
    cssVariables: {
      // Estos valores se aplicarán en modo claro
      // Para dark mode, agrega la clase 'dark' al HTML
      background: '0 0% 95%',      // Gris muy claro en vez de blanco
      foreground: '240 10% 10%',   // Negro suave
      primary: '220 90% 50%',      // Azul personalizado
    }
  }
});
```

## Conversión de Colores

### De HEX a HSL

```javascript
// Ejemplo: Convertir #10b981 a HSL
// Resultado: 160 84% 39%

function hexToHSL(hex) {
  // Remover #
  hex = hex.replace('#', '');
  
  // Convertir a RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}

console.log(hexToHSL('#10b981')); // "160 84% 39%"
```

### Herramientas Online

- [HSL Color Picker](https://hslpicker.com/)
- [Coolors.co](https://coolors.co/) - Generador de paletas
- [ColorSpace](https://mycolor.space/) - Generador de esquemas de color

## Ejemplos de Temas

### Tema Azul Corporativo

```typescript
cssVariables: {
  primary: '220 90% 50%',           // Azul
  primaryForeground: '0 0% 100%',   // Blanco
  border: '220 20% 85%',            // Azul claro
}
```

### Tema Minimalista

```typescript
cssVariables: {
  background: '0 0% 98%',           // Casi blanco
  foreground: '0 0% 10%',           // Casi negro
  muted: '0 0% 92%',               // Gris muy claro
  border: '0 0% 88%',              // Gris claro
  radius: '0.25rem',                // Bordes más cuadrados
}
```

### Tema Oscuro Personalizado

```typescript
cssVariables: {
  background: '240 10% 8%',         // Muy oscuro
  foreground: '0 0% 95%',          // Casi blanco
  card: '240 8% 12%',              // Oscuro medio
  primary: '280 80% 60%',          // Morado
  muted: '240 5% 20%',             // Gris oscuro
  border: '240 5% 18%',            // Gris muy oscuro
}
```

## Inspeccionar Variables CSS

Para ver qué variables está usando el widget actualmente:

```javascript
// En la consola del navegador
const widget = document.getElementById('paseolibre-chat-widget');
const styles = getComputedStyle(widget);

console.log('Background:', styles.getPropertyValue('--background'));
console.log('Primary:', styles.getPropertyValue('--primary'));
console.log('Border:', styles.getPropertyValue('--border'));
```

## Mejores Prácticas

1. **Mantén consistencia**: Usa la misma paleta de colores en toda tu app
2. **Contraste adecuado**: Asegura legibilidad (WCAG AA: 4.5:1 para texto normal)
3. **Prueba dark mode**: Si ofreces dark mode en tu app, prueba el widget con clase `dark`
4. **Usa variables semánticas**: Los nombres describen el propósito, no el color
5. **Documenta tus valores**: Mantén una referencia de los colores HSL que usas

## Soporte

¿Tienes dudas sobre personalización? Revisa los ejemplos en `/examples` o consulta la [documentación completa](../INSTALLATION_GUIDE.md).
