/**
 * Player avatar catalog + on-device persistence.
 *
 * Avatars are realistic rigged humans (male "Ryan" + female "Maya") streamed
 * on demand from the Cloudflare CDN and cached on-device — nothing large is
 * bundled in the app. Each GLB carries Idle / Walk / Run clips.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export type AvatarGender = "male" | "female";

export interface AvatarDef {
  id: string;
  name: string;
  tagline: string;
  gender: AvatarGender;
  /** Accent color used on the picker card. */
  color: string;
}

export const AVATARS: AvatarDef[] = [
  {
    id: "ryan",
    name: "Ryan",
    tagline: "Street-smart & bold",
    gender: "male",
    color: "#5b8cff",
  },
  {
    id: "maya",
    name: "Maya",
    tagline: "Bright & fearless",
    gender: "female",
    color: "#ff6fae",
  },
];

export const DEFAULT_AVATAR_ID = "ryan";

export const AVATAR_MAP: Record<string, AvatarDef> = Object.fromEntries(
  AVATARS.map((a) => [a.id, a]),
);

/** Default avatar id for a chosen gender. */
export const GENDER_AVATAR: Record<AvatarGender, string> = {
  male: "ryan",
  female: "maya",
};

const STORAGE_KEY = "neura.avatarId";
const OWNED_KEY = "neura.ownedAvatars";

/** Load the persisted avatar choice; falls back to the default. */
export async function loadAvatarId(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && AVATAR_MAP[stored]) return stored;
  } catch {
    // storage unavailable — use default
  }
  return DEFAULT_AVATAR_ID;
}

/** Persist the avatar choice on-device (survives app restarts). */
export async function saveAvatarId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, id);
  } catch {
    // non-fatal: choice still applies for this session
  }
}

/**
 * Load the set of avatar looks the player has unlocked in the Store. The
 * currently-equipped look is always implicitly owned, so callers merge it in;
 * this returns only the explicitly-unlocked ids that still exist in the
 * catalog. Unknown/removed ids are dropped.
 */
export async function loadOwnedAvatarIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(OWNED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (x): x is string => typeof x === "string" && !!AVATAR_MAP[x],
        );
      }
    }
  } catch {
    // storage unavailable / corrupt — treat as nothing unlocked yet
  }
  return [];
}

/**
 * Unlock a look and persist it to the owned set. Returns the updated list of
 * owned ids (deduped). Unknown ids are ignored.
 */
export async function unlockAvatar(id: string): Promise<string[]> {
  const owned = new Set(await loadOwnedAvatarIds());
  if (AVATAR_MAP[id]) owned.add(id);
  const list = [...owned];
  try {
    await AsyncStorage.setItem(OWNED_KEY, JSON.stringify(list));
  } catch {
    // non-fatal: unlock still applies for this session
  }
  return list;
}
