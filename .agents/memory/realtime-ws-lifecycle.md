---
name: Realtime WS connection lifecycle
description: Avoiding stale client-map entries in the Neura City WebSocket server
---

# WebSocket connection lifecycle (Neura City /ws)

The `connection` handler does async work (token auth + profile DB read) before
it can register the client in the in-memory `clients` map. A socket can close
during that async window.

**Rule:** attach `close`/`error` cleanup listeners *immediately* on accept
(before any `await`), gate registration behind a `registeredId` that is set only
after `clients.set`, and re-check `ws.readyState === OPEN` after the awaits
before registering. Also make the heartbeat remove dead entries eagerly (on
terminate) rather than trusting a `close` event that may never fire for a dead
socket.

**Why:** without this, a rapid connect-then-close (or a socket that dies mid-auth)
leaves a stale entry that never emits `leave`, leaking memory and showing ghost
players. Verified with a two-client test: rapid connect+close must leave the
next joiner's snapshot empty.

**How to apply:** any future async work added to the connection handler must
stay behind the same readyState/registeredId guards.
