import * as FileSystem from "expo-file-system/legacy";

import type { AssetEntry } from "@/game/assetManifest";

/**
 * Native on-device asset cache (Free-Fire style): assets are downloaded from
 * the CDN once, stored under the app cache directory keyed by content hash,
 * and reused on every later launch. Returns a `file://` uri that R3F's native
 * loaders read directly.
 */
const DIR = `${FileSystem.cacheDirectory ?? ""}neura-assets/`;

function extFor(entry: AssetEntry): string {
  if (entry.mime === "image/jpeg") return "jpg";
  if (entry.mime === "image/png") return "png";
  return "glb";
}

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

/**
 * Ensure an asset is present on disk, downloading it if missing, and return a
 * local `file://` uri. The content hash is the filename, so an unchanged asset
 * is never re-downloaded and an admin replacement (new hash) downloads fresh.
 */
export async function ensureCached(entry: AssetEntry): Promise<string> {
  await ensureDir();
  const uri = `${DIR}${entry.hash}.${extFor(entry)}`;
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) return uri;
  const res = await FileSystem.downloadAsync(entry.url, uri);
  return res.uri;
}

/** Wipe the whole on-device asset cache (forces a fresh download next time). */
export function clearAssetCache(): void {
  void FileSystem.deleteAsync(DIR, { idempotent: true }).catch(() => {
    // non-fatal
  });
}
