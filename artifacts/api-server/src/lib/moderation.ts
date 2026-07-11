import { db, chatMutesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Chat mute persistence + live enforcement glue.
 *
 * A mute lives in `chat_mutes` (one upserted row per user) so it survives
 * reconnects and multiple server instances, and is ALSO pushed into the live
 * realtime client (via the callback registered by realtime.ts) so an online
 * offender is silenced immediately without waiting for a reconnect.
 */

/** Auto-mute duration when distinct reporters pile up. */
export const REPORT_AUTO_MUTE_MS = 10 * 60 * 1000;
/** Distinct reporters within the window needed to trigger an auto-mute. */
export const REPORT_AUTO_MUTE_THRESHOLD = 3;
/** Window for counting distinct reporters. */
export const REPORT_WINDOW_MS = 15 * 60 * 1000;

/** Auto-mute duration when a player keeps tripping the profanity filter. */
export const PROFANITY_AUTO_MUTE_MS = 5 * 60 * 1000;
/** Masked messages within the window that trigger a profanity auto-mute. */
export const PROFANITY_STRIKE_THRESHOLD = 3;
/** Window for counting profanity strikes. */
export const PROFANITY_STRIKE_WINDOW_MS = 10 * 60 * 1000;

type LiveMuteHook = (userId: number, untilMs: number) => void;
let liveMuteHook: LiveMuteHook | null = null;

/** realtime.ts registers this so DB mutes reach online sockets instantly. */
export function registerLiveMuteHook(hook: LiveMuteHook): void {
  liveMuteHook = hook;
}

/** The user's active mute expiry (ms epoch), or null when not muted. */
export async function getMuteUntil(userId: number): Promise<number | null> {
  const [row] = await db
    .select({ mutedUntil: chatMutesTable.mutedUntil })
    .from(chatMutesTable)
    .where(eq(chatMutesTable.userId, userId));
  if (!row) return null;
  const until = row.mutedUntil.getTime();
  return until > Date.now() ? until : null;
}

/**
 * Mute a user until `untilMs`. Upserts the DB row (keeping the later expiry
 * if one already exists) and pushes the mute to their live socket, if any.
 */
export async function muteUser(
  userId: number,
  untilMs: number,
  reason: string,
): Promise<void> {
  await db
    .insert(chatMutesTable)
    .values({ userId, mutedUntil: new Date(untilMs), reason })
    .onConflictDoUpdate({
      target: chatMutesTable.userId,
      set: {
        mutedUntil: sql`greatest(${chatMutesTable.mutedUntil}, excluded.muted_until)`,
        reason: sql`excluded.reason`,
        updatedAt: sql`now()`,
      },
    });
  liveMuteHook?.(userId, untilMs);
  logger.info({ userId, untilMs, reason }, "Chat mute applied");
}

/** Lift a user's mute immediately (admin action). */
export async function unmuteUser(userId: number): Promise<void> {
  await db.delete(chatMutesTable).where(eq(chatMutesTable.userId, userId));
  liveMuteHook?.(userId, 0);
  logger.info({ userId }, "Chat mute lifted");
}
