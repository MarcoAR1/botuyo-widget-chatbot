# 🌍 Sistema de Internacionalización (i18n)

Sistema multi-idioma del Chat Widget con detección automática de idioma del navegador y persistencia en localStorage.

## 📋 Idiomas Soportados

- 🇪🇸 **Español (es)** - Idioma por defecto
- 🇬🇧 **Inglés (en)**
- 🇧🇷 **Portugués (pt)**
- 🇫🇷 **Francés (fr)**

## 🚀 Uso Básico

### Con ChatWidgetProvider (Recomendado)

```tsx
import { ChatWidgetProvider } from '@botuyo/chat-widget'

function App() {
  return (
    <ChatWidgetProvider
      apiKey="tu-api-key"
      apiBaseUrl="https://api.botuyo.com"
      defaultLocale="en" // Opcional: idioma inicial (auto-detectado si no se especifica)
    >
      <YourApp />
    </ChatWidgetProvider>
  )
}
```

### Con Hook useLanguage

```tsx
import { useLanguage } from '@botuyo/chat-widget'

function MyComponent() {
  const { locale, setLocale } = useLanguage()

  return (
    <div>
      <p>Idioma actual: {locale}</p>
      <button onClick={() => setLocale('en')}>English</button>
      <button onClick={() => setLocale('es')}>Español</button>
      <button onClick={() => setLocale('pt')}>Português</button>
      <button onClick={() => setLocale('fr')}>Français</button>
    </div>
  )
}
```

### Con Componente LanguageSelector

```tsx
import { LanguageSelector } from '@botuyo/chat-widget'

function MyHeader() {
  return (
    <header>
      <h1>Mi App</h1>

      {/* Dropdown con banderas */}
      <LanguageSelector variant="dropdown" showFlags />

      {/* O botones */}
      <LanguageSelector variant="buttons" />
    </header>
  )
}
```

## 🔧 Hook useTranslations

```tsx
import { useTranslations } from '@botuyo/chat-widget'

function MyComponent() {
  const { t, setLocale, currentLocale } = useTranslations()

  return (
    <div>
      <p>{t('online')}</p> {/* 'En línea' / 'Online' / etc */}
      <p>{t('extracted.cerrar')}</p> {/* Navegación anidada */}
    </div>
  )
}
```

## 🔍 Detección Automática

El sistema detecta automáticamente el idioma del navegador en el siguiente orden:

1. **Prop `defaultLocale`** en ChatWidgetProvider (si se proporciona)
2. **localStorage** (si existe preferencia guardada en `botuyo-chat-locale`)
3. **navigator.language** (idioma del navegador)
4. **Español** (fallback si no coincide ninguno)

## 💾 Persistencia

El idioma seleccionado se guarda automáticamente en `localStorage` con la clave `botuyo-chat-locale`, por lo que la preferencia del usuario se mantiene entre sesiones.

## 📖 API

Ver código fuente para documentación completa de tipos y funciones.
