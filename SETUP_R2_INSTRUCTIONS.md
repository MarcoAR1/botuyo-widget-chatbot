# 📦 Instrucciones Detalladas: Configuración de Cloudflare R2

## ⚠️ IMPORTANTE: Seguir en Orden

Esta guía te llevará paso a paso para configurar Cloudflare R2 y desplegar el chatbot widget al CDN.

---

## 🔑 Paso 1: Crear API Token de Cloudflare

### 1.1 Acceder al Dashboard
1. Ir a: https://dash.cloudflare.com/
2. Login con tu cuenta de Cloudflare
3. Si no tienes cuenta, créala (es gratis)

### 1.2 Obtener Account ID
1. En el dashboard, hacer click en cualquier dominio (o R2 en el menú izquierdo)
2. En la barra lateral derecha, buscar **"Account ID"**
3. Copiar el Account ID (formato: `abc123def456...`)
4. **GUARDAR** este valor para el Paso 3

### 1.3 Crear API Token
1. Ir a: https://dash.cloudflare.com/profile/api-tokens
2. Click en **"Create Token"**
3. Buscar la plantilla **"Edit Cloudflare Workers"** o crear custom token
4. Configurar permisos:
   - **Account** → **R2** → **Edit**
   - **Account** → **Workers Scripts** → **Edit** (opcional)
5. **Account Resources**: Seleccionar tu cuenta específica
6. **Zone Resources**: "All zones" o específico si prefieres
7. Click en **"Continue to summary"**
8. Click en **"Create Token"**
9. **COPIAR EL TOKEN** (solo se muestra una vez)
10. **GUARDAR** este token para el Paso 3

---

## 🪣 Paso 2: Crear Bucket R2

### Opción A: Desde Dashboard (Recomendado para primera vez)

1. Ir a: https://dash.cloudflare.com/
2. En el menú izquierdo, click en **"R2"**
3. Si es primera vez, aceptar los términos
4. Click en **"Create bucket"**
5. Configurar:
   - **Bucket name**: `chatbot-cdn`
   - **Location**: Automatic (recommended) o específica si prefieres
6. Click en **"Create bucket"**

### Opción B: Desde Línea de Comandos

```bash
# Primero, configurar el API token
export CLOUDFLARE_API_TOKEN="tu_token_copiado_en_paso_1.3"
export CLOUDFLARE_ACCOUNT_ID="tu_account_id_del_paso_1.2"

# Crear bucket
wrangler r2 bucket create chatbot-cdn

# Verificar que se creó
wrangler r2 bucket list
```

**Salida esperada:**
```
✅ Created bucket chatbot-cdn
```

---

## 🔐 Paso 3: Configurar GitHub Secrets

### 3.1 Ir a Configuración de Secrets
1. Ir a: https://github.com/MarcoAR1/paseo-widget-chatbot/settings/secrets/actions
2. Click en **"New repository secret"**

### 3.2 Agregar CLOUDFLARE_ACCOUNT_ID
1. **Name**: `CLOUDFLARE_ACCOUNT_ID`
2. **Value**: Pegar el Account ID del Paso 1.2
3. Click en **"Add secret"**

### 3.3 Agregar CLOUDFLARE_API_TOKEN
1. Click en **"New repository secret"** nuevamente
2. **Name**: `CLOUDFLARE_API_TOKEN`
3. **Value**: Pegar el API Token del Paso 1.3
4. Click en **"Add secret"**

### 3.4 Verificar
Deberías ver ambos secrets listados:
- ✅ CLOUDFLARE_ACCOUNT_ID
- ✅ CLOUDFLARE_API_TOKEN

---

## 🏗️ Paso 4: Primer Deployment Manual

### 4.1 Preparar Entorno Local

```bash
# Ir al repositorio
cd ~/Documents/paseo-widget-chatbot

# Instalar dependencias (si no están)
npm install

# Build del widget
npm run build
```

**Salida esperada:**
```
vite v5.0.8 building for production...
✓ 156 modules transformed.
dist/chatbot.umd.js        45.23 kB │ gzip: 18.45 kB
dist/chatbot.css            8.91 kB │ gzip:  2.34 kB
✓ built in 1.23s
```

### 4.2 Configurar Variables de Entorno

```bash
# En el directorio del proyecto
export CLOUDFLARE_API_TOKEN="tu_token_del_paso_1.3"
export CLOUDFLARE_ACCOUNT_ID="tu_account_id_del_paso_1.2"

# Verificar que están configuradas
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID
```

### 4.3 Ejecutar Deploy Script

```bash
# Asegurarse que el script es ejecutable
chmod +x deploy-r2.sh

# Ejecutar deployment
./deploy-r2.sh
```

**Salida esperada:**
```
🚀 Deploying Paseo Libre Chatbot to Cloudflare R2...

📦 Building project...
✓ Build complete

📤 Uploading files to R2...
✓ Uploaded dist/chatbot.umd.js (45.23 KB)
✓ Uploaded dist/chatbot.css (8.91 KB)
✓ Uploaded dist/chatbot.umd.js to /latest/
✓ Uploaded dist/chatbot.css to /latest/

✅ Deployment complete!

📍 URLs:
   https://chatbot-cdn.<tu-account-id>.r2.dev/v1/chatbot.umd.js
   https://chatbot-cdn.<tu-account-id>.r2.dev/v1/chatbot.css
   https://chatbot-cdn.<tu-account-id>.r2.dev/latest/chatbot.umd.js
   https://chatbot-cdn.<tu-account-id>.r2.dev/latest/chatbot.css
```

### 4.4 Verificar Deployment

```bash
# Verificar que los archivos están en R2
wrangler r2 object list chatbot-cdn

# Probar descarga de archivo
curl -I https://chatbot-cdn.<tu-account-id>.r2.dev/v1/chatbot.umd.js
```

**Salida esperada del curl:**
```
HTTP/2 200
content-type: application/javascript
content-length: 45234
cache-control: public, max-age=31536000, immutable
```

---

## 🌐 Paso 5: Configurar Custom Domain (Opcional pero Recomendado)

### 5.1 Habilitar R2.dev Domain

1. Ir al dashboard: https://dash.cloudflare.com/
2. Navegar a **R2** → **chatbot-cdn**
3. Tab **"Settings"**
4. Sección **"R2.dev subdomain"**
5. Click en **"Allow Access"**
6. Confirmar

**URL pública:** `https://chatbot-cdn.<tu-account-id>.r2.dev`

### 5.2 Configurar Custom Domain (cdn.paseolibre.com)

#### Prerrequisito: Dominio en Cloudflare
Tu dominio `paseolibre.com` debe estar en Cloudflare.

#### Pasos:
1. En R2 → chatbot-cdn → **Settings**
2. Sección **"Custom Domains"**
3. Click en **"Connect Domain"**
4. Ingresar: `cdn.paseolibre.com`
5. Click en **"Continue"**
6. Cloudflare creará automáticamente:
   - CNAME record en DNS
   - Certificado SSL
7. Esperar 1-5 minutos para propagación

#### Verificar:
```bash
# Verificar DNS
dig cdn.paseolibre.com

# Verificar SSL
curl -I https://cdn.paseolibre.com/v1/chatbot.umd.js
```

**URLs finales:**
- ✅ `https://cdn.paseolibre.com/v1/chatbot.umd.js`
- ✅ `https://cdn.paseolibre.com/v1/chatbot.css`
- ✅ `https://cdn.paseolibre.com/latest/chatbot.umd.js`
- ✅ `https://cdn.paseolibre.com/latest/chatbot.css`

---

## 🤖 Paso 6: Configurar GitHub Actions (Deployment Automático)

### 6.1 Verificar Workflow

El workflow ya está configurado en: `.github/workflows/deploy-r2.yml`

**Triggers:**
- Git tags con formato `vX.Y.Z` (ej: v1.0.0, v1.1.0)
- Manual dispatch (desde GitHub UI)

### 6.2 Crear Primera Release

```bash
cd ~/Documents/paseo-widget-chatbot

# Crear tag para versión 1.0.0
git tag -a v1.0.0 -m "Release v1.0.0 - Initial CDN deployment"

# Push tag a GitHub
git push origin v1.0.0
```

### 6.3 Monitorear Deployment

1. Ir a: https://github.com/MarcoAR1/paseo-widget-chatbot/actions
2. Verás un workflow corriendo: **"Deploy to Cloudflare R2"**
3. Click para ver logs en tiempo real
4. Esperar a que termine (1-2 minutos)

**Status esperado:**
```
✅ Deploy to Cloudflare R2 - v1.0.0

Jobs:
  ✓ deploy (1m 23s)
    ✓ Checkout code
    ✓ Setup Node.js
    ✓ Install dependencies
    ✓ Build project
    ✓ Deploy to Cloudflare R2 (v1.0.0)
    ✓ Deploy to Cloudflare R2 (latest)
```

### 6.4 Verificar Nueva Versión

```bash
# Verificar que la versión está disponible
curl -I https://cdn.paseolibre.com/v1.0.0/chatbot.umd.js

# Verificar que "latest" apunta a la nueva versión
curl -I https://cdn.paseolibre.com/latest/chatbot.umd.js
```

---

## 🧪 Paso 7: Testear el Widget

### 7.1 Crear Archivo de Prueba

Crear `test-widget.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Chatbot Widget</title>
  
  <!-- CDN Links - Usar tus URLs reales -->
  <script src="https://cdn.paseolibre.com/v1/chatbot.umd.js"></script>
  <link rel="stylesheet" href="https://cdn.paseolibre.com/v1/chatbot.css">
</head>
<body>
  <h1>Test del Chatbot Widget</h1>
  <p>El widget debería aparecer en la esquina inferior derecha.</p>

  <script>
    // Inicializar el widget
    PaseoLibreChatWidget.init({
      serverUrl: 'wss://api.paseolibre.com', // Tu URL real
      apiKey: 'tu-api-key',                   // Tu API key real
      namespace: '/webchat',
      theme: 'light'                          // o 'dark'
    });
  </script>
</body>
</html>
```

### 7.2 Testear en Navegador

```bash
# Opción A: Servidor HTTP simple con Python
python3 -m http.server 8000

# Opción B: Servidor HTTP simple con Node
npx http-server -p 8000
```

Abrir en navegador: http://localhost:8000/test-widget.html

**Verificar:**
- ✅ Botón flotante aparece en esquina inferior derecha
- ✅ Click abre ventana de chat
- ✅ Se conecta al servidor WebSocket
- ✅ Se puede enviar mensajes
- ✅ Estilos se aplican correctamente

---

## 🔄 Paso 8: Workflow de Desarrollo Continuo

### 8.1 Hacer Cambios al Widget

```bash
cd ~/Documents/paseo-widget-chatbot

# Editar archivos en src/chat-widget/
# Por ejemplo: src/chat-widget/ChatWidget.tsx

# Testear localmente
npm run dev
# Abre http://localhost:5173
```

### 8.2 Commitear Cambios

```bash
git add .
git commit -m "feat: improve message styling"
git push
```

### 8.3 Crear Nueva Release

```bash
# Para cambios menores (bug fixes): incrementar patch
git tag -a v1.0.1 -m "Fix: message bubble alignment"

# Para nuevas features: incrementar minor
git tag -a v1.1.0 -m "Feature: add emoji support"

# Para breaking changes: incrementar major
git tag -a v2.0.0 -m "Breaking: new initialization API"

# Push tag
git push origin v1.0.1  # o la versión que corresponda
```

### 8.4 GitHub Actions Deploya Automáticamente

1. GitHub Actions detecta el tag
2. Ejecuta build
3. Deploya a R2 en dos ubicaciones:
   - `/v1.0.1/` (versión específica, inmutable)
   - `/latest/` (siempre apunta a última versión)
4. Deployment completo en ~2 minutos

---

## 📊 Paso 9: Monitoreo y Métricas

### 9.1 Verificar Uso de R2

```bash
# Listar todos los archivos
wrangler r2 object list chatbot-cdn

# Ver tamaño total
wrangler r2 bucket info chatbot-cdn
```

### 9.2 Cloudflare Analytics

1. Dashboard → R2 → chatbot-cdn
2. Tab **"Metrics"**
3. Ver:
   - Requests totales
   - Bandwidth usado
   - Errores (4xx, 5xx)

### 9.3 Costos

**R2 Pricing (Free Tier):**
- ✅ Storage: 10 GB/mes gratis
- ✅ Class A ops: 1M/mes gratis (write, list)
- ✅ Class B ops: 10M/mes gratis (read)
- ✅ Egress: Gratis a Cloudflare

**Nuestro uso estimado:**
- Storage: ~50 KB por versión × 10 versiones = 500 KB
- Requests: Depende del tráfico
- Conclusión: **100% gratis** para este caso de uso

---

## 🔧 Troubleshooting

### Problema: Error al crear bucket

**Síntoma:**
```
Error: Bucket already exists
```

**Solución:**
- El bucket ya existe, continuar al siguiente paso
- O usar otro nombre: `chatbot-cdn-v2`

### Problema: Deploy falla con "Permission denied"

**Síntoma:**
```
Error: Permission denied for R2 bucket
```

**Solución:**
1. Verificar que el API token tiene permisos de R2 Edit
2. Regenerar token si es necesario
3. Actualizar GitHub secret

### Problema: URLs no cargan (404)

**Síntoma:**
```
curl: (22) The requested URL returned error: 404
```

**Solución:**
1. Verificar que el deployment se completó:
   ```bash
   wrangler r2 object list chatbot-cdn
   ```
2. Verificar la ruta exacta (case-sensitive)
3. Esperar 1-2 minutos para propagación

### Problema: CORS errors en navegador

**Síntoma:**
```
Access to script at 'https://cdn...' has been blocked by CORS
```

**Solución:**
1. En R2 Dashboard → chatbot-cdn → Settings
2. Scroll a **"CORS Policy"**
3. Agregar regla:
   ```json
   {
     "AllowedOrigins": ["*"],
     "AllowedMethods": ["GET", "HEAD"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3600
   }
   ```

### Problema: GitHub Actions falla

**Síntoma:**
```
Error: CLOUDFLARE_API_TOKEN is not set
```

**Solución:**
1. Verificar secrets en: https://github.com/MarcoAR1/paseo-widget-chatbot/settings/secrets/actions
2. Asegurarse que ambos secrets existen
3. Re-run el workflow

---

## 📋 Checklist Final

### Setup Inicial
- [ ] Account ID obtenido
- [ ] API Token creado
- [ ] Bucket R2 creado (`chatbot-cdn`)
- [ ] GitHub Secrets configurados
- [ ] Primer deployment manual exitoso
- [ ] URLs de R2.dev funcionan
- [ ] Custom domain configurado (opcional)

### Deployment Automático
- [ ] GitHub Actions workflow verificado
- [ ] Primer tag creado (v1.0.0)
- [ ] Deployment automático exitoso
- [ ] URLs versionadas funcionan

### Testing
- [ ] Widget carga en HTML de prueba
- [ ] Botón flotante aparece
- [ ] Chat abre y cierra correctamente
- [ ] Conexión WebSocket funciona
- [ ] Mensajes se envían y reciben

### Producción
- [ ] Custom domain en uso (cdn.paseolibre.com)
- [ ] SSL funcionando
- [ ] Integrado en sitio principal
- [ ] Métricas monitoreadas

---

## 🎉 ¡Felicitaciones!

Si completaste todos los pasos, tu chatbot widget está:
- ✅ Desplegado en Cloudflare R2
- ✅ Disponible vía CDN global
- ✅ Con deployment automático configurado
- ✅ Versionado correctamente
- ✅ Con SSL y custom domain

**URLs Finales:**
- Versioned: `https://cdn.paseolibre.com/v1/chatbot.umd.js`
- Latest: `https://cdn.paseolibre.com/latest/chatbot.umd.js`

**Próximos pasos:**
1. Integrar en sitio principal de Paseo Libre
2. Crear más versiones según necesites
3. Monitorear uso y performance
4. Considerar publicar en NPM también

---

## 📞 Soporte

**Repositorio:** https://github.com/MarcoAR1/paseo-widget-chatbot  
**Issues:** https://github.com/MarcoAR1/paseo-widget-chatbot/issues  
**Documentación:** Ver README.md y otros archivos .md en el repo

**Cloudflare R2 Docs:** https://developers.cloudflare.com/r2/  
**Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/

---

**Última actualización:** 21 de Enero, 2026  
**Versión de esta guía:** 1.0
