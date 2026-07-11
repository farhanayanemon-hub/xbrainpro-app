---
name: Chat moderation design
description: How city chat profanity filtering, reports, and mutes are wired; invariants to keep when touching them.
---

The rule: chat mutes are dual-layer — a DB row (`chat_mutes`, upserted, keeps the LATER expiry) plus the live realtime client's in-memory `mutedUntil`. Any new code path that mutes a user must go through the moderation helper (`muteUser`) so both layers stay in sync; the realtime server registers a live-mute hook and also loads the mute from DB on connect.

**Why:** a DB-only mute wouldn't silence an already-connected offender until reconnect, and a memory-only mute evaporates on reconnect (players reconnect constantly on mobile).

**How to apply:** when adding new mute sources (admin UI, new auto-mute triggers), call `muteUser`/`unmuteUser` from the api-server moderation lib — never write `chat_mutes` directly or set `client.mutedUntil` alone. Profanity masking is a synchronous wordlist filter (English + Bangla + leet tolerance) in the chat hot path — keep it free of network/DB calls. Reports auto-mute at 3 distinct reporters per window; per-reporter duplicates in the window are collapsed.
