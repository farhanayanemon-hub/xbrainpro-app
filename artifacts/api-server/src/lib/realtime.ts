import type { Server } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { db, playerProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { resolveUserByToken } from "./auth";
import { logger } from "./logger";

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
 *   server -> client:
 *     { t: "welcome", id }                    your own player id
 *     { t: "snapshot", players: Player[] }    everyone already online
 *     { t: "join", player: Player }           someone appeared
 *     { t: "leave", id }                      someone disappeared
 *     { t: "state", id, x, z, h }             someone moved
 */

const WORLD_LIMIT = 60; // generous clamp; city bound is ~34
const MOVE_MIN_INTERVAL_MS = 40; // ~25 msgs/sec ceiling per client
const HEARTBEAT_MS = 30_000;

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
  return typeof v === "string" && /^[a-z0-9_]{1,32}$/i.test(v) ? v : "knight";
}

export function attachRealtime(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });
  // Keyed by public id so a reconnecting user replaces their old socket.
  const clients = new Map<string, Client>();

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
    let token: string | null = null;
    try {
      const url = new URL(req.url ?? "", "http://localhost");
      token = url.searchParams.get("token");
    } catch {
      token = null;
    }

    const user = await resolveUserByToken(token);
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
      name: profile?.displayName?.slice(0, 24) || "Citizen",
      gender: profile?.gender || "male",
      avatarId: "knight",
      x: 0,
      z: 8,
      h: 0,
      visible: true,
      alive: true,
      lastMoveAt: 0,
    };
    clients.set(id, client);

    send(ws, { t: "welcome", id });

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

    const cleanup = () => {
      // Only remove if this socket is still the active one for the user.
      if (clients.get(id)?.ws === ws) {
        clients.delete(id);
        broadcast({ t: "leave", id }, id);
      }
    };
    ws.on("close", cleanup);
    ws.on("error", cleanup);
  });

  const heartbeat = setInterval(() => {
    for (const c of clients.values()) {
      if (!c.alive) {
        try {
          c.ws.terminate();
        } catch {
          /* ignore */
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
