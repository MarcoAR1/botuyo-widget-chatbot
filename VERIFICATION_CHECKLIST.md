# ✅ Checklist de Verificación - Chat Widget

Esta guía te ayuda a verificar que el Chat Widget esté correctamente instalado y funcionando.

## 📋 Verificación de Instalación

### ✅ 1. Instalación CDN

- [ ] El archivo `dist/paseo-libre-chat.js` existe después de `npm run build`
- [ ] El objeto `window.PaseoLibreChat` está disponible en el navegador
- [ ] El método `init()` funciona sin errores
- [ ] El widget aparece en la posición configurada (bottom-right por defecto)
- [ ] El botón flotante es clickeable

**Test CDN:**
```html
<script src="../dist/paseo-libre-chat.js"></script>
<script>
  console.assert(window.PaseoLibreChat, '❌ PaseoLibreChat no está definido');
  console.assert(typeof window.PaseoLibreChat.init === 'function', '❌ init() no es una función');
  
  const widget = PaseoLibreChat.init({
    apiKey: 'test',
    apiBaseUrl: 'https://api.test.com'
  });
  
  console.assert(widget, '✅ Widget inicializado correctamente');
</script>
```

---

### ✅ 2. Instalación NPM/React

- [ ] El paquete se puede importar sin errores
- [ ] Los tipos TypeScript están disponibles
- [ ] `ChatWidgetProvider` se exporta correctamente
- [ ] `useChatWidget()` hook funciona
- [ ] El widget renderiza en React

**Test React:**
```tsx
import { ChatWidgetProvider, useChatWidget } from '@paseolibre/chat-widget-standalone';

// ✅ No debe haber errores de TypeScript aquí
function Test() {
  const chat = useChatWidget();
  
  console.assert(typeof chat.open === 'function', '❌ chat.open no es una función');
  console.assert(typeof chat.close === 'function', '❌ chat.close no es una función');
  console.assert(typeof chat.toggle === 'function', '❌ chat.toggle no es una función');
  console.assert(typeof chat.sendMessage === 'function', '❌ chat.sendMessage no es una función');
  
  return <div>✅ Hook funciona</div>;
}
```

---

### ✅ 3. TypeScript Support

- [ ] Los tipos se importan sin errores
- [ ] Autocompletado funciona en el IDE
- [ ] No hay errores de tipos en tiempo de compilación

**Test TypeScript:**
```typescript
import type { 
  ChatWidgetProps,
  ChatWidgetProviderProps,
  ChatTheme,
  UserContext,
  PageContext,
  ChatMessage,
  BubbleStyles
} from '@paseolibre/chat-widget-standalone';

// ✅ Estos tipos deben estar disponibles sin errores
const theme: ChatTheme = {
  primaryColor: '#10b981',
  botName: 'Test Bot',
  position: 'bottom-right'
};

const userContext: UserContext = {
  token: 'jwt-token',
  metadata: { userId: '123' }
};

const pageContext: PageContext = {
  page: 'Test',
  id: 1
};
```

---

### ✅ 4. Funcionalidad del Widget

- [ ] El widget se abre al hacer click
- [ ] El widget se cierra correctamente
- [ ] El input acepta texto
- [ ] Los mensajes se pueden enviar
- [ ] Los mensajes del bot se reciben
- [ ] Las imágenes se muestran correctamente
- [ ] El indicador de "escribiendo..." funciona
- [ ] Los callbacks (`onNavigate`, `onLogin`, etc.) se ejecutan
- [ ] El tema personalizado se aplica

**Test Funcional:**
```javascript
const widget = PaseoLibreChat.init({
  apiKey: 'test',
  apiBaseUrl: 'https://api.test.com',
  
  onStateChange: (isOpen) => {
    console.log('✅ onStateChange ejecutado:', isOpen);
  },
  
  onEvent: (event, data) => {
    console.log('✅ onEvent ejecutado:', event, data);
  }
});

// Probar métodos
widget.open();
setTimeout(() => {
  console.assert(widget.getState().isOpen === true, '❌ El widget no se abrió');
  
  widget.sendMessage('Test message');
  console.log('✅ Mensaje enviado');
  
  widget.close();
  setTimeout(() => {
    console.assert(widget.getState().isOpen === false, '❌ El widget no se cerró');
    console.log('✅ Todos los tests pasaron');
  }, 100);
}, 100);
```

---

### ✅ 5. Build y Distribución

- [ ] `npm run build` completa sin errores
- [ ] Se genera `dist/paseo-libre-chat.js`
- [ ] Se genera `dist/standalone.d.ts`
- [ ] El bundle no es excesivamente grande (< 500KB)
- [ ] El sourcemap está generado

**Test Build:**
```bash
# Ejecutar build
npm run build

# Verificar archivos generados
ls -lh dist/

# Verificar tamaño del bundle
du -sh dist/paseo-libre-chat.js

# Verificar que los tipos existan
cat dist/standalone.d.ts | grep "PaseoLibreChatWidget"
```

---

### ✅ 6. Compatibilidad de Navegadores

- [ ] Chrome/Edge (últimas 2 versiones)
- [ ] Firefox (últimas 2 versiones)
- [ ] Safari (últimas 2 versiones)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

### ✅ 7. Responsive Design

- [ ] El widget se ve bien en desktop
- [ ] El widget se adapta a tablets
- [ ] En móvil, el chat ocupa toda la pantalla
- [ ] El botón flotante es accesible en móvil
- [ ] Las imágenes se escalan correctamente

---

### ✅ 8. Ejemplos Funcionando

- [ ] `examples/cdn-example.html` funciona
- [ ] `examples/react-example.tsx` compila sin errores
- [ ] `examples/nextjs-example.tsx` tiene la estructura correcta

**Test Ejemplos:**
```bash
# Abrir ejemplo CDN en navegador
open examples/cdn-example.html

# Verificar que no haya errores en la consola
```

---

## 🔧 Comandos de Verificación Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar build
npm run build

# 3. Verificar que los archivos se generaron
ls -la dist/

# 4. Modo desarrollo
npm run dev

# 5. Abrir en navegador
open http://localhost:3001
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@paseolibre/chat-widget-standalone'"
```bash
# Solución: Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: TypeScript no reconoce los tipos
```bash
# Solución: Regenerar tipos
npm run build:types
```

### El widget no aparece
```javascript
// Verificar en consola:
console.log(window.PaseoLibreChat); // Debe mostrar el objeto
console.log(document.getElementById('paseo-libre-chat-widget-root')); // Debe existir
```

### El build falla
```bash
# Limpiar y reconstruir
npm run clean
npm run build
```

---

## ✅ Checklist Final

Antes de considerar la instalación completa, verifica:

- [x] ✅ Build completa sin errores
- [x] ✅ Tipos TypeScript generados
- [x] ✅ CDN funciona (window.PaseoLibreChat existe)
- [x] ✅ React Provider exportado
- [x] ✅ Hook useChatWidget() funciona
- [x] ✅ Ejemplos creados y documentados
- [x] ✅ Documentación de instalación completa (INSTALLATION_GUIDE.md)
- [ ] 🔄 Widget probado en navegador (pendiente de probar con servidor real)
- [ ] 🔄 Conexión Socket.IO funcional (requiere backend)

---

## 📊 Resultado Esperado

```
✅ CDN Installation: READY
✅ NPM/React Installation: READY  
✅ TypeScript Support: READY
✅ Provider Pattern: READY
✅ Hook Pattern: READY
✅ Documentation: COMPLETE
✅ Examples: CREATED
⏳ Live Testing: PENDING (requiere API backend)
```

---

## 🎉 ¡Éxito!

Si todos los checks anteriores pasan, el widget está:

1. ✅ **Instalable vía CDN** - Script tag + window.PaseoLibreChat
2. ✅ **Instalable vía NPM** - import con soporte TypeScript
3. ✅ **Usable como Provider** - ChatWidgetProvider + useChatWidget()
4. ✅ **Totalmente tipado** - TypeScript types completos
5. ✅ **Documentado** - Guías de instalación y ejemplos
6. ✅ **Listo para producción** - Build optimizado

---

**Última actualización:** Enero 2026
