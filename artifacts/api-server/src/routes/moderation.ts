import { Router, type IRouter } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import {
  db,
  chatReportsTable,
  chatMutesTable,
  playerProfilesTable,
  usersTable,
} from "@workspace/db";
import { requireAdmin, requireAuth } from "../lib/auth";
import {
  muteUser,
  unmuteUser,
  REPORT_AUTO_MUTE_MS,
  REPORT_AUTO_MUTE_THRESHOLD,
  REPORT_WINDOW_MS,
} from "../lib/moderation";

const router: IRouter = Router();

const createReportBody = z.object({
  /** Numeric user id of the reported player (from their public "uNN" id). */
  reportedId: z.number().int().positive(),
  /** The offending message text as the reporter saw it. */
  messageText: z.string().trim().min(1).max(200),
  /** Client timestamp (ms epoch) of the message, if known. */
  messageTs: z.number().int().positive().optional(),
  reason: z.string().trim().max(200).optional(),
});

/**
 * File a report about a city chat message. Duplicate reports from the same
 * reporter about the same player within the window are collapsed (no spam).
 * When enough DISTINCT reporters flag the same player inside the window, the
 * player is auto-muted server-side.
 */
router.post("/chat/reports", requireAuth, async (req, res): Promise<void> => {
  const parsed = createReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid report" });
    return;
  }
  const me = req.user!.id;
  const { reportedId, messageText, messageTs, reason } = parsed.data;

  if (reportedId === me) {
    res.status(400).json({ error: "You can't report yourself" });
    return;
  }
  const [target] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.id, reportedId));
  if (!target) {
    res.status(404).json({ error: "Player not found" });
    return;
  }

  const windowStart = new Date(Date.now() - REPORT_WINDOW_MS);

  // One report per reporter/reported pair per window — repeat taps are a no-op.
  const [existing] = await db
    .select({ id: chatReportsTable.id })
    .from(chatReportsTable)
    .where(
      and(
        eq(chatReportsTable.reporterId, me),
        eq(chatReportsTable.reportedId, reportedId),
        gte(chatReportsTable.createdAt, windowStart),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(chatReportsTable).values({
      reporterId: me,
      reportedId,
      messageText,
      messageTs: messageTs ? new Date(messageTs) : null,
      reason: reason || null,
    });
  }

  // Auto-mute repeat offenders: enough distinct reporters in the window.
  const [agg] = await db
    .select({
      reporters: sql<number>`count(distinct ${chatReportsTable.reporterId})::int`,
    })
    .from(chatReportsTable)
    .where(
      and(
        eq(chatReportsTable.reportedId, reportedId),
        gte(chatReportsTable.createdAt, windowStart),
      ),
    );
  let autoMuted = false;
  if ((agg?.reporters ?? 0) >= REPORT_AUTO_MUTE_THRESHOLD) {
    await muteUser(reportedId, Date.now() + REPORT_AUTO_MUTE_MS, "reports");
    autoMuted = true;
  }

  req.log.info(
    { reporterId: me, reportedId, autoMuted, duplicate: !!existing },
    "Chat report filed",
  );
  res.json({ ok: true, autoMuted });
});

/** Latest reports (with display names) for admin review. */
router.get(
  "/admin/chat/reports",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const reporterProfile = db
      .select({
        userId: playerProfilesTable.userId,
        displayName: playerProfilesTable.displayName,
      })
      .from(playerProfilesTable)
      .as("reporter_profile");
    const reportedProfile = db
      .select({
        userId: playerProfilesTable.userId,
        displayName: playerProfilesTable.displayName,
      })
      .from(playerProfilesTable)
      .as("reported_profile");

    const rows = await db
      .select({
        id: chatReportsTable.id,
        reporterId: chatReportsTable.reporterId,
        reporterName: reporterProfile.displayName,
        reportedId: chatReportsTable.reportedId,
        reportedName: reportedProfile.displayName,
        messageText: chatReportsTable.messageText,
        messageTs: chatReportsTable.messageTs,
        reason: chatReportsTable.reason,
        status: chatReportsTable.status,
        createdAt: chatReportsTable.createdAt,
      })
      .from(chatReportsTable)
      .leftJoin(
        reporterProfile,
        eq(reporterProfile.userId, chatReportsTable.reporterId),
      )
      .leftJoin(
        reportedProfile,
        eq(reportedProfile.userId, chatReportsTable.reportedId),
      )
      .orderBy(desc(chatReportsTable.createdAt))
      .limit(100);

    res.json({ reports: rows });
  },
);

const muteBody = z.object({
  userId: z.number().int().positive(),
  /** Duration in minutes; 0 lifts the mute. */
  minutes: z.number().int().min(0).max(60 * 24 * 30),
});

/** Manually mute (or unmute with minutes=0) a player. */
router.post(
  "/admin/chat/mute",
  requireAdmin,
  async (req, res): Promise<void> => {
    const parsed = muteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid mute request" });
      return;
    }
    const { userId, minutes } = parsed.data;
    if (minutes === 0) {
      await unmuteUser(userId);
      res.json({ ok: true, mutedUntil: null });
      return;
    }
    const until = Date.now() + minutes * 60_000;
    await muteUser(userId, until, "admin");
    res.json({ ok: true, mutedUntil: until });
  },
);

/** Currently active mutes, for the admin panel. */
router.get(
  "/admin/chat/mutes",
  requireAdmin,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        userId: chatMutesTable.userId,
        displayName: playerProfilesTable.displayName,
        mutedUntil: chatMutesTable.mutedUntil,
        reason: chatMutesTable.reason,
      })
      .from(chatMutesTable)
      .leftJoin(
        playerProfilesTable,
        eq(playerProfilesTable.userId, chatMutesTable.userId),
      )
      .where(gte(chatMutesTable.mutedUntil, new Date()));
    res.json({ mutes: rows });
  },
);

export default router;
