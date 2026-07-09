/**
 * Deterministic layout data for the Neura City block. Everything is plain
 * data so the visual meshes and the collision volumes always agree, and so
 * user-supplied 3D models can later replace entries without touching logic.
 */

import { BUILDING_MODELS, type ModelId } from "@/game/models";

export interface BuildingDef {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  /** Which GLB model renders this lot. */
  model: ModelId;
  /** Native (unscaled) height of that model, used to compute Y scale. */
  nativeH: number;
  /** Yaw so the model's front faces the nearest road. */
  rotY: number;
}

export interface Aabb {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const ROAD_HALF = 2.5;

/** Face the nearest road: vertical road runs along x=0, horizontal along z=0. */
function faceRoad(x: number, z: number): number {
  const distV = Math.abs(x) - ROAD_HALF;
  const distH = Math.abs(z) - ROAD_HALF;
  if (distV < distH) {
    // face toward the vertical road (point front along -x when x > 0)
    return x > 0 ? -Math.PI / 2 : Math.PI / 2;
  }
  // face toward the horizontal road (point front along -z when z > 0)
  return z > 0 ? Math.PI : 0;
}

function b(
  i: number,
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
): BuildingDef {
  const m = BUILDING_MODELS[i % BUILDING_MODELS.length];
  return { x, z, w, d, h, model: m.id, nativeH: m.nativeH, rotY: faceRoad(x, z) };
}

/** Roads run along x = 0 and z = 0 (width 5). Plaza sits at the crossing. */
export const BUILDINGS: BuildingDef[] = [
  // north-east quarter
  b(0, 10, -11, 5, 5, 7),
  b(1, 17, -9, 5, 6, 10),
  b(2, 24, -12, 5, 5, 6),
  b(3, 11, -19, 6, 5, 12),
  b(4, 20, -20, 6, 6, 8),
  // north-west quarter
  b(5, -10, -12, 5, 5, 9),
  b(6, -17, -10, 5, 5, 6),
  b(7, -24, -14, 5, 6, 11),
  b(8, -12, -20, 6, 5, 7),
  b(9, -21, -21, 5, 5, 9),
  // south-west quarter
  b(10, -11, 12, 5, 5, 8),
  b(11, -19, 11, 6, 5, 6),
  b(12, -13, 20, 5, 6, 10),
  b(13, -23, 19, 5, 5, 7),
  // south-east quarter
  b(14, 11, 12, 5, 5, 6),
  b(15, 18, 11, 5, 6, 9),
  b(16, 12, 20, 6, 5, 11),
  b(17, 21, 19, 5, 5, 7),
];

export interface TreeDef {
  x: number;
  z: number;
  model: ModelId;
  scale: number;
}

export const TREES: TreeDef[] = [
  { x: 6, z: -6.5, model: "treeA", scale: 2.4 },
  { x: -6, z: -6.5, model: "treeB", scale: 2.2 },
  { x: 6.5, z: 6, model: "treeB", scale: 2.5 },
  { x: -6.5, z: 6.5, model: "treeA", scale: 2.3 },
  { x: 14, z: -5, model: "treeA", scale: 2.6 },
  { x: -14, z: 5, model: "treeB", scale: 2.4 },
  { x: 15, z: 6, model: "treeB", scale: 2.2 },
  { x: -15, z: -5, model: "treeA", scale: 2.5 },
  // leafy clusters in the block corners
  { x: 24, z: 25, model: "treeCluster", scale: 3 },
  { x: -25, z: 24, model: "treeCluster", scale: 3.2 },
  { x: -24, z: -26, model: "treeCluster", scale: 3 },
  { x: 25, z: -25, model: "treeCluster", scale: 3.4 },
];

export const LAMPS: { x: number; z: number; rotY: number }[] = [
  { x: 3.4, z: -3.4, rotY: Math.PI / 2 },
  { x: -3.4, z: -3.4, rotY: -Math.PI / 2 },
  { x: 3.4, z: 3.4, rotY: Math.PI / 2 },
  { x: -3.4, z: 3.4, rotY: -Math.PI / 2 },
  { x: 10, z: -3.4, rotY: 0 },
  { x: -10, z: 3.4, rotY: Math.PI },
  { x: 3.4, z: -14, rotY: Math.PI / 2 },
  { x: -3.4, z: 14, rotY: -Math.PI / 2 },
];

export interface PropDef {
  model: ModelId;
  x: number;
  z: number;
  rotY: number;
  scale: number;
}

/** Decorative props (no collision). */
export const PROPS: PropDef[] = [
  { model: "bench", x: 5.2, z: -2.2, rotY: -Math.PI / 2, scale: 4 },
  { model: "bench", x: -5.2, z: 2.2, rotY: Math.PI / 2, scale: 4 },
  { model: "bench", x: 2.2, z: 5.4, rotY: Math.PI, scale: 4 },
  { model: "trash", x: 4.6, z: -3.5, rotY: 0, scale: 4 },
  { model: "trash", x: -4.6, z: 3.5, rotY: 0, scale: 4 },
  { model: "firehydrant", x: 3.5, z: 9.5, rotY: Math.PI / 2, scale: 3.5 },
  { model: "firehydrant", x: -3.5, z: -9.5, rotY: -Math.PI / 2, scale: 3.5 },
  { model: "dumpster", x: 7.4, z: -8.6, rotY: 0.4, scale: 3.2 },
  { model: "dumpster", x: -7.6, z: 8.8, rotY: -2.6, scale: 3.2 },
  { model: "trafficlight", x: 3.2, z: -10.5, rotY: Math.PI / 2, scale: 3.4 },
  { model: "trafficlight", x: -3.2, z: 10.5, rotY: -Math.PI / 2, scale: 3.4 },
  { model: "bush", x: 5.6, z: -9.2, rotY: 1.3, scale: 3.4 },
  { model: "bush", x: -5.8, z: 9.4, rotY: 2.1, scale: 3.4 },
  { model: "bush", x: 9.2, z: 5.6, rotY: 0.4, scale: 3 },
  { model: "bush", x: -9.4, z: -5.8, rotY: 2.8, scale: 3 },
];

/** Rooftop water towers (purely visual, sit on top of two buildings). */
export const ROOF_PROPS: PropDef[] = [
  { model: "watertower", x: 11, z: -19, rotY: 0.6, scale: 3 },
  { model: "watertower", x: -13, z: 20, rotY: -1.1, scale: 2.6 },
];
/** Y positions (= building heights) for ROOF_PROPS, index-aligned. */
export const ROOF_PROP_Y = [12, 10];

export interface CarDef extends PropDef {
  /** Collision half-extents in world units (x, z). */
  halfW: number;
  halfD: number;
}

/** Parked cars on the road edges (players collide with these). */
export const CARS: CarDef[] = [
  { model: "carSedan", x: 1.55, z: 14, rotY: 0, scale: 4, halfW: 0.95, halfD: 2 },
  { model: "carTaxi", x: -1.55, z: -13, rotY: Math.PI, scale: 4, halfW: 0.95, halfD: 2 },
  { model: "carHatchback", x: 15, z: 1.55, rotY: Math.PI / 2, scale: 4, halfW: 1.8, halfD: 0.95 },
];

/** Fountain at plaza center. */
export const FOUNTAIN = { x: 0, z: -0.5, radius: 1.8 };

/** Rex's noodle stall on the market street (west road). */
export const STALL = { x: -10.5, z: 3.2, w: 2.6, d: 1.6, h: 2.2 };

export const WORLD_BOUND = 27;

function expand(a: Aabb, r: number): Aabb {
  return { minX: a.minX - r, maxX: a.maxX + r, minZ: a.minZ - r, maxZ: a.maxZ + r };
}

const PLAYER_RADIUS = 0.55;

export const COLLIDERS: Aabb[] = [
  ...BUILDINGS.map((bd) =>
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
  ...CARS.map((c) =>
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
  expand(
    {
      minX: FOUNTAIN.x - FOUNTAIN.radius,
      maxX: FOUNTAIN.x + FOUNTAIN.radius,
      minZ: FOUNTAIN.z - FOUNTAIN.radius,
      maxZ: FOUNTAIN.z + FOUNTAIN.radius,
    },
    PLAYER_RADIUS - 0.15,
  ),
  expand(
    {
      minX: STALL.x - STALL.w / 2,
      maxX: STALL.x + STALL.w / 2,
      minZ: STALL.z - STALL.d / 2,
      maxZ: STALL.z + STALL.d / 2,
    },
    PLAYER_RADIUS,
  ),
];
