# P1 — High

## WID-P1-1 — Two parallel voice-call implementations (likely dead code + bundle bloat)

- **Category:** dead code / duplication / bundle size
- **Locations:**
  - `src/chat-widget/voice/useLiveCall.ts` — opens a **raw `WebSocket`** (`new WebSocket`, `ws.onopen/onmessage/onclose`), custom `LiveCall*` message protocol; consumed by `src/chat-widget/components/LiveCallInputArea.tsx`.
  - `src/chat-widget/components/VoiceCallOverlay.tsx` — uses the **socket.io** path (`socket.emit('voice_start', …)`), which is what the backend `WebChatGateway` actually implements.
- **Problem:** Two different live-voice transports coexist. The backend voice seam is socket.io `voice_start` (`VoiceCallOverlay`), so the raw-WebSocket `useLiveCall`/`LiveCallInputArea` path is very likely **legacy/dead**. RULE 2 states bundle size is critical for this embeddable widget — shipping a second, unused voice stack (plus its types) is real bloat.
- **Fix:** **(verify)** which voice UI `ChatWidget` actually mounts. If `useLiveCall`/`LiveCallInputArea` is unreachable, remove it (hook + component + `LiveCall*` types + tests). If both are intentionally supported, document the split and de-duplicate shared logic.
- **Confidence:** Med — two implementations confirmed; live/dead status needs a quick trace from `ChatWidget.tsx`. **Effort:** M (removal + test cleanup) — high payoff (bundle).
