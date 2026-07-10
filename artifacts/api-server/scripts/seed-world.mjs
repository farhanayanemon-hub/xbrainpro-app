/**
 * Seeds the initial Neura City world map into the world_objects table.
 * Mirrors the layout previously hardcoded in the mobile app's cityLayout.ts.
 *
 * Usage:
 *   node scripts/seed-world.mjs            # uses DATABASE_URL
 *   DATABASE_URL="$SUPABASE_DB_URL" node scripts/seed-world.mjs
 *   node scripts/seed-world.mjs --force    # reseed even if objects exist
 *
 * Idempotent: skips when world_objects already has rows (unless --force,
 * which wipes and reseeds).
 */
import { createRequire } from "node:module";

// Resolve pg from the db workspace package so this script needs no own deps.
const require = createRequire(
  new URL("../../../lib/db/package.json", import.meta.url),
);
const { Pool } = require("pg");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL must be set");
  process.exit(1);
}
const force = process.argv.includes("--force");

const BUILDING_MODELS = [
  { id: "buildingA", nativeH: 1.65 },
  { id: "buildingD", nativeH: 2.97 },
  { id: "buildingE", nativeH: 2.35 },
  { id: "buildingF", nativeH: 2.35 },
  { id: "buildingG", nativeH: 2.98 },
  { id: "buildingH", nativeH: 3.05 },
];

const ROAD_HALF = 2.5;
function faceRoad(x, z) {
  const distV = Math.abs(x) - ROAD_HALF;
  const distH = Math.abs(z) - ROAD_HALF;
  if (distV < distH) return x > 0 ? -Math.PI / 2 : Math.PI / 2;
  return z > 0 ? Math.PI : 0;
}

function b(i, x, z, w, d, h) {
  const m = BUILDING_MODELS[i % BUILDING_MODELS.length];
  return { x, z, w, d, h, model: m.id, nativeH: m.nativeH, rotY: faceRoad(x, z) };
}

const buildings = [
  b(0, 10, -11, 5, 5, 7),
  b(1, 17, -9, 5, 6, 10),
  b(2, 24, -12, 5, 5, 6),
  b(3, 11, -19, 6, 5, 12),
  b(4, 20, -20, 6, 6, 8),
  b(5, -10, -12, 5, 5, 9),
  b(6, -17, -10, 5, 5, 6),
  b(7, -24, -14, 5, 6, 11),
  b(8, -12, -20, 6, 5, 7),
  b(9, -21, -21, 5, 5, 9),
  b(10, -11, 12, 5, 5, 8),
  b(11, -19, 11, 6, 5, 6),
  b(12, -13, 20, 5, 6, 10),
  b(13, -23, 19, 5, 5, 7),
  b(14, 11, 12, 5, 5, 6),
  b(15, 18, 11, 5, 6, 9),
  b(16, 12, 20, 6, 5, 11),
  b(17, 21, 19, 5, 5, 7),
];

const treesRaw = [
  { x: 6, z: -6.5, model: "treeA", scale: 2.4 },
  { x: -6, z: -6.5, model: "treeB", scale: 2.2 },
  { x: 6.5, z: 6, model: "treeB", scale: 2.5 },
  { x: -6.5, z: 6.5, model: "treeA", scale: 2.3 },
  { x: 14, z: -5, model: "treeA", scale: 2.6 },
  { x: -14, z: 5, model: "treeB", scale: 2.4 },
  { x: 15, z: 6, model: "treeB", scale: 2.2 },
  { x: -15, z: -5, model: "treeA", scale: 2.5 },
  { x: 24, z: 25, model: "treeCluster", scale: 3 },
  { x: -25, z: 24, model: "treeCluster", scale: 3.2 },
  { x: -24, z: -26, model: "treeCluster", scale: 3 },
  { x: 25, z: -25, model: "treeCluster", scale: 3.4 },
];
const trees = treesRaw.map((t, i) => ({ ...t, rotY: (i * 73) % 6 }));

const lamps = [
  { x: 3.4, z: -3.4, rotY: Math.PI / 2 },
  { x: -3.4, z: -3.4, rotY: -Math.PI / 2 },
  { x: 3.4, z: 3.4, rotY: Math.PI / 2 },
  { x: -3.4, z: 3.4, rotY: -Math.PI / 2 },
  { x: 10, z: -3.4, rotY: 0 },
  { x: -10, z: 3.4, rotY: Math.PI },
  { x: 3.4, z: -14, rotY: Math.PI / 2 },
  { x: -3.4, z: 14, rotY: -Math.PI / 2 },
].map((l) => ({ ...l, model: "streetlight", scale: 3.5 }));

const props = [
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

const roofProps = [
  { model: "watertower", x: 11, y: 12, z: -19, rotY: 0.6, scale: 3 },
  { model: "watertower", x: -13, y: 10, z: 20, rotY: -1.1, scale: 2.6 },
];

const cars = [
  { model: "carSedan", x: 1.55, z: 14, rotY: 0, scale: 4, halfW: 0.95, halfD: 2 },
  { model: "carTaxi", x: -1.55, z: -13, rotY: Math.PI, scale: 4, halfW: 0.95, halfD: 2 },
  { model: "carHatchback", x: 15, z: 1.55, rotY: Math.PI / 2, scale: 4, halfW: 1.8, halfD: 0.95 },
];

const fountain = { x: 0, z: -0.5, radius: 1.8 };
const stall = { x: -10.5, z: 3.2, w: 2.6, d: 1.6, h: 2.2 };

// Residential ring around the city core. Order = plot index (must match the
// mobile app's cityLayout.ts HOUSES and NUM_HOUSE_PLOTS on the server).
const HOUSE_W = 6;
const HOUSE_D = 6;
const HOUSE_H = 4;
const houses = [
  { x: -22, z: -30, rotY: 0 },
  { x: -12, z: -30, rotY: 0 },
  { x: 12, z: -30, rotY: 0 },
  { x: 22, z: -30, rotY: 0 },
  { x: -22, z: 30, rotY: Math.PI },
  { x: -12, z: 30, rotY: Math.PI },
  { x: 12, z: 30, rotY: Math.PI },
  { x: 22, z: 30, rotY: Math.PI },
].map((h, i) => ({
  plot: i,
  x: h.x,
  z: h.z,
  w: HOUSE_W,
  d: HOUSE_D,
  h: HOUSE_H,
  rotY: h.rotY,
}));

const npcs = [
  {
    id: "lumi",
    name: "Lumi",
    title: "AI Citizen • Plaza District",
    color: "#ffb3d9",
    accent: "#ff5c8a",
    x: 3.2,
    z: -4.2,
    greeting:
      "Hey! First time in the Plaza? I can show you around ✦ It gets pretty lively here at night.",
    suggestions: ["Show me around", "Who lives here?", "What is Neura City?"],
    systemPrompt:
      "You are Lumi ✦, a cheerful young AI citizen who works as a guide of the Plaza district in Neura City. You are warm, playful, and curious about visitors, and you occasionally use light emoji or sparkles ✦. You know the city well: the Plaza with its fountain and neon cafes, the market street, and the harbor viewpoint.",
  },
  {
    id: "rex",
    name: "Rex",
    title: "Street Food Vendor • Market Street",
    color: "#9adbb0",
    accent: "#ffd166",
    x: -9.2,
    z: 4.6,
    greeting:
      "Hmph. You look hungry. Noodles are hot, neon's too bright. What do you want?",
    suggestions: ["What's cooking?", "Tell me about the market", "Bye!"],
    systemPrompt:
      "You are Rex, a gruff old street-food vendor and ex-mechanic near the market street in Neura City. You have dry humor and speak in short sentences, but you are secretly kind. You complain about the noisy neon signs, and you love talking about your noodle stall and old machines.",
  },
];

const objects = [
  ...buildings.map((data) => ({ kind: "building", data })),
  ...trees.map((data) => ({ kind: "tree", data })),
  ...lamps.map((data) => ({ kind: "lamp", data })),
  ...props.map((data) => ({ kind: "prop", data })),
  ...roofProps.map((data) => ({ kind: "roofProp", data })),
  ...cars.map((data) => ({ kind: "car", data })),
  { kind: "fountain", data: fountain },
  { kind: "stall", data: stall },
  ...houses.map((data) => ({ kind: "house", data })),
  ...npcs.map((data) => ({ kind: "npc", data })),
];

const pool = new Pool({ connectionString: url });
try {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM world_objects");
  if (rows[0].n > 0 && !force) {
    console.log(`world_objects already has ${rows[0].n} rows — skipping (use --force to reseed)`);
    process.exit(0);
  }
  if (force) await pool.query("DELETE FROM world_objects");

  for (const o of objects) {
    await pool.query(
      "INSERT INTO world_objects (kind, data) VALUES ($1, $2)",
      [o.kind, JSON.stringify(o.data)],
    );
  }
  await pool.query(
    `INSERT INTO app_settings (key, value) VALUES ('world_map_version', '1')
     ON CONFLICT (key) DO UPDATE SET value = (app_settings.value::int + 1)::text, updated_at = now()`,
  );
  console.log(`Seeded ${objects.length} world objects`);
} finally {
  await pool.end();
}
