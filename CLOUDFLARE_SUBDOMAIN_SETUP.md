# 🌐 Configuración del Subdominio CDN en Cloudflare R2

**Subdominio**: cdn-chatbot.botuyo.com  
**Bucket R2**: chatbot-cdn  
**Propósito**: Separar el CDN del sitio principal (botuyo.com)

---

## 🎯 ¿Por qué usar un subdominio?

- ✅ **Organización**: `botuyo.com` para la landing, `cdn-chatbot.botuyo.com` para el widget
- ✅ **Escalabilidad**: Puedes crear más subdominios CDN en el futuro (ej: `cdn-docs.botuyo.com`)
- ✅ **Cache separado**: Headers de cache diferentes para cada servicio
- ✅ **Mejor control**: Cada CDN puede tener su propia configuración

---

## 📋 Pasos para Configurar el Subdominio

### Opción 1: Configuración Automática (Recomendada) ⚡

1. **Ve a Cloudflare R2**:
   ```
   Dashboard → R2 → chatbot-cdn → Settings → Public access
   ```

2. **Click en "Connect domain"**

3. **Ingresa el subdominio**:
   ```
   cdn-chatbot.botuyo.com
   ```

4. **Click "Continue"**

5. **Cloudflare automáticamente**:
   - Crea el registro DNS CNAME
   - Configura el proxy (naranja)
   - Habilita HTTPS automático
   - Conecta el bucket al subdominio

6. **Verificación** (espera 1-2 minutos):
   ```bash
   curl -I https://cdn-chatbot.botuyo.com
   # Debería responder (aunque sin archivos aún)
   ```

✅ **¡Listo!** El subdominio está configurado.

---

### Opción 2: Configuración Manual (Avanzada) 🔧

#### Paso 1: Crear el Registro DNS

1. Ve a **Cloudflare Dashboard** → **Websites** → **botuyo.com** → **DNS** → **Records**

2. Click **Add record**

3. Configura el CNAME:
   ```
   Tipo:           CNAME
   Nombre:         cdn-chatbot
   Destino:        chatbot-cdn.<ACCOUNT_ID>.r2.cloudflarestorage.com
   Proxy status:   Proxied (🟠 naranja)
   TTL:            Auto
   ```

   **¿Dónde obtener el ACCOUNT_ID?**
   - Dashboard de Cloudflare → Esquina superior derecha
   - O desde R2: URL del S3 API tiene el formato `ACCOUNT_ID.r2.cloudflarestorage.com`
   - En tu caso: `765b558f9a5eb2fa76724b7c436f7665`

   Entonces el destino sería:
   ```
   chatbot-cdn.765b558f9a5eb2fa76724b7c436f7665.r2.cloudflarestorage.com
   ```

4. Click **Save**

#### Paso 2: Conectar el Dominio en R2

1. Ve a **R2** → **chatbot-cdn** → **Settings** → **Public access**

2. Click **Connect domain**

3. Ingresa: `cdn-chatbot.botuyo.com`

4. Click **Continue**

5. Cloudflare verificará que el CNAME existe y lo conectará

#### Paso 3: Verificar la Configuración

```bash
# Verificar DNS
nslookup cdn-chatbot.botuyo.com
# Debería resolver al proxy de Cloudflare

# Verificar HTTPS
curl -I https://cdn-chatbot.botuyo.com
# HTTP/2 200 (después de deployar archivos)
```

---

## 🔒 Configuración de Seguridad (Opcional pero Recomendado)

### 1. Habilitar HTTPS Estricto

En **Cloudflare** → **SSL/TLS** → **Edge Certificates**:
- ✅ Always Use HTTPS: ON
- ✅ Automatic HTTPS Rewrites: ON
- ✅ Minimum TLS Version: 1.2 o superior

### 2. Configurar Headers de Seguridad

En **Cloudflare** → **Rules** → **Transform Rules** → **Modify Response Header**:

```yaml
Rule name: CDN Security Headers
When incoming requests match: cdn-chatbot.botuyo.com/*

Set headers:
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
```

### 3. Rate Limiting (Prevenir Abuso)

En **Cloudflare** → **Security** → **WAF** → **Rate limiting rules**:

```yaml
Rule name: CDN Rate Limit
If incoming requests match:
  - Hostname: cdn-chatbot.botuyo.com
  - Path: /v*/botuyo-chat.js

Then:
  - Requests: 100 per 10 seconds
  - Action: Block for 60 seconds
```

---

## 📊 Verificación Post-Configuración

### Checklist de Verificación

Ejecuta estos comandos después de configurar:

```bash
# 1. DNS resuelve correctamente
dig cdn-chatbot.botuyo.com +short
# Debería mostrar IPs de Cloudflare (proxy)

# 2. HTTPS funciona
curl -I https://cdn-chatbot.botuyo.com
# HTTP/2 200 o 404 (404 es normal si no hay archivos aún)

# 3. Redirect HTTP → HTTPS
curl -I http://cdn-chatbot.botuyo.com
# Debería redirigir a https://

# 4. Headers de seguridad (después de configurarlos)
curl -I https://cdn-chatbot.botuyo.com | grep -E "X-Content|X-Frame"
```

### Test Visual

Abre en el navegador (después del primer deploy):
```
https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.js
```

Deberías ver el código JavaScript del widget.

---

## 🚀 Después de Configurar el Subdominio

Una vez que `cdn-chatbot.botuyo.com` esté funcionando:

### 1. Hacer el Primer Deploy

```bash
# En tu proyecto local
git add -A
git commit -m "chore: configure cdn-chatbot.botuyo.com subdomain"
git push

# Probar deploy manual
# GitHub Actions → Deploy to Cloudflare R2 → Run workflow
# Version: v1.0.0-test
```

### 2. Verificar que los Archivos se Suban

Después del deploy, verifica:

```bash
# Main JS
curl -I https://cdn-chatbot.botuyo.com/v1.0.0-test/botuyo-chat.js
# HTTP/2 200

# CSS
curl -I https://cdn-chatbot.botuyo.com/v1.0.0-test/botuyo-chat.css
# HTTP/2 200

# React chunk
curl -I https://cdn-chatbot.botuyo.com/v1.0.0-test/vendor-react.js
# HTTP/2 200
```

### 3. Probar el Widget desde CDN

Abre `cdn-example.html` en tu navegador (usa un servidor local):

```bash
# Opción 1: Python
python3 -m http.server 8000

# Opción 2: Node.js
npx http-server .

# Luego abre: http://localhost:8000/cdn-example.html
```

El widget debería cargar desde `cdn-chatbot.botuyo.com`.

---

## 🎨 Estructura Final

```
botuyo.com/                           ← Landing page
├── index.html
├── about.html
└── contact.html

cdn-chatbot.botuyo.com/               ← Widget CDN
├── v1.0.0/
│   ├── botuyo-chat.js
│   ├── botuyo-chat.css
│   └── vendor-react.js
├── v1.0.1/
│   └── ...
└── latest/
    └── ...

cdn-docs.botuyo.com/                  ← Futura CDN para docs (ejemplo)
```

---

## 🐛 Troubleshooting

### ❌ "DNS_PROBE_FINISHED_NXDOMAIN"

**Problema**: El subdominio no resuelve.

**Solución**:
1. Verifica que el registro CNAME esté creado en Cloudflare DNS
2. Espera 1-5 minutos para propagación DNS
3. Prueba con `nslookup cdn-chatbot.botuyo.com`

### ❌ "522 Connection timed out"

**Problema**: Cloudflare no puede conectarse al origen (R2).

**Solución**:
1. Verifica que el dominio esté conectado en R2 Settings
2. Verifica que Public Access esté habilitado en el bucket
3. El destino del CNAME debe ser correcto: `chatbot-cdn.<ACCOUNT_ID>.r2.cloudflarestorage.com`

### ❌ "403 Forbidden"

**Problema**: El bucket no permite acceso público.

**Solución**:
1. R2 → chatbot-cdn → Settings → Public access → Enable
2. Verifica que el dominio esté en la lista de "Connected domains"

### ❌ "CORS error" en el navegador

**Problema**: Falta configuración CORS.

**Solución**:
```bash
# En R2 → chatbot-cdn → Settings → CORS Policy
# Pega el JSON de R2_QUICK_START.md
```

### ❌ Los chunks (vendor-react.js) dan 404

**Problema**: El workflow no está subiendo todos los archivos.

**Solución**:
1. Verifica que el workflow en `.github/workflows/deploy-r2.yml` tenga el loop:
   ```bash
   for file in dist/*.js; do
     filename=$(basename "$file")
     if [ "$filename" != "botuyo-chat.js" ]; then
       wrangler r2 object put ${BUCKET}/${VERSION}/${filename} ...
     fi
   done
   ```

2. Revisa los logs del workflow en GitHub Actions

---

## 📚 Recursos

- 📖 [R2 Custom Domains](https://developers.cloudflare.com/r2/buckets/public-buckets/#custom-domains)
- 📖 [Cloudflare DNS Records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/)
- 🛠️ [R2 Quick Start](./R2_QUICK_START.md)
- 📊 [Deployment Status](./R2_DEPLOYMENT_STATUS.md)

---

## ✅ Resumen

1. **Crea el subdominio**: R2 → Connect domain → `cdn-chatbot.botuyo.com`
2. **Cloudflare automáticamente** crea el DNS CNAME
3. **Espera 1-2 minutos** para propagación
4. **Verifica** con `curl -I https://cdn-chatbot.botuyo.com`
5. **Deploy** con GitHub Actions
6. **¡Listo!** Tu widget está en el CDN

**Próximos pasos**: Sigue la [guía de deployment](./R2_DEPLOYMENT_STATUS.md) para configurar GitHub Secrets y hacer el primer deploy.
