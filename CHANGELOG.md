# Changelog

All notable changes to **@botuyo/chat-widget-standalone** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Release rule:** every `package.json` version bump MUST add its entry here in the
> **same commit** as the bump. Add changes under `[Unreleased]`, then move them into a
> dated version section when you bump + publish. As a published npm package consumed by
> other repos, keep consumer-facing (breaking/feat/fix) notes clear.

## [Unreleased]

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
