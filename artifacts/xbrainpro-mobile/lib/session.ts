/**
 * Session token persistence + API client auth wiring.
 *
 * The api-server issues a bearer token on register/login. We keep it in
 * AsyncStorage (works on native and web) and register a getter with the
 * generated API client so every call carries `Authorization: Bearer …`.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "neura.sessionToken";

let cached: string | null = null;
let loaded = false;

export async function loadToken(): Promise<string | null> {
  if (loaded) return cached;
  try {
    cached = await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    cached = null;
  }
  loaded = true;
  return cached;
}

export async function saveToken(token: string): Promise<void> {
  cached = token;
  loaded = true;
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    // non-fatal: session lasts for this launch only
  }
}

export async function clearToken(): Promise<void> {
  cached = null;
  loaded = true;
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** Attach the stored token to every generated API client call. */
export function installAuthTokenGetter(): void {
  setAuthTokenGetter(() => loadToken());
}

/**
 * Turn a server-relative URL (e.g. `/api/players/1/photo`) into an absolute
 * one, matching the base-URL logic in app/_layout.tsx.
 */
export function absoluteApiUrl(path: string): string {
  const apiDomain = process.env.EXPO_PUBLIC_DOMAIN;
  if (apiDomain) return `https://${apiDomain}${path}`;
  if (typeof window !== "undefined") return `${window.location.origin}${path}`;
  return path;
}
