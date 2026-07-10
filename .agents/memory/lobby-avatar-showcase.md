---
name: Lobby 3D avatar showcase
description: How the mobile lobby renders the player's real 3D game avatar as a hero, and the reliability trap.
---

The mobile lobby (Free Fire style) shows the player's actual game avatar as a full-screen
hero on a glowing podium, reusing `game/Avatar` inside `game/GameCanvas` (see
`components/lobby/LobbyAvatarStage.tsx`).

Key reuse points:
- `GameCanvas` (`.web` + `.native`) takes an optional `camera` prop; default is the
  city framing `{position:[0,6.5,17],fov:55}`. The lobby overrides to a close portrait
  `{position:[0,1.15,4.4],fov:40}`. The Canvas camera looks straight down -z (no
  controller in the lobby), so pick position.y ≈ chest height to frame the character.
- Force idle animation with `getMotion={() => 0}` so the showcase avatar doesn't couple
  to live game input state.
- Avatar suspends on `useGLTF`, so it MUST be wrapped in `React.Suspense`.

**Why the retry matters (the trap):** `resolveAvatar(id)` returns "" until the asset
manifest is loaded, and `getManifest()` can return null once on an offline/startup race.
If readiness is gated on a one-shot effect, the lobby stays stuck on the photo/spinner
fallback for the whole session even after the network recovers.
**How to apply:** gate rendering on a retry loop (exponential backoff, `getManifest(force)`
on retries) that stops only once `resolveAvatar` is non-empty — never a single attempt.

Note: avatar id comes from device-wide `loadAvatarId()` (same as city). It is NOT scoped
per user, so switching accounts in one session can briefly inherit the prior player's
character — consistent with the rest of the game today.
