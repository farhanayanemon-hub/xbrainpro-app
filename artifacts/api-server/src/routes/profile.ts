import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable, programsTable, usersTable } from "@workspace/db";
import { UpdateProfileBody, UploadAvatarBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { serializeProfile, serializeUser } from "../lib/serialize";
import { uploadAvatarImage, StorageError } from "../lib/storage";

const router: IRouter = Router();

async function userState(userId: number): Promise<{
  hasProgram: boolean;
  onboarded: boolean;
}> {
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, userId));
  const programs = await db
    .select({ id: programsTable.id })
    .from(programsTable)
    .where(eq(programsTable.userId, userId));
  return {
    hasProgram: programs.length > 0,
    onboarded: profile?.onboarded ?? false,
  };
}

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

router.post("/profile/avatar", requireAuth, async (req, res): Promise<void> => {
  const parsed = UploadAvatarBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const userId = req.user!.id;

  try {
    const { publicUrl } = await uploadAvatarImage(
      userId,
      parsed.data.imageBase64,
      parsed.data.contentType,
    );

    const [updated] = await db
      .update(usersTable)
      .set({ avatarUrl: publicUrl })
      .where(eq(usersTable.id, userId))
      .returning();

    const state = await userState(userId);
    res.json(serializeUser(updated, state.hasProgram, state.onboarded));
  } catch (err) {
    if (err instanceof StorageError) {
      if (err.code === "invalid_image") {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(502).json({ error: err.message });
      return;
    }
    throw err;
  }
});

export default router;
