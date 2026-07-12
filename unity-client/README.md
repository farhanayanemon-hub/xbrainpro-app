# Neura City — Unity Client Integration Guide

This folder gives you everything needed to connect a **Unity** game to the
existing Neura City backend (accounts, player profiles, world map, wallet,
friends, and **realtime multiplayer**). You do **not** copy any server code into
Unity — Unity talks to the server over the internet (HTTP + WebSocket).

> **Quick summary (Banglish):** Server + database + multiplayer already ready.
> Unity-te sudhu ei C# script gula boshaben, `NeuraConfig.cs`-e server address
> boshaben, Play chapben — login + multiplayer connect hoye jabe. Map, character,
> animation apni Unity Editor-e sajaben.

---

## 0. What you need (once)
- A PC/laptop (Windows or Mac)
- **Unity Hub** + **Unity Editor** (LTS version, e.g. 2022 LTS or newer) — free
- Your server address:
  - Development: `https://YOUR-REPL.replit.dev`
  - Live (deployed): `https://YOUR-APP.replit.app`

## 1. Create the Unity project
1. Open **Unity Hub → New Project → 3D (Core)** → give it a name → Create.

## 2. Add the one required package (NativeWebSocket)
Realtime multiplayer uses WebSockets. Unity has no built-in WebSocket client, so
add this free package:
1. **Window → Package Manager**
2. **+ → Add package from git URL…**
3. Paste: `https://github.com/endel/NativeWebSocket.git#upm`
4. Wait for it to install.

*(REST calls use `UnityWebRequest`, which is already built into Unity — nothing
to install for that.)*

## 3. Add the scripts
1. In the **Project** window create a folder `Assets/Neura`.
2. Copy the files from this folder's `Scripts/` into `Assets/Neura`:
   - `NeuraConfig.cs`
   - `NeuraModels.cs`
   - `NeuraApi.cs`
   - `NeuraRealtime.cs`
   - `NeuraGameExample.cs` (example / connection test — optional later)

## 4. Set your server address
Open `NeuraConfig.cs` and change **one line**:
```csharp
public static string BaseUrl = "https://YOUR-APP.replit.app";
```
Use your dev URL while building, your live URL for release.

## 5. Test the connection (Play)
1. In the scene, create an **empty GameObject** (`GameObject → Create Empty`),
   name it `Neura`.
2. Add the **NeuraGameExample** component to it (it auto-adds `NeuraApi` and
   `NeuraRealtime`).
3. Press **Play**. In the **Console** you should see:
   - `Logged in as … (token acquired).`
   - `World map loaded (… chars).`
   - `Connected. My id = u…`
   - `N player(s) already here.`
4. Open a second copy (or a second device) logged in as a different account and
   you'll see `Joined: …` / movement / chat events. That proves multiplayer.

Once this works, delete/replace `NeuraGameExample` and wire the events into your
own avatars, map, and UI.

## 6. Import the characters (optional, reuse existing art)
The current game ships GLB avatars (`ryan`, `maya`). To reuse them in Unity:
- Get the `.glb` files (from the app's asset storage / the team) and drag them
  into `Assets/`. Unity imports GLB via the **glTFast** package
  (`com.unity.cloud.gltfast`) if you want runtime glTF, or convert to FBX.
- Add walk / run / idle animation with **Mixamo** (free) and an Animator
  Controller. You will usually also add your own Unity assets/animations.

## 7. Build
- **File → Build Settings**, pick a platform (Windows / Android / WebGL), Build.
- The same live server works for every platform — only `BaseUrl` matters.
- **WebGL note:** browsers only allow secure connections from an https page, so
  use an `https://` server (the WebSocket auto-switches to `wss://`).

---

# API reference

**Base URL:** `{BaseUrl}/api` — e.g. `https://your-app.replit.app/api`

## Auth
Auth is token-based. Register or log in, keep the returned `token`, and send it
on later calls as a header:
```
Authorization: Bearer <token>
```
(`NeuraApi.cs` stores and attaches this for you automatically.)

| Method | Path | Body | Returns |
|--------|------|------|---------|
| POST | `/auth/register` | `{ email, password, name }` | `{ user, token }` |
| POST | `/auth/login` | `{ email, password }` | `{ user, token }` |
| GET | `/auth/me` | — (auth) | the user |
| POST | `/auth/logout` | — (auth) | 204 |

`user` = `{ id, email, name, avatarUrl, xp, level, streak, hasProgram, onboarded, createdAt }`

## Player profile
| Method | Path | Body | Returns |
|--------|------|------|---------|
| GET | `/player/profile` | — (auth) | profile |
| PUT | `/player/profile` | `{ displayName, gender, bio }` | profile |
| GET | `/player/home` | — (auth) | `{ plot }` (0-based house plot) |
| GET | `/players/:userId` | — (auth) | another player's public profile |

`profile` = `{ userId, displayName, gender, bio, hasPhoto, photoUrl }`

## World map
| Method | Path | Returns |
|--------|------|---------|
| GET | `/world/map` | `{ version, objects: [ { id, kind, data } ] }` |

`kind` is one of `building, tree, lamp, prop, roofProp, car, fountain, stall,
npc, house`. `data` is free-form per object (position, rotation, size, etc.), so
`NeuraApi.GetWorldMap` hands you the **raw JSON** — parse the parts your scene
needs (a JSON library like Newtonsoft is handy for the free-form `data`). You can
also just design the map by hand in Unity and ignore this endpoint.

## Wallet
| Method | Path | Returns |
|--------|------|---------|
| GET | `/wallet` | `{ coins, gems }` |
| POST | `/store/avatars/:avatarId/purchase` | updated balance |

## Health
| Method | Path | Returns |
|--------|------|---------|
| GET | `/healthz` | `{ status: "ok" }` — use to test the address is reachable |

*(More routes exist: friends, direct messages, moderation, apartment, contest,
VIP, engagement/daily-tasks. Ask for their shapes when you need them.)*

---

# Realtime multiplayer protocol

**Socket URL:** `{BaseUrl -> ws/wss}/ws?token=<token>`
e.g. `wss://your-app.replit.app/ws?token=abc123`

Connect with the token in the query string (browsers/WebGL can't set headers on
a WebSocket, so the token goes in the URL). All messages are JSON objects with a
`t` (type) field.

### You send → server
| Message | When |
|---------|------|
| `{ t:"join", avatarId }` | right after you receive `welcome` (not before — the server only starts reading your messages once it has authenticated you) |
| `{ t:"move", x, z, h }` | as your player moves (throttled ~25/sec) |
| `{ t:"avatar", avatarId }` | you changed your look mid-session |
| `{ t:"vis", v:false }` | hide while inside a private interior (`true` to show) |
| `{ t:"chat", text }` | send a city chat line (≤120 chars, ~1 per 1.2s) |

### Server sends → you
| Message | Meaning |
|---------|---------|
| `{ t:"welcome", id }` | your own player id (e.g. `u42`) |
| `{ t:"snapshot", players:[…] }` | everyone already online |
| `{ t:"join", player }` | someone appeared |
| `{ t:"leave", id }` | someone disappeared |
| `{ t:"state", id, x, z, h }` | someone moved |
| `{ t:"chat", msg }` | someone said something |
| `{ t:"chatlog", messages:[…] }` | recent chat history, once on connect |
| `{ t:"dm", msg }` | a private message pushed to you |
| `{ t:"muted", until }` | your chat is muted until this time (ms epoch) |
| `{ t:"error", reason }` | e.g. `unauthorized` (bad/expired token) |

`player` = `{ id, name, gender, avatarId, x, z, h }`. Positions are in world
units; the city bound is roughly ±34. `NeuraRealtime.cs` already parses these and
raises C# events for each — you just move avatars in response.

---

## Notes
- **CORS:** the server allows cross-origin calls, so a Unity WebGL build hosted
  anywhere can reach it.
- **Token lifetime:** ~30 days. If a call returns `401` (or the socket closes
  with `unauthorized`), log in again to get a fresh token.
- **One socket per account:** connecting again replaces the previous socket for
  that account (e.g. a second tab kicks the first).
