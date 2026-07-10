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

## The mobile artifact canvas frame CAN be resized to landscape
Despite the canvas skill saying artifact frames "cannot be freely resized (snap back to ratio)", resizing the `artifact:v3:artifacts/xbrainpro-mobile` iframe to a wide size (e.g. 960x460) via `applyCanvasActions` `resize` HELD — it did not snap back. This is the only way to preview a landscape mobile app on the canvas: the Expo web build renders to the iframe's viewport, so a portrait frame squishes a landscape layout. Resize the frame wide, then `presentArtifact`.

## expo-audio setAudioModeAsync needs a FULL AudioMode object
`setAudioModeAsync({ playsInSilentMode: true })` fails typecheck — AudioMode is not Partial. Must pass all fields: `playsInSilentMode`, `interruptionMode` (e.g. "mixWithOthers"), `allowsRecording`, `shouldPlayInBackground`, `shouldRouteThroughEarpiece`. For UI SFX: `createAudioPlayer(require("...wav"))` once, reuse, replay with `seekTo(0); play()`. wav is in Metro's default assetExts (the custom metro.config only appends glb/gltf, doesn't replace defaults). Wrap all audio in try/catch — sound is a nice-to-have, never crash the UI.

## Prefer RN built-in Animated (not reanimated) for lobby/HUD animations
This app renders in a web preview that screenshots blank, and reanimated worklets can behave inconsistently across the Expo web + native targets here. For continuous loops (glow pulse, ember drift, shine sweep) and entrance stagger, use React Native's core `Animated` with `useNativeDriver: Platform.OS !== "web"` — reliable on both web preview and device. Only animate `opacity`/`transform` (native-driver safe); never animate layout/color under the native driver. reanimated IS installed and babel-preset-expo auto-adds its plugin, but built-in Animated is the safer default here. Ambient FX (embers/glows/vignette/sweep) lives in `components/lobby/AmbientFX.tsx` as a pointerEvents-none overlay above the 3D stage, below the HUD.

## expo-secure-store crashes on web
`SecureStore.setItemAsync/getItemAsync/deleteItemAsync` throw `... is not a function` on the web platform. When an Expo app must also render in the web preview, gate secure-store behind `Platform.OS !== "web"` and fall back to `window.localStorage`. Applies to any token/secret persistence in a cross-platform Expo app.
