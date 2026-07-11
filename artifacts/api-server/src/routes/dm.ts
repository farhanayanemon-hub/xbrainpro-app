import { Router, type IRouter } from "express";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  directMessagesTable,
  friendshipsTable,
  playerProfilesTable,
  type DirectMessage,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { deliverToUser } from "../lib/realtime";

const router: IRouter = Router();

const DM_MAX_LEN = 300;
const CONVERSATION_LIMIT = 100;

const sendBody = z.object({
  text: z.string().trim().min(1).max(DM_MAX_LEN),
});

/** Wire shape shared by the REST responses and the `{ t: "dm" }` WS push. */
function serializeDm(m: DirectMessage) {
  return {
    id: m.id,
    fromId: m.senderId,
    toId: m.recipientId,
    text: m.text,
    ts: m.createdAt.getTime(),
  };
}

/** True when `me` and `other` have an accepted friendship (either direction). */
async function areFriends(me: number, other: number): Promise<boolean> {
  const [row] = await db
    .select({ id: friendshipsTable.id })
    .from(friendshipsTable)
    .where(
      and(
        eq(friendshipsTable.status, "accepted"),
        or(
          and(
            eq(friendshipsTable.requesterId, me),
            eq(friendshipsTable.addresseeId, other),
          ),
          and(
            eq(friendshipsTable.requesterId, other),
            eq(friendshipsTable.addresseeId, me),
          ),
        ),
      ),
    )
    .limit(1);
  return !!row;
}

function parseUserId(raw: unknown): number | null {
  const id = Number.parseInt(String(raw ?? ""), 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Total unread DMs for the current user. Cheap enough to poll from the lobby
 * for the friends-button badge without pulling the whole social graph.
 */
router.get("/dm/unread", requireAuth, async (req, res): Promise<void> => {
  const me = req.user!.id;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(directMessagesTable)
    .where(
      and(
        eq(directMessagesTable.recipientId, me),
        isNull(directMessagesTable.readAt),
      ),
    );
  res.json({ unread: row?.count ?? 0 });
});

/**
 * Conversation with a friend: the last messages in both directions, oldest
 * first. Opening the conversation marks their messages to me as read, which
 * is what clears the unread badges.
 */
router.get("/dm/:userId", requireAuth, async (req, res): Promise<void> => {
  const me = req.user!.id;
  const other = parseUserId(req.params.userId);
  if (!other) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  if (!(await areFriends(me, other))) {
    res.status(403).json({ error: "You can only message friends" });
    return;
  }

  const rows = await db
    .select()
    .from(directMessagesTable)
    .where(
      or(
        and(
          eq(directMessagesTable.senderId, me),
          eq(directMessagesTable.recipientId, other),
        ),
        and(
          eq(directMessagesTable.senderId, other),
          eq(directMessagesTable.recipientId, me),
        ),
      ),
    )
    .orderBy(desc(directMessagesTable.id))
    .limit(CONVERSATION_LIMIT);
  rows.reverse();

  // Everything they sent me is now read.
  await db
    .update(directMessagesTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(directMessagesTable.senderId, other),
        eq(directMessagesTable.recipientId, me),
        isNull(directMessagesTable.readAt),
      ),
    );

  res.json({ messages: rows.map(serializeDm) });
});

/**
 * Send a private message to a friend. Always persisted (offline inbox); if
 * the recipient is online it is also pushed over their /ws socket right away.
 */
router.post("/dm/:userId", requireAuth, async (req, res): Promise<void> => {
  const me = req.user!.id;
  const other = parseUserId(req.params.userId);
  if (!other) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }
  if (other === me) {
    res.status(400).json({ error: "You can't message yourself" });
    return;
  }
  const parsed = sendBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "A message is required" });
    return;
  }
  if (!(await areFriends(me, other))) {
    res.status(403).json({ error: "You can only message friends" });
    return;
  }

  const [inserted] = await db
    .insert(directMessagesTable)
    .values({ senderId: me, recipientId: other, text: parsed.data.text })
    .returning();
  if (!inserted) {
    res.status(500).json({ error: "Couldn't send message" });
    return;
  }

  const wire = serializeDm(inserted);

  // Realtime delivery when the recipient is online. The sender's name rides
  // along so the client can render the notification without a lookup.
  const [senderProfile] = await db
    .select({ displayName: playerProfilesTable.displayName })
    .from(playerProfilesTable)
    .where(eq(playerProfilesTable.userId, me));
  deliverToUser(other, {
    t: "dm",
    msg: { ...wire, fromName: senderProfile?.displayName ?? "Citizen" },
  });

  res.status(201).json({ message: wire });
});

export default router;
