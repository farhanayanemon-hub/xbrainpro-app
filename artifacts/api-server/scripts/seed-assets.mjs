/**
 * One-time (idempotent) migration: upload the currently-bundled Neura City
 * assets to Cloudflare R2 and populate the `game_assets` registry so the
 * manifest endpoint can serve them. Safe to re-run — it upserts by id and
 * skips uploading when the content hash already matches.
 *
 * Run:  node artifacts/api-server/scripts/seed-assets.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE = path.resolve(__dirname, "../../xbrainpro-mobile/assets");

const acct = process.env.CLOUDFLARE_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET_NAME;
if (!acct || !bucket || !process.env.R2_ACCESS_KEY_ID) {
  console.error("Missing R2 secrets. Aborting.");
  process.exit(1);
}
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${acct}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const EXT_MIME = { glb: "model/gltf-binary", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
const ext = (f) => (/\.([a-z0-9]+)$/i.exec(f)?.[1] ?? "").toLowerCase();

const models = [
  ["buildingA", "models/building_A.glb", { nativeH: 1.65 }],
  ["buildingD", "models/building_D.glb", { nativeH: 2.97 }],
  ["buildingE", "models/building_E.glb", { nativeH: 2.35 }],
  ["buildingF", "models/building_F.glb", { nativeH: 2.35 }],
  ["buildingG", "models/building_G.glb", { nativeH: 2.98 }],
  ["buildingH", "models/building_H.glb", { nativeH: 3.05 }],
  ["treeA", "models/tree_single_A.glb", {}],
  ["treeB", "models/tree_single_B.glb", {}],
  ["treeCluster", "models/trees_A_medium.glb", {}],
  ["bush", "models/bush.glb", {}],
  ["streetlight", "models/streetlight.glb", {}],
  ["bench", "models/bench.glb", {}],
  ["firehydrant", "models/firehydrant.glb", {}],
  ["dumpster", "models/dumpster.glb", {}],
  ["trash", "models/trash_A.glb", {}],
  ["watertower", "models/watertower.glb", {}],
  ["trafficlight", "models/trafficlight_A.glb", {}],
  ["carSedan", "models/car_sedan.glb", {}],
  ["carTaxi", "models/car_taxi.glb", {}],
  ["carHatchback", "models/car_hatchback.glb", {}],
];
const textures = [
  ["grass", "textures/grass.jpg"],
  ["paving", "textures/paving.jpg"],
  ["asphalt", "textures/asphalt.jpg"],
];
// Avatars are seeded separately by seed-avatars.mjs (realistic humans
// streamed from R2, not bundled in the mobile app).

async function currentHash(id) {
  const { rows } = await pool.query("SELECT content_hash FROM game_assets WHERE id=$1", [id]);
  return rows[0]?.content_hash ?? null;
}

async function upsert(id, category, rel, label, meta, slot = null) {
  const abs = path.join(MOBILE, rel);
  let buf;
  try {
    buf = readFileSync(abs);
  } catch {
    console.warn(`  SKIP ${id}: file not found (${rel})`);
    return;
  }
  const hash = createHash("sha256").update(buf).digest("hex");
  const e = ext(rel) || "glb";
  const key = `assets/${category}/${id}-${hash.slice(0, 12)}.${e}`;
  const mime = EXT_MIME[e] ?? "application/octet-stream";

  const prev = await currentHash(id);
  if (prev === hash) {
    console.log(`  = ${id} (unchanged)`);
  } else {
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: mime }));
    console.log(`  ↑ ${id} -> ${key} (${(buf.length / 1024).toFixed(0)}kb)`);
  }

  await pool.query(
    `INSERT INTO game_assets (id, category, slot, label, r2_key, file_name, content_hash, size, mime_type, version, meta, enabled)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1,$10::jsonb,true)
     ON CONFLICT (id) DO UPDATE SET
       category=EXCLUDED.category, slot=EXCLUDED.slot, label=EXCLUDED.label,
       r2_key=EXCLUDED.r2_key, file_name=EXCLUDED.file_name, content_hash=EXCLUDED.content_hash,
       size=EXCLUDED.size, mime_type=EXCLUDED.mime_type, meta=EXCLUDED.meta, updated_at=now()`,
    [id, category, slot, label, key, path.basename(rel), hash, buf.length, mime, JSON.stringify(meta)],
  );
}

async function main() {
  console.log("Models:");
  for (const [id, rel, meta] of models) await upsert(id, "model", rel, id, meta);
  console.log("Textures:");
  for (const [id, rel] of textures) await upsert(id, "texture", rel, id, {});

  // Bump manifest version so clients pick up the seeded catalog.
  await pool.query(
    `INSERT INTO app_settings (key, value) VALUES ('asset_manifest_version','2')
     ON CONFLICT (key) DO UPDATE SET value=(app_settings.value::int + 1)::text, updated_at=now()`,
  );
  const { rows } = await pool.query("SELECT value FROM app_settings WHERE key='asset_manifest_version'");
  console.log(`\nDone. asset_manifest_version = ${rows[0]?.value}`);
  await pool.end();
}

main().catch((e) => {
  console.error("SEED FAILED:", e);
  process.exit(1);
});
