import { Asset } from "expo-asset";

import { AVATARS } from "@/game/avatar";
import { MODEL_SOURCES, TEXTURE_SOURCES } from "@/game/models";

/**
 * Every bundled 3D/texture asset the world needs. Downloading these up front
 * (into the platform asset cache) lets the loading screen show real progress
 * like a game "downloading resources" step, and makes the scene pop in fast
 * because drei's loaders hit warm caches.
 */
const RESOURCE_MODULES: number[] = [
  ...new Set<number>([
    ...(Object.values(MODEL_SOURCES) as number[]),
    ...(Object.values(TEXTURE_SOURCES) as number[]),
    ...AVATARS.map((a) => a.src),
  ]),
];

/** Parallel download limit — keeps startup smooth on weak devices/networks. */
const CONCURRENCY = 6;

export type ResourceProgress = { done: number; total: number };

/**
 * Download all world resources, reporting progress after each asset.
 * Individual failures are tolerated (the scene loaders will retry on demand),
 * so this never throws and never blocks entry into the city.
 */
export async function downloadResources(
  onProgress: (progress: ResourceProgress) => void,
): Promise<void> {
  const queue = [...RESOURCE_MODULES];
  const total = queue.length;
  let done = 0;
  onProgress({ done, total });

  async function worker(): Promise<void> {
    for (let mod = queue.shift(); mod !== undefined; mod = queue.shift()) {
      try {
        await Asset.fromModule(mod).downloadAsync();
      } catch {
        // Tolerated: drei loaders fetch on demand as a fallback.
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
