# 🎨 Design System - BotUyo Chat Widget

## Variables CSS de Spacing

El widget utiliza un sistema de espaciado configurable mediante CSS variables que garantiza consistencia en todos los componentes.

### Variables Disponibles

```css
--spacing-1: 0.25rem;  /* 4px  - Extra small */
--spacing-2: 0.5rem;   /* 8px  - Small */
--spacing-3: 0.75rem;  /* 12px - Medium small */
--spacing-4: 1rem;     /* 16px - Medium */
--spacing-5: 0.75rem;  /* 12px - Default padding */
--spacing-6: 1.5rem;   /* 24px - Large */
--spacing-8: 2rem;     /* 32px - Extra large */
```

### Uso en Componentes

Todos los componentes principales usan estas variables:

**ChatWindow:**
- Header padding: `var(--spacing-5)` (12px)
- Main content padding: `var(--spacing-5)` (12px)
- Footer padding: `var(--spacing-5)` horizontal, `var(--spacing-3)` vertical

**MessageList:**
- Container padding: `var(--spacing-5)` (12px)
- Gap entre mensajes: `var(--spacing-3)` (12px)

**MessageBubble:**
- Padding interno: `var(--spacing-4)` vertical, `var(--spacing-5)` horizontal

**InputArea:**
- Container padding: `var(--spacing-5)` (20px)

## Configuración Personalizada

Puedes personalizar el spacing pasando las variables en el tema:

```typescript
PaseoLibreChat.init({
  theme: {
    cssVariables: {
      // Spacing compacto
      spacing1: '0.125rem',  // 2px
      spacing2: '0.25rem',   // 4px
      spacing3: '0.5rem',    // 8px
      spacing4: '0.75rem',   // 12px
      spacing5: '0.875rem',  // 14px
      spacing6: '1rem',      // 16px
      spacing8: '1.5rem',    // 24px
    }
  }
})
```

## Temas Predefinidos

### Compact Theme
Spacing reducido para interfaces densas:
```typescript
spacing1: '0.125rem',  // 2px
spacing2: '0.25rem',   // 4px
spacing3: '0.5rem',    // 8px
spacing4: '0.75rem',   // 12px
spacing5: '0.875rem',  // 14px
spacing6: '1rem',      // 16px
spacing8: '1.5rem',    // 24px
```

### Spacious Theme
Spacing amplio para interfaces más respirables:
```typescript
spacing1: '0.375rem',  // 6px
spacing2: '0.75rem',   // 12px
spacing3: '1rem',      // 16px
spacing4: '1.5rem',    // 24px
spacing5: '1.75rem',   // 28px
spacing6: '2rem',      // 32px
spacing8: '2.5rem',    // 40px
```

## Mejores Prácticas

1. **Usa siempre las variables CSS** en lugar de valores hardcodeados
2. **Mantén la jerarquía**: spacing-1 < spacing-2 < spacing-3, etc.
3. **Spacing semántico**:
   - spacing-1, spacing-2: Gaps pequeños (iconos, badges)
   - spacing-3, spacing-4: Spacing interno de componentes
   - spacing-5, spacing-6: Padding de containers
   - spacing-8: Separaciones grandes (secciones)

## Arquitectura

El sistema de spacing se aplica en 3 capas:

1. **styles.css**: Define valores por defecto globales
2. **standalone.tsx**: Aplica variables personalizadas del tema al root container
3. **Componentes**: Consumen variables mediante `var(--spacing-X)`

```
┌─────────────────────────────────────┐
│ Theme Config (usuario)              │
│  cssVariables: { spacing4: '1.5rem' }│
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ standalone.tsx                       │
│  container.style.setProperty()       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Componentes                          │
│  padding: var(--spacing-5)          │
└─────────────────────────────────────┘
```

## Compatibilidad

✅ Funciona con dark mode
✅ Responsive (mobile y desktop)
✅ Compatible con todos los temas
✅ No requiere rebuild para cambios
