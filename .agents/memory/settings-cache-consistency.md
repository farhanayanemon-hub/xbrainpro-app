---
name: Settings cache vs consistency-critical keys
description: The api-server 30s in-process settings cache must not back ETag/version-style keys; use atomic DB upsert increments instead.
---

The rule: any app_settings key that backs a client-visible consistency contract (ETags, map/version numbers, cache invalidation) must be read straight from the DB and bumped with a single atomic upsert (`ON CONFLICT DO UPDATE SET value = (value::int + 1)::text ... RETURNING`), never via the cached `getSetting`/`setSetting` helpers.

**Why:** The settings helper caches per-instance for 30s. A read-then-write bump collapses concurrent increments, and a stale cached read makes the server answer 304 for a map that actually changed — clients silently miss live updates. Caught by architect review on the world-map feature.

**How to apply:** `getSetting` is fine for low-sensitivity config (model names, toggles). For version counters, query/upsert `appSettingsTable` directly in the route (see the world map version handling in the api-server world routes).
