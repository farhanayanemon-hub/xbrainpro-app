import { Asset } from "expo-asset";

/**
 * Web: Metro asset modules resolve to registry IDs (numbers), which THREE's
 * loaders can't fetch ("Could not load 512"). Resolve them to real URLs via
 * expo-asset before handing them to drei/three.
 */
export function assetUri(mod: number | string): string {
  if (typeof mod === "string") return mod;
  return Asset.fromModule(mod).uri;
}
