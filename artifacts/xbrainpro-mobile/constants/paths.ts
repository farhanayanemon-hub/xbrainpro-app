import type { Ionicons } from "@expo/vector-icons";

type IoniconName = keyof typeof Ionicons.glyphMap;

/**
 * Icon per transformation path key. Accent colors come from the API (Path.accent),
 * these icons are a client-side mapping so cards look native.
 */
export const PATH_ICONS: Record<string, IoniconName> = {
  millionaire: "trending-up",
  business: "briefcase",
  heartbreak: "heart",
  happiness: "leaf",
  superhuman: "flash",
  confidence: "people",
  focus: "eye",
};

export function pathIcon(key: string): IoniconName {
  return PATH_ICONS[key] ?? "sparkles";
}
