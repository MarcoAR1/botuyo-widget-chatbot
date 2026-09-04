# Changelog

All notable changes to **@botuyo/chat-widget-standalone** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Release rule:** every `package.json` version bump MUST add its entry here in the
> **same commit** as the bump. Add changes under `[Unreleased]`, then move them into a
> dated version section when you bump + publish. As a published npm package consumed by
> other repos, keep consumer-facing (breaking/feat/fix) notes clear.

## [Unreleased]

## [1.8.9] — 2026-09-04

### Added
- **`theme.cssVariables.fontFamily`** (`--font-family`) — set the widget's font stack (e.g. `"'Inter', sans-serif"`). Applied to the whole widget tree; falls back to the host page font when unset.
- **`theme.cssVariables.borderWidth`** (`--border-width`) — border thickness for the chat window, bot bubbles and input. Default `1px`.

### Fixed
- The desktop chat window hard-coded `border-radius: 32px`, ignoring `windowBorderRadius`. It now honors `--window-border-radius` (default `32px`, non-breaking).

### Docs
- README: complete configurable-tokens table (colors, radii, `bubbleRadius`, `inputRadius`, `borderWidth`, `fontFamily`, spacing) and a note that tokens can be set **consumer-side** (`theme.cssVariables`) or **server-side** via the agent's `widgetConfig.cssVariables` (JSON).

## [1.8.8] — 2026-09-04

### Added
- **`theme.cssVariables.bubbleRadius`** (`--bubble-radius`) and **`theme.cssVariables.inputRadius`** (`--input-radius`) — the chat bubble and text-input corner radii used to be hard-coded (`18px` / `24px`) and ignored the theme. They are now consumer-configurable, with those same values as defaults (non-breaking).

## [1.8.1] — 2026-08-11

### Changed
- Maintenance release to re-publish the widget (npm + R2 CDN) and trigger a coordinated redeploy across all botuyo repos. No functional changes.

## [1.7.7] — 2026-07-01

### Changed
- **Removed `(safe as any)` casts in the `useChatSocket` message sanitizer (WID-P3-1, RULE 11).**
  The message type is now derived via `z.infer<typeof BotMessageSchema>` and the not-parsed fallback
  is typed as `{ type: 'text' }`, so `content`/`emotion`/`sources` read through the schema's inferred
  types instead of `any`. Type-only change — no runtime behavior change, no public API change.

## [1.7.6] — 2026-07-01

### Removed
- **Dead "Voice Notes" (async voice-message) stack removed — cleaner codebase, no public API change.**
  The mounted widget uses the realtime socket.io call path (`VoiceCallOverlay`). The parallel,
  unmounted raw-`WebSocket` "Voice Notes" stack was confirmed dead and deleted: `VoiceInputArea`,
  `useVoiceChat`, `useVoiceState`, `VoiceButton`, `VoiceChatOverlay`, `WaveformVisualizer`, all their
  legacy types (`VoiceState`, `Voice*Message`, `UseVoiceChat*`, `VoiceConfig`, `VoiceButtonProps`,
  `WaveformVisualizerProps`, `VoiceChatOverlayProps`), the `voice/` + `voice/components/` barrels and
  their 3 test suites. The live realtime path is untouched: `VOICE_AUDIO_CONFIG`, `audioEnhancement`,
  `vadGate` and `speechDetector` are kept. None of the removed symbols were part of the npm public
  API (`index.tsx`/`standalone.tsx`), so this is not a breaking change.

## [1.7.5] — 2026-07-01

### Changed
- **`voice_start` no longer sends the dead `language` field (WID-P2-2 cleanup).** Live-voice
  language is prompt-driven (agent config) and the backend dropped the threaded language param
  (BE-P2-4), so `language:'es-AR'` was already ignored. The widget now emits only
  `{ voice: 'Kore' }` — and `voice` is only a fallback for agents without a configured voice
  (the agent's configured voice is authoritative server-side). No public API change.

## [1.7.4] — 2026-07-01

### Changed
- **Production `console.*` calls now route through the gated `logger` (WID-P2-1, RULE 9).**
  Direct `console.log/warn/info` printed unconditionally on the host page's console — noisy for
  an embedded widget. Replaced with `logger.*` (gated behind the DEBUG flag) in `LanguageContext`,
  `AnimationContext` (sound/particle placeholders), `useVoiceState`, `VoiceCallOverlay` (the
  Three.js fallback error boundary) and `Avatar3D`. The single intentional always-on notice
  (`ChatWidget` draft-agent warning) is left as-is on purpose. No public API change.

## [1.7.3] — 2026-07-01

### Removed
- **Dead raw-WebSocket voice stack removed (WID-P1-1) — smaller bundle, no public API change.**
  The mounted widget uses the socket.io realtime path (`VoiceCallOverlay`, `voice_start`).
  The parallel, unmounted raw-`WebSocket` "Live Call" stack was confirmed dead and deleted:
  `voice/useLiveCall.ts`, `components/LiveCallInputArea.tsx`, `voice/components/CallButton.tsx`,
  `voice/components/LiveCallOverlay.tsx`, all `LiveCall*` types (`LiveCallState`,
  `LiveCall*Message`, `UseLiveCall*`, `CallButtonProps`, `LiveCallOverlayProps`) and their tests.
  None of these were part of the npm public API (`index.tsx`), so this is not a breaking change.

## [1.7.2] — 2026-06-28

### Fixed
- **The voice-call 3D avatar now uses the exact same (correct) framing as the preview.**
  v1.7.1 fixed the call's orientation but went too far: it gave the call its own close-up
  framing and also changed the **preview** framing — yet the preview was already correctly
  positioned. The preview framing is now the single source of truth: `Avatar3D` (the call)
  and `Avatar3DPreview` share one `computeGlbFraming` helper, so the call renders the avatar
  exactly as the preview does — same front-facing **(+Z)** orientation and same distance
  (`targetY = 0.3·height`, 1.2× pull-back). The idle-only animation fix (no more "saltando")
  is unchanged. No public API change.

## [1.7.1] — 2026-06-28

### Fixed
- **Realistic GLB avatars no longer appear from behind or jumping in the voice call,
  and the preview gallery is no longer over-zoomed.** Three related issues with 3D
  (`.glb`) avatars are resolved:
  - **"De espaldas" (facing away):** the voice-call avatar (`Avatar3D`) placed the
    camera on the **−Z** side while the preview (`Avatar3DPreview`) used **+Z**, so the
    call rendered the back of the head. glTF / Ready-Player-Me avatars face **+Z**, so
    both now frame the model from the front consistently.
  - **"Saltando" (jumping):** both renderers auto-played **every** embedded animation
    clip. Game-character GLBs ship locomotion/jump clips, which made the avatar jump or
    walk around the frame. They now auto-play **only a genuine idle loop** (matched by
    name) and otherwise rely on the built-in procedural breathing/sway.
  - **Over-zoomed preview:** the gallery framed around the chest with little margin,
    cropping the legs/outfit. The preview now frames the **whole figure** with breathing
    room, while the call keeps a head-and-shoulders bust.
  Camera framing and idle-clip selection were extracted into a shared, unit-tested pure
  helper (`utils/avatar3d`) so the call and the preview can no longer drift apart. No
  public API change.

## [1.7.0] — 2026-06-27

### Added
- **The agent can now show real, openly-licensed images inline in the chat.** A new
  `show_image` socket event (emitted by the backend `show_image` tool) renders an
  `ImageMessage` bubble with the image, an optional **caption** (e.g. the target
  vocabulary word) and a **source/license attribution** that links back to the origin
  (e.g. Creative Commons images via Openverse). The payload is validated with Zod and
  malformed/spoofed events are dropped (`imageUrl` must be a valid URL), so a broken
  image never reaches the transcript. During an **active voice call** the event is
  **skipped in the main chat** — the voice overlay already renders it as visual content —
  mirroring the existing quiz suppression, so images are never duplicated. The
  `ImageMessage` type gained optional `caption`, `attribution` and `sourceUrl` fields.
  No breaking API change.

## [1.6.2] — 2026-06-27

### Fixed
- **Quiz questions no longer linger in the main chat after a voice call.** During an
  **active voice call**, an incoming `quiz_question` event was creating a *persistent*
  interactive quiz card in the main chat transcript **in addition to** the quiz already
  rendered (and answered) inside the voice overlay. Because the user answers in the
  overlay, the main-chat copy was never resolved and stayed visible after the call ended.
  `useChatSocket` now accepts an `isVoiceCallActive` flag and **skips creating the
  main-chat quiz card while a voice call is active** (the voice overlay owns the quiz UI
  during the call); the `quiz_question` event is still forwarded to the host page as
  before. No public API change — the flag is wired internally from the voice-overlay
  open/close state.

## [1.6.1] — 2026-06-26

### Fixed
- **Chat transcript no longer renders out of order after a session resumes.** When the
  widget reconciled its local fast-paint cache with the server's authoritative
  `chat_history`, the merged list was returned as `[...server, ...localInFlight]`
  **without sorting**, so cached messages and freshly-received turns could interleave
  incorrectly (e.g. an agent re-greeting appearing *below* newer messages, with crossed
  timestamps). `mergeServerHistory` now sorts the reconciled transcript **chronologically
  by timestamp** (stable), and the sorted, de-duplicated result is persisted back to the
  cache — guaranteeing a consistent order no matter how server history and local messages
  interleave. Pairs with the backend change that **resumes** an inactivity-closed web
  conversation instead of starting a fresh chat.

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
