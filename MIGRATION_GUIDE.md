# Guía de Migración a Repositorio Independiente

Esta guía explica cómo migrar esta rama (`chatbot-standalone-only`) a un repositorio completamente nuevo e independiente.

---

## 📋 Objetivo

Crear un repositorio nuevo `paseo-chat-widget` que contenga **solo** el código del chatbot standalone, sin el historial de Paseo Libre.

---

## 🚀 Paso 1: Crear Repositorio Nuevo en GitHub

### 1.1 Via GitHub Web

1. Ir a https://github.com/new
2. Configurar:
   - **Repository name**: `paseo-chat-widget`
   - **Description**: "Standalone embeddable chat widget for any website - Powered by Paseo Libre"
   - **Visibility**: Public (o Private si prefieres)
   - **NO inicializar con README** (ya tenemos uno)

3. Click en "Create repository"

### 1.2 Via GitHub CLI (Alternativa)

```bash
gh repo create paseo-chat-widget \
  --public \
  --description "Standalone embeddable chat widget for any website" \
  --source=.
```

---

## 🔄 Paso 2: Migrar Código a Nuevo Repositorio

### 2.1 Cambiar Remote Origin

```bash
# Estando en la rama chatbot-standalone-only
git remote -v
# Deberías ver: origin https://github.com/tu-usuario/paseo-libre

# Cambiar origin al nuevo repo
git remote remove origin
git remote add origin https://github.com/tu-usuario/paseo-chat-widget.git

# Verificar
git remote -v
# Ahora debería apuntar a paseo-chat-widget
```

### 2.2 Push Inicial

```bash
# Push de la rama principal
git push -u origin chatbot-standalone-only

# Renombrar la rama a main (estándar)
git branch -m chatbot-standalone-only main
git push origin -u main

# Eliminar la rama antigua del remote (opcional)
git push origin --delete chatbot-standalone-only
```

---

## 🏗️ Paso 3: Configurar GitHub Repository

### 3.1 Configurar Rama Principal

1. Ir a **Settings → General → Default branch**
2. Cambiar a `main`

### 3.2 Agregar Topics/Tags

1. Ir a **About** (rueda de configuración en la esquina superior derecha)
2. Agregar topics:
   - `chat-widget`
   - `chatbot`
   - `socket-io`
   - `react`
   - `cdn`
   - `standalone`
   - `embeddable`
   - `customer-support`

### 3.3 Configurar Descripción y Website

- **Description**: "Standalone embeddable chat widget for any website - Powered by Paseo Libre"
- **Website**: `https://paseolibre.com/chat-widget` (o tu URL de documentación)

### 3.4 Habilitar GitHub Pages (Demo)

1. **Settings → Pages**
2. **Source**: Deploy from a branch
3. **Branch**: `main` → `/` (root)
4. Esto publicará `index.html` en: `https://tu-usuario.github.io/paseo-chat-widget/`

---

## 📦 Paso 4: Publicar en NPM

### 4.1 Crear Cuenta en NPM (si no tienes)

```bash
npm adduser
# Ingresar username, password, email
```

### 4.2 Actualizar package.json

```json
{
  "name": "@paseolibre/chat-widget",
  "version": "1.0.0",
  "description": "Standalone embeddable chat widget for any website",
  "author": "Paseo Libre <dev@paseolibre.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/tu-usuario/paseo-chat-widget.git"
  },
  "homepage": "https://github.com/tu-usuario/paseo-chat-widget#readme",
  "bugs": {
    "url": "https://github.com/tu-usuario/paseo-chat-widget/issues"
  }
}
```

### 4.3 Publicar

```bash
# Build primero
npm run build

# Publicar (scope público)
npm publish --access public
```

### 4.4 Verificar Publicación

```bash
# Ver en npmjs.com
open https://www.npmjs.com/package/@paseolibre/chat-widget

# Instalar para probar
npm install @paseolibre/chat-widget
```

---

## 🔐 Paso 5: Configurar GitHub Actions (CI/CD)

### 5.1 Crear Workflow para Build y Tests

Crear `.github/workflows/build.yml`:

```yaml
name: Build and Test

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/
```

### 5.2 Crear Workflow para Auto-Deploy a NPM

Crear `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        registry-url: 'https://registry.npmjs.org'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Publish to NPM
      run: npm publish --access public
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 5.3 Configurar Secrets

1. Generar NPM Token:
   ```bash
   npm token create
   ```

2. Ir a **GitHub → Settings → Secrets → Actions**
3. Crear secret:
   - **Name**: `NPM_TOKEN`
   - **Value**: Tu token de NPM

---

## 📝 Paso 6: Documentación Adicional

### 6.1 Crear CONTRIBUTING.md

```markdown
# Contributing to Paseo Chat Widget

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`
4. Build: `npm run build`

## Pull Request Process

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run tests (if any)
5. Submit PR

## Code Style

- Use TypeScript
- Follow ESLint rules
- Add JSDoc comments
```

### 6.2 Crear CHANGELOG.md

```markdown
# Changelog

## [1.0.0] - 2026-01-21

### Added
- Initial release
- React-based chat widget
- Socket.IO integration
- CDN distribution (IIFE bundle)
- NPM package support
- Configurable theming
- Mobile responsive
- Dark mode support
```

### 6.3 Actualizar README.md

Agregar badges al inicio:

```markdown
# Paseo Libre Chat Widget

[![npm version](https://badge.fury.io/js/@paseolibre%2Fchat-widget.svg)](https://www.npmjs.com/package/@paseolibre/chat-widget)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://github.com/tu-usuario/paseo-chat-widget/workflows/Build%20and%20Test/badge.svg)](https://github.com/tu-usuario/paseo-chat-widget/actions)
```

---

## 🔗 Paso 7: Integración con CDN

### 7.1 Configurar GitHub Releases

1. Ir a **Releases** → **Draft a new release**
2. **Tag version**: `v1.0.0`
3. **Release title**: `v1.0.0 - Initial Release`
4. **Description**: Copiar desde CHANGELOG.md
5. **Attach binaries**: Subir `dist/paseo-libre-chat.js` y `.css`

### 7.2 Usar jsDelivr (CDN Gratis para GitHub)

Una vez publicado en GitHub, los archivos estarán disponibles en:

```html
<!-- Via jsDelivr (CDN gratis) -->
<script src="https://cdn.jsdelivr.net/gh/tu-usuario/paseo-chat-widget@latest/dist/paseo-libre-chat.js"></script>

<!-- Versión específica -->
<script src="https://cdn.jsdelivr.net/gh/tu-usuario/paseo-chat-widget@1.0.0/dist/paseo-libre-chat.js"></script>

<!-- Via unpkg (CDN alternativo) -->
<script src="https://unpkg.com/@paseolibre/chat-widget@latest/dist/paseo-libre-chat.js"></script>
```

---

## 🎯 Paso 8: Marketing y Distribución

### 8.1 Sitio Web de Documentación

Crear GitHub Pages con documentación interactiva:

1. Crear carpeta `docs/`
2. Agregar `docs/index.html` con ejemplos interactivos
3. Configurar GitHub Pages para usar `/docs`

### 8.2 Demo en CodePen/JSFiddle

Crear demos interactivos en:
- CodePen: https://codepen.io/
- JSFiddle: https://jsfiddle.net/
- CodeSandbox: https://codesandbox.io/

### 8.3 Promover en Comunidades

- Dev.to (artículo tutorial)
- Reddit (r/webdev, r/javascript)
- Hacker News
- Product Hunt
- Twitter/LinkedIn

---

## ✅ Checklist Post-Migración

- [ ] Repositorio creado en GitHub
- [ ] Código pusheado a main branch
- [ ] GitHub Pages habilitado
- [ ] NPM package publicado
- [ ] GitHub Actions configurado
- [ ] README.md actualizado con badges
- [ ] CONTRIBUTING.md creado
- [ ] CHANGELOG.md creado
- [ ] LICENSE agregado
- [ ] Primera release (v1.0.0) creada
- [ ] CDN configurado (jsDelivr o AWS)
- [ ] Documentación online publicada
- [ ] Demo interactivo creado

---

## 🔄 Workflow de Desarrollo Futuro

### Para nuevas features:

```bash
# 1. Crear feature branch
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios
git add .
git commit -m "feat: agregar nueva funcionalidad"

# 3. Push y crear PR
git push origin feature/nueva-funcionalidad

# 4. Merge a main via PR

# 5. Crear nueva release
git tag v1.1.0
git push origin v1.1.0

# 6. GitHub Actions auto-publica a NPM
```

### Para hotfixes:

```bash
git checkout -b hotfix/bug-critico
git commit -m "fix: resolver bug crítico"
git push origin hotfix/bug-critico
# Merge urgente a main
git tag v1.0.1
git push origin v1.0.1
```

---

## 📞 Soporte

Si tienes problemas durante la migración:

1. Revisar GitHub Actions logs
2. Verificar NPM publish logs
3. Abrir issue en el repo nuevo
4. Contactar: dev@paseolibre.com

---

**Estado**: ✅ Guía completa  
**Última actualización**: Enero 2026  
**Mantenedor**: Equipo Paseo Libre
