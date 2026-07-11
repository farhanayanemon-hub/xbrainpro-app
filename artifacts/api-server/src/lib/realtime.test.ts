import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import { inArray } from "drizzle-orm";
import { db, usersTable, sessionsTable, playerProfilesTable } from "@workspace/db";
import { attachRealtime } from "./realtime";
import { createSession, hashPassword } from "./auth";

/**
 * Integration test for the city chat over the real WebSocket server.
 * Spins up `attachRealtime` on an ephemeral port, seeds real users/sessions
 * in the dev database, connects authenticated clients, and asserts the chat
 * contract: broadcast to everyone (including the sender), trim + 120-char
 * cap, per-player rate limiting, and chatlog history for newcomers.
 */

const CHAT_MAX_LEN = 120;
const CHAT_MIN_INTERVAL_MS = 1200;

interface WireMsg {
  t: string;
  [key: string]: unknown;
}

class TestClient {
  ws: WebSocket;
  messages: WireMsg[] = [];

  private constructor(ws: WebSocket) {
    this.ws = ws;
    ws.on("message", (raw) => {
      try {
        this.messages.push(JSON.parse(String(raw)) as WireMsg);
      } catch {
        /* ignore non-JSON */
      }
    });
  }

  static async connect(port: number, token: string): Promise<TestClient> {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${token}`);
    const client = new TestClient(ws);
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });
    return client;
  }

  send(msg: unknown): void {
    this.ws.send(JSON.stringify(msg));
  }

  /** Wait until a message matching `pred` arrives (checks already-received ones too). */
  async waitFor(
    pred: (m: WireMsg) => boolean,
    timeoutMs = 3000,
  ): Promise<WireMsg> {
    const started = Date.now();
    for (;;) {
      const found = this.messages.find(pred);
      if (found) return found;
      if (Date.now() - started > timeoutMs) {
        throw new Error(
          `Timed out waiting for message. Received: ${JSON.stringify(this.messages)}`,
        );
      }
      await sleep(25);
    }
  }

  chatMessages(): WireMsg[] {
    return this.messages.filter((m) => m.t === "chat");
  }

  close(): void {
    try {
      this.ws.close();
    } catch {
      /* ignore */
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface Fixture {
  userId: number;
  token: string;
  name: string;
}

describe("realtime city chat", () => {
  let server: Server;
  let port: number;
  const userIds: number[] = [];
  let alice: Fixture;
  let bob: Fixture;
  let carol: Fixture;
  const openClients: TestClient[] = [];

  async function seedUser(name: string): Promise<Fixture> {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const [user] = await db
      .insert(usersTable)
      .values({
        email: `chat-test-${name}-${stamp}@test.local`,
        passwordHash: await hashPassword("test-password"),
        name: `ChatTest ${name}`,
      })
      .returning({ id: usersTable.id });
    if (!user) throw new Error("failed to seed user");
    userIds.push(user.id);
    await db.insert(playerProfilesTable).values({
      userId: user.id,
      displayName: name,
      gender: "male",
    });
    const token = await createSession(user.id);
    return { userId: user.id, token, name };
  }

  async function connect(f: Fixture): Promise<TestClient> {
    const client = await TestClient.connect(port, f.token);
    openClients.push(client);
    await client.waitFor((m) => m.t === "welcome");
    client.send({ t: "join", avatarId: "ryan" });
    return client;
  }

  beforeAll(async () => {
    [alice, bob, carol] = await Promise.all([
      seedUser("Alice"),
      seedUser("Bob"),
      seedUser("Carol"),
    ]);

    server = createServer();
    attachRealtime(server);
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    port = (server.address() as AddressInfo).port;
  }, 30_000);

  afterAll(async () => {
    for (const c of openClients) c.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (userIds.length > 0) {
      // Sessions and player profiles cascade on user delete.
      await db.delete(usersTable).where(inArray(usersTable.id, userIds));
    }
  }, 30_000);

  it("rejects a connection with a bad token", async () => {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?token=not-a-real-token`);
    const code = await new Promise<number>((resolve, reject) => {
      ws.on("close", (c) => resolve(c));
      ws.on("error", reject);
    });
    expect(code).toBe(4001);
  });

  it("broadcasts chat to everyone including the sender", async () => {
    const a = await connect(alice);
    const b = await connect(bob);

    a.send({ t: "chat", text: "hello city" });

    const gotA = await a.waitFor(
      (m) =>
        m.t === "chat" &&
        (m.msg as { text?: string } | undefined)?.text === "hello city",
    );
    const gotB = await b.waitFor(
      (m) =>
        m.t === "chat" &&
        (m.msg as { text?: string } | undefined)?.text === "hello city",
    );

    for (const got of [gotA, gotB]) {
      const msg = got.msg as {
        id: string;
        name: string;
        text: string;
        ts: number;
      };
      expect(msg.id).toBe(`u${alice.userId}`);
      expect(msg.name).toBe("Alice");
      expect(msg.text).toBe("hello city");
      expect(typeof msg.ts).toBe("number");
    }
  });

  it("trims whitespace and hard-caps messages at 120 chars", async () => {
    const b = openClients[1];
    if (!b) throw new Error("bob client missing");
    const longText = `   ${"x".repeat(300)}   `;
    b.send({ t: "chat", text: longText });

    const got = await b.waitFor(
      (m) =>
        m.t === "chat" &&
        ((m.msg as { id?: string } | undefined)?.id ?? "") ===
          `u${bob.userId}`,
    );
    const msg = got.msg as { text: string };
    expect(msg.text).toBe("x".repeat(CHAT_MAX_LEN));
    expect(msg.text.length).toBe(CHAT_MAX_LEN);
  });

  it("drops empty / non-string chat payloads", async () => {
    const a = openClients[0];
    const b = openClients[1];
    if (!a || !b) throw new Error("clients missing");
    const before = b.chatMessages().length;

    a.send({ t: "chat", text: "    " });
    a.send({ t: "chat", text: 12345 });
    a.send({ t: "chat" });
    await sleep(400);

    expect(b.chatMessages().length).toBe(before);
  });

  it("rate-limits a player to one message per interval", async () => {
    const a = openClients[0];
    const b = openClients[1];
    if (!a || !b) throw new Error("clients missing");

    // Ensure Alice is out of any previous cooldown window.
    await sleep(CHAT_MIN_INTERVAL_MS + 100);

    const before = b.chatMessages().length;
    a.send({ t: "chat", text: "first in burst" });
    a.send({ t: "chat", text: "second in burst" });

    await b.waitFor(
      (m) =>
        m.t === "chat" &&
        (m.msg as { text?: string } | undefined)?.text === "first in burst",
    );
    await sleep(400);
    const burst = b.chatMessages().slice(before);
    expect(burst.map((m) => (m.msg as { text: string }).text)).toEqual([
      "first in burst",
    ]);

    // After the cooldown the same player can chat again.
    await sleep(CHAT_MIN_INTERVAL_MS + 100);
    a.send({ t: "chat", text: "after cooldown" });
    await b.waitFor(
      (m) =>
        m.t === "chat" &&
        (m.msg as { text?: string } | undefined)?.text === "after cooldown",
    );
  }, 10_000);

  it("sends recent chat history to newcomers on connect", async () => {
    const c = await TestClient.connect(port, carol.token);
    openClients.push(c);

    const log = await c.waitFor((m) => m.t === "chatlog");
    const messages = log.messages as {
      id: string;
      name: string;
      text: string;
    }[];
    const texts = messages.map((m) => m.text);

    expect(texts).toContain("hello city");
    expect(texts).toContain("x".repeat(CHAT_MAX_LEN));
    expect(texts).toContain("first in burst");
    expect(texts).toContain("after cooldown");
    // Rate-limited and empty messages never entered history.
    expect(texts).not.toContain("second in burst");

    // History is ordered oldest -> newest.
    expect(texts.indexOf("hello city")).toBeLessThan(
      texts.indexOf("after cooldown"),
    );
  });
});
