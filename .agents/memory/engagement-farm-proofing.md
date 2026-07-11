---
name: Daily-task farm-proofing
description: Why client task-advance endpoints must not trust task ids, and how currency-granting engagement features stay replay-proof.
---

# Daily Tasks / Mystery Box farm-proofing

Any engagement feature that grants real currency must treat the client as hostile.

## Rule: client advance endpoints must allowlist tasks
Daily tasks split into two kinds:
- **Server-event tasks** (login, entering the city, sending chat) — advanced ONLY by trusted server hooks (board fetch, realtime join/broadcast). A client must never be able to report their progress.
- **Client-reportable tasks** (e.g. visiting the Store) — the client may self-report, but progress is still capped at the task goal server-side.

The task def carries a `clientAdvancable` flag. The public advance route calls a client-safe helper that refuses any task not marked `clientAdvancable`; the internal `advanceTask` (used by server hooks) still trusts any id.

**Why:** an early version exposed one `advanceTask` that trusted any known id, so a modified client could POST `play_city`/`send_chat`/`login` and farm coins without doing anything. Splitting the trust boundary closes it.

**How to apply:** whenever you add a daily/quest task, decide its trust source. If it isn't genuinely client-owned, leave `clientAdvancable: false` and drive it from a server event only.

## Reward payout + gambling must be atomic + idempotent
- Claims lock the progress row `FOR UPDATE`, check completion + a `claimed` flag, and credit the wallet with a per-day ledger reference (`daily:<taskId>:<dayKey>`), so retries never double-pay.
- Mystery Box open runs charge + weighted roll + reward credit + open-record in ONE transaction, wallet row locked first, deduped on `(userId, openId)`. Client sends a fresh `openId` per attempt.
- Client retry gap: on a failed open the mobile client currently generates a NEW openId next tap rather than replaying the pending one, so a lost success response can charge twice. Server idempotency is correct; the client retry semantics are the weak point if revisited.
