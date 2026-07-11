import { and, eq } from "drizzle-orm";
import { db, gameAssetsTable, type PlacedFurniture } from "@workspace/db";

/**
 * Built-in furniture the app ships with — always placeable, no upload needed.
 * Must stay in sync with the mobile catalog in game/furniture.ts. Admins can
 * add more furniture as GLB models in the "apartment" asset zone; those ids are
 * validated against the asset registry at save time.
 */
export const BUILTIN_FURNITURE = new Set<string>([
  "bed",
  "sofa",
  "armchair",
  "table",
  "rug",
  "plant",
  "lamp",
  "bookshelf",
  "tv",
]);

/**
 * Half-size of the square apartment room. Furniture is clamped to stay inside
 * the walls. Mirrors INTERIOR_HALF / INTERIOR_BOUND in the mobile worldMap.ts.
 */
const ROOM_BOUND = 3.9;

/** Hard cap on placed items so a modified client can't bloat a row. */
export const MAX_FURNITURE = 40;

/** A cosy default arrangement served to players who have never decorated. */
export const DEFAULT_LAYOUT: PlacedFurniture[] = [
  { uid: "start-bed", item: "bed", x: 0, z: -2.6, rotY: 0 },
  { uid: "start-rug", item: "rug", x: 0, z: 0.6, rotY: 0 },
  { uid: "start-lamp", item: "lamp", x: -3, z: -3, rotY: 0 },
  { uid: "start-plant", item: "plant", x: 3, z: -3, rotY: 0 },
];

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * The set of furniture ids a player is allowed to place: the built-ins plus
 * every enabled model uploaded to the "apartment" asset zone. Queried per save
 * so newly uploaded furniture is immediately usable without a server restart.
 */
async function allowedItemIds(): Promise<Set<string>> {
  const rows = await db
    .select({ id: gameAssetsTable.id, meta: gameAssetsTable.meta })
    .from(gameAssetsTable)
    .where(
      and(
        eq(gameAssetsTable.category, "model"),
        eq(gameAssetsTable.enabled, true),
      ),
    );
  const allowed = new Set(BUILTIN_FURNITURE);
  for (const r of rows) {
    const zone = (r.meta as Record<string, unknown> | null)?.zone;
    if (zone === "apartment") allowed.add(r.id);
  }
  return allowed;
}

/**
 * Validate + normalise a client-submitted layout: drop malformed entries and
 * any item id the player isn't allowed to place, clamp positions inside the
 * room, and cap the total count. Returns a clean array safe to persist.
 */
export async function sanitizeLayout(input: unknown): Promise<PlacedFurniture[]> {
  if (!Array.isArray(input)) return [];
  const allowed = await allowedItemIds();
  const out: PlacedFurniture[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (out.length >= MAX_FURNITURE) break;
    if (!raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const item = typeof r.item === "string" ? r.item : "";
    if (!allowed.has(item)) continue;
    if (!isFiniteNum(r.x) || !isFiniteNum(r.z) || !isFiniteNum(r.rotY)) continue;
    // Give each instance a stable, collision-free id even if the client sends
    // duplicates or junk — the client only needs it to be unique per layout.
    let uid = typeof r.uid === "string" && r.uid.length > 0 && r.uid.length <= 64
      ? r.uid
      : `f${out.length}`;
    if (seen.has(uid)) uid = `${uid}-${out.length}`;
    seen.add(uid);
    out.push({
      uid,
      item,
      x: clamp(r.x, -ROOM_BOUND, ROOM_BOUND),
      z: clamp(r.z, -ROOM_BOUND, ROOM_BOUND),
      rotY: r.rotY,
    });
  }
  return out;
}
