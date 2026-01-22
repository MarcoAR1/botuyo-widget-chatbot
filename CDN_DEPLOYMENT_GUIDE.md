# Guía de Deployment a CDN y Uso del Chat Widget

Este documento explica cómo hacer el build del widget, subirlo a un CDN y usarlo en proyectos externos.

---

## 📦 Paso 1: Build del Widget

### 1.1 Instalar Dependencias

```bash
npm install
```

### 1.2 Build de Producción

```bash
npm run build
```

Esto generará en `dist/`:
- `paseo-libre-chat.js` - Bundle IIFE minificado (~500KB sin gzip, ~150KB con gzip)
- `paseo-libre-chat.css` - Estilos del widget (~50KB)
- `paseo-libre-chat.js.map` - Source map para debugging

### 1.3 Verificar el Build

```bash
ls -lh dist/
# Deberías ver:
# - paseo-libre-chat.js
# - paseo-libre-chat.css
# - paseo-libre-chat.js.map
```

---

## ☁️ Paso 2: Deployment a CDN

### Opción A: AWS S3 + CloudFront (Recomendado)

#### 2.1 Subir a S3

```bash
# Configurar AWS CLI (si no lo has hecho)
aws configure

# Crear bucket (primera vez)
aws s3 mb s3://cdn.paseolibre.com

# Subir archivos con headers correctos
aws s3 cp dist/paseo-libre-chat.js s3://cdn.paseolibre.com/chat-widget.js \
  --content-type "application/javascript" \
  --cache-control "public, max-age=31536000" \
  --acl public-read

aws s3 cp dist/paseo-libre-chat.css s3://cdn.paseolibre.com/chat-widget.css \
  --content-type "text/css" \
  --cache-control "public, max-age=31536000" \
  --acl public-read

aws s3 cp dist/paseo-libre-chat.js.map s3://cdn.paseolibre.com/chat-widget.js.map \
  --content-type "application/json" \
  --cache-control "public, max-age=31536000" \
  --acl public-read
```

#### 2.2 Configurar CloudFront (CDN)

1. Ir a AWS CloudFront Console
2. Crear nueva distribución:
   - **Origin Domain**: `cdn.paseolibre.com.s3.amazonaws.com`
   - **Origin Path**: `/`
   - **Viewer Protocol Policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP Methods**: GET, HEAD, OPTIONS
   - **Cache Policy**: CachingOptimized
   - **Compress Objects**: Yes (gzip automático)

3. Configurar CORS:
   - Ir a S3 Bucket → Permissions → CORS
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

4. Obtener URL de CloudFront:
   - Ejemplo: `https://d1234567890.cloudfront.net/chat-widget.js`

#### 2.3 Configurar Custom Domain (Opcional)

1. Ir a Route 53
2. Crear registro CNAME:
   - **Name**: `cdn`
   - **Type**: CNAME
   - **Value**: `d1234567890.cloudfront.net`

3. Configurar SSL en CloudFront:
   - Ir a CloudFront → Distribution → General → Settings
   - **Alternate Domain Names (CNAMEs)**: `cdn.paseolibre.com`
   - **SSL Certificate**: Request ACM certificate para `cdn.paseolibre.com`

### Opción B: Vercel/Netlify (Alternativa Simple)

#### 2.1 Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Los archivos estarán en:
# https://tu-proyecto.vercel.app/paseo-libre-chat.js
```

#### 2.2 Netlify

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Los archivos estarán en:
# https://tu-proyecto.netlify.app/paseo-libre-chat.js
```

### Opción C: GitHub Pages

```bash
# En tu repositorio de GitHub
git checkout -b gh-pages
git add dist/
git commit -m "Deploy widget to GitHub Pages"
git push origin gh-pages

# Habilitar GitHub Pages en:
# Settings → Pages → Source: gh-pages branch

# URL final:
# https://tu-usuario.github.io/paseo-chat-widget/paseo-libre-chat.js
```

---

## 🔗 Paso 3: Configurar CORS en el Backend

El backend de Socket.IO debe permitir conexiones desde cualquier origen:

```javascript
// backend/src/server.js
const io = require('socket.io')(server, {
  cors: {
    origin: '*', // O lista específica de dominios
    methods: ['GET', 'POST'],
    credentials: true
  }
});
```

---

## 🌐 Paso 4: Uso en Proyectos Externos

### 4.1 Instalación Básica (Script Tag)

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Mi Sitio Web</title>
</head>
<body>
  <h1>Contenido de mi sitio...</h1>

  <!-- Chatbot Script -->
  <script src="https://cdn.paseolibre.com/chat-widget.js"></script>
  <script>
    PaseoLibreChat.init({
      apiKey: 'pk_live_cliente_xyz_12345',
      apiBaseUrl: 'https://api.paseolibre.com',
      theme: {
        primaryColor: '#10b981',
        botName: 'Asistente Paseo Libre',
        position: 'bottom-right'
      }
    });
  </script>
</body>
</html>
```

### 4.2 Instalación con NPM

```bash
npm install @paseolibre/chat-widget-standalone
```

```javascript
import PaseoLibreChat from '@paseolibre/chat-widget-standalone';

PaseoLibreChat.init({
  apiKey: 'pk_live_cliente_xyz_12345',
  apiBaseUrl: 'https://api.paseolibre.com'
});
```

### 4.3 Uso en WordPress

1. Ir a **Apariencia → Editor de Temas → footer.php**
2. Antes del `</body>`, agregar:

```html
<script src="https://cdn.paseolibre.com/chat-widget.js"></script>
<script>
  PaseoLibreChat.init({
    apiKey: 'pk_live_cliente_xyz_12345',
    apiBaseUrl: 'https://api.paseolibre.com',
    theme: {
      primaryColor: '<?php echo get_theme_mod("primary_color", "#10b981"); ?>',
      botName: 'Asistente de <?php bloginfo("name"); ?>'
    }
  });
</script>
```

### 4.4 Uso en React (sin build)

```jsx
// src/App.jsx
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Cargar script
    const script = document.createElement('script');
    script.src = 'https://cdn.paseolibre.com/chat-widget.js';
    script.async = true;
    script.onload = () => {
      window.PaseoLibreChat.init({
        apiKey: 'pk_live_cliente_xyz_12345',
        apiBaseUrl: 'https://api.paseolibre.com'
      });
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (window.PaseoLibreChat) {
        window.PaseoLibreChat.destroy();
      }
      document.body.removeChild(script);
    };
  }, []);

  return <div>Mi App React</div>;
}
```

### 4.5 Uso en Next.js (sin build)

```tsx
// app/layout.tsx
'use client';

import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        
        <Script 
          src="https://cdn.paseolibre.com/chat-widget.js"
          strategy="lazyOnload"
          onLoad={() => {
            window.PaseoLibreChat.init({
              apiKey: 'pk_live_cliente_xyz_12345',
              apiBaseUrl: 'https://api.paseolibre.com'
            });
          }}
        />
      </body>
    </html>
  );
}
```

### 4.6 Uso en Vue.js (sin build)

```vue
<!-- App.vue -->
<script setup>
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  const script = document.createElement('script');
  script.src = 'https://cdn.paseolibre.com/chat-widget.js';
  script.onload = () => {
    window.PaseoLibreChat.init({
      apiKey: 'pk_live_cliente_xyz_12345',
      apiBaseUrl: 'https://api.paseolibre.com'
    });
  };
  document.body.appendChild(script);
});

onUnmounted(() => {
  if (window.PaseoLibreChat) {
    window.PaseoLibreChat.destroy();
  }
});
</script>
```

---

## 🔐 Paso 5: Generar API Keys para Clientes

### 5.1 Estructura de API Key

```
pk_[env]_[cliente]_[random]

Ejemplos:
- pk_test_demo_12345678 (testing)
- pk_live_empresa_abc_87654321 (producción)
```

### 5.2 Backend: Validar API Key

```javascript
// backend/middleware/validateApiKey.js
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Buscar en base de datos
  const client = await db.clients.findOne({ apiKey });
  
  if (!client || !client.active) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Adjuntar info del cliente al request
  req.client = client;
  next();
};
```

### 5.3 Socket.IO: Validar en Handshake

```javascript
// backend/socket.js
io.use(async (socket, next) => {
  const apiKey = socket.handshake.auth.apiKey;
  
  const client = await db.clients.findOne({ apiKey });
  
  if (!client || !client.active) {
    return next(new Error('Authentication error'));
  }

  socket.clientId = client.id;
  socket.clientName = client.name;
  next();
});
```

---

## 📊 Paso 6: Monitoreo y Analytics

### 6.1 CloudWatch (AWS)

```bash
# Ver métricas de CloudFront
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=E123456789 \
  --start-time 2026-01-20T00:00:00Z \
  --end-time 2026-01-21T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

### 6.2 Google Analytics

Agregar tracking en el widget:

```javascript
// En onStateChange callback
onStateChange: (isOpen) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'chat_widget', {
      action: isOpen ? 'open' : 'close',
      label: window.location.pathname
    });
  }
}
```

### 6.3 Custom Backend Analytics

```javascript
// Trackear uso en backend
io.on('connection', (socket) => {
  await db.analytics.insert({
    event: 'widget_connected',
    clientId: socket.clientId,
    timestamp: new Date(),
    userAgent: socket.handshake.headers['user-agent'],
    referrer: socket.handshake.headers.referer
  });
});
```

---

## 🔄 Paso 7: Versionado y Actualizaciones

### 7.1 Estrategia de Versionado

```
https://cdn.paseolibre.com/
  └── chat-widget.js          → Latest (siempre última versión)
  └── v1/chat-widget.js       → v1.x.x
  └── v2/chat-widget.js       → v2.x.x
  └── v1.2.3/chat-widget.js   → Versión específica
```

### 7.2 Script de Deploy con Versionado

```bash
#!/bin/bash
# deploy.sh

VERSION=$(node -p "require('./package.json').version")

echo "Building version $VERSION..."
npm run build

echo "Uploading to S3..."

# Subir versión específica
aws s3 cp dist/paseo-libre-chat.js s3://cdn.paseolibre.com/v$VERSION/chat-widget.js
aws s3 cp dist/paseo-libre-chat.css s3://cdn.paseolibre.com/v$VERSION/chat-widget.css

# Actualizar latest
aws s3 cp dist/paseo-libre-chat.js s3://cdn.paseolibre.com/chat-widget.js
aws s3 cp dist/paseo-libre-chat.css s3://cdn.paseolibre.com/chat-widget.css

echo "Deployed version $VERSION to CDN!"
echo "Latest: https://cdn.paseolibre.com/chat-widget.js"
echo "Pinned: https://cdn.paseolibre.com/v$VERSION/chat-widget.js"
```

### 7.3 Invalidar Caché de CloudFront

```bash
# Invalidar después del deploy
aws cloudfront create-invalidation \
  --distribution-id E123456789 \
  --paths "/chat-widget.js" "/chat-widget.css"
```

---

## 🧪 Paso 8: Testing en Diferentes Entornos

### 8.1 Testing Local

```bash
npm run dev
# Abre http://localhost:3001
```

### 8.2 Testing con ngrok (Simular CDN)

```bash
# Servir dist/ localmente
npx http-server dist -p 8080

# Tunnel público
ngrok http 8080

# Usar URL de ngrok:
# https://abc123.ngrok.io/paseo-libre-chat.js
```

### 8.3 Testing en Staging

```html
<script src="https://cdn-staging.paseolibre.com/chat-widget.js"></script>
<script>
  PaseoLibreChat.init({
    apiKey: 'pk_test_staging_12345',
    apiBaseUrl: 'https://api-staging.paseolibre.com'
  });
</script>
```

---

## 📋 Checklist Pre-Deployment

- [ ] Build exitoso sin errores
- [ ] Testing en local (index.html)
- [ ] Minificación habilitada (Terser)
- [ ] Source maps generados
- [ ] CORS configurado en backend
- [ ] API keys generadas para clientes
- [ ] CDN configurado (S3 + CloudFront)
- [ ] SSL/TLS habilitado
- [ ] Cache headers correctos
- [ ] Gzip habilitado
- [ ] Versionado implementado
- [ ] Monitoreo configurado
- [ ] Documentación actualizada

---

## 🆘 Troubleshooting

### Widget no carga

1. **Verificar URL del script**: Abrir `https://cdn.paseolibre.com/chat-widget.js` en el navegador
2. **Verificar errores de CORS**: Abrir DevTools → Console
3. **Verificar Content-Type**: Debería ser `application/javascript`

### Socket no conecta

1. **Verificar apiBaseUrl**: Debe incluir protocolo (`https://`)
2. **Verificar CORS en backend**: Debe permitir el origen
3. **Verificar API key**: Válida y activa en BD

### Estilos rotos

1. **Verificar CSS se carga**: Revisar Network tab
2. **Verificar conflictos CSS**: Inspeccionar `#paseo-libre-chat-widget-root`
3. **Forzar especificidad**: Todos los estilos tienen scope

---

## 📚 Recursos Adicionales

- [README.md](./README.md) - Documentación principal
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Resumen técnico
- [package.json](./package.json) - Scripts disponibles
- [vite.config.ts](./vite.config.ts) - Configuración de build

---

**Última actualización**: Enero 2026  
**Mantenedor**: Equipo Paseo Libre
