---
name: Expo web preview quirks
description: Gotchas when running an Expo artifact's web build in the Replit preview + why runTest can't reach it
---

# Expo web preview quirks

## runTest / Playwright cannot reach an Expo artifact
The Playwright testing subagent (`runTest`) navigates through the shared proxy at `localhost:80/<path>`. Expo apps bypass that proxy and are served on `$REPLIT_EXPO_DEV_DOMAIN`. So a test plan that navigates to `/` hits whatever **web** artifact is mounted at that path, NOT the Expo app. Symptom: the test reports the wrong app's UI (e.g. a different splash screen) and 401 loops from the web app's auth polling.

**How to verify an Expo app instead:** use the `screenshot` tool with `type=app_preview` and the Expo artifact's `artifact_dir_name` — it resolves the correct Expo dev domain URL. It's view-only (no interaction), so validate flows by confirming the render + relying on shared-backend correctness proven elsewhere.

## Headless preview has NO WebGL — 3D scenes can never render there
The screenshot tool's headless browser cannot create a WebGL context (THREE.WebGLRenderer throws, LogBox fullscreen error). Any three/R3F scene must probe WebGL support (`canvas.getContext("webgl2") || getContext("webgl")`) BEFORE mounting `<Canvas>` and render a graceful fallback — an ErrorBoundary alone still shows the dev LogBox overlay. Verify only the fallback/HUD via screenshot; the actual 3D scene needs a real device or WebGL-enabled browser.

## The screenshot tool returns a BLANK WHITE frame for this app
For the `xbrainpro-mobile` Expo web build, `screenshot type=app_preview` consistently returns an all-white image even though the DOM mounts (React deprecation warnings for the rendered components appear in the returned browser logs). It stays blank even for pure-RN / LinearGradient content, not just `<Canvas>`. Treat screenshot as UNUSABLE for visually verifying this app.

**How to verify a logged-in screen instead:** the canvas mobile iframe the user sees IS the dev build, so Metro hot-reload changes are visible to the user immediately — lean on their eyes for design feedback. For auth-gated screens, a dev-only bypass in `app/index.tsx` (`PREVIEW_PROFILE`, gated by `__DEV__ && Platform.OS==="web" && ?preview=lobby`) renders the lobby with a mock profile so it can be opened without login. Keep verification to typecheck + jest + code reasoning; do not trust a blank screenshot as evidence of a broken screen.

## expo-secure-store crashes on web
`SecureStore.setItemAsync/getItemAsync/deleteItemAsync` throw `... is not a function` on the web platform. When an Expo app must also render in the web preview, gate secure-store behind `Platform.OS !== "web"` and fall back to `window.localStorage`. Applies to any token/secret persistence in a cross-platform Expo app.
