import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Registry of downloadable game assets hosted on Cloudflare R2.
 *
 * The binary files live in the R2 bucket (keyed by `r2Key`); this table is the
 * source of truth for what exists, its version, and how the client should use
 * it. The public `/api/assets/manifest` endpoint reads from here and hands the
 * client presigned CDN URLs. Admins mutate rows via the admin panel, which
 * bumps the global `asset_manifest_version` so players auto-update.
 */
export const gameAssetsTable = pgTable("game_assets", {
  /** Logical id the runtime resolver requests, e.g. "buildingA", "knight". */
  id: text("id").primaryKey(),
  /** "model" | "texture" | "avatar". */
  category: text("category").notNull(),
  /** Optional avatar slot assignment: "male" | "female" | null. */
  slot: text("slot"),
  /** Human-friendly display name for the admin panel. */
  label: text("label").notNull(),
  /** Object key inside the R2 bucket. */
  r2Key: text("r2_key").notNull(),
  /** Original file name (for extension + admin display). */
  fileName: text("file_name").notNull(),
  /** SHA-256 (hex) of the file — used for client cache-busting. */
  contentHash: text("content_hash").notNull(),
  /** File size in bytes. */
  size: integer("size").notNull(),
  /** MIME type, e.g. "model/gltf-binary", "image/jpeg". */
  mimeType: text("mime_type").notNull(),
  /** Per-asset version, bumped on every replace. */
  version: integer("version").notNull().default(1),
  /** Free-form metadata: nativeH for buildings, color/tagline for avatars, etc. */
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  /** Soft toggle without deleting the file. */
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type GameAsset = typeof gameAssetsTable.$inferSelect;
export type NewGameAsset = typeof gameAssetsTable.$inferInsert;
