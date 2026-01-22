# 🚀 Deploy a Cloudflare R2 - Guía Completa

Guía paso a paso para deployar el Chatbot Widget a Cloudflare R2 + CDN (100% gratis hasta 10GB).

---

## 📋 Tabla de Contenidos

1. [Por Qué Cloudflare R2](#por-qué-cloudflare-r2)
2. [Requisitos Previos](#requisitos-previos)
3. [Setup Inicial](#setup-inicial)
4. [Deploy Manual](#deploy-manual)
5. [Deploy Automático (GitHub Actions)](#deploy-automático-github-actions)
6. [Configuración de Custom Domain](#configuración-de-custom-domain)
7. [Cache y Performance](#cache-y-performance)
8. [Troubleshooting](#troubleshooting)

---

## Por Qué Cloudflare R2

### Ventajas

✅ **Gratis**: 10 GB storage, 10 millones de operaciones/mes  
✅ **Rápido**: Red global de Cloudflare  
✅ **Sin costos de egress**: No pagas por transferencia de datos  
✅ **Simple**: Setup en minutos  
✅ **Custom domain**: `cdn.paseolibre.com` gratis  
✅ **SSL automático**: HTTPS incluido  

### vs Alternativas

| Feature | Cloudflare R2 | AWS S3 | Vercel |
|---------|---------------|---------|--------|
| **Costo** | Gratis (10GB) | $0.023/GB | Gratis (100GB) |
| **Egress** | $0 | $0.09/GB 💸 | $0 |
| **Setup** | 5 min | 15 min | 3 min |
| **Custom domain** | ✅ Gratis | ✅ Gratis | ✅ Gratis |
| **SSL** | ✅ Automático | ⚠️ Manual | ✅ Automático |

**Recomendación**: Cloudflare R2 es la mejor opción para CDN de widgets.

---

## Requisitos Previos

### 1. Cuenta Cloudflare

1. Ir a [cloudflare.com](https://cloudflare.com)
2. Sign up (gratis)
3. Verificar email

### 2. Wrangler CLI

```bash
npm install -g wrangler
# o
yarn global add wrangler
```

Verificar instalación:
```bash
wrangler --version
```

### 3. Build del Widget

```bash
cd chatbot-cdn
npm install
npm run build
```

Verificar que existe `dist/`:
```bash
ls dist/
# Debe mostrar: chatbot.umd.js, chatbot.es.js, chatbot.css, index.d.ts
```

---

## Setup Inicial

### 1. Login a Cloudflare

```bash
wrangler login
```

Esto abrirá tu navegador para autorizar Wrangler.

### 2. Crear R2 Bucket

```bash
# Crear bucket para el chatbot
wrangler r2 bucket create chatbot-cdn

# Listar buckets (verificar)
wrangler r2 bucket list
```

**Output esperado**:
```
✅ Created bucket 'chatbot-cdn'
```

### 3. Verificar Access

```bash
wrangler r2 bucket list
```

Debes ver `chatbot-cdn` en la lista.

---

## Deploy Manual

### Método 1: Wrangler CLI (Recomendado)

```bash
cd chatbot-cdn

# Upload chatbot.umd.js (para CDN)
wrangler r2 object put chatbot-cdn/v1/chatbot.umd.js \
  --file dist/chatbot.umd.js \
  --content-type application/javascript \
  --cache-control "public, max-age=31536000, immutable"

# Upload chatbot.es.js (para bundlers)
wrangler r2 object put chatbot-cdn/v1/chatbot.es.js \
  --file dist/chatbot.es.js \
  --content-type application/javascript \
  --cache-control "public, max-age=31536000, immutable"

# Upload chatbot.css
wrangler r2 object put chatbot-cdn/v1/chatbot.css \
  --file dist/chatbot.css \
  --content-type text/css \
  --cache-control "public, max-age=31536000, immutable"

# Upload TypeScript definitions
wrangler r2 object put chatbot-cdn/v1/index.d.ts \
  --file dist/index.d.ts \
  --content-type text/plain \
  --cache-control "public, max-age=31536000, immutable"
```

### Método 2: Script Automatizado

Crear `deploy-r2.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Chatbot Widget to Cloudflare R2..."

# Build
echo "📦 Building..."
npm run build

# Version
VERSION=${1:-v1}
BUCKET="chatbot-cdn"
PREFIX="${VERSION}"

# Upload files
echo "⬆️  Uploading files to R2..."

wrangler r2 object put ${BUCKET}/${PREFIX}/chatbot.umd.js \
  --file dist/chatbot.umd.js \
  --content-type application/javascript \
  --cache-control "public, max-age=31536000, immutable"

wrangler r2 object put ${BUCKET}/${PREFIX}/chatbot.es.js \
  --file dist/chatbot.es.js \
  --content-type application/javascript \
  --cache-control "public, max-age=31536000, immutable"

wrangler r2 object put ${BUCKET}/${PREFIX}/chatbot.css \
  --file dist/chatbot.css \
  --content-type text/css \
  --cache-control "public, max-age=31536000, immutable"

wrangler r2 object put ${BUCKET}/${PREFIX}/index.d.ts \
  --file dist/index.d.ts \
  --content-type text/plain \
  --cache-control "public, max-age=31536000, immutable"

echo "✅ Deployment complete!"
echo "📍 Files available at:"
echo "   - https://chatbot-cdn.r2.dev/${PREFIX}/chatbot.umd.js"
echo "   - https://chatbot-cdn.r2.dev/${PREFIX}/chatbot.css"
```

Dar permisos:
```bash
chmod +x deploy-r2.sh
```

Usar:
```bash
./deploy-r2.sh        # Deploy a v1
./deploy-r2.sh v2     # Deploy a v2
./deploy-r2.sh latest # Deploy a latest
```

### Verificar Upload

```bash
# Listar archivos
wrangler r2 object list chatbot-cdn --prefix v1/

# Descargar archivo para verificar
wrangler r2 object get chatbot-cdn/v1/chatbot.umd.js --file test.js
cat test.js | head -20
```

---

## Deploy Automático (GitHub Actions)

### Configurar Secrets en GitHub

1. Ir a tu repo → Settings → Secrets and variables → Actions
2. Agregar secrets:

**CLOUDFLARE_ACCOUNT_ID**:
```bash
# Obtener account ID
wrangler whoami
# Copiar el "Account ID"
```

**CLOUDFLARE_API_TOKEN**:
1. Ir a [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Create Token → "Edit Cloudflare Workers"
3. Permisos:
   - Account → R2 → Edit
   - Account → R2 → Read
4. Copiar token

### GitHub Action Workflow

Crear `.github/workflows/deploy-r2.yml`:

```yaml
name: Deploy to Cloudflare R2

on:
  push:
    tags:
      - 'v*'  # Deploy en cada release (v1.0.0, v1.1.0, etc.)
  workflow_dispatch:  # Deploy manual

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Install Wrangler
        run: npm install -g wrangler
      
      - name: Deploy to R2
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          # Extract version from tag (v1.0.0 -> 1.0.0)
          VERSION=${GITHUB_REF#refs/tags/v}
          
          # Deploy to versioned path
          wrangler r2 object put chatbot-cdn/v${VERSION}/chatbot.umd.js \
            --file dist/chatbot.umd.js \
            --content-type application/javascript \
            --cache-control "public, max-age=31536000, immutable"
          
          wrangler r2 object put chatbot-cdn/v${VERSION}/chatbot.css \
            --file dist/chatbot.css \
            --content-type text/css \
            --cache-control "public, max-age=31536000, immutable"
          
          # Also deploy to /latest/
          wrangler r2 object put chatbot-cdn/latest/chatbot.umd.js \
            --file dist/chatbot.umd.js \
            --content-type application/javascript \
            --cache-control "public, max-age=3600"
          
          wrangler r2 object put chatbot-cdn/latest/chatbot.css \
            --file dist/chatbot.css \
            --content-type text/css \
            --cache-control "public, max-age=3600"
      
      - name: Summary
        run: |
          echo "✅ Deployment complete!"
          echo "📍 Version: ${GITHUB_REF#refs/tags/v}"
          echo "🔗 URL: https://cdn.paseolibre.com/v${GITHUB_REF#refs/tags/v}/chatbot.umd.js"
```

### Trigger Deploy

**Opción 1: Release con Tag**
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
# GitHub Actions se ejecuta automáticamente
```

**Opción 2: Manual**
1. Ir a GitHub → Actions
2. Seleccionar "Deploy to Cloudflare R2"
3. Click "Run workflow"

---

## Configuración de Custom Domain

### 1. En Cloudflare Dashboard

1. Ir a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. R2 → `chatbot-cdn` → Settings
3. Public buckets → "Connect domain"

### 2. Conectar Dominio

**Opción A: Subdomain de dominio existente en Cloudflare**

Si ya tienes `paseolibre.com` en Cloudflare:

1. Click "Connect domain"
2. Ingresar: `cdn.paseolibre.com`
3. Click "Continue"
4. Cloudflare automáticamente crea el DNS record
5. ✅ Listo! SSL automático

**Opción B: Dominio nuevo**

1. Agregar dominio a Cloudflare
2. Cambiar nameservers en tu registrar
3. Esperar propagación DNS (hasta 24h)
4. Seguir "Opción A"

### 3. Verificar Custom Domain

```bash
# Test con curl
curl -I https://cdn.paseolibre.com/v1/chatbot.umd.js

# Debe responder 200 OK
# Headers: content-type: application/javascript
```

### 4. Actualizar URLs en Documentación

Ahora puedes usar:
```html
<script src="https://cdn.paseolibre.com/v1/chatbot.umd.js"></script>
<link rel="stylesheet" href="https://cdn.paseolibre.com/v1/chatbot.css">
```

---

## Cache y Performance

### Headers de Cache

Ya configurados en los comandos de deploy:

```bash
--cache-control "public, max-age=31536000, immutable"
```

**Significado**:
- `public`: Cacheable por CDN y navegadores
- `max-age=31536000`: Cache por 1 año (365 días)
- `immutable`: No revalidar, es inmutable

### Versionado

**Estrategia recomendada**:

```
/v1/chatbot.umd.js    <- Version específica (inmutable)
/v2/chatbot.umd.js    <- Nueva versión
/latest/chatbot.umd.js <- Siempre la última (cache corto)
```

**Para usuarios**:
```html
<!-- Específico (recomendado para producción) -->
<script src="https://cdn.paseolibre.com/v1/chatbot.umd.js"></script>

<!-- Latest (útil para testing) -->
<script src="https://cdn.paseolibre.com/latest/chatbot.umd.js"></script>
```

### Invalidación de Cache

Si necesitas forzar actualización:

```bash
# Subir nueva versión
wrangler r2 object put chatbot-cdn/latest/chatbot.umd.js \
  --file dist/chatbot.umd.js \
  --cache-control "public, max-age=0, must-revalidate"
```

---

## Troubleshooting

### Error: "Bucket not found"

```bash
# Verificar nombre del bucket
wrangler r2 bucket list

# Crear si no existe
wrangler r2 bucket create chatbot-cdn
```

### Error: "Authentication failed"

```bash
# Re-login
wrangler logout
wrangler login

# O usar API token
export CLOUDFLARE_API_TOKEN=your_token_here
```

### Error: "File not found" al acceder

1. Verificar que el archivo existe:
```bash
wrangler r2 object list chatbot-cdn --prefix v1/
```

2. Verificar custom domain está configurado:
   - Dashboard → R2 → chatbot-cdn → Settings → Public buckets

3. Verificar DNS propagación:
```bash
dig cdn.paseolibre.com
nslookup cdn.paseolibre.com
```

### Archivos se descargan en lugar de ejecutarse

**Problema**: Content-Type incorrecto

**Solución**: Re-upload con content-type correcto:
```bash
wrangler r2 object put chatbot-cdn/v1/chatbot.umd.js \
  --file dist/chatbot.umd.js \
  --content-type application/javascript  # ← Importante
```

### CORS errors

**Problema**: CORS no configurado

**Solución**: Configurar CORS en R2:

1. Dashboard → R2 → chatbot-cdn → Settings → CORS policy
2. Agregar:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

O via Wrangler:
```bash
# Crear cors.json
cat > cors.json << EOF
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
EOF

# Aplicar (requiere Cloudflare API)
# Esto se hace desde el dashboard por ahora
```

---

## Monitoreo y Analytics

### Ver Estadísticas

1. Dashboard → R2 → chatbot-cdn → Metrics
2. Ver:
   - Requests por día
   - Storage usado
   - Bandwidth usado

### Alertas

Configurar alertas en Cloudflare:
1. Notifications → Add
2. Tipo: R2 usage threshold
3. Threshold: 80% de 10GB
4. Email notification

---

## Costos Estimados

### Tier Gratis (Incluido)

- ✅ 10 GB storage
- ✅ 10 millones Class A operations/mes
- ✅ 100 millones Class B operations/mes
- ✅ Transferencia de datos ilimitada

### Ejemplo de Uso

**Supuesto**: 
- Widget: 300 KB total (UMD + CSS)
- 1 millón de loads/mes

**Cálculo**:
- Storage: 300 KB × 10 versions = 3 MB ✅ Gratis
- Operations: 1M loads = 2M operations (GET file × 2) ✅ Gratis
- Egress: 300 KB × 1M = ~300 GB ✅ Gratis (no se cobra egress)

**Costo total**: $0/mes 🎉

### Si excedes el free tier

- Storage: $0.015/GB/mes
- Class A ops: $4.50/millón
- Class B ops: $0.36/millón
- Egress: $0 (siempre gratis)

---

## Checklist de Deploy

### Pre-Deploy
- [ ] Build exitoso (`npm run build`)
- [ ] Archivos en `dist/` verificados
- [ ] Wrangler instalado y actualizado
- [ ] Login a Cloudflare (`wrangler login`)
- [ ] Bucket creado (`chatbot-cdn`)

### Deploy
- [ ] Archivos subidos a R2
- [ ] Content-Type correcto
- [ ] Cache headers configurados
- [ ] CORS configurado (si necesario)

### Post-Deploy
- [ ] Verificar acceso a archivos (curl)
- [ ] Custom domain configurado
- [ ] DNS propagado
- [ ] SSL funcionando (HTTPS)
- [ ] Actualizar documentación con URLs
- [ ] Notificar a usuarios

### GitHub Actions (Opcional)
- [ ] Secrets configurados en GitHub
- [ ] Workflow file creado
- [ ] Test con workflow_dispatch
- [ ] Verificar deploy automático en release

---

## Recursos

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Custom Domains R2](https://developers.cloudflare.com/r2/buckets/public-buckets/)

---

## Comandos Rápidos

```bash
# Login
wrangler login

# Crear bucket
wrangler r2 bucket create chatbot-cdn

# Deploy (simple)
wrangler r2 object put chatbot-cdn/v1/chatbot.umd.js --file dist/chatbot.umd.js

# Listar archivos
wrangler r2 object list chatbot-cdn

# Descargar archivo
wrangler r2 object get chatbot-cdn/v1/chatbot.umd.js --file test.js

# Eliminar archivo
wrangler r2 object delete chatbot-cdn/v1/old-file.js

# Ver buckets
wrangler r2 bucket list
```

---

**Última actualización**: 21 enero 2026  
**Versión**: 1.0.0  
**Autor**: Paseo Libre Team  
**URL**: https://cdn.paseolibre.com/v1/
