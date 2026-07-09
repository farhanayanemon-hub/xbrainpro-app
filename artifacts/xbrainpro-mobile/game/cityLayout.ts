/**
 * Deterministic layout data for the Neura City block. Everything is plain
 * data so the visual meshes and the collision volumes always agree, and so
 * user-supplied 3D models can later replace entries without touching logic.
 */

export interface BuildingDef {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  neon: string;
}

export interface Aabb {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const NEON = ["#ff5c8a", "#4dd6ff", "#b18cff", "#ffd166", "#63f5c2"];
const WALL = ["#232946", "#2b2d52", "#20304e", "#30284e", "#263251", "#2e2440"];

function b(
  i: number,
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
): BuildingDef {
  return { x, z, w, d, h, color: WALL[i % WALL.length], neon: NEON[i % NEON.length] };
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

export const TREES: { x: number; z: number }[] = [
  { x: 6, z: -6.5 },
  { x: -6, z: -6.5 },
  { x: 6.5, z: 6 },
  { x: -6.5, z: 6.5 },
  { x: 14, z: -5 },
  { x: -14, z: 5 },
  { x: 15, z: 6 },
  { x: -15, z: -5 },
];

export const LAMPS: { x: number; z: number }[] = [
  { x: 3.4, z: -3.4 },
  { x: -3.4, z: -3.4 },
  { x: 3.4, z: 3.4 },
  { x: -3.4, z: 3.4 },
  { x: 10, z: -3.4 },
  { x: -10, z: 3.4 },
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
