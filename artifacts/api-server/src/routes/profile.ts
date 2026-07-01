import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { UpdateProfileBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { serializeProfile } from "../lib/serialize";

const router: IRouter = Router();

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  let [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));
  if (!profile) {
    [profile] = await db
      .insert(profilesTable)
      .values({ userId })
      .returning();
  }
  res.json(serializeProfile(profile));
});

router.patch("/profile", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.id;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));
  if (!existing) {
    await db.insert(profilesTable).values({ userId });
  }

  const [profile] = await db
    .update(profilesTable)
    .set(parsed.data)
    .where(eq(profilesTable.userId, userId))
    .returning();

  res.json(serializeProfile(profile));
});

export default router;
