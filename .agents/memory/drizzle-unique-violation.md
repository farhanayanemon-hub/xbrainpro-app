---
name: Drizzle unique-violation detection
description: Detecting Postgres 23505 unique violations when drizzle wraps the driver error
---

# Detecting unique violations through drizzle's error wrapper

To turn a Postgres unique-violation (code `23505`) into a domain error
(e.g. "already entered", "already voted"), you must walk the error's `cause`
chain — the code is NOT on the top-level thrown error.

**Why:** Current drizzle-orm wraps the pg driver error in a `DrizzleQueryError`.
A naive `err.code === "23505"` check always fails because `err.code` is
undefined on the wrapper; the real pg error (with `.code`) sits on `err.cause`.
This silently let duplicate inserts throw a raw "Failed query" error instead of
the intended domain error, which was only caught by a DB-backed test.

**How to apply:** When catching insert conflicts (relying on a unique index
instead of a pre-check), detect the violation by iterating `err` → `err.cause`
(a few levels deep) and matching `code === "23505"`.
Note: reference-based idempotency using `SELECT ... FOR UPDATE` + reference
lookup does not hit this because it never relies on the thrown unique-violation.
