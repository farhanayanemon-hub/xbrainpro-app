---
name: R3F GLB assets in Expo
description: How GLB models + textures load in the Expo mobile artifact (metro, drei, platform split)
---
- Metro must list `glb`/`gltf` in `assetExts` (metro.config.js) or imports silently fail; `game/assets.d.ts` declares `*.glb` modules for TS.
- drei `useGLTF`/`useTexture` accept metro module IDs directly on both web and native (R3F native polyfills handle resolution) — no `Asset.downloadAsync` needed.
- Platform split done via tsconfig `moduleSuffixes: [".web", ""]` + paired files (e.g. `drei.ts` re-exports `@react-three/drei/native`, `drei.web.ts` re-exports `@react-three/drei`). Typecheck only covers the `.web` variant.
- **Why:** importing drei's web entry on native (or native entry on web) breaks at runtime; this split is the only pattern verified to work here.
- **How to apply:** any new three/drei-dependent module in the mobile artifact should follow the same paired-file pattern and route model/texture refs through `game/models.ts`.
- Verify bundle health headlessly: get entry URL via `curl https://$REPLIT_EXPO_DEV_DOMAIN/ | grep src=`, fetch the bundle (expect 200), and fetch a GLB at `assets/?unstable_path=./assets/models/<file>.glb` (expect `glTF` magic bytes). Real 3D rendering still needs a WebGL browser/phone.
