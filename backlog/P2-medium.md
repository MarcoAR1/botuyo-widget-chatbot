# P2 — Medium

## WID-P2-2 — Hardcoded `voice_start { language: 'es-AR', voice: 'Kore' }`

- **Category:** inconsistency / config gap
- **Location:** `src/chat-widget/components/VoiceCallOverlay.tsx:991`
- **Problem:** The live-voice kickoff hardcodes Spanish + the "Kore" voice. The backend now treats the **agent's configured voice as authoritative** (so `voice:'Kore'` is a harmless fallback), but `language:'es-AR'` is still sent and is dead/ignored — and a non-Spanish tenant can't influence the widget's voice kickoff at all.
- **Fix:** Accept `voice`/`language` via `mediaConfig` props (default to current values for back-compat) and emit those. Coordinates with backend BE-P2-4. Public-API change → minor version bump + changelog.
- **Confidence:** High. **Effort:** S–M (prop threading + types + tests).
