---
name: Dev vs prod databases diverge
description: Local dev uses Replit helium DATABASE_URL; Railway prod uses Supabase. Schema pushes and seed users must be applied to BOTH.
---

The rule: any Drizzle schema change or seeded record (e.g. admin users) must be applied to two databases — the local dev DB (`DATABASE_URL`, Replit helium host) and the prod DB (`SUPABASE_DB_URL`, used by Railway).

**Why:** Login broke locally with a 500 "Failed query ... is_admin" after a schema change was pushed only to Supabase — the local api-server reads `DATABASE_URL`, which points at a different (helium) database.

**How to apply:** After `drizzle push` against Supabase, also run `pnpm run push` in `lib/db` (uses `DATABASE_URL`) and re-run any seed scripts against both connection strings before testing locally.

Note: `drizzle-kit push` against Supabase can fail with "Interactive prompts require a TTY" in non-interactive shells (it wants a create-vs-rename answer). When that happens, apply the equivalent DDL directly with a small `pg` script (`CREATE TABLE IF NOT EXISTS …`) against `SUPABASE_DB_URL`, matching the drizzle schema exactly (column names, FKs, indexes).
