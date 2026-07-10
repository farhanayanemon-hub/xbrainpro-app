---
name: Friends presence & join contract
description: How the friends lobby derives online vs joinable from realtime, and the join-near-friend flow.
---

# Friends presence & join

The friends REST layer reads live state directly from the in-memory realtime
registry (same process). `realtime.ts` exposes `isUserOnline(userId)` and
`getUserPresence(userId)`; the `clients` map is lifted to a module-level
`liveClients` ref set inside `attachRealtime`.

**Rule: online != joinable.** `isUserOnline` is true whenever the user has an
open city socket, but `getUserPresence` returns null when the user is hidden
(`visible === false`, i.e. inside a private home). The lobby must gate the
"Join" button on a non-null `position`, NOT on `online`.

**Why:** an early version fell back to the default city spawn `{x:0,z:8}` when
position was null, so "Join" on a friend who was inside their home silently
teleported you to spawn instead of next to them. Show a green "Online" dot from
`isUserOnline`, but only render Join (and label "In the city") when a position
exists.

**How to apply:** any UI that acts on a friend's live location must use
`position`, and treat `online && !position` as "online but not reachable right
now". The join deep link passes `?sx=&sz=` to `/city`; `city.tsx` applies it
once on mount (ref guard) before the scene reads `game.player`, offsetting by
~1.4 so avatars don't overlap.

**Friend requests:** by `player_profiles.displayName` (case-insensitive
`ilike`, non-unique — ambiguous if names collide). Directional rows; a reverse
pending request is auto-accepted. Writes use `onConflictDoNothing` on the
`(requester,addressee)` unique pair so concurrent duplicate sends return a
stable 409 instead of a 500. Presence is in-memory only → single Railway
instance assumption.
