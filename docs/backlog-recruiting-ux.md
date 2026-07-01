# Backlog — Chat Widget UX Fixes (Recruiting Voice Overlay)

> Generado: 2026-07-01 · Origen: Auditoría de usabilidad del flujo de recruiting (entrevista de candidatos)

---

## Completado ✅

### [WGT-UX-001] Fix flexbox overflow en VoiceCallOverlay
- **Archivo:** `src/chat-widget/components/VoiceCallOverlay.tsx`
- **Problema:** El contenedor scrollable de la conversación (`flex-1 overflow-y-auto`) crecía indefinidamente por `min-height: auto` de flexbox, empujando los controles inferiores (mute, end call, text input) fuera del viewport.
- **Fix aplicado:** Añadido `min-h-0` al contenedor scrollable (línea 1711).
- **Verificación:** Build exitoso + 873 tests pasando.
- **Commit:** `fix(voice): add min-h-0 to voice overlay conversation container`
