---
name: Neura City city↔interior world swap
description: How the mutable `world` runtime state is swapped between the open city and house interiors, and the invariants that keep the 60fps loop correct.
---

# City ↔ interior world swap

The game reads a single mutable `world` object (`game/worldMap.ts`) every frame:
`world.map`, `world.colliders`, `world.bound`, `world.camDist`, `world.interactables`.
Player movement, collision, camera distance, and proximity prompts all read it
directly (no React re-render per tick). Scene rendering is driven by React state
(`inside` in `app/city.tsx`), so the two must be kept in agreement.

Rule: any function that changes the active area must set ALL of bound, colliders,
camDist, and interactables together. `setActiveWorldMap()` restores city values;
`setActiveInterior()` sets interior values. Setting only some fields leaves the
loop reading a stale mix (e.g. interior collider set but city bound).

**Why:** interiors need a smaller movement bound and tighter camera; forgetting
one field produced wrong collisions / camera indoors.

**How to apply:**
- Enter/leave home in `app/city.tsx` must reposition `game.player` + `game.cam`
  AND flip both the React `inside` flag and the mutable world (via
  setActiveInterior / setActiveWorldMap).
- The async `loadWorldMap().then()` on mount must NOT call `setActiveWorldMap`
  if the player is already inside (guard with an `insideRef`), or a late-
  resolving fetch silently clobbers interior runtime state. `leaveHome()`
  re-activates the freshest map on exit.

# Personal houses are server-driven

Each player's home plot comes from `GET /player/home` (deterministic from userId,
no schema column). Houses live in the seeded world map (kind `"house"`). Resolve
the player's house from the fetched `worldMap.houses` by `plot`, not from the
bundled `HOUSES` constant — the constant is only a fallback. Door prompt, exit
teleport, and the home beacon must all use the same resolved house so they never
desync from the rendered/colliding house.

**Why:** bundled layout and DB seed can diverge; keying off the server data keeps
interaction points aligned with what's actually rendered.

# The interior IS the player's decorate-able apartment

There is no separate "house interior" scene anymore — entering home renders
`ApartmentScene` driven by the player's saved furniture layout (`useApartment`
hook, `GET/PUT /apartment`). `setActiveInterior()` sets NO colliders: furniture
is walk-through in v1. The "Sleep" prompt is derived from a placed `bed` item in
the layout (not a fixed collider); if no bed is placed, there is no sleep prompt.
Decorate mode (`apartment.editing`) must be added to `game.frozen` so the on-
screen pad drives the selected piece, not the character.

**Why:** a fixed bed collider/interactable was removed when the room became fully
player-decorated; re-adding one would double up with the layout-driven prompt and
block walking. Built-in furniture IDs must stay in sync between mobile
`game/furniture.ts` and server `lib/apartment.ts` (bed, sofa, armchair, table,
rug, plant, lamp, bookshelf, tv) or valid pieces get rejected on save.

**How to apply:** save the whole layout on "Done" and only exit edit mode if the
save succeeds (a failed save must not silently drop the arrangement). Furniture
GLBs come from the "apartment" asset zone; `ensureZoneCached("apartment")` on
enter. Lobby menu deep-links `/city?home=1` to auto-enter once the world is ready.
