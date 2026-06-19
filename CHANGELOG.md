# Changelog

All notable changes to **@botuyo/chat-widget-standalone** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Release rule:** every `package.json` version bump MUST add its entry here in the
> **same commit** as the bump. Add changes under `[Unreleased]`, then move them into a
> dated version section when you bump + publish. As a published npm package consumed by
> other repos, keep consumer-facing (breaking/feat/fix) notes clear.

## [Unreleased]

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
