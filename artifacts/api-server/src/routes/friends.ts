import { Router, type IRouter } from "express";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  friendshipsTable,
  playerProfilesTable,
  type PlayerProfile,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { getUserPresence, isUserOnline } from "../lib/realtime";

const router: IRouter = Router();

const sendRequestBody = z.object({
  displayName: z.string().trim().min(1).max(24),
});

/** Public shape for a friend/request entry in the lobby. */
function serializeFriendProfile(p: PlayerProfile) {
  const hasPhoto = !!p.photoData;
  return {
    userId: p.userId,
    displayName: p.displayName,
    gender: p.gender,
    hasPhoto,
    photoUrl: hasPhoto
      ? `/api/players/${p.userId}/photo?v=${p.updatedAt.getTime()}`
      : null,
  };
}

/** Load player profiles for a set of user ids, keyed by userId. */
async function profilesByUserId(
  userIds: number[],
): Promise<Map<number, PlayerProfile>> {
  const map = new Map<number, PlayerProfile>();
  if (userIds.length === 0) return map;
  const rows = await db
    .select()
    .from(playerProfilesTable)
    .where(inArray(playerProfilesTable.userId, userIds));
  for (const r of rows) map.set(r.userId, r);
  return map;
}

/**
 * The social graph for the current user: accepted friends (with live online
 * status + position for "Join"), plus pending requests waiting on the user
 * (incoming) and requests the user has sent (outgoing).
 */
router.get("/friends", requireAuth, async (req, res): Promise<void> => {
  const me = req.user!.id;

  const rows = await db
    .select()
    .from(friendshipsTable)
    .where(
      or(
        eq(friendshipsTable.requesterId, me),
        eq(friendshipsTable.addresseeId, me),
      ),
    );

  const friendIds: number[] = [];
  const incomingIds: number[] = [];
  const outgoingIds: number[] = [];

  for (const row of rows) {
    const other = row.requesterId === me ? row.addresseeId : row.requesterId;
    if (row.status === "accepted") {
      friendIds.push(other);
    } else if (row.addresseeId === me) {
      incomingIds.push(other); // they asked me
    } else {
      outgoingIds.push(other); // I asked them
    }
  }

  const profiles = await profilesByUserId([
    ...friendIds,
    ...incomingIds,
    ...outgoingIds,
  ]);

  const friends = friendIds
    .map((uid) => profiles.get(uid))
    .filter((p): p is PlayerProfile => !!p)
    .map((p) => {
      const presence = getUserPresence(p.userId);
      return {
        ...serializeFriendProfile(p),
        online: isUserOnline(p.userId),
        position: presence ? { x: presence.x, z: presence.z } : null,
      };
    })
    // Online friends first, then alphabetical.
    .sort(
      (a, b) =>
        Number(b.online) - Number(a.online) ||
        a.displayName.localeCompare(b.displayName),
    );

  const incoming = incomingIds
    .map((uid) => profiles.get(uid))
    .filter((p): p is PlayerProfile => !!p)
    .map(serializeFriendProfile);

  const outgoing = outgoingIds
    .map((uid) => profiles.get(uid))
    .filter((p): p is PlayerProfile => !!p)
    .map(serializeFriendProfile);

  res.json({ friends, incoming, outgoing });
});

/**
 * Send a friend request by display name. If the target has already sent me a
 * request, this accepts it instead of creating a mirrored pending row.
 */
router.post(
  "/friends/requests",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = req.user!.id;
    const parsed = sendRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "A display name is required" });
      return;
    }
    const name = parsed.data.displayName;

    const [target] = await db
      .select()
      .from(playerProfilesTable)
      .where(ilike(playerProfilesTable.displayName, name))
      .limit(1);

    if (!target) {
      res.status(404).json({ error: `No player named "${name}" found` });
      return;
    }
    if (target.userId === me) {
      res.status(400).json({ error: "You can't add yourself" });
      return;
    }

    // Any existing edge between the two, in either direction.
    const [existing] = await db
      .select()
      .from(friendshipsTable)
      .where(
        or(
          and(
            eq(friendshipsTable.requesterId, me),
            eq(friendshipsTable.addresseeId, target.userId),
          ),
          and(
            eq(friendshipsTable.requesterId, target.userId),
            eq(friendshipsTable.addresseeId, me),
          ),
        ),
      );

    if (existing) {
      if (existing.status === "accepted") {
        res.status(409).json({ error: "You're already friends" });
        return;
      }
      // A pending row exists. If they asked me, accept it; otherwise it's my
      // own outstanding request already.
      if (existing.addresseeId === me) {
        await db
          .update(friendshipsTable)
          .set({ status: "accepted", updatedAt: new Date() })
          .where(eq(friendshipsTable.id, existing.id));
        res.json({ status: "accepted" });
        return;
      }
      res.status(409).json({ error: "Request already sent" });
      return;
    }

    // onConflictDoNothing makes concurrent duplicate sends deterministic: the
    // loser of the race gets no row back and we report the stable 409 below,
    // instead of surfacing the unique-constraint violation as a 500.
    const [inserted] = await db
      .insert(friendshipsTable)
      .values({ requesterId: me, addresseeId: target.userId })
      .onConflictDoNothing({
        target: [friendshipsTable.requesterId, friendshipsTable.addresseeId],
      })
      .returning();
    if (!inserted) {
      res.status(409).json({ error: "Request already sent" });
      return;
    }
    res.status(201).json({ status: "pending" });
  },
);

/** Accept a pending request that was sent to me by `userId`. */
router.post(
  "/friends/requests/:userId/accept",
  requireAuth,
  async (req, res): Promise<void> => {
    const me = req.user!.id;
    const otherId = Number.parseInt(String(req.params.userId ?? ""), 10);
    if (!Number.isInteger(otherId)) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    const [row] = await db
      .update(friendshipsTable)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(
        and(
          eq(friendshipsTable.requesterId, otherId),
          eq(friendshipsTable.addresseeId, me),
          eq(friendshipsTable.status, "pending"),
        ),
      )
      .returning();

    if (!row) {
      res.status(404).json({ error: "No pending request from that player" });
      return;
    }
    res.json({ status: "accepted" });
  },
);

export default router;
