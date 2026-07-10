import type { AssetEntry } from "@/game/assetManifest";

/**
 * Web has no persistent filesystem to manage — the browser's HTTP cache already
 * handles caching, so we hand the presigned CDN url straight to the loaders.
 */
export async function ensureCached(entry: AssetEntry): Promise<string> {
  return entry.url;
}

export function clearAssetCache(): void {
  // no-op on web
}
