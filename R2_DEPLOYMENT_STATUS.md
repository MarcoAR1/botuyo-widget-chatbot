# 🚀 Configuración de Cloudflare R2 - Completada

**Fecha**: 26 de enero de 2026  
**Bucket**: chatbot-cdn  
**Dominio**: botuyo.com  
**Región**: Eastern North America (ENAM)

---

## ✅ Cambios Realizados

### 1. GitHub Actions Workflow Actualizado
- ✅ Archivo corregido: `.github/workflows/deploy-r2.yml`
- ✅ Nombres de archivo actualizados: `botuyo-chat.js` (en lugar de chatbot.umd.js)
- ✅ Dominio actualizado: `botuyo.com` (en lugar de cdn.botuyo.com)
- ✅ Soporte para code-split chunks (vendor-react, ChatWidget, etc.)
- ✅ Deploy automático de todos los archivos .js en dist/

### 2. Documentación Actualizada
- ✅ `R2_QUICK_START.md`: URLs y nombres de archivo corregidos
- ✅ `CLOUDFLARE_R2_SETUP_GUIDE.md`: URLs y nombres de archivo corregidos
- ✅ `cdn-example.html`: Demo interactiva creada

### 3. Bucket R2 Configurado
- ✅ Nombre: `chatbot-cdn`
- ✅ Región: Eastern North America (ENAM)
- ✅ Dominio público: `botuyo.com`
- ✅ S3 API: `https://765b558f9a5eb2fa76724b7c436f7665.r2.cloudflarestorage.com/chatbot-cdn`

---

## 🔑 Próximos Pasos (IMPORTANTE)

### Paso 1: Configurar GitHub Secrets

Ve a tu repositorio de GitHub:

```
Settings → Secrets and variables → Actions → New repository secret
```

Agrega estos dos secrets:

**CLOUDFLARE_ACCOUNT_ID**:
- Ve a: https://dash.cloudflare.com/
- Copia el Account ID (esquina superior derecha)
- Pégalo en el secret

**CLOUDFLARE_API_TOKEN**:
- Ve a: https://dash.cloudflare.com/profile/api-tokens
- Click en "Create Token"
- Selecciona "Custom token"
- Permisos: **Workers R2 Storage → Edit**
- Account Resources: Include → Tu cuenta
- Click "Continue to summary" → "Create Token"
- Copia el token (solo se muestra una vez)
- Pégalo en el secret

### Paso 2: Configurar CORS en el Bucket

En Cloudflare R2:

```
R2 → chatbot-cdn → Settings → CORS Policy
```

Pega esta configuración:

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

### Paso 3: Probar el Deploy Manual

Una vez configurados los secrets:

1. Ve a: `Actions` en tu repositorio de GitHub
2. Selecciona el workflow "Deploy to Cloudflare R2"
3. Click en "Run workflow"
4. Version: escribe `v1.0.0-test`
5. Click "Run workflow"

**Resultado esperado**:
- ✅ Build exitoso
- ✅ Archivos subidos a R2
- ✅ URLs disponibles:
  - https://botuyo.com/v1.0.0-test/botuyo-chat.js
  - https://botuyo.com/v1.0.0-test/botuyo-chat.css
  - https://botuyo.com/v1.0.0-test/vendor-react.js
  - https://botuyo.com/v1.0.0-test/ChatWidget.js
  - (y todos los demás chunks)

### Paso 4: Verificar el Deploy

```bash
# Verificar archivo principal
curl -I https://botuyo.com/v1.0.0-test/botuyo-chat.js

# Respuesta esperada:
# HTTP/2 200
# content-type: application/javascript
# cache-control: public, max-age=31536000, immutable

# Verificar chunk de React
curl -I https://botuyo.com/v1.0.0-test/vendor-react.js

# Verificar CSS
curl -I https://botuyo.com/v1.0.0-test/botuyo-chat.css
```

### Paso 5: Deploy de Producción con Tag

Cuando estés listo para producción:

```bash
# Crear tag de versión
git tag v1.0.0
git push origin v1.0.0
```

Esto automáticamente:
- ✅ Ejecuta el workflow
- ✅ Despliega a `https://botuyo.com/v1.0.0/` (cache 1 año)
- ✅ Despliega a `https://botuyo.com/latest/` (cache 1 hora)

---

## 📦 Estructura de Archivos en R2

Después del deploy, tu bucket tendrá:

```
chatbot-cdn/
├── v1.0.0-test/              # Deploy de prueba
│   ├── botuyo-chat.js        # Entry point (~3 KB)
│   ├── botuyo-chat.css       # Estilos (~22 KB)
│   ├── vendor-react.js       # React + ReactDOM (~583 KB)
│   ├── ChatWidget.js         # Chat UI (~101 KB)
│   ├── chunk-chat-ui.js      # Componentes UI (~85 KB)
│   ├── chunk-markdown.js     # Markdown renderer (~156 KB)
│   ├── vendor-socket.js      # Socket.io (~42 KB)
│   ├── chunk-gallery.js      # Galería de imágenes (~8.5 KB)
│   ├── chunk-audio.js        # Audio player (~1.8 KB)
│   ├── browser-image-compression.js (~53 KB)
│   └── index.d.ts            # TypeScript definitions
│
├── v1.0.0/                   # Deploy de producción (cuando hagas tag)
│   └── (todos los archivos de arriba)
│
└── latest/                   # Siempre apunta a la última versión
    └── (todos los archivos de arriba)
```

---

## 🌐 Uso en Producción

### HTML

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <!-- Performance optimization -->
  <link rel="dns-prefetch" href="https://botuyo.com">
  <link rel="preconnect" href="https://botuyo.com" crossorigin>
  <link rel="preload" href="https://botuyo.com/v1.0.0/botuyo-chat.css" as="style">
  <link rel="preload" href="https://botuyo.com/v1.0.0/botuyo-chat.js" as="script">
  
  <!-- Stylesheet -->
  <link rel="stylesheet" href="https://botuyo.com/v1.0.0/botuyo-chat.css">
</head>
<body>
  <!-- Tu contenido -->
  
  <!-- Chat Widget -->
  <script type="module" src="https://botuyo.com/v1.0.0/botuyo-chat.js"></script>
  <script>
    const widget = BotUyoChat.init({
      serverUrl: 'https://api.botuyo.com',
      emotion: '😊'
    });
  </script>
</body>
</html>
```

### TypeScript

```typescript
// Cargar tipos desde el CDN (opcional)
/// <reference types="https://botuyo.com/v1.0.0/index.d.ts" />

declare global {
  interface Window {
    BotUyoChat: {
      init(config: ChatConfig): ChatWidget;
    };
  }
}

interface ChatConfig {
  serverUrl: string;
  emotion?: string;
  theme?: 'light' | 'dark';
}

// Usar el widget
const widget = window.BotUyoChat.init({
  serverUrl: 'https://api.botuyo.com',
  emotion: '🤖'
});

widget.open();
widget.sendMessage('Hola!');
widget.close();
widget.destroy();
```

---

## 🎯 Checklist Final

Antes de considerar la configuración completa:

- [ ] **GitHub Secrets configurados**
  - [ ] CLOUDFLARE_ACCOUNT_ID agregado
  - [ ] CLOUDFLARE_API_TOKEN agregado con permisos correctos

- [ ] **R2 Bucket configurado**
  - [x] Bucket "chatbot-cdn" creado
  - [ ] CORS policy configurado
  - [x] Dominio público "botuyo.com" conectado
  - [x] Public access habilitado

- [ ] **Deploy de prueba exitoso**
  - [ ] Workflow ejecutado manualmente
  - [ ] Archivos visibles en R2
  - [ ] URLs responden con 200 OK
  - [ ] Chunks se cargan correctamente

- [ ] **Deploy de producción**
  - [ ] Tag v1.0.0 creado
  - [ ] Workflow automático ejecutado
  - [ ] /latest/ actualizado

- [ ] **Testing**
  - [ ] cdn-example.html funciona localmente
  - [ ] cdn-example.html funciona desde CDN
  - [ ] Widget se inicializa correctamente
  - [ ] Chunks lazy-load correctamente

---

## 🐛 Troubleshooting

### ❌ "API token invalid"
**Solución**: El token debe tener permisos **Workers R2 Storage → Edit**. Regenera el token con los permisos correctos.

### ❌ "Bucket not found"
**Solución**: Verifica que `CLOUDFLARE_ACCOUNT_ID` sea correcto y que el bucket se llame exactamente `chatbot-cdn`.

### ❌ 403 Forbidden al acceder a las URLs
**Solución**: 
1. Verifica que Public Access esté habilitado
2. Verifica que el dominio `botuyo.com` esté conectado
3. Espera 1-2 minutos para propagación de DNS

### ❌ CORS error en navegador
**Solución**: Configura la CORS policy como se indica en el Paso 2.

### ❌ Chunks no se cargan (404)
**Solución**: 
1. Verifica que el workflow haya subido todos los archivos .js
2. Revisa los logs del workflow en GitHub Actions
3. El loop `for file in dist/*.js` debe haber subido todos los chunks

---

## 📚 Recursos

- 📖 [Guía Rápida](./R2_QUICK_START.md)
- 📖 [Guía Completa](./CLOUDFLARE_R2_SETUP_GUIDE.md)
- 🎮 [Demo Interactiva](./cdn-example.html)
- 🔧 [GitHub Workflow](./.github/workflows/deploy-r2.yml)
- 🌐 [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- 🛠️ [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

---

## 🎉 ¡Todo Listo!

Una vez completados todos los pasos del checklist:

✅ Tu widget estará disponible globalmente en https://botuyo.com  
✅ Deploy automático con cada tag de versión  
✅ Cache optimizado (1 año para versiones, 1 hora para /latest/)  
✅ Code splitting para carga rápida (<3 KB inicial)  
✅ CDN global con 200+ ubicaciones de Cloudflare

**Siguiente deploy**: Solo necesitas hacer `git tag v1.0.1 && git push origin v1.0.1` 🚀
