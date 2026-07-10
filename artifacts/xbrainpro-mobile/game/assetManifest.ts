import AsyncStorage from "@react-native-async-storage/async-storage";

import { absoluteApiUrl } from "@/lib/session";

/**
 * Runtime asset manifest fetched from the API. The server streams every game
 * asset from Cloudflare R2 through its own origin (`/api/assets/file/:id?h=`),
 * so the `url` below is a same-origin, content-hashed, immutable download link.
 * The `version` bumps whenever an admin uploads/replaces/deletes an asset so
 * clients know to re-fetch.
 */
export type AssetCategory = "model" | "texture" | "avatar";

export interface AssetEntry {
  id: string;
  category: AssetCategory;
  slot: string | null;
  label: string;
  /** Same-origin, content-hashed download url served by the API from R2. */
  url: string;
  /** Content hash — stable cache key on disk. */
  hash: string;
  size: number;
  mime: string;
  version: number;
  meta: Record<string, unknown>;
}

/**
 * Which zone an asset belongs to. Models/textures live in a zone (the spawn
 * "city", a house "interior", a future map, …) and are only downloaded when
 * the player enters that zone. Avatars are global ("*") and fetched on
 * selection. Defaults to "city" so a manifest without zones still works.
 */
export function assetZone(entry: AssetEntry): string {
  const z = entry.meta?.zone;
  return typeof z === "string" && z ? z : "city";
}

export interface AssetManifest {
  version: number;
  configured: boolean;
  assets: AssetEntry[];
}

const CACHE_KEY = "neura.assetManifest.v1";

let inflight: Promise<AssetManifest | null> | null = null;

async function loadManifest(): Promise<AssetManifest | null> {
  try {
    const res = await fetch(absoluteApiUrl("/api/assets/manifest"));
    if (!res.ok) throw new Error(`manifest ${res.status}`);
    const json = (await res.json()) as AssetManifest;
    // Persist the metadata (id → hash map) so an offline launch can still
    // resolve already-downloaded files by hash even though the presigned
    // urls inside are stale.
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(json));
    } catch {
      // storage unavailable — non-fatal
    }
    return json;
  } catch {
    // Offline / server down — fall back to the last manifest we saw.
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw) as AssetManifest;
    } catch {
      // ignore
    }
    return null;
  }
}

/**
 * Fetch the manifest, memoized for the session so avatar/model/texture
 * resolution all share one network round-trip. Pass `force` to bypass.
 */
export function getManifest(force = false): Promise<AssetManifest | null> {
  if (!inflight || force) inflight = loadManifest();
  return inflight;
}
