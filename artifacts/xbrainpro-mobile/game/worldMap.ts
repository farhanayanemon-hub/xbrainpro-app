/**
 * Server-driven world map for Neura City.
 *
 * The layout lives in the api-server database and is fetched on launch, so
 * new buildings, props and NPCs can appear without an app update. The last
 * good map is cached in AsyncStorage; the bundled layout in cityLayout.ts is
 * the offline/first-launch fallback. Objects referencing model ids that this
 * app build does not bundle are skipped gracefully.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getWorldMap, type WorldMap } from "@workspace/api-client-react";

import {
  BUILDINGS,
  CARS,
  FOUNTAIN,
  LAMPS,
  PROPS,
  ROOF_PROP_Y,
  ROOF_PROPS,
  STALL,
  TREES,
  WORLD_BOUND,
  type Aabb,
  type BuildingDef,
  type CarDef,
  type PropDef,
} from "@/game/cityLayout";
import { MODEL_SOURCES, type ModelId } from "@/game/models";
import { NPCS, type NpcDef } from "@/game/npcs";

const CACHE_KEY = "neura.worldMap";
const PLAYER_RADIUS = 0.55;

export interface LampDef {
  x: number;
  z: number;
  rotY: number;
  model: ModelId;
  scale: number;
}

export interface RoofPropDef extends PropDef {
  y: number;
}

export interface FountainDef {
  x: number;
  z: number;
  radius: number;
}

export interface StallDef {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
}

export interface ParsedWorldMap {
  version: number;
  buildings: BuildingDef[];
  trees: (PropDef & { scale: number })[];
  lamps: LampDef[];
  props: PropDef[];
  roofProps: RoofPropDef[];
  cars: CarDef[];
  fountains: FountainDef[];
  stalls: StallDef[];
  npcs: NpcDef[];
}

export const DEFAULT_MAP: ParsedWorldMap = {
  version: 0,
  buildings: BUILDINGS,
  trees: TREES.map((t, i) => ({ ...t, rotY: (i * 73) % 6 })),
  lamps: LAMPS.map((l) => ({ ...l, model: "streetlight" as ModelId, scale: 3.5 })),
  props: PROPS,
  roofProps: ROOF_PROPS.map((p, i) => ({ ...p, y: ROOF_PROP_Y[i] ?? 0 })),
  cars: CARS,
  fountains: [FOUNTAIN],
  stalls: [STALL],
  npcs: NPCS,
};

// ---------------------------------------------------------------------------
// Parsing (tolerant: invalid objects are skipped, never crash the scene)
// ---------------------------------------------------------------------------

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function modelId(v: unknown): ModelId | null {
  const s = str(v);
  return s && s in MODEL_SOURCES ? (s as ModelId) : null;
}

type Raw = Record<string, unknown>;

function parseBuilding(d: Raw): BuildingDef | null {
  const x = num(d.x), z = num(d.z), w = num(d.w), dd = num(d.d), h = num(d.h);
  const nativeH = num(d.nativeH), rotY = num(d.rotY), model = modelId(d.model);
  if (x === null || z === null || w === null || dd === null || h === null) return null;
  if (nativeH === null || nativeH <= 0 || rotY === null || !model) return null;
  return { x, z, w, d: dd, h, model, nativeH, rotY };
}

function parseProp(d: Raw): PropDef | null {
  const x = num(d.x), z = num(d.z), rotY = num(d.rotY), scale = num(d.scale);
  const model = modelId(d.model);
  if (x === null || z === null || rotY === null || scale === null || !model) return null;
  return { model, x, z, rotY, scale };
}

function parseTree(d: Raw): (PropDef & { scale: number }) | null {
  const x = num(d.x), z = num(d.z), scale = num(d.scale);
  const model = modelId(d.model);
  if (x === null || z === null || scale === null || !model) return null;
  return { model, x, z, rotY: num(d.rotY) ?? 0, scale };
}

function parseLamp(d: Raw): LampDef | null {
  const x = num(d.x), z = num(d.z), rotY = num(d.rotY);
  if (x === null || z === null || rotY === null) return null;
  return {
    x,
    z,
    rotY,
    model: modelId(d.model) ?? ("streetlight" as ModelId),
    scale: num(d.scale) ?? 3.5,
  };
}

function parseRoofProp(d: Raw): RoofPropDef | null {
  const base = parseProp(d);
  const y = num(d.y);
  if (!base || y === null) return null;
  return { ...base, y };
}

function parseCar(d: Raw): CarDef | null {
  const base = parseProp(d);
  const halfW = num(d.halfW), halfD = num(d.halfD);
  if (!base || halfW === null || halfD === null) return null;
  return { ...base, halfW, halfD };
}

function parseFountain(d: Raw): FountainDef | null {
  const x = num(d.x), z = num(d.z), radius = num(d.radius);
  if (x === null || z === null || radius === null) return null;
  return { x, z, radius };
}

function parseStall(d: Raw): StallDef | null {
  const x = num(d.x), z = num(d.z), w = num(d.w), dd = num(d.d), h = num(d.h);
  if (x === null || z === null || w === null || dd === null || h === null) return null;
  return { x, z, w, d: dd, h };
}

function parseNpc(d: Raw): NpcDef | null {
  const id = str(d.id), name = str(d.name), x = num(d.x), z = num(d.z);
  if (!id || !name || x === null || z === null) return null;
  return {
    id,
    name,
    title: str(d.title) ?? "",
    color: str(d.color) ?? "#ffb3d9",
    accent: str(d.accent) ?? "#ff5c8a",
    x,
    z,
    greeting: str(d.greeting) ?? `Hi, I'm ${name}!`,
    suggestions: Array.isArray(d.suggestions)
      ? d.suggestions.filter((s): s is string => typeof s === "string").slice(0, 4)
      : [],
  };
}

export function parseWorldMap(raw: WorldMap): ParsedWorldMap {
  const map: ParsedWorldMap = {
    version: raw.version,
    buildings: [],
    trees: [],
    lamps: [],
    props: [],
    roofProps: [],
    cars: [],
    fountains: [],
    stalls: [],
    npcs: [],
  };

  for (const obj of raw.objects) {
    const d = (obj.data ?? {}) as Raw;
    switch (obj.kind) {
      case "building": {
        const v = parseBuilding(d);
        if (v) map.buildings.push(v);
        break;
      }
      case "tree": {
        const v = parseTree(d);
        if (v) map.trees.push(v);
        break;
      }
      case "lamp": {
        const v = parseLamp(d);
        if (v) map.lamps.push(v);
        break;
      }
      case "prop": {
        const v = parseProp(d);
        if (v) map.props.push(v);
        break;
      }
      case "roofProp": {
        const v = parseRoofProp(d);
        if (v) map.roofProps.push(v);
        break;
      }
      case "car": {
        const v = parseCar(d);
        if (v) map.cars.push(v);
        break;
      }
      case "fountain": {
        const v = parseFountain(d);
        if (v) map.fountains.push(v);
        break;
      }
      case "stall": {
        const v = parseStall(d);
        if (v) map.stalls.push(v);
        break;
      }
      case "npc": {
        const v = parseNpc(d);
        if (v) map.npcs.push(v);
        break;
      }
      default:
        break; // unknown kind from a newer server — ignore
    }
  }

  // A map without any buildings is almost certainly corrupt — keep defaults.
  if (map.buildings.length === 0) return DEFAULT_MAP;
  return map;
}

// ---------------------------------------------------------------------------
// Collision volumes derived from the map (mirrors the old static COLLIDERS)
// ---------------------------------------------------------------------------

function expand(a: Aabb, r: number): Aabb {
  return { minX: a.minX - r, maxX: a.maxX + r, minZ: a.minZ - r, maxZ: a.maxZ + r };
}

export function deriveColliders(map: ParsedWorldMap): Aabb[] {
  return [
    ...map.buildings.map((bd) =>
      expand(
        {
          minX: bd.x - bd.w / 2,
          maxX: bd.x + bd.w / 2,
          minZ: bd.z - bd.d / 2,
          maxZ: bd.z + bd.d / 2,
        },
        PLAYER_RADIUS,
      ),
    ),
    ...map.cars.map((c) =>
      expand(
        {
          minX: c.x - c.halfW,
          maxX: c.x + c.halfW,
          minZ: c.z - c.halfD,
          maxZ: c.z + c.halfD,
        },
        PLAYER_RADIUS - 0.15,
      ),
    ),
    ...map.fountains.map((f) =>
      expand(
        {
          minX: f.x - f.radius,
          maxX: f.x + f.radius,
          minZ: f.z - f.radius,
          maxZ: f.z + f.radius,
        },
        PLAYER_RADIUS - 0.15,
      ),
    ),
    ...map.stalls.map((s) =>
      expand(
        {
          minX: s.x - s.w / 2,
          maxX: s.x + s.w / 2,
          minZ: s.z - s.d / 2,
          maxZ: s.z + s.d / 2,
        },
        PLAYER_RADIUS,
      ),
    ),
  ];
}

// ---------------------------------------------------------------------------
// Mutable world state read by the 60fps game loop (no React re-renders)
// ---------------------------------------------------------------------------

export const world = {
  map: DEFAULT_MAP,
  colliders: deriveColliders(DEFAULT_MAP),
  bound: WORLD_BOUND,
};

export function setActiveWorldMap(map: ParsedWorldMap): void {
  world.map = map;
  world.colliders = deriveColliders(map);
}

// ---------------------------------------------------------------------------
// Loading: cache first, then network (ETag avoids re-downloading)
// ---------------------------------------------------------------------------

async function readCache(): Promise<ParsedWorldMap | null> {
  try {
    const rawJson = await AsyncStorage.getItem(CACHE_KEY);
    if (!rawJson) return null;
    const raw = JSON.parse(rawJson) as WorldMap;
    if (typeof raw?.version !== "number" || !Array.isArray(raw?.objects)) return null;
    return parseWorldMap(raw);
  } catch {
    return null;
  }
}

async function writeCache(raw: WorldMap): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(raw));
  } catch {
    // cache write failure is non-fatal
  }
}

function isNotModified(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status: unknown }).status === 304
  );
}

/**
 * Resolve the freshest available world map: cached copy immediately if the
 * server is unreachable, otherwise the server's copy (skipping the download
 * entirely via ETag when the cached version is still current).
 */
export async function loadWorldMap(): Promise<ParsedWorldMap> {
  const cached = await readCache();

  try {
    const raw = await getWorldMap(
      cached
        ? { headers: { "If-None-Match": `W/"v${cached.version}"` } }
        : undefined,
    );
    if (raw && typeof raw.version === "number" && Array.isArray(raw.objects)) {
      void writeCache(raw);
      return parseWorldMap(raw);
    }
    return cached ?? DEFAULT_MAP;
  } catch (err) {
    if (isNotModified(err) && cached) return cached;
    return cached ?? DEFAULT_MAP;
  }
}
