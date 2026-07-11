/**
 * Friends REST client for the lobby. Uses raw fetch (like the asset manifest
 * loader) with the stored bearer token, rather than the generated API client,
 * so the social layer stays self-contained.
 */
import { absoluteApiUrl, loadToken } from "@/lib/session";

export interface FriendEntry {
  userId: number;
  displayName: string;
  gender: string;
  hasPhoto: boolean;
  photoUrl: string | null;
  online: boolean;
  position: { x: number; z: number } | null;
  /** Unread private messages from this friend. */
  unread: number;
}

export interface RequestEntry {
  userId: number;
  displayName: string;
  gender: string;
  hasPhoto: boolean;
  photoUrl: string | null;
}

export interface FriendsData {
  friends: FriendEntry[];
  incoming: RequestEntry[];
  outgoing: RequestEntry[];
}

/** An error carrying the server's HTTP status + human-readable message. */
export class FriendsError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "FriendsError";
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
  throw new FriendsError(res.status, message);
}

export async function listFriends(): Promise<FriendsData> {
  const res = await authedFetch("/api/friends");
  if (!res.ok) return parseError(res);
  return (await res.json()) as FriendsData;
}

/** Send (or auto-accept) a request. Returns the resulting status. */
export async function sendFriendRequest(
  displayName: string,
): Promise<"pending" | "accepted"> {
  const res = await authedFetch("/api/friends/requests", {
    method: "POST",
    body: JSON.stringify({ displayName }),
  });
  if (!res.ok) return parseError(res);
  const body = (await res.json()) as { status: "pending" | "accepted" };
  return body.status;
}

export async function acceptFriendRequest(userId: number): Promise<void> {
  const res = await authedFetch(`/api/friends/requests/${userId}/accept`, {
    method: "POST",
  });
  if (!res.ok) return parseError(res);
}
