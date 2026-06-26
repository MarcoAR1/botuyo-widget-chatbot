# Changelog

All notable changes to **@botuyo/chat-widget-standalone** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Release rule:** every `package.json` version bump MUST add its entry here in the
> **same commit** as the bump. Add changes under `[Unreleased]`, then move them into a
> dated version section when you bump + publish. As a published npm package consumed by
> other repos, keep consumer-facing (breaking/feat/fix) notes clear.

## [Unreleased]

## [1.6.0] — 2026-06-26

### Added
- **Interactive 3D avatar preview.** `Avatar3DPreview` (consumed by the dashboard/landing
  to preview interviewer avatars) now supports mouse/touch **orbit + zoom** via OrbitControls,
  plus real **loading and error states** so a slow or broken `.glb`/`.vrm` gives clear feedback
  instead of a blank canvas.
  - **New optional props:** `interactive` (orbit/zoom, default `true`), `showShadow` (soft
    contact shadow, default `true`), `loadingLabel`, `errorLabel`, `onLoad`, and `onError`.
  - **Better visuals:** 3-point studio lighting and a soft contact shadow that grounds the model.
  - All new props are optional — **no breaking change** for existing consumers.

### Changed
- `Avatar3DPreview` no longer writes to `console.*` directly: model load failures now go through
  the centralized `logger` and surface an in-canvas error overlay (+ the new `onError` callback).

## [1.5.2] — 2026-06-26

### Fixed
- **Chat transcript no longer corrupts when a message id repeats.** A `chat_history`
  transcript carrying the same message `id` twice produced duplicate React keys, which
  corrupted list reconciliation — a single bot reply rendered visually **split around the
  user's message** with crossed timestamps. Bulk message loads now de-duplicate by id
  (`SET_MESSAGES` history merge + `RESTORE_SESSION` hydration), and the message list builds
  **collision-proof render keys** (a per-occurrence suffix) so two messages can never share a
  React key even if an id is repeated.

## [1.5.1] — 2026-06-26

### Fixed
- **Long emails/links no longer overflow the chat bubble.** Email (`mailto:`) and phone (`tel:`)
  autolinks were being mis-detected as call-to-action buttons. The CTA style is a fixed-width,
  non-wrapping uppercase pill, so an address like `marcorivero.mr26@gmail.com` — which happens to
  contain the substring `"ver"` — spilled outside the bubble. Email/phone autolinks now render as
  normal inline links, and every rendered link uses `break-words` so long addresses/URLs wrap inside
  the bubble. Genuine action links (`reservar`/`ver`/`pagar`) keep their CTA styling.

## [1.5.0] — 2026-06-25

### Added
- **Authenticated agents + inline tool approval.** The widget can now back an authenticated
  "operator copilot" agent: it forwards the host's verified user identity and renders a native
  confirmation card for mutating tool calls — no bespoke per-host chat UI required.
  - **New `getUserToken?: () => Promise<string>` prop.** The widget calls it during the socket
    handshake and again to refresh after the server reports the token expired/invalid. Preferred
    over `userContext.token` because it is refreshable; same `/webchat` connection, no route change.
  - **New `onAuthRequired?: () => void` prop.** Fired when the agent needs a verified identity and
    the presented token is missing/expired/invalid, so the host app can prompt the user to (re-)authenticate.
  - **New `ToolProposalCard` + `tool_proposal` message type.** When an agent wants to run a mutating
    tool that needs human confirmation, the widget renders a localized title/summary with Confirm/Cancel
    actions. The client echoes **only** the opaque `proposalId` on the `tool_confirm` / `tool_reject`
    socket events — the server re-derives the args (never trusts the client) and re-validates `ownerOnly`.
    Owner-only proposals show a badge and can be pre-disabled with `canConfirm={false}`.
  - **Server-driven resolution.** `tool_proposal_resolved` / `tool_proposal_expired` custom events mark
    an in-flight card as confirmed/cancelled/expired (e.g. on server-side expiry or history restore).
  - **i18n.** New `copilot` namespace (`proposalLabel`, `confirm`, `cancel`, `confirmed`, `cancelled`,
    `expired`, `ownerOnly`) in all four languages (es/en/pt/fr).
  - **Public API.** Exports `ToolProposalCard`, `ToolProposalCardProps`, `ToolProposalMessage`,
    `ToolProposalCardStatus`. Fully backward-compatible — all new props are optional.

## [1.4.4] — 2026-06-24

### Fixed
- **Voice: the "Próxima clase" card is now shown DURING a voice call.** On `suggest_next_class` the next-class card was only rendered on the host page's hero, which sits *behind* the fullscreen voice overlay — so while on a call the student heard "te agendo la próxima clase" but saw nothing. `VoiceCallOverlay` now renders the card inline (date + title/detail) as part of the in-call transcript. The actionable "Activar recordatorio" button stays on the hero card and is visible as soon as the call closes.
- **Voice: the interactive quiz no longer vanishes while the student thinks out loud.** The pinned quiz used to clear on *any* final user transcript, so background noise or thinking aloud dismissed it before the student could answer. The quiz now stays pinned until the bot starts its next spoken turn after the student answered (or the student taps an option), giving them time to respond.

## [1.4.3] — 2026-06-21

### Fixed
- **Voice: the mic can no longer be silenced by a "stuck" bot-speaking flag.** Half-duplex gating keyed off `isPlayingRef`, which is only cleared by the last audio source's `onended` callback. If that callback never fires — a suspended/closed `AudioContext`, a stalled or stopped source, network jitter — the flag stayed `true`, so the gate stayed authoritative **forever** and dropped the user's mic even though the bot had long finished talking (the reported "the bot greets/speaks but never hears me"). Bot-speaking is now derived from the **audio clock** (`resolveBotSpeaking`): the bot is treated as speaking only while the gapless schedule cursor (`nextPlayTime`) is still ahead of the `AudioContext` clock; once the clock passes it (or the context isn't running) the user is heard again regardless of the flag. Builds on v1.4.2 (`resolveShouldStream` defers to the server-side VAD while the bot is idle).

## [1.4.2] — 2026-06-21

### Fixed
- **Voice: while it's the user's turn, the mic is ALWAYS streamed — the client VAD can no longer silence a real voice.** v1.4.0's near-field energy gate (`nearFieldRms`) decided locally whether each frame was "speech", but that energy threshold is unreliable across microphones and input gains — a normal/quiet mic (or a tenant whose Silero model is blocked by a strict network, so the gate runs energy-only) could sit below the bar and have **100% of its audio dropped before it ever left the browser**, so the bot greeted/answered text but never heard speech. The widget now **defers to the provider's server-side VAD while the bot is idle** (`resolveShouldStream` — stream every frame on the user's turn), the pre-VAD "as it was" behavior, so being heard never depends on a client-side threshold. **Echo/greeting protection is unchanged:** while the bot is *speaking* the `VadGate` stays authoritative (only a clear, frontal barge-in streams; otherwise half-duplex), so the bot can't self-interrupt its greeting. Pairs with the backend greeting-gate (≥ v2.2.161).

## [1.4.1] — 2026-06-21

### Fixed
- **Voice: the user is heard even when the Silero VAD assets can't load.** On a network or
  CSP that blocks the VAD CDN (e.g. corporate networks / strict embeds), Silero never loaded,
  so mic chunks were never marked `voice_audio_chunk.speech: true` and the backend
  greeting-gate dropped all of them — the bot greeted and answered typed text but **ignored
  the user's voice**. In the energy-only fallback the widget now marks streamed near-field
  frames as `speech`, so being heard no longer depends on the third-party VAD CDN being
  reachable. Echo safety during the greeting is unchanged: while the bot speaks without a
  fresh VAD signal the gate still stays half-duplex (silent frame), so the bot can't
  self-interrupt and ambient noise can't cut the greeting.

## [1.4.0] — 2026-06-20

### Added
- **Client-side Voice Activity Detection (Silero VAD) — a provider-agnostic speech gate
  for voice calls.** The widget now decides locally what audio reaches the voice provider
  instead of relying on the provider's server-side VAD. It combines a real speech-vs-noise
  probability (Silero, via `@ricky0123/vad-web`) with a near-field energy check, so only a
  **clear, frontal** voice is streamed — background noise, fans/keyboards and distant
  chatter/TV no longer trigger or interrupt the bot.
  - **Barge-in preserved:** the detector runs continuously (even while the bot is speaking),
    so the user can always interrupt with a clear, frontal voice; playback is cut locally for
    instant feedback rather than waiting for the provider round-trip.
  - **Zero bundle impact, fully transparent:** Silero loads lazily from a pinned CDN only when
    a call starts (no npm dependency, no config required). On any failure — offline, strict
    CSP, unsupported browser — it **degrades gracefully** to the near-field energy gate, so a
    call never breaks.
  - **New config (all optional):** `voiceConfig.vad` (`'low' | 'standard' | 'high'`, a partial
    threshold object, or `false` to use the energy gate only) and `voiceConfig.vadAssetBaseUrl`
    to self-host the Silero/ONNX assets for strict-CSP tenants. Defaults to on (`'standard'`);
    the existing `noiseGate` setting is still honored.
- **Greeting barge-in coordination (pairs with backend ≥ v2.2.140).** During the bot's
  greeting the mic stays **half-duplex** unless Silero confirms a real, near-field voice — so
  the bot's own audio leaking into the mic can't self-interrupt the greeting — and the widget
  marks confirmed-speech chunks with `voice_audio_chunk.speech: true` so the backend lets a
  genuine barge-in through while dropping ambient noise during the greeting.
- **`startCall()` — open the widget straight into a voice call.** New programmatic API on both
  surfaces: `useChatWidget().startCall()` (React) and `window.BotUyoChat.startCall()`
  (standalone), plus a `botuyo-chat:start-call` window event. It opens the widget and
  auto-starts the voice call as soon as the socket connects (and the agent has voice enabled),
  so a host page's "start a class / call" button goes straight to the call instead of the text
  chat. No-ops gracefully to the text chat when voice is disabled.

## [1.3.5] — 2026-06-19

### Added
- **Quiz questions now stay pinned on screen until answered.** When the agent asks a
  multiple-choice question (`quiz_question`), the question + options are pinned in a dock
  just above the input (text chat) or above the call controls (voice), so they no longer
  scroll away with the transcript while the agent keeps talking. The pinned quiz is
  dismissed as soon as the user answers — tapping an option (text or voice), answering by
  voice (final transcript) in a call, or typing another message in text chat. Once
  resolved, the quiz files back into the transcript as history (the chosen option stays
  highlighted in text chat). Applies to BOTH text and voice modes.

## [1.3.4] — 2026-06-19

### Fixed
- **Call overlay now shows the ACTIVE agent's avatar after a mid-session transfer + re-call (no page reload needed).** `VoiceCallOverlay` applies the agent avatar identity the backend now sends in `voice_ready` (every call start) and `voice_agent_switched` (live transfer), overriding the connect-time `logoUrl` / `avatars` props which go stale after an in-call agent switch. Works for any agent family (e.g. Ms. Ellis Nivelador → B1); falls back to the connect-time props when the server sends no avatar. Requires backend `v2.2.123`.

## [1.3.3] — 2026-06-19

### Fixed
- **Voice transcript no longer piles up / duplicates in the chat.** Removed the
  client-side voice-transcript dump (which re-added the same turns with new ids on
  call end). The chat transcript is now **server-authoritative**: on the `chat_history`
  socket event the list is reconciled via the new `mergeServerHistory` util (the server
  transcript replaces the local list, preserving only genuine in-flight messages).
  `localStorage` remains a fast-paint cache, reconciled on every `chat_history`.

### Added
- **Server history sync after a voice call:** when a call ends (user- or server-initiated)
  the widget requests fresh history (`request_history`) so the just-finished turns —
  persisted server-side — appear in the chat. This also fixes the transcript being lost
  when the AGENT ended the call. Pairs with the backend `chat_history` emit on connect.

## [1.3.2] — 2026-06-18

### Added
- **Voice-first (kiosk) mode** (`voiceFirst` prop on `ChatWidget`): renders ONLY a
  fullscreen voice-call experience that auto-starts the call as soon as the socket
  connects — no launcher, no text chat window. Built for the recruiting interview room.
  The host is notified via `onEvent`:
  - `onEvent('voice_call_ended', { reason })` when the SERVER ends the call
    (e.g. `reason: 'interview_completed'` once the agent finalizes the interview).
  - `onEvent('voice_first_ended', {})` when the call overlay closes for any reason.
- **`VoiceCallOverlay.onCallEnded(reason)`** callback — fired when the backend emits
  `voice_call_ended`, forwarding the reason so a voice-first host can show its
  completion screen before the overlay auto-closes.
- **Live agent/variant switch reflected in the chat** (`agent_switched` socket event):
  when the backend switches the active agent — a `switch_variant` (intra-family) or a
  `transfer_to_department` (inter-agent) — the header now updates to the new agent's name
  and avatar, and a localized system bubble announces it (e.g. "Now chatting with
  Ms. Ellis · A2"). Payloads are Zod-validated; copy added in all four locales (es/en/pt/fr).
- **Configurable voice noise gate** (`theme.voiceNoiseGate`): a background-noise gate that
  isolates the speaker in front of the device during live voice calls —
  `'off' | 'low' | 'standard' | 'high'` (default `'standard'`), a boolean, or a partial
  `VoiceGateConfig` for fine control. Backed by a shared audio chain (highpass/lowpass +
  dynamic compressor + an AudioWorklet RMS gate). New public exports: `VoiceGateSetting`,
  `VoiceGateSensitivity`, `VoiceGateConfig`, `VOICE_GATE_PRESETS`. The backend can push the
  setting through the agent's widget config.
- **Screen stays awake during voice calls** (`useWakeLock`): acquires a Screen Wake Lock
  while a call is active so the display does not dim or blank, re-acquiring it after tab or
  visibility changes; gracefully no-ops where the API is unavailable.

## [1.3.1] — 2026-06-17

### Fixed
- **Voice call overlay:** the agent's spoken transcript no longer gets glued into the
  tool bubble. Tool renders (quiz, content cards) and agent-switch notices now render in
  their own bubble, and a following `voice_model_transcript` opens a new bubble instead of
  being appended onto the tool output.

### Changed
- **Voice call overlay:** quiz option buttons restyled to read unmistakably as buttons
  (solid gradient fill, elevation + inset top highlight, lift on hover) with more spacing
  between the question, the options, and the conversation bubbles.

## [1.3.0] — baseline

Changelog introduced at this version. For prior history, see `git log`.
