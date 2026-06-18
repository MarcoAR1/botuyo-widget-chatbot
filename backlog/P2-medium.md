# P2 — Medium

## WID-P2-1 — `console.*` used directly instead of `logger.*` (RULE 9 / pitfall 12.9)

- **Category:** inconsistency / rule violation
- **Locations (production code, not stories/tests):**
  - `src/chat-widget/voice/useLiveCall.ts:317,347,352,359,371,399`
  - `src/chat-widget/voice/useVoiceState.ts:106`
  - `src/chat-widget/components/VoiceCallOverlay.tsx:247,643,960,985`
  - `src/chat-widget/components/LiveCallInputArea.tsx:77`
  - `src/chat-widget/components/Avatar3DPreview.tsx:116`, `Avatar3D.tsx:222,224`
  - `src/chat-widget/i18n/LanguageContext.tsx:55`
- **Problem:** RULE 9 mandates the centralized `logger` (gates `log/warn/info/debug` behind the DEBUG flag; only `error` is always shown). Direct `console.log/info/warn` **always print** on the host page's console — noisy/embarrassing for an embedded widget and leaks internal state. The entire `voice/` module appears to predate/ignore the logger convention.
- **Fix:** Replace `console.*` with `logger.*` (import from `utils/logger.ts`) using the `[Component] msg` prefix. Stories (`*.stories.tsx`) and `utils/logger.ts` itself are exempt.
- **Confidence:** High — confirmed in source. **Effort:** S (mechanical) — but touch the voice module carefully (RULE 10 TDD).

## WID-P2-2 — Hardcoded `voice_start { language: 'es-AR', voice: 'Kore' }`

- **Category:** inconsistency / config gap
- **Location:** `src/chat-widget/components/VoiceCallOverlay.tsx:991`
- **Problem:** The live-voice kickoff hardcodes Spanish + the "Kore" voice. The backend now treats the **agent's configured voice as authoritative** (so `voice:'Kore'` is a harmless fallback), but `language:'es-AR'` is still sent and is dead/ignored — and a non-Spanish tenant can't influence the widget's voice kickoff at all.
- **Fix:** Accept `voice`/`language` via `mediaConfig` props (default to current values for back-compat) and emit those. Coordinates with backend BE-P2-4. Public-API change → minor version bump + changelog.
- **Confidence:** High. **Effort:** S–M (prop threading + types + tests).
