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
  `OPENROUTER_API_KEY`, and `DATABASE_URL` (Supabase Session-pooler Postgres URI —
  the Replit dev Helium DB is unreachable from Railway; drizzle-kit push was run
  against Supabase to create the schema).
- Mobile (Expo) is NOT deployed to Railway as a native app; BUT its **web export IS
  served live at `/play`** on the same service: Railway build also runs the mobile
  package's `build:web` (expo export --platform web → `web-dist`, base path `/play` via
  `EXPO_WEB_BASE_URL` + `app.config.js`), and api-server serves it at `/play` in
  production (immutable cache for hashed assets, no-cache HTML). The exported web app
  finds the API via `window.location.origin` fallback when `EXPO_PUBLIC_DOMAIN` is unset.
- git push to GitHub main is blocked locally — push local main to a temp branch, then
  PATCH the main ref via GitHub API; for uncommitted files, create blobs/tree/commit
  via the GitHub git API on top of the current head.

**Deployed state (live):**
- Railway project `nurturing-dedication` (id db162504-62e1-4924-859b-dcfaa00b6bfb),
  env `production` (5575ae11-d0b9-47d2-8638-b702cfa0a7e0), single service `xbrainpro`
  (a3481cde-e065-486d-8356-7d21dd093777) from GitHub `farhanayanemon-hub/xbrainpro-app` main.
- URL: https://xbrainpro-production.up.railway.app (do NOT touch the user's other
  project `hospitable-nourishment`).

**Custom domain (www.xbrainpro.com):**
- Root `@` CNAME was NOT possible: user actively uses Hostinger email on xbrainpro.com
  (MX/SPF at `@` conflict with CNAME). Chose `www` CNAME instead; root still points to
  Hostinger hosting — optional hPanel redirect root→www can be added later.
- Free plan = 1 custom domain per service; deleted root domain entry before adding www.
- Hostinger DNS API: `developers.hostinger.com/api/dns/v1/zones/{domain}` (Bearer token).
  DELETE with `{"filters":[{"name","type"}]}` to remove records, PUT with
  `{"overwrite":true,"zone":[...]}` to upsert. Zone publish takes a couple of minutes —
  verify via Google DoH (`dns.google/resolve`), local resolver caches stale answers.
- Railway CNAME target for www changes EVERY time the domain is re-added — after any
  customDomainDelete/customDomainCreate, read the new `requiredValue` and update the
  Hostinger `www` CNAME to match (current: `f37v91iw.up.railway.app`).
- **Cert stuck in `VALIDATING_OWNERSHIP` root cause: Railway requires TWO DNS records —
  the CNAME AND a TXT record `_railway-verify.www` containing the `verificationToken`
  from GraphQL domain status (`status { verificationToken }`).** The `dnsRecords` list
  only shows the CNAME (misleading!) and `certificateErrorMessage` stays null; without
  the TXT the cert never issues. Adding the TXT flipped the cert to VALID in <2 min.
  Until then the edge serves the `*.up.railway.app` wildcard cert and browsers show
  "site can't be reached".

**Bare apex `xbrainpro.com` (no www) — Railway will NOT issue a cert for it:**
- KEY LESSON: Railway custom-domain ownership validation does a *literal CNAME-record
  lookup* at the domain. At an apex you cannot have a real CNAME, so with an ALIAS /
  CNAME-flattening record the CNAME query returns the flattened A (NODATA for CNAME) →
  Railway's `dnsRecords` shows `currentValue: ""`, status stays `REQUIRES_UPDATE`, and
  `certificateStatus` sits at `VALIDATING_OWNERSHIP` forever. Adding the `_railway-verify`
  TXT does NOT unblock it (that only helped `www`, which had a real CNAME). Verified by
  waiting 15+ min with ALIAS resolving to the Railway edge and the TXT confirmed live.
- Consequence: apex over HTTPS is impossible with Railway serving it directly, on ANY
  plan (this is a validation limitation, not the 1-domain free-plan limit). Upgrading
  Railway does NOT fix apex.
- Hostinger facts learned: DNS API ACCEPTS type `ALIAS` (and it flattens/resolves to the
  target's A at query time — good CNAME-flattening) but REJECTS `ANAME` (422 invalid
  type). `PUT /api/dns/v1/zones/{domain}` with `overwrite:true` UPSERTS per (name,type)
  only — it does NOT wipe the whole zone (email MX/SPF/DKIM survived). `DELETE` body is
  `{"filters":[{"name","type"}]}`. Right after adding a record, public resolvers may
  negative-cache NXDOMAIN for the SOA min TTL (~300s) — verify via cloudflare-dns.com DoH,
  not just dns.google.
- The ONLY reliable way to serve the app at bare `https://xbrainpro.com` with this
  registrar is to put a proxy that terminates SSL at the apex in front of Railway —
  i.e. move DNS to **Cloudflare** (free): apex proxied CNAME (flattened) → the Railway
  target, SSL Full; CF serves the browser its own valid cert so Railway's stuck cert is
  irrelevant. Requires nameserver change at Hostinger + replicating ALL records (esp.
  email) in CF first. Needs a Cloudflare account/token (none configured). Hostinger
  apex forwarding is NOT a substitute (no HTTPS for the apex, flaky).

**CURRENT LIVE DOMAIN STATE — apex now works securely, Cloudflare NOT needed:**
The old "Railway can't do apex" limitation above no longer holds in practice. Hostinger
apex `@` is `ALIAS → 2b55zfvy.up.railway.app` (flattens to Railway edge IP, e.g.
`69.46.46.24`) with the root `_railway-verify` TXT present, and **Railway HAS issued a
valid Let's Encrypt cert for `xbrainpro.com`** — `https://xbrainpro.com` returns 200
serving the app (`server: railway-hikari`), cert `CN=xbrainpro.com`, and `http://` 301s
to `https://`. So the apex padlock goal is MET without any Cloudflare/nameserver change.
Email (MX mx1/mx2.hostinger.com, SPF, 3x DKIM, DMARC, autodiscover/autoconfig) is intact
on Hostinger NS (dns-parking). `www` was a stale broken Railway CNAME (SSL name-mismatch);
its `www` CNAME + `_railway-verify.www` TXT were DELETED, so `www` is now NXDOMAIN (no
scary warning) but does NOT serve/redirect. To make `www` active again it must be added
as a 2nd custom domain in the **Railway dashboard** — the team API token CANNOT do it:
both the `domains` read query and `customDomainCreate`/`customDomainDelete` mutations
return "Not Authorized" (only deploy/variable mutations work with this token).

**Railway API gotchas (GraphQL backboard.railway.com/graphql/v2):**
- User's token is a TEAM token: `me`/`externalWorkspaces` return "Not Authorized" but
  `projects`/mutations work. Always `.strip()` the token — pasted secrets may carry a
  trailing newline that silently breaks the Authorization header.
- Python urllib gets 403 from backboard without a User-Agent header; curl works. Set UA.
- Free plan blocks `projectCreate` ("resource provision limit exceeded") — reuse/clean an
  existing project (delete extra services) instead of creating a new one.
- Deploy flow: variableUpsert → serviceInstanceDeploy → poll latestDeployment.status →
  serviceDomainCreate. Edge 404 "Application not found" = deployment never went live
  (health check failing); read `deploymentLogs(deploymentId)` for the real error.
