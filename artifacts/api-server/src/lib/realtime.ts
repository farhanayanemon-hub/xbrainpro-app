import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { db, playerProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { resolveUserByToken } from "./auth";
import { logger } from "./logger";
import { advanceTask } from "./dailyTasks";
import { filterProfanity } from "./profanity";
import {
  getMuteUntil,
  muteUser,
  registerLiveMuteHook,
  PROFANITY_AUTO_MUTE_MS,
  PROFANITY_STRIKE_THRESHOLD,
  PROFANITY_STRIKE_WINDOW_MS,
} from "./moderation";

/**
 * Realtime co-presence for Neura City. A WebSocket server rides on the same
 * HTTP server (path `/ws`) so it works through the single Railway service in
 * production. Clients authenticate with their session token via `?token=`.
 *
 * Protocol (JSON):
 *   client -> server:
 *     { t: "join", avatarId }                 sent right after connect
 *     { t: "move", x, z, h }                  throttled position/heading
 *     { t: "avatar", avatarId }               avatar changed mid-session
 *     { t: "vis", v: boolean }                false while inside a private home
 *     { t: "chat", text }                     city chat message
 *   server -> client:
 *     { t: "welcome", id }                    your own player id
 *     { t: "snapshot", players: Player[] }    everyone already online
 *     { t: "join", player: Player }           someone appeared
 *     { t: "leave", id }                      someone disappeared
 *     { t: "state", id, x, z, h }             someone moved
 *     { t: "chat", msg: ChatWire }            someone said something
 *     { t: "chatlog", messages: ChatWire[] }  recent history, once on connect
 *     { t: "dm", msg: DmWire }                private message (pushed by the
 *                                             REST layer via deliverToUser)
 *     { t: "muted", until }                   your chat is muted until (ms epoch)
 */

const WORLD_LIMIT = 60; // generous clamp; city bound is ~34
const MOVE_MIN_INTERVAL_MS = 40; // ~25 msgs/sec ceiling per client
const HEARTBEAT_MS = 30_000;
const CHAT_MAX_LEN = 120;
const CHAT_MIN_INTERVAL_MS = 1200; // one message per ~1.2s per player
const CHAT_HISTORY_MAX = 30;

interface ChatWire {
  id: string;
  name: string;
  text: string;
  ts: number;
}

interface Client {
  ws: WebSocket;
  id: string; // stable public id, e.g. "u42"
  userId: number;
  name: string;
  gender: string;
  avatarId: string;
  x: number;
  z: number;
  h: number;
  visible: boolean;
  alive: boolean;
  lastMoveAt: number;
  lastChatAt: number;
  /** Chat is blocked while Date.now() < mutedUntil (0 = not muted). */
  mutedUntil: number;
  /** Timestamps of recent messages that tripped the profanity filter. */
  profanityStrikes: number[];
}

interface PlayerWire {
  id: string;
  name: string;
  gender: string;
  avatarId: string;
  x: number;
  z: number;
  h: number;
}

function wire(c: Client): PlayerWire {
  return {
    id: c.id,
    name: c.name,
    gender: c.gender,
    avatarId: c.avatarId,
    x: c.x,
    z: c.z,
    h: c.h,
  };
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function safeAvatarId(v: unknown): string {
  return typeof v === "string" && /^[a-z0-9_]{1,32}$/i.test(v) ? v : "ryan";
}

/**
 * Live presence registry, shared with the (same-process) REST layer so the
 * friends API can report who is online and where they are standing right now.
 * Set once when the WebSocket server is attached.
 */
let liveClients: Map<string, Client> | null = null;

/** True when the user currently has an open city socket. */
export function isUserOnline(userId: number): boolean {
  return liveClients?.has(`u${userId}`) ?? false;
}

/**
 * Push a message to a specific user's live socket, if they have one.
 * Used by the REST layer to deliver direct messages in realtime.
 * Returns true when the message was actually sent.
 */
export function deliverToUser(userId: number, msg: unknown): boolean {
  const c = liveClients?.get(`u${userId}`);
  if (!c || c.ws.readyState !== WebSocket.OPEN) return false;
  try {
    c.ws.send(JSON.stringify(msg));
    return true;
  } catch {
    return false;
  }
}

/**
 * The user's latest city position, or null if they're offline or hidden
 * (inside a private home). Used to spawn a friend nearby on "Join".
 */
export function getUserPresence(
  userId: number,
): { x: number; z: number; h: number } | null {
  const c = liveClients?.get(`u${userId}`);
  if (!c || !c.visible) return null;
  return { x: c.x, z: c.z, h: c.h };
}

export function attachRealtime(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });
  // Keyed by public id so a reconnecting user replaces their old socket.
  const clients = new Map<string, Client>();
  liveClients = clients;

  // Push DB-side mutes (reports/admin) into live sockets immediately.
  registerLiveMuteHook((userId, untilMs) => {
    const c = clients.get(`u${userId}`);
    if (!c) return;
    c.mutedUntil = untilMs;
    if (untilMs > Date.now()) {
      send(c.ws, { t: "muted", until: untilMs });
    }
  });

  // Session-only city chat history so newcomers see recent conversation.
  const chatHistory: ChatWire[] = [];

  function broadcast(msg: unknown, exceptId?: string): void {
    const data = JSON.stringify(msg);
    for (const c of clients.values()) {
      if (c.id === exceptId) continue;
      if (c.ws.readyState === WebSocket.OPEN) c.ws.send(data);
    }
  }

  function send(ws: WebSocket, msg: unknown): void {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }

  wss.on("connection", async (ws, req) => {
    // Attach a lifecycle guard immediately, BEFORE any async auth/DB work, so a
    // socket that disconnects during that window is never registered as a live
    // client. `registeredId` is set only once the client is placed in the map.
    let registeredId: string | null = null;
    const cleanup = () => {
      if (registeredId && clients.get(registeredId)?.ws === ws) {
        const gone = registeredId;
        clients.delete(gone);
        broadcast({ t: "leave", id: gone }, gone);
      }
    };
    ws.on("close", cleanup);
    ws.on("error", cleanup);

    let token: string | null = null;
    try {
      const url = new URL(req.url ?? "", "http://localhost");
      token = url.searchParams.get("token");
    } catch {
      token = null;
    }

    // The whole auth/profile path talks to the DB. Any transient failure here
    // must NOT reject this async listener (that would surface as an unhandled
    // rejection and can take down the whole process). Contain it and close the
    // one bad socket instead.
    let user: Awaited<ReturnType<typeof resolveUserByToken>>;
    let profileName = "Citizen";
    let profileGender = "male";
    let mutedUntil = 0;
    try {
      user = await resolveUserByToken(token);
      if (!user) {
        send(ws, { t: "error", reason: "unauthorized" });
        ws.close(4001, "unauthorized");
        return;
      }

      const [profile] = await db
        .select({
          displayName: playerProfilesTable.displayName,
          gender: playerProfilesTable.gender,
        })
        .from(playerProfilesTable)
        .where(eq(playerProfilesTable.userId, user.id));
      profileName = profile?.displayName?.slice(0, 24) || "Citizen";
      profileGender = profile?.gender || "male";
      mutedUntil = (await getMuteUntil(user.id)) ?? 0;
    } catch (err) {
      logger.error({ err }, "Realtime auth/profile lookup failed");
      send(ws, { t: "error", reason: "server_error" });
      try {
        ws.close(1011, "server error");
      } catch {
        /* ignore */
      }
      return;
    }

    // The socket may have closed while we were awaiting auth/profile. Bail
    // before registering so we never leave a dead entry in the map.
    if (ws.readyState !== WebSocket.OPEN) return;

    const id = `u${user.id}`;

    // Replace any existing connection for this user (e.g. second tab/reload).
    const existing = clients.get(id);
    if (existing && existing.ws !== ws) {
      try {
        existing.ws.close(4000, "replaced");
      } catch {
        /* ignore */
      }
    }

    const client: Client = {
      ws,
      id,
      userId: user.id,
      name: profileName,
      gender: profileGender,
      avatarId: "ryan",
      x: 0,
      z: 8,
      h: 0,
      visible: true,
      alive: true,
      lastMoveAt: 0,
      lastChatAt: 0,
      mutedUntil,
      profanityStrikes: [],
    };
    clients.set(id, client);
    registeredId = id;

    send(ws, { t: "welcome", id });
    if (chatHistory.length > 0) {
      send(ws, { t: "chatlog", messages: chatHistory });
    }

    ws.on("pong", () => {
      client.alive = true;
    });

    ws.on("message", (raw) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(raw)) as Record<string, unknown>;
      } catch {
        return;
      }
      switch (msg["t"]) {
        case "join": {
          client.avatarId = safeAvatarId(msg["avatarId"]);
          client.visible = true;
          // Tell the newcomer who's already here...
          const others = [...clients.values()]
            .filter((c) => c.id !== id && c.visible)
            .map(wire);
          send(ws, { t: "snapshot", players: others });
          // ...and announce them to everyone else.
          broadcast({ t: "join", player: wire(client) }, id);
          // Credit the "enter the city" daily task (fire-and-forget; capped
          // server-side so re-joining can't farm it).
          void advanceTask(client.userId, "play_city").catch((err) =>
            logger.error({ err }, "Failed to advance play_city task"),
          );
          break;
        }
        case "avatar": {
          client.avatarId = safeAvatarId(msg["avatarId"]);
          if (client.visible) {
            broadcast(
              { t: "join", player: wire(client) },
              id,
            );
          }
          break;
        }
        case "move": {
          const now = Date.now();
          if (now - client.lastMoveAt < MOVE_MIN_INTERVAL_MS) return;
          client.lastMoveAt = now;
          client.x = clamp(num(msg["x"]), -WORLD_LIMIT, WORLD_LIMIT);
          client.z = clamp(num(msg["z"]), -WORLD_LIMIT, WORLD_LIMIT);
          client.h = num(msg["h"]);
          if (client.visible) {
            broadcast(
              { t: "state", id, x: client.x, z: client.z, h: client.h },
              id,
            );
          }
          break;
        }
        case "chat": {
          // Hidden players (inside interiors) may still chat; only rate/length
          // limits apply. Text is trimmed and hard-capped server-side.
          const now = Date.now();
          if (now - client.lastChatAt < CHAT_MIN_INTERVAL_MS) return;
          // Muted players get a private notice instead of a broadcast.
          if (now < client.mutedUntil) {
            send(ws, { t: "muted", until: client.mutedUntil });
            break;
          }
          const raw = msg["text"];
          if (typeof raw !== "string") break;
          const trimmed = raw.trim().slice(0, CHAT_MAX_LEN);
          if (!trimmed) break;
          client.lastChatAt = now;
          // Mask profanity before anyone (including the sender) sees it, and
          // count a strike. Repeat offenders are auto-muted for a while.
          const { text, hadProfanity } = filterProfanity(trimmed);
          if (hadProfanity) {
            client.profanityStrikes = client.profanityStrikes.filter(
              (ts) => now - ts < PROFANITY_STRIKE_WINDOW_MS,
            );
            client.profanityStrikes.push(now);
            if (client.profanityStrikes.length >= PROFANITY_STRIKE_THRESHOLD) {
              const until = now + PROFANITY_AUTO_MUTE_MS;
              client.mutedUntil = until;
              client.profanityStrikes = [];
              // Persist async; the in-memory mute already blocks this socket.
              muteUser(client.userId, until, "profanity").catch((err) =>
                logger.error({ err }, "Failed to persist profanity auto-mute"),
              );
              send(ws, { t: "muted", until });
              break;
            }
          }
          const entry: ChatWire = { id, name: client.name, text, ts: now };
          chatHistory.push(entry);
          if (chatHistory.length > CHAT_HISTORY_MAX) chatHistory.shift();
          // Everyone including the sender gets the canonical broadcast, so the
          // sender's own feed/bubble reflects exactly what others see.
          broadcast({ t: "chat", msg: entry });
          // Credit the "send a chat" daily task (fire-and-forget; capped).
          void advanceTask(client.userId, "send_chat").catch((err) =>
            logger.error({ err }, "Failed to advance send_chat task"),
          );
          break;
        }
        case "vis": {
          const next = msg["v"] === true;
          if (next === client.visible) break;
          client.visible = next;
          if (next) {
            const others = [...clients.values()]
              .filter((c) => c.id !== id && c.visible)
              .map(wire);
            send(ws, { t: "snapshot", players: others });
            broadcast({ t: "join", player: wire(client) }, id);
          } else {
            broadcast({ t: "leave", id }, id);
          }
          break;
        }
        default:
          break;
      }
    });

  });

  const heartbeat = setInterval(() => {
    for (const [id, c] of clients) {
      if (!c.alive) {
        // Missed the last ping: force-close and remove eagerly rather than
        // waiting on a `close` event that may never fire for a dead socket.
        try {
          c.ws.terminate();
        } catch {
          /* ignore */
        }
        if (clients.get(id)?.ws === c.ws) {
          clients.delete(id);
          broadcast({ t: "leave", id }, id);
        }
        continue;
      }
      c.alive = false;
      try {
        c.ws.ping();
      } catch {
        /* ignore */
      }
    }
  }, HEARTBEAT_MS);

  wss.on("close", () => clearInterval(heartbeat));

  logger.info("Realtime city WebSocket listening at /ws");
  return wss;
}
