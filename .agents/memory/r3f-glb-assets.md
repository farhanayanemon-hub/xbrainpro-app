---
name: R3F GLB assets in Expo
description: How GLB models + textures load in the Expo mobile artifact (metro, drei, platform split)
---
- Metro must list `glb`/`gltf` in `assetExts` (metro.config.js) or imports silently fail; `game/assets.d.ts` declares `*.glb` modules for TS.
- drei `useGLTF`/`useTexture` accept metro module IDs on NATIVE only. On web (esp. `expo export`) numeric module IDs fail as "Could not load 512" — every loader callsite must wrap sources in `assetUri(...)` (`game/assetUri.ts` native pass-through, `assetUri.web.ts` resolves via `Asset.fromModule(mod).uri`). This shipped broken for weeks masked by a generic "no WebGL" ErrorBoundary fallback — keep the fallback showing the real error message.
- Platform split done via tsconfig `moduleSuffixes: [".web", ""]` + paired files (e.g. `drei.ts` re-exports `@react-three/drei/native`, `drei.web.ts` re-exports `@react-three/drei`). Typecheck only covers the `.web` variant.
- **Why:** importing drei's web entry on native (or native entry on web) breaks at runtime; this split is the only pattern verified to work here.
- **How to apply:** any new three/drei-dependent module in the mobile artifact should follow the same paired-file pattern and route model/texture refs through `game/models.ts`.
- Animated characters: KayKit packs (CC0, GitHub KayKit-Game-Assets) ship GLBs with full clip sets; strip to needed clips + resample/prune/quantize via gltf-transform (register ALL_EXTENSIONS or quantized output loses its extension declaration and fails to load). ~330KB/character.
- Skinned avatars need `SkeletonUtils.clone` (plain `.clone()` breaks skinning), `frustumCulled=false` on meshes (bones move outside static bounds), and drei `useAnimations` with a group ref; RN Views can't render inside Canvas so in-scene error boundaries must fall back to meshes.
- Verify bundle health headlessly: get entry URL via `curl https://$REPLIT_EXPO_DEV_DOMAIN/ | grep src=`, fetch the bundle (expect 200), and fetch a GLB at `assets/?unstable_path=./assets/models/<file>.glb` (expect `glTF` magic bytes). Real 3D rendering still needs a WebGL browser/phone.
