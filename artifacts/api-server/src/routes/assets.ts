import { Router, type IRouter } from "express";
import multer from "multer";
import { asc, eq, sql } from "drizzle-orm";
import { appSettingsTable, db, gameAssetsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { SETTING_KEYS } from "../lib/settings";
import type { Request } from "express";
import {
  deleteObject,
  getObject,
  hashBuffer,
  isR2Configured,
  uploadObject,
} from "../lib/r2";

const router: IRouter = Router();

const CATEGORIES = ["model", "texture", "avatar", "scene"] as const;
// male/female pick an avatar by gender; lobby/loading tag a "scene" asset as the
// lobby 3D room or the loading-screen backdrop so admins can swap them freely.
const SLOTS = ["male", "female", "lobby", "loading"] as const;
type Category = (typeof CATEGORIES)[number];

/** Max upload size — GLBs with 2K textures can be sizable. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 },
});

const EXT_MIME: Record<string, string> = {
  glb: "model/gltf-binary",
  gltf: "model/gltf+json",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  ktx2: "image/ktx2",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

function extOf(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name.trim());
  return m ? m[1]!.toLowerCase() : "";
}

function mimeFor(fileName: string, fallback?: string): string {
  return EXT_MIME[extOf(fileName)] ?? fallback ?? "application/octet-stream";
}

/**
 * The asset manifest version backs the client's re-download decision, so like
 * the world map version it is read straight from the DB (never the 30s cache)
 * and bumped with a single atomic upsert safe across concurrent admins.
 */
export async function getAssetManifestVersion(): Promise<number> {
  const [row] = await db
    .select({ value: appSettingsTable.value })
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, SETTING_KEYS.assetManifestVersion));
  const parsed = row ? Number.parseInt(row.value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : 1;
}

async function bumpAssetManifestVersion(): Promise<number> {
  const [row] = await db
    .insert(appSettingsTable)
    .values({ key: SETTING_KEYS.assetManifestVersion, value: "2" })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: {
        value: sql`(${appSettingsTable.value}::int + 1)::text`,
        updatedAt: new Date(),
      },
    })
    .returning({ value: appSettingsTable.value });
  return Number.parseInt(row!.value, 10);
}

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

/** Absolute origin of this request, honouring the Railway/Replit proxy. */
function publicBaseUrl(req: Request): string {
  const proto = String(
    req.headers["x-forwarded-proto"] ?? req.protocol ?? "https",
  )
    .split(",")[0]!
    .trim();
  const host = String(
    req.headers["x-forwarded-host"] ?? req.headers.host ?? "",
  )
    .split(",")[0]!
    .trim();
  return `${proto}://${host}`;
}

/** Same-origin download URL for an asset, cache-busted by content hash. */
function assetFileUrl(req: Request, id: string, hash: string): string {
  return `${publicBaseUrl(req)}/api/assets/file/${id}?h=${hash.slice(0, 12)}`;
}

/* ------------------------------------------------------------------ */
/* Public manifest — drives what the game downloads.                   */
/* ------------------------------------------------------------------ */

router.get("/assets/manifest", async (req, res): Promise<void> => {
  const version = await getAssetManifestVersion();
  const etag = `W/"a${version}"`;
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", "no-cache");
  if (req.headers["if-none-match"] === etag) {
    res.status(304).end();
    return;
  }

  if (!isR2Configured()) {
    // Degrade gracefully: no CDN assets, client falls back to bundled ones.
    res.json({ version, configured: false, assets: [] });
    return;
  }

  const rows = await db
    .select()
    .from(gameAssetsTable)
    .where(eq(gameAssetsTable.enabled, true))
    .orderBy(asc(gameAssetsTable.id));

  const assets = await Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      category: r.category,
      slot: r.slot,
      label: r.label,
      url: assetFileUrl(req, r.id, r.contentHash),
      hash: r.contentHash,
      size: r.size,
      mime: r.mimeType,
      version: r.version,
      // `zone` lets the client fetch only the assets for the zone the player is
      // entering (spawn city up front, interiors/other zones on demand) instead
      // of the whole catalog. Models/textures default to the "city" spawn zone;
      // avatars are global ("*") and downloaded on selection, not per zone.
      meta: {
        ...((r.meta as Record<string, unknown> | null) ?? {}),
        zone:
          ((r.meta as Record<string, unknown> | null)?.zone as
            | string
            | undefined) ??
          (r.category === "avatar"
            ? "*"
            : r.category === "scene"
              ? "lobby"
              : "city"),
      },
    }))
  );

  res.json({ version, configured: true, assets });
});

/* ------------------------------------------------------------------ */
/* Public asset bytes — streamed same-origin (no CORS, immutable).     */
/* ------------------------------------------------------------------ */

router.get("/assets/file/:id", async (req, res): Promise<void> => {
  if (!isR2Configured()) {
    res.status(404).end();
    return;
  }
  const id = String(req.params.id ?? "");
  const [row] = await db
    .select()
    .from(gameAssetsTable)
    .where(eq(gameAssetsTable.id, id));
  if (!row) {
    res.status(404).end();
    return;
  }
  // Content-addressed: if a hash is pinned in the URL it must match the current
  // asset, so a stale (?h=) URL from before an admin replace never serves the
  // new bytes (and immutable caches stay consistent with what they cached).
  const pinned = typeof req.query.h === "string" ? req.query.h : "";
  if (pinned && pinned !== row.contentHash.slice(0, 12)) {
    res.status(404).end();
    return;
  }
  try {
    const obj = await getObject(row.r2Key);
    res.setHeader(
      "Content-Type",
      row.mimeType || obj.contentType || "application/octet-stream",
    );
    if (obj.contentLength != null) {
      res.setHeader("Content-Length", String(obj.contentLength));
    }
    // Content is addressed by hash (?h=), so it can be cached forever.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    obj.body.on("error", () => {
      if (!res.headersSent) res.status(502).end();
      else res.destroy();
    });
    obj.body.pipe(res);
  } catch (err) {
    req.log.error({ err, id }, "asset stream failed");
    if (!res.headersSent) res.status(502).end();
  }
});

/* ------------------------------------------------------------------ */
/* Admin: list / upload / replace / delete / assign slot.              */
/* ------------------------------------------------------------------ */

router.get("/admin/assets", requireAdmin, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(gameAssetsTable)
    .orderBy(asc(gameAssetsTable.category), asc(gameAssetsTable.id));
  const configured = isR2Configured();
  const assets = rows.map((r) => ({
    id: r.id,
    category: r.category,
    slot: r.slot,
    label: r.label,
    fileName: r.fileName,
    hash: r.contentHash,
    size: r.size,
    mime: r.mimeType,
    version: r.version,
    enabled: r.enabled,
    meta: r.meta ?? {},
    previewUrl: configured ? assetFileUrl(req, r.id, r.contentHash) : null,
    updatedAt: r.updatedAt,
  }));
  res.json({ configured, assets });
});

/**
 * Upload a new asset OR replace an existing one (same id). Multipart form:
 *  - file: the binary
 *  - id, category, label (required on create), slot, meta (JSON string)
 */
router.post(
  "/admin/assets",
  requireAdmin,
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!isR2Configured()) {
      res.status(503).json({ error: "R2 storage is not configured on the server" });
      return;
    }
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Missing file" });
      return;
    }
    const id = String(req.body?.id ?? "").trim();
    if (!isValidId(id)) {
      res.status(400).json({ error: "Invalid id (use letters, numbers, _ or -)" });
      return;
    }
    const category = String(req.body?.category ?? "").trim() as Category;
    if (!CATEGORIES.includes(category)) {
      res.status(400).json({ error: `Invalid category (${CATEGORIES.join(", ")})` });
      return;
    }
    const slotRaw = String(req.body?.slot ?? "").trim();
    const slot = slotRaw && (SLOTS as readonly string[]).includes(slotRaw) ? slotRaw : null;

    let meta: Record<string, unknown> = {};
    if (req.body?.meta) {
      try {
        const parsed = JSON.parse(String(req.body.meta));
        if (parsed && typeof parsed === "object") meta = parsed as Record<string, unknown>;
      } catch {
        res.status(400).json({ error: "meta must be valid JSON" });
        return;
      }
    }

    const [existing] = await db
      .select()
      .from(gameAssetsTable)
      .where(eq(gameAssetsTable.id, id));

    const label =
      String(req.body?.label ?? "").trim() || existing?.label || id;
    const hash = hashBuffer(file.buffer);
    const ext = extOf(file.originalname) || (category === "texture" ? "jpg" : "glb");
    const r2Key = `assets/${category}/${id}-${hash.slice(0, 12)}.${ext}`;
    const mime = mimeFor(file.originalname, file.mimetype);

    await uploadObject(r2Key, file.buffer, mime);

    const version = existing ? existing.version + 1 : 1;
    const mergedMeta = { ...(existing?.meta ?? {}), ...meta };

    const [row] = await db
      .insert(gameAssetsTable)
      .values({
        id,
        category,
        slot,
        label,
        r2Key,
        fileName: file.originalname,
        contentHash: hash,
        size: file.size,
        mimeType: mime,
        version,
        meta: mergedMeta,
      })
      .onConflictDoUpdate({
        target: gameAssetsTable.id,
        set: {
          category,
          slot,
          label,
          r2Key,
          fileName: file.originalname,
          contentHash: hash,
          size: file.size,
          mimeType: mime,
          version,
          meta: mergedMeta,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Clean up the previous object if the key changed (hash differs).
    if (existing && existing.r2Key !== r2Key) {
      try {
        await deleteObject(existing.r2Key);
      } catch {
        // non-fatal: orphaned object, safe to ignore
      }
    }

    const manifestVersion = await bumpAssetManifestVersion();
    req.log.info(
      { id, category, replaced: Boolean(existing), manifestVersion, adminId: req.user!.id },
      "game asset uploaded",
    );
    res.status(existing ? 200 : 201).json({ asset: row, manifestVersion });
  },
);

router.put(
  "/admin/assets/:id/slot",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = String(req.params.id ?? "");
    const slotRaw = String(req.body?.slot ?? "").trim();
    const slot = slotRaw === "" || slotRaw === "none"
      ? null
      : (SLOTS as readonly string[]).includes(slotRaw)
        ? slotRaw
        : undefined;
    if (slot === undefined) {
      res.status(400).json({ error: `Invalid slot (${SLOTS.join(", ")} or none)` });
      return;
    }
    const [row] = await db
      .update(gameAssetsTable)
      .set({ slot, updatedAt: new Date() })
      .where(eq(gameAssetsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }
    const manifestVersion = await bumpAssetManifestVersion();
    res.json({ asset: row, manifestVersion });
  },
);

router.delete(
  "/admin/assets/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = String(req.params.id ?? "");
    const [row] = await db
      .delete(gameAssetsTable)
      .where(eq(gameAssetsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }
    if (isR2Configured()) {
      try {
        await deleteObject(row.r2Key);
      } catch {
        // non-fatal
      }
    }
    const manifestVersion = await bumpAssetManifestVersion();
    req.log.info({ id, manifestVersion, adminId: req.user!.id }, "game asset deleted");
    res.json({ ok: true, manifestVersion });
  },
);

export default router;
