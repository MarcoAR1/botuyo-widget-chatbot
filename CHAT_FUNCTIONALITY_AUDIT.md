# 🧪 Auditoría de Funcionalidad del Chat y Plan de Mejora

Este documento identifica problemas actuales, riesgos y oportunidades de mejora para dejar el widget de chat completamente funcional, sin errores y con UX sólida en desktop y mobile.

## 📌 Estado Actual Verificado
- Build: OK, sin advertencias de Rollup/Vite tras ajustar `exports: 'named'` en [vite.config.ts](vite.config.ts#L15-L35)
- Linting: OK, 0 errores / 0 warnings (se desactivó `no-explicit-any` por flexibilidad de API)
- Altura dinámica mobile: OK, se usa `visualViewport` con limpieza de listeners en [useDynamicHeight.ts](src/chat-widget/hooks/useDynamicHeight.ts#L20-L70)
- Persistencia: OK, con debounced autosave y rehidratación segura en [useChatState.ts](src/chat-widget/hooks/useChatState.ts#L70-L110)
- Accesibilidad parcial: `role="dialog"` presente en [ChatWindow.tsx](src/chat-widget/components/ChatWindow.tsx#L45), faltan mejoras de foco y `aria-labels`.

## ❗ Problemas Detectados (Prioridad)

### 1) Tipos del protocolo Socket desincronizados
- Evidencia: `ClientToServerEvents.user_message` solo permite `text | image | location` en [types/socket.ts](src/chat-widget/types/socket.ts#L20-L35), pero el UI envía también `audio` y `file` en [ChatWidget.tsx](src/chat-widget/ChatWidget.tsx#L247-L292) y renderiza `audio` en [MessageBubble.tsx](src/chat-widget/components/MessageBubble.tsx#L79-L96).
- Riesgo: Uso de `as any` para el tipo rompe seguridad de tipos, puede causar mensajes ignorados por el backend.
- Acción: Ampliar tipos para soportar `audio` y `file` en C↔S, y añadir `audio` en `BotMessagePayload`.

### 2) Falta de cola y reintentos al estar offline
- Evidencia: En [useChatSocket.ts](src/chat-widget/hooks/useChatSocket.ts#L166-L206) si no hay conexión, se corta con error y no se guarda el mensaje.
- Riesgo: UX pobre en móviles con reconexión, pérdida de intención del usuario.
- Acción: Implementar cola en memoria + reintentos exponenciales; emitir un evento `queued_message` al UI.

### 3) Eventos `typing` no están limitados
- Evidencia: Emisión directa en [useChatSocket.ts](src/chat-widget/hooks/useChatSocket.ts#L232-L236) sin throttle/debounce.
- Riesgo: Saturación de eventos en conexiones inestables.
- Acción: Añadir `throttle(250ms)` para `typing` y `debounce(300ms)` en el lado UI.

### 4) Rendimiento: lista sin virtualización
- Evidencia: Render directo `messages.map(...)` en [MessageList.tsx](src/chat-widget/components/MessageList.tsx#L80-L144).
- Riesgo: Conversaciones largas degradan rendimiento y memoria.
- Acción: Integrar virtualización ligera (por ejemplo, `react-virtual`) y windowing de mensajes.

### 5) Seguridad de contenido (Markdown)
- Evidencia: Uso de `react-markdown` + `remark-gfm` en [MessageBubble.tsx](src/chat-widget/components/MessageBubble.tsx#L121-L156) sin sanitización explícita.
- Riesgo: XSS si el backend o terceros envían contenido no confiable.
- Acción: Integrar `rehype-sanitize` con whitelist de elementos/atributos; validar URLs.

### 6) Accesibilidad y manejo de foco
- Evidencia: `role="dialog"` sin foco-trap ni `aria-labelledby/aria-describedby` en [ChatWindow.tsx](src/chat-widget/components/ChatWindow.tsx#L45-L120).
- Riesgo: Navegación por teclado deficiente, lectores de pantalla con contexto pobre.
- Acción: Añadir foco-trap al abrir, manejar retorno de foco al cerrar, `aria-*` descriptivos.

### 7) Bundle size elevado (~928 kB)
- Evidencia: Output en build: `928.32 kB` en `dist/paseo-libre-chat.js`.
- Riesgo: Carga lenta en 3G, impacto en LCP.
- Acción: Lazy-load de librerías pesadas (`framer-motion`, `remark-gfm`, `date-fns`, `browser-image-compression`), code splitting condicional, eliminar console en producción.

### 8) Logs en producción
- Evidencia: `console.log/warn/error` en múltiples archivos, por ejemplo [ChatWidget.tsx](src/chat-widget/ChatWidget.tsx#L116-L136), [useChatState.ts](src/chat-widget/hooks/useChatState.ts#L116-L137).
- Riesgo: Ruido en consola, posible exposición de datos.
- Acción: Encapsular en `logger` con flag `DEBUG`; eliminar logs en build.

### 9) Envío de adjuntos como Base64
- Evidencia: `toBase64(file)` y `sendMessage(b64, t)` en [ChatWidget.tsx](src/chat-widget/ChatWidget.tsx#L226-L292).
- Riesgo: Mensajes pesados, latencia y uso de memoria; límites de payload.
- Acción: Migrar a carga por URL presignada (Cloudflare R2 está documentado), y enviar solo metadatos (link, tipo, tamaño).

### 10) Tipado flexible sin validación
- Evidencia: `sanitizeIncomingMessage(data: any)` en [useChatSocket.ts](src/chat-widget/hooks/useChatSocket.ts#L40-L88) convierte libremente estructuras.
- Riesgo: Mensajes mal formados rompen UI.
- Acción: Validar payload con `zod` y descartar/sanar campos inesperados.

## 🛠️ Plan de Trabajo Priorizado

1. Tipos del protocolo (audio+file) y sanitización
2. Cola offline + reintentos exponenciales
3. Throttle/debounce para `typing`
4. Virtualización de `MessageList`
5. Sanitización Markdown con `rehype-sanitize`
6. Accesibilidad (foco-trap, `aria-*`)
7. Optimización de bundle (lazy imports + tree-shaking)
8. Logger con `DEBUG` y limpieza en producción
9. Adjuntos con URLs presignadas (Cloudflare R2)
10. Validación de payload con `zod`

## ✅ Criterios de Aceptación

- Sin `any` crítico en protocolo de mensajes; UI y backend alineados.
- En modo offline: mensajes se encolan y se envían al reconectar; feedback visual.
- `typing` estable sin spam; uso máximo de red 1 evento/250ms.
- Listas con 5,000 mensajes mantienen FPS aceptable (>50fps) y memoria contenida.
- Markdown seguro: sin ejecución de scripts, solo tags permitidos.
- Accesible: navegación por teclado, foco correcto, labels ARIA presentes.
- Bundle inicial < 500 kB (objetivo), módulos pesados cargados bajo demanda.
- Consola limpia en producción; logs visibles solo con `DEBUG=1`.
- Adjuntos subidos fuera de Socket; se envían metadatos y preview.
- Payloads validados; UI resistente ante datos inesperados.

## 📎 Cambios de Código Propuestos (Resumen)

- `src/chat-widget/types/socket.ts`: ampliar `UserMessagePayload.type` a `'text' | 'image' | 'audio' | 'file' | 'location'`; añadir `'audio'` en `BotMessagePayload.type`.
- `src/chat-widget/hooks/useChatSocket.ts`: implementar cola y reintentos (`backoff`); throttling en `typing`.
- `src/chat-widget/components/MessageList.tsx`: integrar `react-virtual` para windowing.
- `src/chat-widget/components/MessageBubble.tsx`: usar `rehype-sanitize` en Markdown.
- `src/chat-widget/components/ChatWindow.tsx`: foco-trap al abrir; `aria-labelledby/aria-describedby`.
- `src/chat-widget/ChatWidget.tsx`: migrar adjuntos a flujo de subida + metadatos; eliminar `toBase64` en producción.
- `vite.config.ts`: conservar `exports: 'named'`, añadir `drop_console: true` en producción.
- `src/chat-widget/hooks/useSEOMetadata.ts`: ya corregido el `useMemo` complejo; mantener.

## 🔍 Referencias de Código
- Altura dinámica mobile: [useDynamicHeight.ts](src/chat-widget/hooks/useDynamicHeight.ts#L20-L70)
- Entrada y adjuntos: [InputArea.tsx](src/chat-widget/components/InputArea.tsx#L1-L120)
- Emisión de mensajes: [ChatWidget.tsx](src/chat-widget/ChatWidget.tsx#L226-L292)
- Socket: [useChatSocket.ts](src/chat-widget/hooks/useChatSocket.ts#L1-L120)
- Lista de mensajes: [MessageList.tsx](src/chat-widget/components/MessageList.tsx#L80-L144)
- Burbuja: [MessageBubble.tsx](src/chat-widget/components/MessageBubble.tsx#L121-L180)

---

Si quieres, puedo empezar por los tipos del socket y la cola offline. Confirma y lo implemento de inmediato.