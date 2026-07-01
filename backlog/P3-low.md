# P3 — Low / cleanup

## WID-P3-1 — `(safe as any)` casts after Zod validation

- **Category:** typing / tech debt (RULE 11 strict)
- **Location:** `src/chat-widget/hooks/useChatSocket.ts:139-141` — `(safe as any).content`, `(safe as any).emotion`, `(safe as any).sources`.
- **Problem:** `safe` is the Zod-validated message; casting to `any` to read fields defeats the schema's inferred type and risks shape drift.
- **Fix:** Derive the message type from the Zod schema (`z.infer<typeof BotMessageSchema>`) and use a discriminated union on `type` so `content`/`emotion`/`sources` are typed per variant. Drop the `as any`.
- **Confidence:** High. **Effort:** S.

> Dropped (not a bug / note only): **WID-P3-2** (`logger` `(...args: any[])` — reasonable console passthrough).
