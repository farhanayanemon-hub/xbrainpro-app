import { ensureCached } from "@/game/assetCache";
import { assetZone, getManifest, type AssetEntry } from "@/game/assetManifest";
import { setResolvedAsset } from "@/game/assetResolver";

/**
 * Zone-scoped CDN asset loading — Free-Fire style. When the player enters a
 * zone we download only that zone's models + textures (fetched once, cached to
 * disk by content hash, skipped next time), instead of the whole catalog up
 * front. Avatars are global and fetched on demand when a player is chosen.
 *
 * Fully tolerant: if the manifest/CDN is unreachable every 3D component falls
 * back to its bundled asset, so this never blocks entry into a zone.
 */

/** Parallel download limit — keeps startup smooth on weak devices/networks. */
const CONCURRENCY = 6;

export type ResourceProgress = { done: number; total: number };

/** Model/texture assets that belong to a given zone. */
async function zoneAssets(zone: string): Promise<AssetEntry[]> {
  const manifest = await getManifest();
  return (manifest?.assets ?? []).filter(
    (a) =>
      (a.category === "model" || a.category === "texture") &&
      assetZone(a) === zone,
  );
}

async function fetchAll(
  required: AssetEntry[],
  onProgress?: (progress: ResourceProgress) => void,
): Promise<void> {
  const total = required.length;
  let done = 0;
  onProgress?.({ done, total });
  if (total === 0) return;

  const queue = [...required];
  async function worker(): Promise<void> {
    for (let entry = queue.shift(); entry; entry = queue.shift()) {
      try {
        const uri = await ensureCached(entry);
        setResolvedAsset(entry.id, uri);
      } catch {
        // Tolerated: the resolver falls back to the bundled asset.
      } finally {
        done += 1;
        onProgress?.({ done, total });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker()),
  );
}

/**
 * Download the assets for the spawn zone (default "city") with real progress —
 * this backs the "Downloading resources" bar shown before the world appears.
 */
export async function downloadResources(
  zone: string,
  onProgress: (progress: ResourceProgress) => void,
): Promise<void> {
  await fetchAll(await zoneAssets(zone), onProgress);
}

/**
 * Fetch + cache a zone's assets on demand, e.g. when stepping into a house
 * interior. No progress UI — it runs quietly and the resolver serves bundled
 * assets until the CDN copies land. No-op when the zone has no CDN assets.
 */
export async function ensureZoneCached(zone: string): Promise<void> {
  await fetchAll(await zoneAssets(zone));
}

/**
 * Fetch + cache a single avatar GLB on demand and register its resolved uri.
 * Called when the player selects an avatar so we don't download all nine up
 * front. No-op (falls back to bundled) if the avatar isn't in the manifest.
 */
export async function ensureAvatarCached(id: string): Promise<void> {
  try {
    const manifest = await getManifest();
    const entry = manifest?.assets.find(
      (a) => a.category === "avatar" && a.id === id,
    );
    if (!entry) return;
    const uri = await ensureCached(entry);
    setResolvedAsset(id, uri);
  } catch {
    // Tolerated: Avatar falls back to its bundled glb.
  }
}
