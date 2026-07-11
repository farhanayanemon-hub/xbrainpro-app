---
name: City HUD overlay layering
description: Render-order rules for full-screen overlays/backdrops in the city HUD (city.tsx).
---

The city screen stacks many absolutely-positioned overlays over the 3D canvas.
RN hit-testing follows mount order: a full-screen backdrop `Pressable` only
blocks controls that are mounted BEFORE it.

**Why:** the city chat panel's tap-outside backdrop initially failed to block
the contextual action button (enter home/sleep) because the button was mounted
later — players could trigger world actions while typing, despite
`game.frozen` being set.

**How to apply:** any overlay that must be modal (backdrop swallows taps) has
to be mounted after all HUD/action controls in `app/city.tsx` — or use an RN
`Modal` like NpcChat/PauseMenu do. Also add its open-state to the
`game.frozen` effect so movement freezes.
