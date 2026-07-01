import { and, eq, count } from "drizzle-orm";
import {
  db,
  usersTable,
  earnedBadgesTable,
  tasksTable,
  programsTable,
  type User,
} from "@workspace/db";
import { levelFromXp } from "./badges";
import { serializeBadges } from "./serialize";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const dbTime = new Date(b + "T00:00:00Z").getTime();
  return Math.round((dbTime - da) / (1000 * 60 * 60 * 24));
}

export interface CompletionOutcome {
  user: User;
  xpAwarded: number;
  leveledUp: boolean;
  newBadgeKeys: string[];
}

/**
 * Award XP for a completed task, update the daily streak, and grant any
 * newly-earned badges. Returns the refreshed user and metadata.
 */
export async function awardTaskCompletion(
  user: User,
  taskXp: number,
): Promise<CompletionOutcome> {
  const prevLevel = levelFromXp(user.xp);
  const today = todayStr();

  let streak = user.streak;
  let longestStreak = user.longestStreak;
  if (user.lastActivityDate !== today) {
    if (user.lastActivityDate && daysBetween(user.lastActivityDate, today) === 1) {
      streak = user.streak + 1;
    } else {
      streak = 1;
    }
    longestStreak = Math.max(longestStreak, streak);
  }

  const newXp = user.xp + taskXp;
  const [updated] = await db
    .update(usersTable)
    .set({ xp: newXp, streak, longestStreak, lastActivityDate: today })
    .where(eq(usersTable.id, user.id))
    .returning();

  const newLevel = levelFromXp(newXp);
  const leveledUp = newLevel > prevLevel;
  const newBadgeKeys = await evaluateBadges(updated);

  return { user: updated, xpAwarded: taskXp, leveledUp, newBadgeKeys };
}

export async function countCompletedTasks(userId: number): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(tasksTable)
    .innerJoin(programsTable, eq(tasksTable.programId, programsTable.id))
    .where(and(eq(tasksTable.completed, true), eq(programsTable.userId, userId)));
  return row?.c ?? 0;
}

export async function evaluateBadges(user: User): Promise<string[]> {
  const level = levelFromXp(user.xp);
  const completedCount = await countCompletedTasks(user.id);

  const eligible: string[] = [];
  if (completedCount >= 1) eligible.push("first_step");
  if (completedCount >= 25) eligible.push("tasks_25");
  if (user.streak >= 3) eligible.push("streak_3");
  if (user.streak >= 7) eligible.push("streak_7");
  if (user.streak >= 30) eligible.push("streak_30");
  if (level >= 2) eligible.push("level_2");
  if (level >= 5) eligible.push("level_5");
  if (user.xp >= 500) eligible.push("xp_500");
  if (user.xp >= 1000) eligible.push("xp_1000");

  if (eligible.length === 0) return [];

  const existing = await db
    .select()
    .from(earnedBadgesTable)
    .where(eq(earnedBadgesTable.userId, user.id));
  const existingKeys = new Set(existing.map((e) => e.badgeKey));

  const toAward = eligible.filter((k) => !existingKeys.has(k));
  if (toAward.length === 0) return [];

  await db
    .insert(earnedBadgesTable)
    .values(toAward.map((badgeKey) => ({ userId: user.id, badgeKey })))
    .onConflictDoNothing();

  return toAward;
}

export async function newBadgesResponse(userId: number, keys: string[]) {
  if (keys.length === 0) return [];
  const rows = await db
    .select()
    .from(earnedBadgesTable)
    .where(eq(earnedBadgesTable.userId, userId));
  const filtered = rows.filter((r) => keys.includes(r.badgeKey));
  return serializeBadges(filtered).filter((b) => keys.includes(b.key));
}

export { todayStr };
