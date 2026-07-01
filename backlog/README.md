# botuyo-widget-chatbot — Code Audit Backlog

Audit of the embeddable chat widget (`@botuyo/chat-widget-standalone`). Generated Jun 2026.

## Priority legend

| Pri | Meaning |
|-----|---------|
| **P0** | Critical — security / breaks consumers |
| **P1** | High — real bug / bundle bloat (size-critical) / rule violation |
| **P2** | Medium — tech debt, inconsistency |
| **P3** | Low — cleanup, typing |

## Files

- [`P1-high.md`](./P1-high.md)
- [`P2-medium.md`](./P2-medium.md)
- [`P3-low.md`](./P3-low.md)

(No P0: public API + Zod validation + Shadow DOM isolation are intact.)

## Summary

| Pri | Count | Headline |
|-----|-------|----------|
| P1 | 0 | — no open items |
| P2 | 0 | — no open items |
| P3 | 1 | `(safe as any)` casts after Zod (WID-P3-1) |

## Method & confidence

Loaded the widget architecture/TDD skill, grepped `src/` for `console.*` / `voice_start` / hardcoded voice. High-signal, not exhaustive. **(verify)** = confirm before acting. RULE 2 (bundle size is critical) makes dead code higher-impact here than in app repos. TDD (RULE 10) + CHANGELOG-on-bump apply.
