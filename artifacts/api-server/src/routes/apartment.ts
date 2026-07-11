import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, apartmentsTable, type PlacedFurniture } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { DEFAULT_LAYOUT, sanitizeLayout } from "../lib/apartment";

const router: IRouter = Router();

/**
 * Get the player's saved apartment layout. A player who has never decorated has
 * no row yet — they get a cosy default starter arrangement (not persisted, so
 * their first edit becomes their real layout).
 */
router.get("/apartment", requireAuth, async (req, res): Promise<void> => {
  const [row] = await db
    .select()
    .from(apartmentsTable)
    .where(eq(apartmentsTable.userId, req.user!.id));

  if (!row) {
    res.json({ layout: DEFAULT_LAYOUT, isDefault: true });
    return;
  }
  res.json({ layout: (row.layout as PlacedFurniture[]) ?? [], isDefault: false });
});

/**
 * Save the player's full apartment layout. The client sends the entire
 * arrangement and it replaces the previous one in a single upsert. Everything
 * is validated server-side: unknown items are dropped, positions are clamped
 * inside the room, and the item count is capped.
 */
router.put("/apartment", requireAuth, async (req, res): Promise<void> => {
  const layout = await sanitizeLayout(req.body?.layout);
  const now = new Date();

  const [row] = await db
    .insert(apartmentsTable)
    .values({ userId: req.user!.id, layout, updatedAt: now })
    .onConflictDoUpdate({
      target: apartmentsTable.userId,
      set: { layout, updatedAt: now },
    })
    .returning();

  res.json({ layout: (row.layout as PlacedFurniture[]) ?? [], isDefault: false });
});

export default router;
