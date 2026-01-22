# 🔄 Migración a Repositorio Independiente

Guía paso a paso para migrar el Chatbot Widget a su propio repositorio Git.

## 📋 Tabla de Contenidos

1. [Preparación](#preparación)
2. [Crear Nuevo Repositorio](#crear-nuevo-repositorio)
3. [Migrar Código](#migrar-código)
4. [Configurar CI/CD](#configurar-cicd)
5. [Publicar a NPM](#publicar-a-npm)
6. [Deploy a CDN](#deploy-a-cdn)

---

## 1. Preparación

### 1.1 Verificar Estado Actual

```bash
cd /Users/A446116/Documents/persona-projects/paseo-libre
git checkout feature/chatbot-cdn-standalone
git pull origin feature/chatbot-cdn-standalone
```

### 1.2 Verificar Build Funcional

```bash
cd chatbot-cdn
npm install
npm run build
npm run dev  # Test local
```

---

## 2. Crear Nuevo Repositorio

### 2.1 En GitHub/GitLab

1. Ir a GitHub/GitLab
2. Crear nuevo repositorio:
   - **Nombre**: `paseolibre-chatbot-widget`
   - **Visibilidad**: Private (por ahora)
   - **Descripción**: "AI-powered chatbot widget for websites"
   - **NO** inicializar con README, .gitignore, o licencia

### 2.2 Estructura Recomendada

```
paseolibre-chatbot-widget/
├── src/              # Código fuente (copiar de chatbot-cdn/src/)
├── dist/             # Build outputs (generado)
├── docs/             # Documentación pública
├── examples/         # Ejemplos de integración
│   ├── html/         # Ejemplo CDN
│   ├── react/        # Ejemplo React
│   ├── nextjs/       # Ejemplo Next.js
│   └── vue/          # Ejemplo Vue
├── .github/
│   └── workflows/    # GitHub Actions
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── .gitignore
├── .env.example
├── README.md
├── LICENSE
└── CHANGELOG.md
```

---

## 3. Migrar Código

### 3.1 Método 1: Copia Directa (Recomendado)

```bash
# 1. Crear directorio del nuevo repo
mkdir -p ~/Documents/paseolibre-chatbot-widget
cd ~/Documents/paseolibre-chatbot-widget

# 2. Inicializar Git
git init
git branch -M main

# 3. Copiar archivos desde chatbot-cdn
cp -r /Users/A446116/Documents/persona-projects/paseo-libre/chatbot-cdn/* .

# 4. Eliminar archivos de Next.js específicos (si hay)
rm -rf node_modules/
rm -f package-lock.json

# 5. Actualizar package.json
# (Ver sección 3.2)

# 6. Commit inicial
git add .
git commit -m "feat: initial chatbot widget standalone repository"

# 7. Conectar con GitHub
git remote add origin https://github.com/paseolibre/paseolibre-chatbot-widget.git
git push -u origin main
```

### 3.2 Actualizar package.json

Edita `package.json`:

```json
{
  "name": "@paseolibre/chatbot-widget",
  "version": "1.0.0",
  "description": "AI-powered chatbot widget for websites with Socket.IO and Google Gemini",
  "main": "./dist/chatbot.umd.js",
  "module": "./dist/chatbot.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/chatbot.es.js",
      "require": "./dist/chatbot.umd.js",
      "types": "./dist/index.d.ts"
    },
    "./dist/chatbot.css": "./dist/chatbot.css"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "prepublishOnly": "npm run build",
    "test": "echo 'Tests coming soon' && exit 0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/paseolibre/paseolibre-chatbot-widget.git"
  },
  "keywords": [
    "chatbot",
    "widget",
    "ai",
    "customer-support",
    "socket.io",
    "gemini",
    "paseolibre"
  ],
  "author": "Paseo Libre",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/paseolibre/paseolibre-chatbot-widget/issues"
  },
  "homepage": "https://github.com/paseolibre/paseolibre-chatbot-widget#readme",
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "socket.io-client": "^4.8.1",
    "lucide-react": "^0.469.0",
    "framer-motion": "^11.15.0",
    "date-fns": "^4.1.0",
    "browser-image-compression": "^2.0.2"
  },
  "devDependencies": {
    "@types/node": "^22.10.5",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.6.2",
    "vite": "^6.0.5",
    "vite-plugin-dts": "^4.3.0"
  }
}
```

### 3.3 Método 2: Subtree Split (Alternativo)

Si quieres preservar el historial Git completo del directorio:

```bash
# Desde el repo principal de paseo-libre
cd /Users/A446116/Documents/persona-projects/paseo-libre

# Crear branch con solo el contenido de chatbot-cdn
git subtree split --prefix=chatbot-cdn -b chatbot-widget-history

# Crear nuevo repo
mkdir ~/Documents/paseolibre-chatbot-widget
cd ~/Documents/paseolibre-chatbot-widget
git init
git pull ~/Documents/persona-projects/paseo-libre chatbot-widget-history

# Conectar con GitHub
git remote add origin https://github.com/paseolibre/paseolibre-chatbot-widget.git
git push -u origin main

# Limpiar branch temporal
cd /Users/A446116/Documents/persona-projects/paseo-libre
git branch -D chatbot-widget-history
```

---

## 4. Configurar CI/CD

### 4.1 GitHub Actions - Build & Test

Crear `.github/workflows/build.yml`:

```yaml
name: Build & Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Test
      run: npm test
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: dist-${{ matrix.node-version }}
        path: dist/
```

### 4.2 GitHub Actions - Publish to NPM

Crear `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
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

### 4.3 GitHub Actions - Deploy to CDN

Crear `.github/workflows/deploy-cdn.yml`:

```yaml
name: Deploy to CDN

on:
  release:
    types: [published]
  workflow_dispatch: # Manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    # Option A: Cloudflare R2
    - name: Deploy to Cloudflare R2
      env:
        CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
      run: |
        npm install -g wrangler
        wrangler r2 object put chatbot-cdn/v1/chatbot.umd.js --file dist/chatbot.umd.js
        wrangler r2 object put chatbot-cdn/v1/chatbot.es.js --file dist/chatbot.es.js
        wrangler r2 object put chatbot-cdn/v1/chatbot.css --file dist/chatbot.css
    
    # Option B: AWS S3 + CloudFront
    # - name: Deploy to S3
    #   run: |
    #     aws s3 sync dist/ s3://paseolibre-chatbot-cdn/v1/ --acl public-read
    #     aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DIST_ID }} --paths "/v1/*"
    #   env:
    #     AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    #     AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    #     AWS_DEFAULT_REGION: us-east-1
```

---

## 5. Publicar a NPM

### 5.1 Crear Cuenta NPM

1. Ir a [npmjs.com](https://www.npmjs.com/)
2. Crear cuenta o login
3. Verificar email

### 5.2 Login desde Terminal

```bash
npm login
# Ingresar username, password, email
# Verificar OTP si tienes 2FA
```

### 5.3 Verificar Package Name Disponible

```bash
npm search @paseolibre/chatbot-widget
# Si no hay resultados, el nombre está disponible
```

### 5.4 Publicar Primera Versión

```bash
cd ~/Documents/paseolibre-chatbot-widget

# Build
npm run build

# Verificar qué se va a publicar
npm pack --dry-run

# Publicar (scope @paseolibre requiere --access public)
npm publish --access public
```

### 5.5 Configurar NPM Token en GitHub

1. En npmjs.com → Account → Access Tokens
2. Crear token tipo "Automation"
3. Copiar token
4. En GitHub repo → Settings → Secrets and variables → Actions
5. Crear secret: `NPM_TOKEN` con el valor del token

---

## 6. Deploy a CDN

### 6.1 Opción 1: Cloudflare R2 + CDN

**Ventajas**: Gratuito (10GB/mes), rápido, simple

**Setup**:

```bash
# 1. Instalar Wrangler CLI
npm install -g wrangler

# 2. Login
wrangler login

# 3. Crear R2 bucket
wrangler r2 bucket create chatbot-cdn

# 4. Configurar archivo wrangler.toml
cat > wrangler.toml << EOF
name = "chatbot-cdn"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "CHATBOT_CDN"
bucket_name = "chatbot-cdn"
EOF

# 5. Deploy files
cd dist
wrangler r2 object put chatbot-cdn/v1/chatbot.umd.js --file chatbot.umd.js
wrangler r2 object put chatbot-cdn/v1/chatbot.es.js --file chatbot.es.js
wrangler r2 object put chatbot-cdn/v1/chatbot.css --file chatbot.css

# 6. Configurar custom domain (opcional)
# En Cloudflare dashboard → R2 → chatbot-cdn → Settings → Custom domain
# Agregar: cdn.paseolibre.com
```

**URL final**:
```
https://cdn.paseolibre.com/v1/chatbot.umd.js
https://cdn.paseolibre.com/v1/chatbot.css
```

### 6.2 Opción 2: AWS S3 + CloudFront

**Ventajas**: Máximo control, escalabilidad

**Setup**:

```bash
# 1. Crear bucket S3
aws s3 mb s3://paseolibre-chatbot-cdn

# 2. Configurar como website estático
aws s3 website s3://paseolibre-chatbot-cdn \
  --index-document index.html

# 3. Configurar CORS
cat > cors.json << EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
aws s3api put-bucket-cors --bucket paseolibre-chatbot-cdn --cors-configuration file://cors.json

# 4. Upload files
cd dist
aws s3 sync . s3://paseolibre-chatbot-cdn/v1/ --acl public-read

# 5. Crear CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name paseolibre-chatbot-cdn.s3.amazonaws.com \
  --default-root-object index.html
# Guardar el Distribution ID

# 6. Invalidar cache cuando actualices
aws cloudfront create-invalidation \
  --distribution-id EXXXXXXXXXXXXX \
  --paths "/v1/*"
```

### 6.3 Opción 3: Vercel Edge Network

**Ventajas**: Deploy automático con Git, SSL gratis

**Setup**:

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd ~/Documents/paseolibre-chatbot-widget
vercel --prod

# 4. Configurar vercel.json
cat > vercel.json << EOF
{
  "version": 2,
  "public": true,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/v1/(.*)",
      "dest": "/dist/$1",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    }
  ]
}
EOF

# 5. Conectar con GitHub (auto-deploy on push)
vercel --prod
# Seguir instrucciones para conectar repo
```

### 6.4 Opción 4: jsdelivr (Free CDN)

**Ventajas**: Gratis, automático con GitHub releases

**Setup**:

```bash
# 1. Hacer release en GitHub con tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# 2. Crear release en GitHub UI
# GitHub → Releases → New release → Tag: v1.0.0

# 3. jsdelivr automáticamente sirve desde:
# https://cdn.jsdelivr.net/gh/paseolibre/paseolibre-chatbot-widget@1.0.0/dist/chatbot.umd.js
```

**URLs generadas**:
```html
<!-- Latest version -->
<script src="https://cdn.jsdelivr.net/gh/paseolibre/paseolibre-chatbot-widget@latest/dist/chatbot.umd.js"></script>

<!-- Specific version -->
<script src="https://cdn.jsdelivr.net/gh/paseolibre/paseolibre-chatbot-widget@1.0.0/dist/chatbot.umd.js"></script>
```

---

## 7. Checklist Final

### Pre-Migración
- [ ] Build exitoso en `chatbot-cdn`
- [ ] Todos los imports funcionan
- [ ] No hay dependencias de Next.js
- [ ] Tailwind funciona standalone
- [ ] Socket.IO se conecta correctamente

### Repositorio Nuevo
- [ ] Repo creado en GitHub/GitLab
- [ ] Código migrado (método 1 o 2)
- [ ] package.json actualizado
- [ ] .gitignore configurado
- [ ] README.md completo
- [ ] LICENSE agregado (MIT)
- [ ] CHANGELOG.md iniciado

### CI/CD
- [ ] GitHub Actions configurado
- [ ] Build workflow funciona
- [ ] Tests passing (aunque sean dummies)
- [ ] Publish workflow listo

### NPM
- [ ] Cuenta NPM creada
- [ ] Nombre `@paseolibre/chatbot-widget` reservado
- [ ] Primera versión publicada (v1.0.0)
- [ ] NPM_TOKEN en GitHub secrets

### CDN
- [ ] Opción de CDN elegida
- [ ] Files subidos a CDN
- [ ] URLs funcionando
- [ ] CORS configurado
- [ ] SSL/HTTPS funcionando
- [ ] Cache headers configurados

### Documentación
- [ ] README público actualizado
- [ ] Ejemplos de integración (HTML, React, Vue)
- [ ] API reference completa
- [ ] CHANGELOG con versión inicial

### Testing
- [ ] CDN carga en navegador
- [ ] NPM install funciona
- [ ] React app de ejemplo funciona
- [ ] HTML demo funciona
- [ ] Socket.IO conecta al backend

---

## 8. Comandos Resumen

### Migración Rápida (Método 1)

```bash
# 1. Crear y configurar repo nuevo
mkdir ~/Documents/paseolibre-chatbot-widget
cd ~/Documents/paseolibre-chatbot-widget
git init
git branch -M main

# 2. Copiar código
cp -r /Users/A446116/Documents/persona-projects/paseo-libre/chatbot-cdn/* .
rm -rf node_modules package-lock.json

# 3. Instalar y build
npm install
npm run build

# 4. Commit y push
git add .
git commit -m "feat: initial chatbot widget standalone repository"
git remote add origin https://github.com/paseolibre/paseolibre-chatbot-widget.git
git push -u origin main

# 5. Publicar a NPM
npm login
npm publish --access public

# 6. Deploy a CDN (Cloudflare ejemplo)
npm install -g wrangler
wrangler login
wrangler r2 bucket create chatbot-cdn
wrangler r2 object put chatbot-cdn/v1/chatbot.umd.js --file dist/chatbot.umd.js
wrangler r2 object put chatbot-cdn/v1/chatbot.css --file dist/chatbot.css
```

### Actualizar Versión

```bash
# 1. Hacer cambios en código
# 2. Build
npm run build

# 3. Bump version
npm version patch  # 1.0.0 -> 1.0.1
# o
npm version minor  # 1.0.0 -> 1.1.0
# o
npm version major  # 1.0.0 -> 2.0.0

# 4. Push tags
git push --follow-tags

# 5. Crear release en GitHub
# (Trigger automático de CI/CD para publicar a NPM y CDN)
```

---

## 9. Troubleshooting

### Error: "Package name already exists"

```bash
# Cambiar nombre en package.json
# Usar: @tu-org/chatbot-widget
# O agregar sufijo: @paseolibre/chatbot-widget-v2
```

### Error: "Module not found" al importar

```bash
# Verificar exports en package.json
"exports": {
  ".": {
    "import": "./dist/chatbot.es.js",
    "require": "./dist/chatbot.umd.js"
  }
}
```

### Styles no cargan desde NPM

```bash
# Asegurarse de incluir CSS en build
# vite.config.ts debe tener:
build: {
  lib: {
    entry: resolve(__dirname, 'src/index.tsx'),
    formats: ['es', 'umd'],
  },
  rollupOptions: {
    output: {
      assetFileNames: 'chatbot.css'
    }
  }
}
```

### CDN devuelve 403/404

```bash
# Verificar permisos públicos
# S3:
aws s3api put-object-acl --bucket paseolibre-chatbot-cdn --key v1/chatbot.umd.js --acl public-read

# Cloudflare R2:
# Debe configurarse como public en dashboard
```

---

## 10. Recursos

- [Vite Library Mode](https://vitejs.dev/guide/build.html#library-mode)
- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Actions for NPM](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS S3 Static Website](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [jsdelivr Documentation](https://www.jsdelivr.com/documentation)

---

**Última actualización**: 21 enero 2026  
**Autor**: AI Assistant  
**Versión**: 1.0.0
