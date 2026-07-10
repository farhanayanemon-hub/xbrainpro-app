---
name: R2 asset delivery (game assets)
description: How Neura City serves R2 game assets to web + native, and why not direct/presigned.
---

# R2 game-asset delivery: stream through the API, don't hand out R2 URLs

Game assets (GLBs, textures) live in a **private** R2 bucket. The client gets
each asset via `GET /api/assets/file/:id?h=<hash12>` on the api-server, which
streams the object bytes from R2 (`getObject` in `lib/r2.ts`). The manifest's
`url` fields point at this proxy endpoint, not at R2.

**Why not direct / presigned R2 URLs:**
- The R2 "public URL" secret is actually the S3 API endpoint (auth-required),
  not a public r2.dev host.
- Enabling public r2.dev access needs a Cloudflare **API token** we don't have.
- The object-scoped S3 credentials (`R2_ACCESS_KEY_ID/SECRET`) are **denied**
  `PutBucketCors` (403 AccessDenied) — so you cannot add a bucket CORS policy to
  let browsers read presigned URLs cross-origin. Presigned GETs come back with
  **no `Access-Control-Allow-Origin`**, so the Expo-web build / web preview
  can't read them.

**Why the proxy works everywhere:**
- The api-server has global `app.use(cors())` → every response (incl. the stream
  route) reflects `Access-Control-Allow-Origin: *`, so cross-origin browser
  fetches succeed.
- Native mobile has no CORS at all.
- URL is content-addressed via `?h=<hash>` + `Cache-Control: immutable`, so an
  admin replacement (new hash) busts caches; native also caches on disk by hash
  so each file downloads once.

**How to apply:** never switch game-asset delivery back to presigned/direct R2
URLs unless a real Cloudflare API token is added and bucket CORS is configured.
Keep asset `url`s same-origin through the api-server.

## Zone-scoped, on-demand loading

Assets carry a `meta.zone` (models/textures default `"city"`, avatars are global
`"*"`). The client downloads **only the entered zone's** assets — spawn `"city"`
up front (progress bar), other zones (house `"interior"`, future maps) on entry
via `ensureZoneCached(zone)`; avatars via `ensureAvatarCached` on selection. Do
NOT reintroduce a "download the whole catalog at startup" step — that was
rejected in review as violating on-demand loading. The game currently has one
populated zone (city) by design; interior/other zones are the extension point.
Web `assetCache.web.ts` prefetches (`fetch(url)`) so the progress bar reflects
real work and warms the browser cache.
