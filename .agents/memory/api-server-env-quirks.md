---
name: api-server env quirks
description: Non-obvious environment gotchas for the XBrainPro Express api-server artifact.
---

## EADDRINUSE on rapid restarts
Restarting the `artifacts/api-server: API Server` workflow several times in quick succession can fail with `EADDRINUSE 0.0.0.0:8080` because the previous node process hasn't released the port yet.
**Why:** the dev script does `build && start`; a fresh start races the old process's shutdown.
**How to apply:** if a restart fails with EADDRINUSE, just restart once more (with a slightly longer timeout) rather than treating it as a code bug.

## Express JSON body limit for base64 uploads
Endpoints that accept base64-encoded images (e.g. `POST /profile/avatar`) need the express body limit raised — the default 100kb rejects even small photos once base64-inflated.
**Why:** base64 adds ~33% and photos are MBs; default `express.json()` limit is 100kb.
**How to apply:** the app sets `express.json({ limit: "8mb" })` in `app.ts`; keep it in sync with the storage MAX_BYTES (5MB decoded) ceiling.
