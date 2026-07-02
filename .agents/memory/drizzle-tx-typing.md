---
name: Drizzle transaction typing
description: How to type Drizzle transaction handles and avoid XP/state lost-updates.
---

To type a Drizzle transaction handle without `any`, extract it from the db:

```ts
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
```

Helpers that run both inside and outside a transaction take an executor union
`typeof db | Tx`; the basic select/insert/update builders are compatible across
both.

**Why:** read-modify-write on counters (XP, streak) is lost-update prone. Two
concurrent completions each read the old XP and one write clobbers the other.

**How to apply:** do such mutations inside `db.transaction`, lock the row with
`.for("update")` before recomputing, and guard idempotent state transitions with
a conditional update (e.g. `WHERE completed = false ... RETURNING`) so a race that
loses returns no row instead of double-awarding.
