import { Router, type IRouter } from "express";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { appSettingsTable, db, worldObjectsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { SETTING_KEYS } from "../lib/settings";

const router: IRouter = Router();

export const WORLD_KINDS = [
  "building",
  "tree",
  "lamp",
  "prop",
  "roofProp",
  "car",
  "fountain",
  "stall",
  "npc",
] as const;

const worldObjectInput = z.object({
  kind: z.enum(WORLD_KINDS),
  data: z.record(z.string(), z.unknown()),
});

/**
 * The map version must be strongly consistent — it backs the ETag that
 * decides whether clients re-download the map. So it is always read straight
 * from the DB (never the 30s in-process settings cache) and bumped with a
 * single atomic upsert that survives concurrent admin mutations and multiple
 * server instances.
 */
export async function getWorldVersion(): Promise<number> {
  const [row] = await db
    .select({ value: appSettingsTable.value })
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, SETTING_KEYS.worldMapVersion));
  const parsed = row ? Number.parseInt(row.value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : 1;
}

async function bumpWorldVersion(): Promise<number> {
  const [row] = await db
    .insert(appSettingsTable)
    .values({ key: SETTING_KEYS.worldMapVersion, value: "2" })
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

/** NPC personas must never leak their system prompt to clients. */
function publicData(kind: string, data: unknown): unknown {
  if (kind === "npc" && data && typeof data === "object") {
    const { systemPrompt: _omit, ...rest } = data as Record<string, unknown>;
    return rest;
  }
  return data;
}

router.get("/world/map", async (req, res): Promise<void> => {
  const version = await getWorldVersion();
  const etag = `W/"v${version}"`;
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", "no-cache");
  if (req.headers["if-none-match"] === etag) {
    res.status(304).end();
    return;
  }

  const rows = await db
    .select()
    .from(worldObjectsTable)
    .orderBy(asc(worldObjectsTable.id));

  res.json({
    version,
    objects: rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      data: publicData(r.kind, r.data),
    })),
  });
});

router.post(
  "/admin/world/objects",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = worldObjectInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .insert(worldObjectsTable)
      .values({ kind: parsed.data.kind, data: parsed.data.data })
      .returning();
    const version = await bumpWorldVersion();
    req.log.info(
      { id: row!.id, kind: row!.kind, version, adminId: req.user!.id },
      "world object added",
    );
    res.status(201).json({ id: row!.id, kind: row!.kind, data: row!.data, version });
  },
);

router.put(
  "/admin/world/objects/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = Number.parseInt(String(req.params.id ?? ""), 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid object id" });
      return;
    }
    const parsed = worldObjectInput.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .update(worldObjectsTable)
      .set({ kind: parsed.data.kind, data: parsed.data.data, updatedAt: new Date() })
      .where(eq(worldObjectsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "World object not found" });
      return;
    }
    const version = await bumpWorldVersion();
    req.log.info(
      { id, kind: row.kind, version, adminId: req.user!.id },
      "world object updated",
    );
    res.json({ id: row.id, kind: row.kind, data: row.data, version });
  },
);

router.delete(
  "/admin/world/objects/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const id = Number.parseInt(String(req.params.id ?? ""), 10);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Invalid object id" });
      return;
    }
    const [row] = await db
      .delete(worldObjectsTable)
      .where(eq(worldObjectsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "World object not found" });
      return;
    }
    const version = await bumpWorldVersion();
    req.log.info({ id, version, adminId: req.user!.id }, "world object removed");
    res.json({ ok: true, version });
  },
);

export default router;
