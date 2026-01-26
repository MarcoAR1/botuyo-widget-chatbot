# ⚡ Quick Start: Cloudflare R2 + GitHub Actions

Configuración rápida de Cloudflare R2 para deploys automáticos del BotUyo Chat Widget.

## 🎯 Configuración en 5 Minutos

### 1️⃣ Cloudflare R2 - Crear Bucket

```bash
# 1. Ve a: https://dash.cloudflare.com/
# 2. Sidebar → R2
# 3. Create bucket → Nombre: "chatbot-cdn"
# 4. Create
```

**Copia y guarda**:
- ✅ Account ID (arriba derecha, ej: `a1b2c3d4...`)

### 2️⃣ Configurar CORS

En el bucket → Settings → CORS Policy:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 3️⃣ Hacer el Bucket Público

**Opción A - Con subdominio personalizado** (Recomendado):
```
Settings → Public access → Connect domain
Dominio personalizado: cdn-chatbot.botuyo.com
Resultado: https://cdn-chatbot.botuyo.com

Nota: Necesitas agregar un registro CNAME en Cloudflare DNS:
- Tipo: CNAME
- Nombre: cdn-chatbot
- Destino: (lo proporciona R2 al conectar el dominio)
```

**Opción B - Sin dominio** (Desarrollo):
```
Settings → Public access → Enable
URL generada: https://pub-xxxxx.r2.dev
```

### 4️⃣ Generar API Token

```bash
# 1. Profile (arriba derecha) → API Tokens
# 2. Create Token
# 3. Plantilla: "Edit Cloudflare Workers"
# 4. Permisos:
#    - Account → Workers R2 Storage → Edit
# 5. Create Token
# 6. ⚠️ COPIA EL TOKEN (solo se muestra una vez)
```

### 5️⃣ GitHub Secrets

En tu repositorio de GitHub:

```
Settings → Secrets and variables → Actions → New repository secret
```

Crea 2 secrets:

| Name | Value |
|------|-------|
| `CLOUDFLARE_ACCOUNT_ID` | Tu Account ID (32 chars) |
| `CLOUDFLARE_API_TOKEN` | El token que copiaste |

### 6️⃣ Probar Deploy

**Deploy Manual**:
```
GitHub → Actions → "Deploy to Cloudflare R2" → Run workflow
Version: v1.0.0-test
```

**Deploy con Tag** (Producción):
```bash
git tag v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 🔗 Usar el CDN

### HTML Básico

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.botuyo.com/v1.0.0/chatbot.css">

<!-- JavaScript -->
<script type="module" src="https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.js"></script>
<script>
  BotUyoChat.init({
    serverUrl: 'https://api.botuyo.com',
    emotion: '😊'
  });
</script>
```

### Con Performance Optimization

```html
<head>
  <!-- Preload para carga rápida -->
  <link rel="dns-prefetch" href="https://cdn-chatbot.botuyo.com">
  <link rel="preconnect" href="https://cdn-chatbot.botuyo.com" crossorigin>
  <link rel="preload" href="https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.css" as="style">
  <link rel="preload" href="https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.js" as="script">
  
  <!-- Stylesheet -->
  <link rel="stylesheet" href="https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.css">
</head>
```

## 📦 Estructura de URLs

```
https://cdn-chatbot.botuyo.com/
├── v1.0.0/              # Versión específica (cache 1 año)
│   ├── botuyo-chat.js   # Entry point (ES module)
│   ├── botuyo-chat.css
│   ├── vendor-react.js  # Chunk: React + ReactDOM
│   ├── ChatWidget.js    # Chunk: Chat UI (lazy)
│   ├── chunk-*.js       # Otros chunks
│   └── index.d.ts
├── v1.0.1/              # Nueva versión
│   └── ...
└── latest/              # Siempre la última (cache 1 hora)
    ├── botuyo-chat.js
    ├── botuyo-chat.css
    ├── vendor-react.js
    ├── ChatWidget.js
    ├── chunk-*.js
    └── index.d.ts
```

## 🚨 Troubleshooting Rápido

### ❌ "API token invalid"
```bash
# Regenera el token con permiso: Workers R2 Storage → Edit
# Actualiza el secret CLOUDFLARE_API_TOKEN en GitHub
```

### ❌ "Bucket not found"
```bash
# Verifica que el nombre en .github/workflows/deploy-r2.yml
# coincida con el nombre del bucket en R2 (default: "chatbot-cdn")
```

### ❌ 403 Forbidden al acceder
```bash
# Asegúrate que Public Access esté habilitado
# R2 → Bucket → Settings → Public access → Enable
```

### ❌ CORS error en navegador
```bash
# Verifica la configuración CORS (paso 2)
# Debe permitir GET y HEAD desde tu dominio
```

## 📊 Verificar Deploy

```bash
# Verifica que los archivos existan
curl -I https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.js

# Respuesta esperada:
# HTTP/2 200
# content-type: application/javascript
# cache-control: public, max-age=31536000, immutable
```

## 🎓 Recursos

- 📖 [Guía Completa](./CLOUDFLARE_R2_SETUP_GUIDE.md) - Documentación detallada
- 🔗 [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- 🛠️ [GitHub Actions Workflow](./.github/workflows/deploy-r2.yml)

## ✅ Checklist

- [ ] Bucket creado en R2
- [ ] CORS configurado
- [ ] Dominio público conectado
- [ ] API Token generado
- [ ] GitHub Secrets configurados
- [ ] Deploy manual exitoso
- [ ] URLs del CDN funcionando

---

**Total tiempo**: ~5-10 minutos  
**Costo**: $0 (dentro del free tier de 10GB)  
**Última actualización**: 26 Enero 2026
