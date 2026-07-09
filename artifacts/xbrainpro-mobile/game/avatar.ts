/**
 * Player avatar catalog + on-device persistence.
 *
 * All avatars are CC0 KayKit character packs (Adventurers + Skeletons),
 * stripped to the Idle / Walking_A / Running_A animation clips and
 * quantized, so the whole catalog stays under ~3MB.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AvatarDef {
  id: string;
  name: string;
  tagline: string;
  /** Accent color used on the picker card. */
  color: string;
  /** Metro asset module for the GLB. */
  src: number;
}

export const AVATARS: AvatarDef[] = [
  {
    id: "knight",
    name: "Knight",
    tagline: "Armored & loyal",
    color: "#8fb4ff",
    src: require("../assets/models/avatars/knight.glb"),
  },
  {
    id: "barbarian",
    name: "Barbarian",
    tagline: "Strong & fearless",
    color: "#ffb36b",
    src: require("../assets/models/avatars/barbarian.glb"),
  },
  {
    id: "mage",
    name: "Mage",
    tagline: "Master of spells",
    color: "#b78bff",
    src: require("../assets/models/avatars/mage.glb"),
  },
  {
    id: "rogue",
    name: "Rogue",
    tagline: "Quick & clever",
    color: "#7be0a2",
    src: require("../assets/models/avatars/rogue.glb"),
  },
  {
    id: "rogue_hooded",
    name: "Shadow",
    tagline: "Hidden in the hood",
    color: "#5fd4d0",
    src: require("../assets/models/avatars/rogue_hooded.glb"),
  },
  {
    id: "skeleton_warrior",
    name: "Bone Warrior",
    tagline: "Rattling & brave",
    color: "#e6e0c8",
    src: require("../assets/models/avatars/skeleton_warrior.glb"),
  },
  {
    id: "skeleton_mage",
    name: "Bone Mage",
    tagline: "Spooky sorcery",
    color: "#c9b8ff",
    src: require("../assets/models/avatars/skeleton_mage.glb"),
  },
  {
    id: "skeleton_rogue",
    name: "Bone Rogue",
    tagline: "Sneaky bones",
    color: "#9fd8b1",
    src: require("../assets/models/avatars/skeleton_rogue.glb"),
  },
  {
    id: "skeleton_minion",
    name: "Minion",
    tagline: "Small but mighty",
    color: "#f2a8c0",
    src: require("../assets/models/avatars/skeleton_minion.glb"),
  },
];

export const DEFAULT_AVATAR_ID = "knight";

export const AVATAR_MAP: Record<string, AvatarDef> = Object.fromEntries(
  AVATARS.map((a) => [a.id, a]),
);

const STORAGE_KEY = "neura.avatarId";

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
