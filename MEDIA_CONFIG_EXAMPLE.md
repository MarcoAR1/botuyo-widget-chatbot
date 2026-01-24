# 📎 Configuración de Funcionalidades Multimedia

## 🎯 Descripción

El ChatWidget ahora incluye una configuración completa para habilitar/deshabilitar funcionalidades multimedia de forma granular.

## 🔧 Configuración Disponible

### Interfaz `MediaConfig`

```typescript
export interface MediaConfig {
  /** Habilitar envío de imágenes (default: true) */
  enableImages?: boolean
  /** Habilitar grabación y envío de audio (default: true) */
  enableAudio?: boolean
  /** Habilitar envío de archivos (default: true) */
  enableFiles?: boolean
  /** Habilitar compartir ubicación (default: true) */
  enableLocation?: boolean
  /** Tipos de archivos permitidos (default: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip']) */
  allowedFileTypes?: string[]
  /** Tamaño máximo de archivo en MB (default: 10) */
  maxFileSizeMB?: number
}
```

## 📋 Ejemplos de Uso

### 1. Configuración por Defecto (Todo Habilitado)

```typescript
<ChatWidget
  apiKey="your-api-key"
  apiBaseUrl="https://api.example.com"
  // Sin mediaConfig, todas las funcionalidades están habilitadas
/>
```

### 2. Solo Texto (Sin Multimedia)

```typescript
<ChatWidget
  apiKey="your-api-key"
  apiBaseUrl="https://api.example.com"
  mediaConfig={{
    enableImages: false,
    enableAudio: false,
    enableFiles: false,
    enableLocation: false,
  }}
/>
```

### 3. Solo Imágenes y Archivos

```typescript
<ChatWidget
  apiKey="your-api-key"
  apiBaseUrl="https://api.example.com"
  mediaConfig={{
    enableImages: true,
    enableAudio: false,
    enableFiles: true,
    enableLocation: false,
    allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf'],
    maxFileSizeMB: 5,
  }}
/>
```

### 4. Solo Audio y Ubicación

```typescript
<ChatWidget
  apiKey="your-api-key"
  apiBaseUrl="https://api.example.com"
  mediaConfig={{
    enableImages: false,
    enableAudio: true,
    enableFiles: false,
    enableLocation: true,
  }}
/>
```

### 5. Archivos Personalizados (Solo Documentos)

```typescript
<ChatWidget
  apiKey="your-api-key"
  apiBaseUrl="https://api.example.com"
  mediaConfig={{
    enableImages: false,
    enableAudio: false,
    enableFiles: true,
    enableLocation: false,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'xlsx'],
    maxFileSizeMB: 20,
  }}
/>
```

### 6. Configuración Empresarial (Seguridad Estricta)

```typescript
<ChatWidget
  apiKey="your-api-key"
  apiBaseUrl="https://api.example.com"
  mediaConfig={{
    enableImages: true,
    enableAudio: false, // Deshabilitado por seguridad
    enableFiles: true,
    enableLocation: false, // Deshabilitado por privacidad
    allowedFileTypes: ['pdf', 'jpg', 'png'], // Solo documentos seguros
    maxFileSizeMB: 5, // Límite estricto
  }}
/>
```

## 🎨 Comportamiento de la UI

### Botón Plus (Adjuntar)

El botón "+" solo aparece si **al menos una** de las siguientes opciones está habilitada:
- `enableImages`
- `enableFiles`
- `enableLocation`

### Menú del Botón Plus

Las opciones del menú se muestran condicionalmente:

| Opción | Se muestra si... |
|--------|-----------------|
| 📷 Fotos | `enableImages === true` |
| 📎 Archivos | `enableFiles === true` |
| 📍 Ubicación | `enableLocation === true` |

### Botón de Micrófono

El botón de micrófono (cuando no hay texto escrito) solo aparece si:
- `enableAudio === true`
- `onSendAttachment` callback está definido

Si el audio está deshabilitado, se muestra directamente el botón de enviar.

## 📦 Tipos de Archivos Soportados

### Extensiones por Defecto

```typescript
allowedFileTypes: [
  'jpg', 'jpeg', 'png', 'webp', 'gif', // Imágenes
  'pdf',                                 // Documentos
  'doc', 'docx',                         // Microsoft Word
  'txt',                                 // Texto plano
  'zip'                                  // Archivos comprimidos
]
```

### Validación de Archivos

- ✅ **Magic Bytes**: Verifica el tipo real del archivo (no solo la extensión)
- ✅ **Tamaño Máximo**: Configurable vía `maxFileSizeMB`
- ✅ **Tipo MIME**: Valida que el tipo MIME coincida con la extensión

## 🚀 Nuevas Funcionalidades

### 1. Envío de Archivos Adjuntos

Ahora puedes enviar cualquier tipo de archivo (no solo imágenes):

```typescript
// El widget enviará el archivo como tipo 'file'
onSendAttachment={(file, type) => {
  if (type === 'file') {
    console.log('Archivo adjunto:', file.name, file.type)
    // Subir a tu servidor
  }
}}
```

### 2. Nuevo Tipo de Mensaje: FileMessage

```typescript
export interface FileMessage extends BaseMessage {
  type: 'file'
  fileUrl: string
  fileName: string
  fileSize?: number
  mimeType?: string
}
```

### 3. Renderizado de Archivos en el Chat

Los archivos adjuntos se muestran con:
- 📎 Icono de archivo
- Nombre del archivo
- Tamaño (si está disponible)
- Extensión (PDF, DOCX, etc.)
- Botón de descarga

## 🎯 Casos de Uso Reales

### Chat de Soporte Técnico

```typescript
mediaConfig={{
  enableImages: true,      // Screenshots de errores
  enableFiles: true,       // Logs, archivos de configuración
  enableAudio: false,      // No necesario
  enableLocation: false,   // No necesario
  allowedFileTypes: ['jpg', 'png', 'txt', 'log', 'json', 'pdf'],
  maxFileSizeMB: 10,
}}
```

### Chat de Ventas/Comercial

```typescript
mediaConfig={{
  enableImages: true,      // Fotos de productos
  enableFiles: true,       // Catálogos PDF
  enableAudio: true,       // Mensajes de voz personalizados
  enableLocation: true,    // Ubicación de tiendas
  allowedFileTypes: ['jpg', 'png', 'pdf'],
  maxFileSizeMB: 5,
}}
```

### Chat de Atención Médica

```typescript
mediaConfig={{
  enableImages: true,      // Estudios médicos
  enableFiles: true,       // Resultados de laboratorio
  enableAudio: false,      // Privacidad
  enableLocation: false,   // Privacidad
  allowedFileTypes: ['jpg', 'png', 'pdf', 'dicom'],
  maxFileSizeMB: 20,       // Archivos médicos pueden ser grandes
}}
```

### Chat Público/Marketing

```typescript
mediaConfig={{
  enableImages: false,     // Evitar spam
  enableFiles: false,      // Evitar archivos maliciosos
  enableAudio: false,      // Solo texto
  enableLocation: false,   // Privacidad
}}
```

## ⚙️ Valores por Defecto

Si no se proporciona `mediaConfig`, estos son los valores por defecto:

```typescript
const DEFAULT_MEDIA_CONFIG: MediaConfig = {
  enableImages: true,
  enableAudio: true,
  enableFiles: true,
  enableLocation: true,
  allowedFileTypes: [
    'jpg', 'jpeg', 'png', 'webp', 'gif',
    'pdf', 'doc', 'docx', 'txt', 'zip'
  ],
  maxFileSizeMB: 10,
}
```

## 🔐 Consideraciones de Seguridad

### Recomendaciones

1. **Validación del Servidor**: Siempre valida los archivos en el backend, no confíes solo en la validación del cliente
2. **Escaneo de Malware**: Usa servicios como ClamAV o VirusTotal para archivos subidos
3. **Límites de Tamaño**: Ajusta `maxFileSizeMB` según tu infraestructura
4. **Tipos Permitidos**: Restringe `allowedFileTypes` solo a lo necesario
5. **Almacenamiento**: Considera usar servicios como AWS S3, Azure Blob Storage o Cloudflare R2

## 📊 Migración desde Versiones Anteriores

### Antes (sin configuración)

```typescript
<ChatWidget
  apiKey="key"
  apiBaseUrl="url"
  onSendAttachment={handleAttachment} // Solo imágenes
  onSendLocation={handleLocation}
/>
```

### Después (con configuración explícita)

```typescript
<ChatWidget
  apiKey="key"
  apiBaseUrl="url"
  mediaConfig={{
    enableImages: true,
    enableFiles: true,   // Nueva funcionalidad
    enableAudio: true,
    enableLocation: true,
  }}
  onSendAttachment={handleAttachment} // Ahora soporta imágenes, audio Y archivos
  onSendLocation={handleLocation}
/>
```

## 🎨 Personalización Avanzada

### Configuración Dinámica según Usuario

```typescript
const getUserMediaConfig = (userRole: string): MediaConfig => {
  switch (userRole) {
    case 'admin':
      return {
        enableImages: true,
        enableFiles: true,
        enableAudio: true,
        enableLocation: true,
        maxFileSizeMB: 50,
      }
    case 'user':
      return {
        enableImages: true,
        enableFiles: true,
        enableAudio: false,
        enableLocation: false,
        maxFileSizeMB: 10,
      }
    case 'guest':
      return {
        enableImages: false,
        enableFiles: false,
        enableAudio: false,
        enableLocation: false,
      }
    default:
      return {}
  }
}

<ChatWidget
  apiKey="key"
  apiBaseUrl="url"
  mediaConfig={getUserMediaConfig(currentUser.role)}
/>
```

## 📝 Notas Importantes

1. ✅ La configuración se aplica en **tiempo real** - no requiere reiniciar el widget
2. ✅ Si **todas** las opciones multimedia están deshabilitadas, el botón "+" no se muestra
3. ✅ Los archivos de **imagen** se comprimen automáticamente antes de enviar (si `enableImages: true`)
4. ✅ La validación de **Magic Bytes** previene ataques de cambio de extensión
5. ✅ El componente es **retrocompatible** - funciona sin `mediaConfig`

---

**Última Actualización**: Enero 2026  
**Versión**: 1.0.0
