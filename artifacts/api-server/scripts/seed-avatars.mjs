/**
 * Seed the realistic human avatars (male + female) into R2 + the game_assets
 * registry, and retire the old fantasy KayKit avatars so the manifest only
 * serves the new humans. Idempotent: upserts by id, skips upload when the
 * content hash already matches.
 *
 * Dev:   node artifacts/api-server/scripts/seed-avatars.mjs
 * Prod:  DATABASE_URL="$SUPABASE_DB_URL" node artifacts/api-server/scripts/seed-avatars.mjs
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AVATAR_DIR = path.resolve(__dirname, "../assets/avatars");

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

// id, file, slot, name, tagline, accent color
const AVATARS = [
  ["ryan", "ryan.glb", "male", "Ryan", "Street-smart & bold", "#5b8cff"],
  ["maya", "maya.glb", "female", "Maya", "Bright & fearless", "#ff6fae"],
];
// Fantasy avatars from the KayKit era — retire them from the manifest.
const RETIRED = [
  "knight", "barbarian", "mage", "rogue", "rogue_hooded",
  "skeleton_warrior", "skeleton_mage", "skeleton_rogue", "skeleton_minion",
];

async function currentHash(id) {
  const { rows } = await pool.query(
    "SELECT content_hash FROM game_assets WHERE id=$1",
    [id],
  );
  return rows[0]?.content_hash ?? null;
}

async function upsertAvatar(id, file, slot, name, tagline, color) {
  const buf = readFileSync(path.join(AVATAR_DIR, file));
  const hash = createHash("sha256").update(buf).digest("hex");
  const key = `assets/avatar/${id}-${hash.slice(0, 12)}.glb`;
  const meta = { name, tagline, color, zone: "*" };

  if ((await currentHash(id)) === hash) {
    console.log(`  = ${id} (unchanged)`);
  } else {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buf,
        ContentType: "model/gltf-binary",
      }),
    );
    console.log(`  ↑ ${id} -> ${key} (${(buf.length / 1024).toFixed(0)}kb)`);
  }

  await pool.query(
    `INSERT INTO game_assets (id, category, slot, label, r2_key, file_name, content_hash, size, mime_type, version, meta, enabled)
     VALUES ($1,'avatar',$2,$3,$4,$5,$6,$7,'model/gltf-binary',1,$8::jsonb,true)
     ON CONFLICT (id) DO UPDATE SET
       category='avatar', slot=EXCLUDED.slot, label=EXCLUDED.label,
       r2_key=EXCLUDED.r2_key, file_name=EXCLUDED.file_name, content_hash=EXCLUDED.content_hash,
       size=EXCLUDED.size, mime_type=EXCLUDED.mime_type, meta=EXCLUDED.meta,
       enabled=true, updated_at=now()`,
    [id, slot, name, key, file, hash, buf.length, JSON.stringify(meta)],
  );
}

async function main() {
  console.log("Realistic avatars:");
  for (const a of AVATARS) await upsertAvatar(...a);

  console.log("Retiring fantasy avatars:");
  const { rowCount } = await pool.query(
    `UPDATE game_assets SET enabled=false, updated_at=now()
     WHERE id = ANY($1::text[]) AND category='avatar'`,
    [RETIRED],
  );
  console.log(`  disabled ${rowCount} old avatar(s)`);

  await pool.query(
    `INSERT INTO app_settings (key, value) VALUES ('asset_manifest_version','1')
     ON CONFLICT (key) DO UPDATE SET value=(app_settings.value::int + 1)::text, updated_at=now()`,
  );
  const { rows } = await pool.query(
    "SELECT value FROM app_settings WHERE key='asset_manifest_version'",
  );
  console.log(`\nDone. asset_manifest_version = ${rows[0]?.value}`);
  await pool.end();
}

main().catch((e) => {
  console.error("SEED FAILED:", e);
  process.exit(1);
});
