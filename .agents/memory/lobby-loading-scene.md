---
name: Lobby/loading scene asset category
description: How admin-swappable 3D lobby room + loading backdrop are wired end-to-end via the "scene" asset category.
---

# Lobby / loading "scene" asset category

Admins can swap the 3D lobby room and the loading-screen backdrop by uploading
assets tagged with the **`scene`** category and a **slot** of `lobby` or `loading`.

## The contract (must stay consistent across all four layers)
- **api-server** `routes/assets.ts`: `CATEGORIES` includes `scene`; `SLOTS`
  includes `lobby` and `loading` (alongside avatar's `male`/`female`). Manifest
  default zone: `avatar -> "*"`, `scene -> "lobby"`, else `"city"`.
- **mobile** `game/assetManifest.ts`: `AssetCategory` includes `scene`;
  `sceneEntrySync(slot)` looks up the lobby/loading entry. `assetResolver.ts`
  `resolvedUri(id, fallback)`. `resources.ts` `zoneAssets` includes `scene` and
  `prepareLobby(avatarId, onProgress)` preloads lobby scene/model/texture + warms
  the avatar before entry.
- **web admin** `pages/admin.tsx`: `scene` in category union + scene slot
  dropdowns.

**Why:** the four layers were edited separately and the enum on the server is the
gatekeeper — if `scene`/`lobby`/`loading` are missing from `CATEGORIES`/`SLOTS`,
uploads and slot updates 400 and the whole feature silently fails end-to-end even
though the admin UI shows the options.

## Tolerance rule
The lobby must never brick when scene assets are missing or fail to load:
LobbyAvatarStage renders `DefaultRoom` primitives and only swaps in the
admin GLB (`GlbRoom`) behind a `RoomBoundary` error boundary; LoadingScreen falls
back to a gradient + emblem when no backdrop/photo. Entry (`enterLobby` /
`prepareLobby` in `app/index.tsx`) must proceed even if preload fails.

## Gotcha
Assets manifest is served at **`/api/assets/manifest?zone=<zone>`** (the `/api`
prefix matters — `/assets/...` 404s).
