# Burbujas superpuestas al retomar el chat

## Resultado y alcance

Se reprodujo una causa de superposición en Chromium y se corrigió en el widget. La prueba con el `MessageList` anterior midió **491,5 px de invasión entre filas**; con el componente corregido pasa la comprobación de separación con tolerancia de 1 px. Se utilizó el mismo contenido y navegador; el control anterior conservó las demás mejoras de `MessageBubble`, por lo que también permite aislar el defecto de la lista.

Esto confirma un defecto real, pero no identifica de manera exclusiva el incidente de producción: no contamos con su cantidad de mensajes, duración de la pausa, navegador, versión desplegada ni eventos de red. Los cambios están en el repositorio local; no se publicaron.

## Causa principal

`MessageList.tsx` cambia de renderizado normal a virtualizado cuando hay **más de 100 mensajes**. La implementación anterior posicionaba cada fila de forma absoluta cada 80 px (`estimateSize`), sin conectar `measureElement` ni `data-index`. Los 80 px se convertían de hecho en una altura fija, aunque el contenido ocupara mucho más.

Al retomar una conversación hay dos disparadores especialmente relevantes:

- El separador temporal agrega contenido y márgenes a la primera fila posterior a una pausa de más de 15 minutos. Esa altura tampoco se contabilizaba.
- La hidratación de IndexedDB carga hasta 100 mensajes. El primer mensaje nuevo puede pasar de 100 a 101 y activar justamente el renderer defectuoso.

La inactividad no es un temporizador que cambie el CSS. Puede producir un separador, una reconexión con reemplazo de historial o coincidir con el cruce del umbral. Los textos largos ya podían solaparse sin ninguna pausa. Las imágenes, galerías y cambios de ancho agravaban el problema porque alteran la altura real.

La solución conserva la virtualización y mide la fila completa, incluyendo márgenes y separador, dentro de un contenedor `flow-root`. El observador del virtualizador actualiza las medidas cuando cambia el contenido. Las claves se basan en la identidad del mensaje, con una codificación que evita colisiones entre IDs repetidos y sufijos literales. El scroll virtual utiliza desplazamiento automático para evitar transiciones suaves compitiendo con medidas cambiantes. Se limita explícitamente el tamaño mínimo del contenedor flexible.

Referencia de la API utilizada: [TanStack Virtual: medición de elementos y claves](https://tanstack.com/virtual/latest/docs/api/virtualizer). La implementación también se contrastó con el código instalado en `node_modules`; no se agregaron opciones exclusivas de versiones más recientes.

## Otros defectos corregidos

| Defecto                                                                                                 | Consecuencia                                                                                                 | Corrección                                                                                                    |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `MessageList` comparaba solamente cantidad y último ID; `MessageBubble` omitía contenido y varias props | Historial actualizado, fuentes, respuestas de quiz o callbacks podían quedar obsoletos                       | `memo` con comparación estándar de todas las props; el estado se actualiza de forma inmutable                 |
| El quiz copiaba `selectedId` únicamente al montar                                                       | Una respuesta recuperada del historial podía dejar botones activos                                           | Se respeta `answered` y `selectedId` del mensaje además de la selección local                                 |
| La fusión de historial usaba el estado capturado por un callback                                        | Un mensaje agregado y una recuperación de historial en el mismo lote de React podían perder el mensaje nuevo | Acción `MERGE_HISTORY` en el reducer, que opera sobre el estado más reciente                                  |
| La deduplicación comparaba texto contra todo el historial sin límite temporal                           | Un nuevo “hola” después de una pausa desaparecía                                                             | Comparación de tipo, autor y texto dentro de 30 segundos; correspondencia uno a uno                           |
| Imágenes y ubicaciones sin `content` compartían firma vacía                                             | Mensajes distintos podían descartarse como duplicados                                                        | La deduplicación por texto se aplica sólo a mensajes textuales no vacíos                                      |
| Un reintento confirmado seguía en la cola                                                               | Nuevos envíos innecesarios, con riesgo de respuestas repetidas                                               | Se marca como entregado y se retira antes del próximo intento; el intento final puede informar su agotamiento |
| Texto sin espacios y fuentes en la misma fila horizontal                                                | Desbordamiento o compresión del texto en anchos pequeños                                                     | Ajuste de ancho, ruptura de palabras largas y fuentes en una fila propia                                      |

## Prevención y pruebas

Las pruebas de DOM por sí solas no validan alturas ni superposición. Se agregó Playwright con un fixture que carga el componente y su CSS real, sin depender de una cuenta, backend ni mensajes de clientes.

`npm run test:e2e` verifica en Chromium:

- Cruce de 100 a 101 mensajes y conversación que ya tiene 120.
- Envío con fecha 20 minutos posterior, para activar el separador sin esperar 20 minutos reales.
- Actualización del contenido conservando IDs y cantidad.
- Cambio de ancho, cierre/reapertura y contenedor oculto que vuelve a mostrarse.
- Inserción de historial anterior y reducción a 50 mensajes, volviendo al renderer normal.
- Visibilidad del final de la lista con indicador de escritura.
- Texto de 500 caracteres sin espacios en una conversación corta.
- Imagen cuya carga se libera después del render, comprobando la nueva geometría.

Las pruebas unitarias agregadas cubren actualización de contenido, callbacks actuales, quiz restaurado, colisiones de claves, repetición de saludos, imágenes diferentes, correspondencia uno a uno, fusión de historial en un mismo lote y cancelación de reintentos confirmados.

Resultado de la validación local: 792 pruebas unitarias aprobadas (la suite mantiene 10 omitidas), cuatro escenarios E2E aprobados en Chromium, TypeScript sin errores y build ES/UMD/declaraciones completado. ESLint terminó sin errores, con advertencias del repositorio; el build también conserva advertencias de CSS (`:new`), Browserslist y división de chunks. No se presenta la compilación como libre de advertencias.

Para prevenir regresiones, ejecutar `npm run test:run`, `npm run typecheck`, `npm run lint`, `npm run build` y `npm run test:e2e` antes de publicar cambios en la lista, las burbujas, el historial o el CSS. La configuración E2E conserva trazas de los fallos. No se modificó la infraestructura de CI.

## Riesgos adicionales y límites pendientes

Estos puntos se identificaron por lectura del código; no deben confundirse con causas demostradas del solapamiento ni darse por resueltos:

- **Identidad extremo a extremo:** el mensaje optimista usa `temp-*`, el socket genera otro ID y el historial devuelve el ID persistido. La ventana de 30 segundos es una heurística: un envío legítimo idéntico muy cercano o un reloj muy desfasado siguen siendo ambiguos. La solución completa requiere conservar un `clientMessageId` en persistencia, historial y ACK, con idempotencia en el servidor.
- **Historial parcial:** el backend devuelve una ventana y `hasMore`; el widget reemplaza el historial y no pagina usando ese dato. Pueden desaparecer mensajes antiguos al reconectar. El cambio de renderer se prueba, pero no se implementó paginación ni se cambió el contrato del backend.
- **Caché y sesión:** la hidratación asíncrona, el cambio de agente y la limpieza de IndexedDB merecen pruebas de integración específicas. El guardado actual también puede conservar registros antiguos según la operación de almacenamiento. No se modificaron esas políticas.
- **Transporte:** la cola offline se vacía sin ACK y el envío inicial no establece un timeout propio de confirmación; tampoco se verificó aquí la idempotencia del servidor. Corregir el reintento confirmado no equivale a garantizar entrega exactamente una vez.
- **Scroll de lectura:** sigue existiendo auto-scroll ante cambios de mensajes. Una política de “seguir sólo si estaba al final”, respetando al usuario que lee mensajes antiguos, requiere otro ajuste de comportamiento.
- **Agrupación:** fechas inválidas o mensajes fuera de orden pueden producir separadores/grupos inconsistentes; la agrupación existente no rechaza diferencias negativas. No provoca la altura fija que se corrigió.
- **Producción y dispositivos:** el fixture no simula la suspensión real del proceso de una pestaña, una pérdida de red real ni el teclado de Safari/iOS. Falta contrastar esos escenarios con la integración donde se reportó el incidente y con el bundle efectivamente servido por CDN.

Antes de cerrar el incidente de producción, registrar navegador, versión del widget, número de mensajes y secuencia de conexión/historial, sin contenido privado, y repetir el escenario original con el bundle corregido. No es necesario afirmar que nunca habrá otro bug para mantener una prevención verificable: la comprobación automática de geometría debe continuar fallando si se reintroduce el posicionamiento por alturas estimadas sin medir.

## Integraci?n para publicar

Antes del push se actualiz? la base local a `c4126e0` (v1.8.17). Se conserv? su normalizaci?n cronol?gica y la acci?n `MERGE_SERVER_HISTORY` ya existente, agregando las correcciones visuales, de deduplicaci?n y de reintentos de este informe. La versi?n de publicaci?n es **1.8.18**; 1.8.3 ya hab?a sido utilizada en el remoto.

Validaci?n de la integraci?n final: 806 pruebas unitarias aprobadas (10 omitidas existentes), cuatro escenarios E2E aprobados y build ES/UMD/declaraciones completado.
