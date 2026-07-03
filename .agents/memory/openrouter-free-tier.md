---
name: OpenRouter free-tier reliability
description: Why AI plan generation failed in prod and how the app is hardened for free-tier models
---

# OpenRouter free-tier reliability

**Rule:** The app's AI model is env-driven via `OPENROUTER_MODEL` (default `openai/gpt-4o-mini`). When the OpenRouter account has no credits, paid models return 402 "Insufficient credits" and every AI feature (plan generation, coach chat) fails. Currently set to `openai/gpt-oss-20b:free` (Replit shared env + Railway). When the user adds credits, switch back by updating/removing `OPENROUTER_MODEL` in both places — no code change needed.

**Why:** July 2026: "generate architecture dile failed dekhay" — root cause was 402 credits, then the free model emitted occasionally-invalid JSON and hit 429 rate limits (free tier allows roughly 1 concurrent request; parallel calls instantly 429).

**How to apply:**
- Free-tier gotchas: gpt-oss models spend ~2000 tokens on reasoning that counts against `max_tokens` (use 8000+), sometimes emit broken JSON mid-string, and generation can take 1–2 min (client timeouts look like failures while the server completes).
- Server hardening already in `artifacts/api-server/src/lib/ai.ts`: 429/5xx retry with backoff, JSON extraction/repair, 2-attempt generation with lower temp on retry. `POST /programs` has an in-memory per-user lock (409 if already generating) to prevent duplicate programs on client retries.
- If AI fails again: check Railway deployment logs for `OpenRouter request failed` and test the key directly with curl against openrouter.ai — a 402/429 tells you immediately whether it's credits or rate limiting.
