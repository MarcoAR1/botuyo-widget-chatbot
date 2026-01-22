/**
 * Sistema de internacionalización del Chat Widget
 * Traducciones en español por defecto
 */

export const translations = {
  es: {
    // Estado de conexión
    online: 'En línea',
    offline: 'Desconectado',
    
    // Footer
    con_amor_paseo_libre: 'Con ❤️ por Paseo Libre',
    
    // Input area
    preview: 'Vista previa',
    fotos: 'Fotos',
    ubicacion: 'Ubicación',
    
    // Extracted (común)
    extracted: {
      assistant: 'Asistente',
      anterior: 'Anterior',
      siguiente: 'Siguiente',
      cerrar: 'Cerrar',
      ver_ubicacion: 'Ver ubicación',
    },
  },
  en: {
    // Connection status
    online: 'Online',
    offline: 'Offline',
    
    // Footer
    con_amor_paseo_libre: 'With ❤️ by Paseo Libre',
    
    // Input area
    preview: 'Preview',
    fotos: 'Photos',
    ubicacion: 'Location',
    
    // Extracted (common)
    extracted: {
      assistant: 'Assistant',
      anterior: 'Previous',
      siguiente: 'Next',
      cerrar: 'Close',
      ver_ubicacion: 'View location',
    },
  },
} as const

export type Locale = keyof typeof translations
export type TranslationKey = keyof typeof translations.es
export type ExtractedKey = keyof typeof translations.es.extracted

// Tipo helper para acceder a las traducciones
type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${DeepKeys<T[K]>}` | K
          : K
        : never
    }[keyof T]
  : never

export type TranslationPath = DeepKeys<typeof translations.es>
