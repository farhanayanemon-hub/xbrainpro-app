import type { AssetEntry } from "@/game/assetManifest";

/**
 * Web has no persistent filesystem to manage — the browser's HTTP cache handles
 * persistence. But we still prefetch each asset so the "Downloading resources"
 * progress reflects real network work and the loaders hit a warm cache. The url
 * is content-hashed + immutable, so the browser reuses it on later visits.
 */
export async function ensureCached(entry: AssetEntry): Promise<string> {
  try {
    await fetch(entry.url, { cache: "force-cache" });
  } catch {
    // Non-fatal: the loader will fetch it directly (or fall back to bundled).
  }
  return entry.url;
}

export function clearAssetCache(): void {
  // no-op on web
}
