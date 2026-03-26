---
name: BotUyo TDD & Best Practices
description: Core guidelines for developing features in the BotUyo Chat Widget project using a strict Test-Driven Development (TDD) approach to prevent regressions.
---

# 🚀 BotUyo Chat Widget: TDD & Mejores Prácticas

Este skill define la metodología obligatoria para cualquier desarrollo, modificación o refactorización dentro del proyecto `botuyo-widget-chatbot`. El objetivo principal es mantener la estabilidad del sistema y asegurar que las nuevas funcionalidades ("features") no rompan el comportamiento existente mediante la aplicación estricta de Test-Driven Development (TDD).

## 1. 🏗️ Estructura del Proyecto

Antes de desarrollar, es fundamental entender la estructura del proyecto para ubicar las pruebas y el código correctamente:

- `src/chat-widget/`: Contiene los componentes React (TSX), hooks, estado y lógica específica de la interfaz de usuario del widget de chat.
  - `components/`: Componentes UI modulares (`ChatWindow`, `MessageList`, etc.).
  - `i18n/`: Lógica de internacionalización y traducciones.
- `src/lib/`: Utilidades genéricas, helpers y lógica de negocio pura (desacoplados de React para facilitar su testeo).
- `src/test/` (o archivos `*.test.ts/tsx` / `*.spec.ts/tsx` junto al código): Pruebas unitarias de Vitest y configuración de testing.
- `e2e/` o subcarpetas de Playwright: Pruebas End-to-End que interactúan con el widget renderizado en un entorno de navegador real.

Tecnologías Clave: **React, TypeScript, TailwindCSS, Socket.IO, Vitest, Playwright, Storybook.**

## 2. 🧪 Metodología TDD Obligatoria (El Ciclo Red-Green-Refactor)

**Regla de Oro:** **NUNCA** debes escribir o modificar el código de producción antes de haber escrito una prueba que falle (Red) o haber modificado una prueba existente para que refleje el nuevo requisito.

Sigue rigurosamente estos pasos al implementar nuevas features:

1. **🔴 Escribir la Prueba (Red):** 
   - Traduce los requerimientos de la nueva feature en un caso de prueba utilizando **Vitest** (para lógica unitaria/componentes) o **Playwright** (para flujos UI).
   - Ejecuta la prueba respectiva (`npm run test` o `npm run test:e2e`). Debe **FALLAR** o estar en rojo, garantizando que el entorno detecta la falta de la implementación.

2. **🟢 Escribir el Código (Green):**
   - Escribe *únicamente* el código mínimo necesario en `src/` para hacer pasar la prueba.
   - Apóyate en utilidades y componentes existentes antes de duplicar comportamiento.
   - Ejecuta las pruebas nuevamente. Todas las pruebas (incluidas las de features anteriores) deben **PASAR**.

3. **🔵 Refactorizar (Refactor):**
   - Mejora el diseño del código, elimina duplicación, limpia la estructura de clases/interfaces (TypeScript), o aplica principios SOLID.
   - Ejecuta las pruebas continuamente durante este proceso para asegurar que tu refactorización no rompió un feature estabilizado.

## 3. 🛡️ Prevención de Regresiones

Para garantizar que "implementaciones nuevas no rompan features anteriores":

- **Ejecución Múltiple:** Antes de dar por finalizado un feature, ejecuta **toda la suite completa de pruebas** mediante `npm run build` (que suele fallar si hay errores de tipos) y `npm run test:run` / `npm run test:e2e`.
- **No ignorar test rotos:** Si un test existente falla al implementar un nuevo feature:
  - **Opción A (Regresión Falsa):** El nuevo feature de hecho cambió el contrato/regla de negocio esperado. En este caso, **actualiza los tests anteriores primero**.
  - **Opción B (Regresión Real):** Rompiste funcionalidad esperada incidentalmente. Corrige tu nuevo código para no pisar el contrato previo.
- **Mocking Extremo:** Para aislar tests, mokea con Vitest (`vi.mock`) y utilidades estandarizadas dependencias que inyecten estado frágil (como llamadas de Red/Socket.IO) dentro de los tests unitarios.

## 4. 📐 Patrones Promulgados por este Skill

- **Single Responsibility Component:** Cada componente exportado desde `src/chat-widget/components` no debe tener más de una sola responsabilidad de renderizado.
- **Tipado Fuerte Obligatorio:** Todo prop nuevo y Payload asociado a Socket de Chat o API debe tener su Interface en TypeScript sin uso de `any` o conversiones dudosas.
- **TDD Asistido por IA (Instrucción Clave):** Cada vez que recibas una instrucción de modificar un archivo, tu primer paso como Agente será abrir dicho archivo **y su contraparte de prueba**, definir las aserciones, verificar que fallen e iterar desde ahí.
