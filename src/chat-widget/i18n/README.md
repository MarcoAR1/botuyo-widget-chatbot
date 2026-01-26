# Sistema de Internacionalización (i18n)

Sistema de internacionalización personalizado para el Chat Widget de BotUyo, diseñado para reemplazar next-intl y eliminar dependencias externas.

## Arquitectura

```
src/chat-widget/i18n/
├── index.ts           # Exportaciones centralizadas
├── translations.ts    # Diccionario de traducciones
├── useTranslations.ts # Hook de React para acceder a traducciones
└── README.md         # Esta documentación
```

## Uso en Componentes

### Hook useTranslations()

```typescript
import { useTranslations } from '@/chat-widget/i18n'

function MyComponent() {
  const t = useTranslations()
  
  return (
    <div>
      <h1>{t('online')}</h1>
      <p>{t('extracted.cerrar')}</p>
    </div>
  )
}
```

### Con Namespace

```typescript
const t = useTranslations('extracted')

// Ahora 'extracted.' se antepone automáticamente
t('cerrar') // → 'Cerrar'
t('anterior') // → 'Anterior'
```

### Función t() directa

Para uso fuera de componentes React:

```typescript
import { t } from '@/chat-widget/i18n'

const mensaje = t('online') // → 'En línea'
const texto = t('extracted.ver_ubicacion') // → 'Ver ubicación'
```

## Traducciones Disponibles

### Claves de Primer Nivel

- `online` - Estado en línea
- `offline` - Estado fuera de línea
- `con_amor_paseo_libre` - Mensaje de footer
- `preview` - Vista previa
- `fotos` - Etiqueta de fotos
- `ubicacion` - Etiqueta de ubicación

### Namespace: extracted

- `extracted.assistant` - Nombre del asistente
- `extracted.anterior` - Botón anterior
- `extracted.siguiente` - Botón siguiente
- `extracted.cerrar` - Botón cerrar
- `extracted.ver_ubicacion` - Ver ubicación en mapa

## Agregar Nuevas Traducciones

1. Abre [translations.ts](./translations.ts)
2. Agrega la clave en ambos idiomas (es/en):

```typescript
export const translations = {
  es: {
    // ... traducciones existentes
    nueva_clave: 'Nuevo texto en español',
  },
  en: {
    // ... traducciones existentes
    nueva_clave: 'New text in English',
  },
}
```

3. Usa la nueva clave en tu componente:

```typescript
const t = useTranslations()
t('nueva_clave') // → 'Nuevo texto en español'
```

## Idiomas Soportados

- **Español (es)**: Idioma por defecto
- **Inglés (en)**: Disponible para expansión futura

Por ahora el widget usa español por defecto. Para agregar soporte multi-idioma dinámico, se puede extender `useTranslations` para detectar el idioma del navegador o permitir configuración manual.

## Ventajas vs next-intl

✅ **Sin dependencias externas** - No requiere next-intl  
✅ **Más ligero** - Código mínimo, sin peso extra  
✅ **Standalone** - Compatible con CDN y NPM  
✅ **TypeScript nativo** - Types completos incluidos  
✅ **Simple** - API intuitiva y fácil de mantener  

## Migración desde next-intl

El sistema es 100% compatible con la API de next-intl usada en el widget:

```typescript
// Antes (next-intl)
import { useTranslations } from 'next-intl'

// Después (sistema propio)
import { useTranslations } from '@/chat-widget/i18n'

// La API es idéntica
const t = useTranslations()
t('online') // Funciona igual
```

## Extensiones Futuras

- [ ] Detección automática de idioma del navegador
- [ ] API para cambiar idioma dinámicamente
- [ ] Interpolación de variables en traducciones
- [ ] Pluralización inteligente
- [ ] Formateo de fechas y números localizados
