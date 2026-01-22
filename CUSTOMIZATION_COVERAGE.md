# 🎨 Cobertura Completa de Personalización

Este documento detalla **TODAS** las partes del chatbot que puedes personalizar usando el sistema de temas.

## ✅ Componentes Totalmente Personalizables

### 1. **ChatWidget** (Contenedor Principal)
- ✅ Fondo del contenedor
- ✅ Todos los colores CSS del tema aplicados
- ✅ Estilos inline garantizados

### 2. **ChatWindow** (Ventana de Chat)
- ✅ Fondo de la ventana
- ✅ Color del borde
- ✅ Color del texto principal
- ✅ Header con fondo semitransparente
- ✅ Área de contenido con fondo muted
- ✅ Footer con fondo del tema

### 3. **Launcher** (Botón Flotante)
- ✅ Color de fondo del botón (primaryColor)
- ✅ Burbuja de prompt (fondo, texto, borde)
- ✅ Sombras personalizables

### 4. **InputArea** (Área de Entrada)
- ✅ Fondo del contenedor (95% opacidad)
- ✅ Bordes del input
- ✅ Color del texto
- ✅ Preview de adjuntos (fondo, borde)
- ✅ Botones del menú (fondo, borde, texto)
- ✅ Estado de grabación (color destructivo)

### 5. **MessageBubble** (Burbujas de Mensajes)
- ✅ **Mensajes del usuario:**
  - Color de fondo (brandColor)
  - Color del texto
  - Sombras personalizadas
- ✅ **Mensajes del bot:**
  - Fondo (solidStyles.card)
  - Borde (solidStyles.border)
  - Color del texto (solidStyles.foreground)
- ✅ **Mensajes del sistema:**
  - Fondo (solidStyles.muted)
  - Borde (solidStyles.border)
  - Color del texto (solidStyles.mutedForeground)
- ✅ **Avatar del bot:**
  - Fondo (solidStyles.background)
  - Borde (solidStyles.border)
  - Color de placeholder (brandColor)

### 6. **TypingIndicator** (Indicador de Escritura)
- ✅ Fondo del contenedor (solidStyles.card)
- ✅ Color del borde (solidStyles.border)
- ✅ Puntos animados con color primario (40% opacidad)

### 7. **Gallery** (Galería de Imágenes)
- ✅ **Imágenes individuales:**
  - Bordes personalizables
- ✅ **Carrusel:**
  - Bordes de imagen principal
  - Botones de navegación (fondo, color)
- ✅ **Lightbox:**
  - Fondo oscuro semitransparente
  - Botones sobre la imagen (cerrar, navegación)
  - Contador de imágenes

### 8. **AudioPlayer** (Reproductor de Audio)
- ✅ **Botón de play/pause:**
  - Color de fondo (brandColor para bot, solidStyles.card para usuario)
  - Color del icono
- ✅ Barra de progreso
- ✅ Temporizador

## 🎯 Variables CSS Disponibles

Todas estas variables afectan directamente a los componentes:

```typescript
interface CSSVariables {
  background: string        // Fondo principal
  foreground: string        // Texto principal
  card: string             // Fondo de tarjetas
  cardForeground: string   // Texto en tarjetas
  popover: string          // Fondo de popovers
  popoverForeground: string // Texto en popovers
  primary: string          // Color primario/marca
  primaryForeground: string // Texto sobre primario
  muted: string            // Fondos atenuados
  mutedForeground: string  // Texto atenuado
  border: string           // Color de bordes
  destructive: string      // Color de error/grabación
}
```

## 📋 Formato HSL Requerido

**IMPORTANTE:** Todas las variables deben usar formato HSL **sin** `hsl()`:

```typescript
✅ CORRECTO:
cssVariables: {
  background: '0 0% 100%',      // Blanco
  foreground: '222.2 84% 4.9%', // Casi negro
  primary: '160 84% 39%',       // Verde Paseo Libre
}

❌ INCORRECTO:
cssVariables: {
  background: 'hsl(0, 0%, 100%)',  // NO usar hsl()
  foreground: '#ffffff',           // NO usar hex
  primary: 'rgb(255, 255, 255)',   // NO usar rgb
}
```

## 🚀 Ejemplos de Uso Completo

### Tema Personalizado Completo
```typescript
PaseoLibreChat.init({
  serverUrl: 'http://localhost:3000',
  theme: {
    primaryColor: 'hsl(160, 84%, 39%)', // Verde Paseo Libre
    cssVariables: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      cardForeground: '222.2 84% 4.9%',
      popover: '0 0% 100%',
      popoverForeground: '222.2 84% 4.9%',
      primary: '160 84% 39%',
      primaryForeground: '210 40% 98%',
      muted: '210 40% 96.1%',
      mutedForeground: '215.4 16.3% 46.9%',
      border: '214.3 31.8% 91.4%',
      destructive: '0 84.2% 60.2%',
    },
  },
})
```

### Tema Oscuro
```typescript
PaseoLibreChat.init({
  serverUrl: 'http://localhost:3000',
  theme: {
    primaryColor: 'hsl(160, 84%, 39%)',
    cssVariables: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      cardForeground: '210 40% 98%',
      popover: '222.2 84% 4.9%',
      popoverForeground: '210 40% 98%',
      primary: '160 84% 39%',
      primaryForeground: '222.2 47.4% 11.2%',
      muted: '217.2 32.6% 17.5%',
      mutedForeground: '215 20.2% 65.1%',
      border: '217.2 32.6% 17.5%',
      destructive: '0 62.8% 30.6%',
    },
  },
})
```

## 🎨 Temas Predefinidos Disponibles

Puedes importar y usar estos temas directamente:

```typescript
import { PASEO_LIBRE_THEME, PASEO_LIBRE_DARK_THEME, CORPORATE_BLUE_THEME, MINIMALIST_THEME } from './dist/paseo-libre-chat.js'

// Usar tema predefinido
PaseoLibreChat.init({
  serverUrl: 'http://localhost:3000',
  theme: PASEO_LIBRE_DARK_THEME,
})
```

## 🔧 Partes NO Personalizables (Fijas)

Estas partes tienen estilos fijos por razones funcionales:

- ❌ Lightbox overlay (siempre fondo negro 95% opacidad)
- ❌ Badges de contador en galería (siempre negro con blur)
- ❌ Gradientes de overlay en imágenes (negro semitransparente)
- ❌ Animaciones de framer-motion (timing y curvas)

## ✨ Garantías del Sistema

1. **100% Inline Styles:** Todos los colores críticos usan estilos inline, no dependen de Tailwind
2. **Fallbacks Siempre Presentes:** Si falta una variable, se usa el valor por defecto
3. **TypeScript Completo:** Autocompletado y validación de tipos
4. **Dark Mode Ready:** Sistema preparado para modo oscuro
5. **Sin Clases Tailwind Rotas:** Los estilos inline garantizan que siempre se vean

## 📚 Documentación Relacionada

- [THEME_GUIDE.md](./THEME_GUIDE.md) - Guía completa de temas
- [QUICK_THEME_SETUP.md](./QUICK_THEME_SETUP.md) - Setup rápido
- [CSS_CUSTOMIZATION.md](./CSS_CUSTOMIZATION.md) - Detalles técnicos
- [theme.examples.ts](./src/chat-widget/utils/theme.examples.ts) - 10 ejemplos de código

## 🎯 Resumen

**SÍ, puedes cambiar TODAS las partes visuales del bot** usando el sistema de temas:

✅ Colores de fondo de todos los componentes  
✅ Colores de texto en todos los estados  
✅ Bordes y sombras  
✅ Burbujas de mensajes (bot y usuario)  
✅ Botones y controles  
✅ Avatar del bot  
✅ Indicador de escritura  
✅ Galería de imágenes  
✅ Reproductor de audio  
✅ Área de input  
✅ Ventana principal  
✅ Launcher flotante  

**El sistema está 100% completo y listo para usar.**
