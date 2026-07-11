import { avatarEntrySync } from "@/game/assetManifest";
import { assetUri } from "@/game/assetUri";
import { DEFAULT_AVATAR_ID } from "@/game/avatar";
import {
  MODEL_SOURCES,
  TEXTURE_SOURCES,
  type ModelId,
  type TextureId,
} from "@/game/models";

/**
 * Maps a logical asset id (model/texture/avatar) to its resolved uri once it's
 * been downloaded from the CDN — a `file://` path on native, an https url on
 * web. Populated by the resource loader; anything not yet resolved falls back
 * to the bundled asset so the world always renders, even offline or while the
 * download is still in flight.
 */
const resolved = new Map<string, string>();

export function setResolvedAsset(id: string, uri: string): void {
  resolved.set(id, uri);
}

export function hasResolvedAsset(id: string): boolean {
  return resolved.has(id);
}

/**
 * Resolve any asset id to a loadable uri: the on-device cached copy once it's
 * downloaded, otherwise the provided fallback (typically the manifest's
 * same-origin CDN url). Used for generic assets like the lobby "scene" room
 * that have no bundled counterpart.
 */
export function resolvedUri(id: string, fallback: string): string {
  return resolved.get(id) ?? fallback;
}

export function resolveModel(id: ModelId): string {
  return resolved.get(id) ?? assetUri(MODEL_SOURCES[id]);
}

export function resolveTexture(id: TextureId): string {
  return resolved.get(id) ?? assetUri(TEXTURE_SOURCES[id]);
}

/**
 * Resolve an avatar id to a loadable GLB uri. Order:
 *   1. a cached on-device copy (`file://`) once downloaded, else
 *   2. the manifest's same-origin CDN url (streamed + browser/disk cached).
 * Unknown ids fall back to the default avatar. Returns "" when the manifest
 * isn't available yet — callers render a placeholder body until it resolves.
 */
export function resolveAvatar(id: string): string {
  const cached = resolved.get(id);
  if (cached) return cached;
  const entry = avatarEntrySync(id) ?? avatarEntrySync(DEFAULT_AVATAR_ID);
  return entry?.url ?? "";
}
