import { ensureCached } from "@/game/assetCache";
import { getManifest, type AssetEntry } from "@/game/assetManifest";
import { setResolvedAsset } from "@/game/assetResolver";

/**
 * Downloads the world's CDN assets on entry — Free-Fire style: fetched once,
 * cached to disk by content hash, skipped next time. Models + textures (the
 * bulk of the scene) are fetched up front so the loading bar reflects real
 * work; avatars are fetched on demand when a player is chosen.
 *
 * Fully tolerant: if the manifest/CDN is unreachable every 3D component falls
 * back to its bundled asset, so this never blocks entry into the city.
 */

/** Parallel download limit — keeps startup smooth on weak devices/networks. */
const CONCURRENCY = 6;

export type ResourceProgress = { done: number; total: number };

export async function downloadResources(
  onProgress: (progress: ResourceProgress) => void,
): Promise<void> {
  const manifest = await getManifest();
  const required: AssetEntry[] = (manifest?.assets ?? []).filter(
    (a) => a.category === "model" || a.category === "texture",
  );
  const total = required.length;
  let done = 0;
  onProgress({ done, total });
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
        onProgress({ done, total });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker()),
  );
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
