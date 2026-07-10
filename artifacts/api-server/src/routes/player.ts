import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playerProfilesTable, type PlayerProfile } from "@workspace/db";
import { UpsertPlayerProfileBody, UploadPlayerPhotoBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

/** ~2MB of raw image data (base64 inflates by ~4/3). */
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

function serializePlayerProfile(p: PlayerProfile) {
  const hasPhoto = !!p.photoData;
  return {
    userId: p.userId,
    displayName: p.displayName,
    gender: p.gender,
    bio: p.bio ?? null,
    hasPhoto,
    photoUrl: hasPhoto
      ? `/api/players/${p.userId}/photo?v=${p.updatedAt.getTime()}`
      : null,
  };
}

/**
 * Number of residential house plots in the starter city. Must match the
 * HOUSES array length in the mobile app's cityLayout.ts / world seed.
 */
const NUM_HOUSE_PLOTS = 8;

/**
 * The player's assigned home. The plot index is derived deterministically
 * from the account id so every account always maps to the same house (no
 * extra table needed). The client resolves the plot to a world position from
 * the shared, server-driven house objects.
 */
router.get("/player/home", requireAuth, async (req, res): Promise<void> => {
  const id = req.user!.id;
  const plot = (((id - 1) % NUM_HOUSE_PLOTS) + NUM_HOUSE_PLOTS) % NUM_HOUSE_PLOTS;
  res.json({ plot });
});

router.get("/player/profile", requireAuth, async (req, res): Promise<void> => {
  const [profile] = await db
    .select()
    .from(playerProfilesTable)
    .where(eq(playerProfilesTable.userId, req.user!.id));
  if (!profile) {
    res.status(404).json({ error: "Player profile not created yet" });
    return;
  }
  res.json(serializePlayerProfile(profile));
});

router.put("/player/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpsertPlayerProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const displayName = parsed.data.displayName.trim();
  if (displayName.length < 2) {
    res.status(400).json({ error: "Display name is too short" });
    return;
  }
  const values = {
    displayName,
    gender: parsed.data.gender,
    bio: parsed.data.bio?.trim() || null,
    updatedAt: new Date(),
  };

  const [profile] = await db
    .insert(playerProfilesTable)
    .values({ userId: req.user!.id, ...values })
    .onConflictDoUpdate({
      target: playerProfilesTable.userId,
      set: values,
    })
    .returning();

  res.json(serializePlayerProfile(profile));
});

router.post("/player/photo", requireAuth, async (req, res): Promise<void> => {
  const parsed = UploadPlayerPhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { imageBase64, contentType } = parsed.data;
  if (!ALLOWED_MIMES.has(contentType)) {
    res.status(400).json({ error: "Only JPEG, PNG or WebP photos are allowed" });
    return;
  }
  // base64 length * 3/4 approximates decoded byte size.
  const approxBytes = Math.floor(imageBase64.length * 0.75);
  if (approxBytes > MAX_PHOTO_BYTES) {
    res.status(400).json({ error: "Photo is too large (max 2MB)" });
    return;
  }
  if (!/^[A-Za-z0-9+/=\s]+$/.test(imageBase64) || approxBytes < 50) {
    res.status(400).json({ error: "Invalid image data" });
    return;
  }

  const [profile] = await db
    .update(playerProfilesTable)
    .set({
      photoData: imageBase64,
      photoMime: contentType,
      updatedAt: new Date(),
    })
    .where(eq(playerProfilesTable.userId, req.user!.id))
    .returning();

  if (!profile) {
    res.status(404).json({ error: "Create your profile before adding a photo" });
    return;
  }
  res.json(serializePlayerProfile(profile));
});

router.get(
  "/players/:userId",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    const [profile] = await db
      .select()
      .from(playerProfilesTable)
      .where(eq(playerProfilesTable.userId, userId));
    if (!profile) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    res.json(serializePlayerProfile(profile));
  },
);

router.get("/players/:userId/photo", async (req, res): Promise<void> => {
  const userId = Number(req.params.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(404).json({ error: "No photo" });
    return;
  }
  const [profile] = await db
    .select({
      photoData: playerProfilesTable.photoData,
      photoMime: playerProfilesTable.photoMime,
    })
    .from(playerProfilesTable)
    .where(eq(playerProfilesTable.userId, userId));
  if (!profile?.photoData || !profile.photoMime) {
    res.status(404).json({ error: "No photo" });
    return;
  }
  const buf = Buffer.from(profile.photoData, "base64");
  res.setHeader("Content-Type", profile.photoMime);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(buf);
});

export default router;
