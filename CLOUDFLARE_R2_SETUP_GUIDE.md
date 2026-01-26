# 🚀 Guía Completa: Configuración de Cloudflare R2 para CDN del Widget

Esta guía te llevará paso a paso para configurar Cloudflare R2 como CDN para distribuir el BotUyo Chat Widget y automatizar los deploys con GitHub Actions.

## 📋 Índice

1. [¿Qué es Cloudflare R2?](#qué-es-cloudflare-r2)
2. [Prerrequisitos](#prerrequisitos)
3. [Paso 1: Crear Cuenta en Cloudflare](#paso-1-crear-cuenta-en-cloudflare)
4. [Paso 2: Crear Bucket en R2](#paso-2-crear-bucket-en-r2)
5. [Paso 3: Configurar Dominio Público](#paso-3-configurar-dominio-público)
6. [Paso 4: Generar API Token](#paso-4-generar-api-token)
7. [Paso 5: Configurar GitHub Secrets](#paso-5-configurar-github-secrets)
8. [Paso 6: Probar el Deploy](#paso-6-probar-el-deploy)
9. [Uso del CDN](#uso-del-cdn)
10. [Troubleshooting](#troubleshooting)

---

## 🌐 ¿Qué es Cloudflare R2?

**Cloudflare R2** es un servicio de almacenamiento de objetos compatible con S3, diseñado para ser más económico (sin costos de egreso) y más rápido gracias a la red global de Cloudflare.

### Ventajas de R2:
- ✅ **Sin cargos de egreso** (transferencia de datos)
- ✅ **CDN global integrado** (200+ ubicaciones)
- ✅ **Compatible con S3** (fácil migración)
- ✅ **10 GB gratis** al mes (suficiente para widgets)
- ✅ **Baja latencia** en todo el mundo

### Precios:
- **Almacenamiento**: $0.015/GB/mes
- **Operaciones Clase A**: $4.50/millón (PUT, LIST)
- **Operaciones Clase B**: $0.36/millón (GET, HEAD)
- **Sin cargos de egreso** 🎉

---

## 📝 Prerrequisitos

Antes de comenzar, necesitas:

- [ ] Cuenta de Cloudflare (gratis)
- [ ] Dominio registrado (opcional pero recomendado)
- [ ] Cuenta de GitHub con acceso al repositorio
- [ ] Permisos de administrador en el repositorio

---

## Paso 1: Crear Cuenta en Cloudflare

### 1.1 Registro

1. Ve a [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Ingresa tu email y crea una contraseña
3. Verifica tu email
4. Completa tu perfil

### 1.2 Verificar Account ID

Una vez dentro del dashboard:

1. En la barra lateral, haz clic en **R2**
2. Si es tu primera vez, acepta los términos de servicio
3. En la parte superior derecha verás tu **Account ID**
4. **Copia y guarda este ID** (lo necesitarás después)

```
Ejemplo de Account ID: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## Paso 2: Crear Bucket en R2

### 2.1 Crear el Bucket

1. En el dashboard de Cloudflare, ve a **R2**
2. Haz clic en **Create bucket**
3. Configura el bucket:
   - **Bucket name**: `chatbot-cdn` (o el nombre que prefieras)
   - **Location**: `Automatic` (recomendado) o elige una región específica
4. Haz clic en **Create bucket**

### 2.2 Configurar CORS (Cross-Origin Resource Sharing)

Para permitir que los navegadores carguen tus archivos desde cualquier dominio:

1. Selecciona tu bucket (`chatbot-cdn`)
2. Ve a la pestaña **Settings**
3. Busca la sección **CORS Policy**
4. Haz clic en **Add CORS policy**
5. Agrega la siguiente configuración:

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

6. Guarda los cambios

> **Nota**: `"AllowedOrigins": ["*"]` permite acceso desde cualquier dominio. Para mayor seguridad, puedes especificar solo tus dominios: `["https://tudominio.com", "https://www.tudominio.com"]`

---

## Paso 3: Configurar Dominio Público

### 3.1 Conectar un Dominio Personalizado (Recomendado)

Si tienes un dominio en Cloudflare:

1. En tu bucket, ve a **Settings**
2. Busca **Public access**
3. Haz clic en **Connect domain**
4. Elige tu dominio (ej: `botuyo.com`)
5. Ingresa el subdominio: `cdn` (quedará como `botuyo.com`)
6. Haz clic en **Connect domain**

Cloudflare configurará automáticamente:
- ✅ DNS records
- ✅ SSL/TLS certificate
- ✅ CDN caching

### 3.2 Usar Dominio R2.dev (Alternativa Gratuita)

Si no tienes dominio propio:

1. En **Settings** del bucket
2. Habilita **Public access**
3. Se generará una URL como: `https://pub-xxxxx.r2.dev`
4. Puedes usar esta URL como CDN

> **Limitaciones de r2.dev**:
> - No puedes personalizar el dominio
> - No recomendado para producción

### 3.3 Verificar Acceso Público

Prueba que el bucket sea accesible públicamente:

```bash
# Debería devolver 404 (aún no hay archivos)
curl -I https://cdn-chatbot.botuyo.com/test.js
# O con r2.dev:
curl -I https://pub-xxxxx.r2.dev/test.js
```

---

## Paso 4: Generar API Token

### 4.1 Crear API Token para Wrangler

1. En el dashboard de Cloudflare, ve al icono de perfil (arriba derecha)
2. Haz clic en **My Profile**
3. En la barra lateral, selecciona **API Tokens**
4. Haz clic en **Create Token**
5. Busca la plantilla **Edit Cloudflare Workers** y haz clic en **Use template**

### 4.2 Configurar Permisos del Token

Modifica los permisos para que quede así:

**Permissions**:
- Account → **Workers R2 Storage** → **Edit**
- Account → **Workers Scripts** → **Edit** (opcional, si usas Workers)

**Account Resources**:
- Include → **Specific account** → Selecciona tu cuenta

**Zone Resources** (opcional):
- Include → **All zones** (o selecciona zonas específicas)

**Client IP Address Filtering** (opcional):
- Puedes agregar IPs permitidas para mayor seguridad

### 4.3 Crear y Guardar el Token

1. Haz clic en **Continue to summary**
2. Revisa los permisos
3. Haz clic en **Create Token**
4. **⚠️ IMPORTANTE**: Copia el token inmediatamente
   - Solo se muestra una vez
   - Guárdalo en un lugar seguro (no en el código)

```
Ejemplo de token: 
abcdef1234567890abcdef1234567890abcdef1234567890
```

---

## Paso 5: Configurar GitHub Secrets

### 5.1 Agregar Secrets al Repositorio

1. Ve a tu repositorio en GitHub
2. Haz clic en **Settings** (pestaña superior)
3. En la barra lateral, selecciona **Secrets and variables** → **Actions**
4. Haz clic en **New repository secret**

### 5.2 Crear CLOUDFLARE_ACCOUNT_ID

1. **Name**: `CLOUDFLARE_ACCOUNT_ID`
2. **Secret**: Pega tu Account ID (del Paso 1.2)
3. Haz clic en **Add secret**

### 5.3 Crear CLOUDFLARE_API_TOKEN

1. Haz clic en **New repository secret** otra vez
2. **Name**: `CLOUDFLARE_API_TOKEN`
3. **Secret**: Pega el API Token (del Paso 4.3)
4. Haz clic en **Add secret**

### 5.4 Verificar Secrets

Deberías ver dos secrets:

- ✅ `CLOUDFLARE_ACCOUNT_ID`
- ✅ `CLOUDFLARE_API_TOKEN`

> **Nota de Seguridad**: Los secrets nunca se muestran después de crearlos. Solo pueden ser editados o eliminados.

---

## Paso 6: Probar el Deploy

### 6.1 Deploy Manual (Recomendado para Primera Prueba)

1. Ve a tu repositorio en GitHub
2. Haz clic en **Actions** (pestaña superior)
3. En la barra lateral, selecciona **Deploy to Cloudflare R2**
4. Haz clic en **Run workflow** (derecha)
5. Configura:
   - **Use workflow from**: `main` (o tu rama principal)
   - **Version to deploy**: `v1.0.0-test` (para pruebas)
6. Haz clic en **Run workflow**

### 6.2 Monitorear el Deploy

1. El workflow aparecerá en la lista (puede tardar unos segundos)
2. Haz clic en el workflow para ver los detalles
3. Observa cada paso:
   - ✅ Checkout code
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Build widget
   - ✅ Deploy to R2
   - ✅ Create deployment summary

### 6.3 Verificar el Deploy

Si todo salió bien:

1. El workflow mostrará ✅ (verde)
2. En el summary verás los CDN URLs
3. Prueba acceder a los archivos:

```bash
# Reemplaza con tu dominio
curl -I https://cdn-chatbot.botuyo.com/v1.0.0-test/botuyo-chat.js

# Deberías ver:
# HTTP/2 200
# content-type: application/javascript
# cache-control: public, max-age=31536000, immutable
```

### 6.4 Deploy con Tags (Producción)

Para deploys de producción:

1. Crea un tag en tu repositorio:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

2. El workflow se ejecutará automáticamente
3. Desplegará en dos ubicaciones:
   - `/v1.0.0/` (versión específica, cache inmutable)
   - `/latest/` (versión más reciente, cache 1 hora)

---

## 📦 Uso del CDN

### Instalación Básica (CDN)

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mi Sitio con BotUyo</title>
  
  <!-- BotUyo Chat Widget - Versión Específica (Recomendado) -->
  <link rel="stylesheet" href="https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.css">
</head>
<body>
  <h1>Mi Sitio Web</h1>
  
  <!-- Widget se inyectará aquí automáticamente -->
  
  <!-- BotUyo Chat Widget -->
  <script src="https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.js"></script>
  <script>
    BotUyoChat.init({
      apiKey: 'tu-api-key-aqui',
      apiBaseUrl: 'https://api.botuyo.com',
      theme: {
        primaryColor: '#10b981',
        botName: 'Asistente BotUyo'
      }
    });
  </script>
</body>
</html>
```

### Versión Latest (Auto-actualizable)

```html
<!-- Siempre carga la última versión -->
<link rel="stylesheet" href="https://cdn-chatbot.botuyo.com/latest/botuyo-chat.css">
<script src="https://cdn-chatbot.botuyo.com/latest/botuyo-chat.js"></script>
```

> **⚠️ Advertencia**: `/latest/` se actualiza automáticamente. Úsalo solo si estás seguro de que las actualizaciones no romperán tu implementación.

### Preload para Mejor Performance

```html
<head>
  <!-- DNS Prefetch -->
  <link rel="dns-prefetch" href="https://cdn-chatbot.botuyo.com">
  
  <!-- Preconnect -->
  <link rel="preconnect" href="https://cdn-chatbot.botuyo.com" crossorigin>
  
  <!-- Preload Assets -->
  <link rel="preload" href="https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.css" as="style">
  <link rel="preload" href="https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.js" as="script">
  
  <!-- Stylesheet -->
  <link rel="stylesheet" href="https://cdn-chatbot.botuyo.com/v1.0.0/botuyo-chat.css">
</head>
```

### Uso con TypeScript

```typescript
// types.d.ts
/// <reference types="@botuyo/chat-widget-standalone" />

// O descarga los tipos
// https://cdn-chatbot.botuyo.com/v1.0.0/index.d.ts

// app.ts
declare global {
  interface Window {
    BotUyoChat: {
      init(config: BotUyoConfig): void;
      open(): void;
      close(): void;
      destroy(): void;
    }
  }
}

window.BotUyoChat.init({
  apiKey: 'your-key',
  apiBaseUrl: 'https://api.botuyo.com'
});
```

---

## 🔧 Troubleshooting

### Error: "API token invalid"

**Problema**: El token no tiene los permisos correctos.

**Solución**:
1. Ve a Cloudflare → My Profile → API Tokens
2. Edita el token
3. Asegúrate de tener permiso `Workers R2 Storage: Edit`
4. Regenera el token si es necesario
5. Actualiza el secret en GitHub

### Error: "Bucket not found"

**Problema**: El nombre del bucket no coincide.

**Solución**:
1. Verifica el nombre en `.github/workflows/deploy-r2.yml` (línea 63):
   ```yaml
   BUCKET="chatbot-cdn"  # ← Este nombre debe coincidir con tu bucket
   ```
2. O edita el nombre del bucket en R2 para que coincida

### Error: "No such file or directory: dist/botuyo-chat.js"

**Problema**: El build no generó los archivos esperados.

**Solución**:
1. Verifica que `vite.config.mjs` esté configurado correctamente
2. Ejecuta `npm run build` localmente para verificar
3. Revisa que los nombres de archivo en el workflow coincidan con los generados

### Error: 403 Forbidden al acceder al CDN

**Problema**: El bucket no está configurado como público.

**Solución**:
1. Ve al bucket en Cloudflare R2
2. Settings → Public access → Enable
3. O conecta un dominio personalizado

### Los archivos no se actualizan

**Problema**: Cache del navegador o CDN.

**Solución**:
```bash
# Limpia cache con query string
https://cdn-chatbot.botuyo.com/latest/botuyo-chat.js?v=1234567890

# O usa versiones específicas
https://cdn-chatbot.botuyo.com/v1.0.1/botuyo-chat.js
```

### GitHub Action falla sin error claro

**Solución**:
1. Ve a Actions → Selecciona el workflow fallido
2. Haz clic en cada paso para ver logs detallados
3. Busca líneas con `Error:` o `Failed:`
4. Verifica que los secrets estén configurados correctamente
5. Asegúrate de que tu Account ID sea correcto (32 caracteres hexadecimales)

---

## 📊 Monitoreo y Métricas

### Ver Estadísticas de Uso

1. Ve a Cloudflare Dashboard → R2
2. Selecciona tu bucket
3. Pestaña **Metrics**
4. Verás:
   - Requests (solicitudes)
   - Storage (almacenamiento usado)
   - Bandwidth (transferencia de datos)

### Configurar Alertas

1. Dashboard → Notifications
2. Create → R2
3. Configura alertas para:
   - Storage usage > 80%
   - Unusual request patterns
   - Error rate > 1%

---

## 🎯 Mejores Prácticas

### 1. Versionado Semántico

Usa tags siguiendo [SemVer](https://semver.org/):

```bash
# Patch (bug fixes)
git tag v1.0.1

# Minor (nuevas features, compatible)
git tag v1.1.0

# Major (breaking changes)
git tag v2.0.0
```

### 2. Cache Strategy

```
/vX.Y.Z/  → Cache: 1 año (immutable)
/latest/  → Cache: 1 hora (auto-update)
```

### 3. Rollback Rápido

Si una versión tiene problemas:

```bash
# Deploy manual de versión anterior
# Actions → Deploy to Cloudflare R2 → Run workflow
# Version: v1.0.0 (la que funcionaba)
```

### 4. Testing Antes de Producción

```bash
# 1. Deploy de prueba
git tag v1.0.1-beta
git push origin v1.0.1-beta

# 2. Prueba en staging
https://cdn-chatbot.botuyo.com/v1.0.1-beta/botuyo-chat.js

# 3. Si funciona, deploy a producción
git tag v1.0.1
git push origin v1.0.1
```

### 5. Seguridad

- ✅ Nunca commitees API tokens en el código
- ✅ Usa GitHub Secrets para credenciales
- ✅ Rota tokens cada 6 meses
- ✅ Revisa logs de acceso regularmente
- ✅ Habilita 2FA en Cloudflare

---

## 📚 Recursos Adicionales

- [Documentación oficial de Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## ✅ Checklist Final

Antes de ir a producción, verifica:

- [ ] Cuenta de Cloudflare creada
- [ ] Bucket R2 creado (`chatbot-cdn`)
- [ ] CORS configurado correctamente
- [ ] Dominio público conectado (botuyo.com)
- [ ] API Token creado con permisos correctos
- [ ] GitHub Secrets configurados
  - [ ] `CLOUDFLARE_ACCOUNT_ID`
  - [ ] `CLOUDFLARE_API_TOKEN`
- [ ] Workflow probado manualmente
- [ ] Deploy con tag funciona correctamente
- [ ] URLs del CDN accesibles públicamente
- [ ] Widget carga correctamente en navegador
- [ ] Cache headers configurados
- [ ] TypeScript types disponibles

---

## 💡 Próximos Pasos

Una vez configurado R2:

1. **Actualiza la documentación** del proyecto con las URLs del CDN
2. **Configura monitoring** en Cloudflare para alertas
3. **Implementa CI/CD** completo con tests antes del deploy
4. **Crea un CHANGELOG** automatizado en cada release
5. **Configura CDN analytics** para ver uso real

---

**¿Necesitas ayuda?** 
- 📧 Contacta al equipo de DevOps
- 💬 Abre un issue en GitHub
- 📖 Consulta la documentación de Cloudflare

---

**Última actualización**: 26 de Enero, 2026  
**Versión del documento**: 1.0.0  
**Autor**: Equipo BotUyo DevOps
