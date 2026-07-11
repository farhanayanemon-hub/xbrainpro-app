/**
 * Realtime co-presence client for Neura City.
 *
 * Connects to the api-server WebSocket (`/ws`) with the session token, sends
 * the local player's position at a throttled rate, and keeps a mutable map of
 * other online players. The 3D scene reads `remote` every frame and smoothly
 * interpolates each avatar toward its latest target; React subscribes to the
 * roster so avatars mount/unmount as players join/leave.
 */
import { DEFAULT_AVATAR_ID } from "@/game/avatar";
import { clearBubbles, setBubble } from "@/game/bubbles";
import { labels } from "@/game/labels";

export interface RemotePlayer {
  id: string;
  name: string;
  gender: string;
  avatarId: string;
  /** Rendered (interpolated) transform. */
  cur: { x: number; z: number; h: number };
  /** Latest transform received from the server. */
  target: { x: number; z: number; h: number };
  /** Estimated movement magnitude 0..1, used to drive walk/run animation. */
  motion: number;
}

/** Wire shape sent by the server for snapshot/join. */
interface PlayerWire {
  id: string;
  name: string;
  gender: string;
  avatarId: string;
  x: number;
  z: number;
  h: number;
}

/** id -> remote player. Read by the render loop, written by socket messages. */
export const remote = new Map<string, RemotePlayer>();

/** Getter the app installs so we can sample the local player each tick. */
export interface SelfState {
  avatarId: string;
  /** Display name (currently authoritative server-side; kept for parity). */
  name?: string;
  x: number;
  z: number;
  h: number;
}
type SelfGetter = () => SelfState;

type RosterListener = (ids: string[]) => void;

/** One city chat message as broadcast by the server. */
export interface ChatMessage {
  id: string;
  name: string;
  text: string;
  ts: number;
}

export const CHAT_MAX_LEN = 120;
const CHAT_FEED_MAX = 50;

/** Rolling feed of recent chat messages (oldest first). */
const chatFeed: ChatMessage[] = [];

type ChatListener = (feed: ChatMessage[]) => void;
const chatListeners = new Set<ChatListener>();

function emitChat(): void {
  const snapshot = [...chatFeed];
  for (const cb of chatListeners) cb(snapshot);
}

export function subscribeChat(cb: ChatListener): () => void {
  chatListeners.add(cb);
  cb([...chatFeed]);
  return () => {
    chatListeners.delete(cb);
  };
}

/** One private message as pushed by the server over /ws. */
export interface DmPush {
  id: number;
  fromId: number;
  toId: number;
  text: string;
  ts: number;
  fromName?: string;
}

type DmListener = (msg: DmPush) => void;
const dmListeners = new Set<DmListener>();

/**
 * Subscribe to realtime private messages (only fires while the city socket
 * is connected). Used by an open DM thread to append incoming messages, and
 * by badges to bump unread counts without polling.
 */
export function subscribeDm(cb: DmListener): () => void {
  dmListeners.add(cb);
  return () => {
    dmListeners.delete(cb);
  };
}

/** Send a chat message to everyone in the city. */
export function sendChat(text: string): void {
  const t = text.trim().slice(0, CHAT_MAX_LEN);
  if (!t) return;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ t: "chat", text: t }));
  }
}

let ws: WebSocket | null = null;
let selfGetter: SelfGetter | null = null;
let sendTimer: ReturnType<typeof setInterval> | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let intentionalClose = false;
let backoff = 1000;
let myId: string | null = null;
let visible = true;
let lastSent = { x: NaN, z: NaN, h: NaN };
let lastAvatar = "";

const rosterListeners = new Set<RosterListener>();

function emitRoster(): void {
  const ids = [...remote.keys()];
  for (const cb of rosterListeners) cb(ids);
}

export function subscribeRoster(cb: RosterListener): () => void {
  rosterListeners.add(cb);
  cb([...remote.keys()]);
  return () => {
    rosterListeners.delete(cb);
  };
}

/** Build the ws(s) URL for the same origin that serves the API. */
function resolveWsUrl(): string | null {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  let origin: string | null = null;
  if (domain) origin = `https://${domain}`;
  else if (typeof window !== "undefined") origin = window.location.origin;
  if (!origin) return null;
  return origin.replace(/^http/, "ws") + "/ws";
}

function ensurePlayer(p: {
  id: string;
  name: string;
  gender: string;
  avatarId: string;
  x: number;
  z: number;
  h: number;
}): void {
  const existing = remote.get(p.id);
  if (existing) {
    existing.name = p.name;
    existing.gender = p.gender;
    existing.avatarId = p.avatarId;
    existing.target = { x: p.x, z: p.z, h: p.h };
  } else {
    remote.set(p.id, {
      id: p.id,
      name: p.name,
      gender: p.gender,
      avatarId: p.avatarId,
      cur: { x: p.x, z: p.z, h: p.h },
      target: { x: p.x, z: p.z, h: p.h },
      motion: 0,
    });
  }
}

function handleMessage(raw: string): void {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return;
  }
  switch (msg["t"]) {
    case "welcome":
      myId = typeof msg["id"] === "string" ? msg["id"] : null;
      break;
    case "snapshot": {
      const players = Array.isArray(msg["players"])
        ? (msg["players"] as PlayerWire[])
        : [];
      remote.clear();
      labels.clear();
      for (const p of players) {
        if (p.id === myId) continue;
        ensurePlayer(p);
      }
      emitRoster();
      break;
    }
    case "join": {
      const p = msg["player"] as PlayerWire | undefined;
      if (p && p.id !== myId) {
        ensurePlayer(p);
        emitRoster();
      }
      break;
    }
    case "leave": {
      const id = msg["id"];
      if (typeof id === "string" && remote.delete(id)) {
        labels.delete(id);
        emitRoster();
      }
      break;
    }
    case "state": {
      const id = msg["id"];
      if (typeof id !== "string" || id === myId) break;
      const p = remote.get(id);
      if (p) {
        p.target = {
          x: Number(msg["x"]) || 0,
          z: Number(msg["z"]) || 0,
          h: Number(msg["h"]) || 0,
        };
      }
      break;
    }
    case "chat": {
      const m = msg["msg"] as ChatMessage | undefined;
      if (!m || typeof m.text !== "string" || typeof m.id !== "string") break;
      chatFeed.push(m);
      if (chatFeed.length > CHAT_FEED_MAX) chatFeed.shift();
      // Speech bubble over the speaker's head ("me" for the local player).
      setBubble(m.id === myId ? "me" : m.id, m.text);
      emitChat();
      break;
    }
    case "dm": {
      const m = msg["msg"] as DmPush | undefined;
      if (!m || typeof m.text !== "string" || typeof m.fromId !== "number") {
        break;
      }
      for (const cb of dmListeners) cb(m);
      break;
    }
    case "chatlog": {
      const list = Array.isArray(msg["messages"])
        ? (msg["messages"] as ChatMessage[])
        : [];
      chatFeed.length = 0;
      for (const m of list) {
        if (m && typeof m.text === "string") chatFeed.push(m);
      }
      emitChat();
      break;
    }
    default:
      break;
  }
}

function startSendLoop(): void {
  if (sendTimer) return;
  sendTimer = setInterval(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN || !selfGetter) return;
    const s = selfGetter();
    if (s.avatarId !== lastAvatar) {
      lastAvatar = s.avatarId;
      ws.send(JSON.stringify({ t: "avatar", avatarId: s.avatarId }));
    }
    if (!visible) return;
    // Only send when the player actually moved (saves bandwidth on mobile).
    const moved =
      Math.abs(s.x - lastSent.x) > 0.02 ||
      Math.abs(s.z - lastSent.z) > 0.02 ||
      Math.abs(s.h - lastSent.h) > 0.03;
    if (!moved) return;
    lastSent = { x: s.x, z: s.z, h: s.h };
    ws.send(JSON.stringify({ t: "move", x: s.x, z: s.z, h: s.h }));
  }, 100);
}

function stopSendLoop(): void {
  if (sendTimer) {
    clearInterval(sendTimer);
    sendTimer = null;
  }
}

function open(token: string): void {
  const url = resolveWsUrl();
  if (!url) return;
  try {
    ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);
  } catch {
    scheduleReconnect(token);
    return;
  }

  ws.onopen = () => {
    backoff = 1000;
    lastSent = { x: NaN, z: NaN, h: NaN };
    lastAvatar = "";
    const s = selfGetter?.();
    ws?.send(
      JSON.stringify({ t: "join", avatarId: s?.avatarId ?? DEFAULT_AVATAR_ID }),
    );
    startSendLoop();
  };
  ws.onmessage = (ev) => handleMessage(String(ev.data));
  ws.onclose = () => {
    stopSendLoop();
    remote.clear();
    labels.clear();
    clearBubbles();
    // Drop the feed too — the server re-sends its authoritative history
    // ("chatlog") on reconnect, so stale messages never linger.
    chatFeed.length = 0;
    emitChat();
    emitRoster();
    if (!intentionalClose) scheduleReconnect(token);
  };
  ws.onerror = () => {
    try {
      ws?.close();
    } catch {
      /* onclose handles reconnect */
    }
  };
}

function scheduleReconnect(token: string): void {
  if (reconnectTimer || intentionalClose) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    open(token);
  }, backoff);
  backoff = Math.min(backoff * 2, 15_000);
}

export function connect(token: string, getSelf: SelfGetter): void {
  intentionalClose = false;
  selfGetter = getSelf;
  visible = true;
  open(token);
}

export function disconnect(): void {
  intentionalClose = true;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  stopSendLoop();
  try {
    ws?.close();
  } catch {
    /* ignore */
  }
  ws = null;
  remote.clear();
  labels.clear();
  clearBubbles();
  chatFeed.length = 0;
  emitChat();
  emitRoster();
}

/** Hide/show the local player (e.g. while inside a private home interior). */
export function setVisible(v: boolean): void {
  if (v === visible) return;
  visible = v;
  lastSent = { x: NaN, z: NaN, h: NaN };
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ t: "vis", v }));
  }
}
