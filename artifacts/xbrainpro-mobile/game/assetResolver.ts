import { assetUri } from "@/game/assetUri";
import { AVATAR_MAP, DEFAULT_AVATAR_ID } from "@/game/avatar";
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

export function resolveModel(id: ModelId): string {
  return resolved.get(id) ?? assetUri(MODEL_SOURCES[id]);
}

export function resolveTexture(id: TextureId): string {
  return resolved.get(id) ?? assetUri(TEXTURE_SOURCES[id]);
}

export function resolveAvatar(id: string): string {
  const cdn = resolved.get(id);
  if (cdn) return cdn;
  const def = AVATAR_MAP[id] ?? AVATAR_MAP[DEFAULT_AVATAR_ID];
  return assetUri(def.src);
}
