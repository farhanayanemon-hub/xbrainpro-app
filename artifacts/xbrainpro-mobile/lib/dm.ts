/**
 * Direct-message REST client. Sending goes through REST so it works from the
 * lobby (no city socket needed); the server persists every message and pushes
 * it over the recipient's /ws socket when they're online.
 */
import { absoluteApiUrl, loadToken } from "@/lib/session";

export const DM_MAX_LEN = 300;

export interface DmMessage {
  id: number;
  fromId: number;
  toId: number;
  text: string;
  ts: number;
}

export class DmError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "DmError";
  }
}

async function authedFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const token = await loadToken();
  const headers: Record<string, string> = {
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (init?.body) headers["Content-Type"] = "application/json";
  return fetch(absoluteApiUrl(path), { ...init, headers });
}

async function parseError(res: Response): Promise<never> {
  let message = `Request failed (${res.status})`;
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) message = body.error;
  } catch {
    /* keep default */
  }
  throw new DmError(res.status, message);
}

/**
 * Load the conversation with a friend (oldest first). Opening it marks their
 * messages as read server-side, clearing the unread badges.
 */
export async function getConversation(userId: number): Promise<DmMessage[]> {
  const res = await authedFetch(`/api/dm/${userId}`);
  if (!res.ok) return parseError(res);
  const body = (await res.json()) as { messages: DmMessage[] };
  return body.messages;
}

/** Send a private message; returns the persisted message. */
export async function sendDm(
  userId: number,
  text: string,
): Promise<DmMessage> {
  const res = await authedFetch(`/api/dm/${userId}`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return parseError(res);
  const body = (await res.json()) as { message: DmMessage };
  return body.message;
}

/** Total unread DMs for the current user (drives the lobby badge). */
export async function getUnreadTotal(): Promise<number> {
  const res = await authedFetch("/api/dm/unread");
  if (!res.ok) return parseError(res);
  const body = (await res.json()) as { unread: number };
  return body.unread;
}
