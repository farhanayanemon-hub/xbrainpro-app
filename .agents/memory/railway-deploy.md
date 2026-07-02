---
name: Railway / single-service deploy
description: How XBrainPro is deployed off-Replit (Railway) as one combined service.
---

# Deploying XBrainPro outside Replit (Railway)

The web frontend calls the backend with **relative `/api`** URLs (orval baseUrl `/api`,
Wouter base from `import.meta.env.BASE_URL`). So on any host, the web and API must be
served from the **same origin**.

**Decision:** deploy as a SINGLE service. In production (`NODE_ENV=production`) the
Express api-server serves the built web app from `artifacts/xbrainpro-web/dist/public`
(resolved relative to the bundled `dist/index.mjs`, or `WEB_STATIC_DIR` override) with an
SPA fallback for non-`/api` GET routes. See `artifacts/api-server/src/app.ts`.

**Why:** two separate services would break the web's relative `/api` calls (they'd hit
the web domain, which has no API). One service = one domain = relative calls just work,
and the mobile app can point `setBaseUrl` at that same domain.

**How to apply / build gotchas:**
- Web `vite.config.ts` REQUIRES `BASE_PATH` and `PORT` env at build time (it throws
  otherwise), even though the web preview server isn't used in the combined deploy.
  Build with `BASE_PATH=/ PORT=3000 NODE_ENV=production`. `railway.json` bakes this in.
- Do NOT set `NODE_ENV=production` as a global platform var (can affect install of
  devDeps). Keep it inline in build & start commands only.
- Do NOT set `PORT` manually on Railway — it injects one at runtime; api-server reads it.
- Lib packages (`api-client-react`, `api-zod`, `db`) export TS source and have no build
  step; only `xbrainpro-web` + `api-server` need building.
- Runtime secrets the deploy needs: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `OPENROUTER_API_KEY`.
- Mobile (Expo) is NOT deployed to Railway; point its API domain at the deployed URL.
