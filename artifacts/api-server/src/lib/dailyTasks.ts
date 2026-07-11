import { and, eq } from "drizzle-orm";
import {
  db,
  dailyTaskProgressTable,
  playerStreaksTable,
} from "@workspace/db";
import { adjustWithinTx, getOrCreateWallet, type Balance, type Currency } from "./wallet";

/**
 * Daily Tasks + login streak for Neura City.
 *
 * A small fixed set of tasks resets every UTC day. Progress on some tasks is
 * driven by real server events (entering the city, sending a chat); others are
 * reported by the client. Every task caps at its goal, so client-reported
 * progress can't be farmed for extra value. Rewards are paid server-side and
 * claimed exactly once per day — the claim is guarded by both a `claimed` flag
 * and an idempotent wallet ledger reference, so retries never double-pay.
 *
 * The login streak advances once per day the player is first seen; consecutive
 * days grow the streak and a gap resets it. The daily check-in reward scales
 * with the streak, so returning every day is worth more.
 */

export interface DailyTaskDef {
  id: string;
  title: string;
  description: string;
  goal: number;
  /** Base reward; the login task's amount is overridden by the streak. */
  reward: { currency: Currency; amount: number };
  /**
   * Whether a client request may report progress for this task. Server-event
   * tasks (login, entering the city, chatting) are driven by trusted server
   * hooks only — a client can NEVER advance them, or they'd be farmable.
   */
  clientAdvancable: boolean;
}

export const DAILY_TASKS: DailyTaskDef[] = [
  {
    id: "login",
    title: "Daily Check-In",
    description: "Log in today",
    goal: 1,
    reward: { currency: "coins", amount: 50 },
    clientAdvancable: false, // auto-completed server-side on board fetch
  },
  {
    id: "play_city",
    title: "Hit the Streets",
    description: "Enter Neura City",
    goal: 1,
    reward: { currency: "coins", amount: 150 },
    clientAdvancable: false, // driven by the realtime join hook
  },
  {
    id: "send_chat",
    title: "Say Hello",
    description: "Send a message in city chat",
    goal: 1,
    reward: { currency: "coins", amount: 80 },
    clientAdvancable: false, // driven by the chat-broadcast hook
  },
  {
    id: "visit_store",
    title: "Window Shopping",
    description: "Visit the Store",
    goal: 1,
    reward: { currency: "gems", amount: 3 },
    clientAdvancable: true, // the only task a client may self-report
  },
];

const TASK_BY_ID = new Map(DAILY_TASKS.map((t) => [t.id, t]));

/** How much the daily check-in grows per streak day, and its ceiling. */
const STREAK_STEP_COINS = 25;
const STREAK_MAX_DAYS = 7;

export interface DailyTaskView {
  id: string;
  title: string;
  description: string;
  goal: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardCurrency: Currency;
  rewardAmount: number;
}

export interface DailyState {
  dayKey: string;
  streak: number;
  longestStreak: number;
  tasks: DailyTaskView[];
}

export interface ClaimResult {
  claimed: boolean;
  alreadyClaimed: boolean;
  rewardCurrency: Currency;
  rewardAmount: number;
  balance: Balance;
}

/** UTC calendar day, e.g. "2026-07-11". */
export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** The UTC calendar day immediately before `dayKey`. */
function prevKey(dayKey: string): string {
  const d = new Date(`${dayKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** The streak-scaled reward amount for the daily check-in task. */
function loginRewardAmount(streak: number): number {
  const capped = Math.min(Math.max(streak, 1), STREAK_MAX_DAYS);
  return 50 + (capped - 1) * STREAK_STEP_COINS;
}

/**
 * Advance today's login streak, exactly once per day. Locks the streak row so
 * concurrent first-of-day requests can't both bump it. Returns the current
 * streak numbers after any advance.
 */
async function advanceStreak(
  userId: number,
  dayKey: string,
): Promise<{ current: number; longest: number }> {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(playerStreaksTable)
      .where(eq(playerStreaksTable.userId, userId))
      .for("update");

    if (!existing) {
      const [created] = await tx
        .insert(playerStreaksTable)
        .values({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastLoginDay: dayKey,
        })
        .onConflictDoNothing({ target: playerStreaksTable.userId })
        .returning();
      if (created) return { current: created.currentStreak, longest: created.longestStreak };
      // Lost a race — read the row the other request created.
      const [row] = await tx
        .select()
        .from(playerStreaksTable)
        .where(eq(playerStreaksTable.userId, userId));
      return { current: row!.currentStreak, longest: row!.longestStreak };
    }

    // Already counted today — no change.
    if (existing.lastLoginDay === dayKey) {
      return { current: existing.currentStreak, longest: existing.longestStreak };
    }

    const consecutive = existing.lastLoginDay === prevKey(dayKey);
    const current = consecutive ? existing.currentStreak + 1 : 1;
    const longest = Math.max(existing.longestStreak, current);
    await tx
      .update(playerStreaksTable)
      .set({
        currentStreak: current,
        longestStreak: longest,
        lastLoginDay: dayKey,
        updatedAt: new Date(),
      })
      .where(eq(playerStreaksTable.userId, userId));
    return { current, longest };
  });
}

/** Upsert a progress row, capping at `goal`. Used by auto + client advances. */
async function bumpProgress(
  userId: number,
  dayKey: string,
  taskId: string,
  goal: number,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(dailyTaskProgressTable)
    .where(
      and(
        eq(dailyTaskProgressTable.userId, userId),
        eq(dailyTaskProgressTable.dayKey, dayKey),
        eq(dailyTaskProgressTable.taskId, taskId),
      ),
    );

  if (!existing) {
    await db
      .insert(dailyTaskProgressTable)
      .values({ userId, dayKey, taskId, progress: 1 })
      .onConflictDoNothing({
        target: [
          dailyTaskProgressTable.userId,
          dailyTaskProgressTable.dayKey,
          dailyTaskProgressTable.taskId,
        ],
      });
    return;
  }

  if (existing.progress >= goal) return; // already maxed; nothing to do
  await db
    .update(dailyTaskProgressTable)
    .set({ progress: Math.min(existing.progress + 1, goal), updatedAt: new Date() })
    .where(eq(dailyTaskProgressTable.id, existing.id));
}

/**
 * Record a tracked action against today's task, if such a task exists. Safe to
 * call fire-and-forget from gameplay hooks — unknown ids are ignored and it
 * never throws into the caller's path.
 */
export async function advanceTask(userId: number, taskId: string): Promise<void> {
  const def = TASK_BY_ID.get(taskId);
  if (!def) return;
  await bumpProgress(userId, todayKey(), taskId, def.goal);
}

/**
 * Advance a task on behalf of a *client* request. Only tasks explicitly marked
 * `clientAdvancable` may be reported this way; server-event tasks (login,
 * play_city, send_chat) are ignored here so a modified client can't forge their
 * progress. Returns whether the task was accepted.
 */
export async function advanceTaskFromClient(
  userId: number,
  taskId: string,
): Promise<boolean> {
  const def = TASK_BY_ID.get(taskId);
  if (!def || !def.clientAdvancable) return false;
  await bumpProgress(userId, todayKey(), taskId, def.goal);
  return true;
}

/**
 * Build the player's daily task board. Counts this call as today's login (so
 * the check-in task auto-completes and the streak advances), then returns each
 * task with its live progress, claim state, and streak-aware reward.
 */
export async function getDailyState(userId: number): Promise<DailyState> {
  const dayKey = todayKey();
  const streak = await advanceStreak(userId, dayKey);
  // Fetching the board counts as logging in today.
  await bumpProgress(userId, dayKey, "login", 1);

  const rows = await db
    .select()
    .from(dailyTaskProgressTable)
    .where(
      and(
        eq(dailyTaskProgressTable.userId, userId),
        eq(dailyTaskProgressTable.dayKey, dayKey),
      ),
    );
  const byTask = new Map(rows.map((r) => [r.taskId, r]));

  const tasks: DailyTaskView[] = DAILY_TASKS.map((def) => {
    const row = byTask.get(def.id);
    const progress = row?.progress ?? 0;
    const rewardAmount =
      def.id === "login" ? loginRewardAmount(streak.current) : def.reward.amount;
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      goal: def.goal,
      progress,
      completed: progress >= def.goal,
      claimed: row?.claimed ?? false,
      rewardCurrency: def.reward.currency,
      rewardAmount,
    };
  });

  return {
    dayKey,
    streak: streak.current,
    longestStreak: streak.longest,
    tasks,
  };
}

/**
 * Claim a completed task's reward. Atomic and idempotent: locks the progress
 * row, verifies the goal is met and the reward is unclaimed, marks it claimed,
 * and credits the wallet in the same transaction with a per-day reference so a
 * retry can never double-pay.
 */
export async function claimTask(userId: number, taskId: string): Promise<ClaimResult> {
  const def = TASK_BY_ID.get(taskId);
  if (!def) throw new UnknownTaskError(taskId);

  const dayKey = todayKey();
  await getOrCreateWallet(userId);

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(dailyTaskProgressTable)
      .where(
        and(
          eq(dailyTaskProgressTable.userId, userId),
          eq(dailyTaskProgressTable.dayKey, dayKey),
          eq(dailyTaskProgressTable.taskId, taskId),
        ),
      )
      .for("update");

    if (!row || row.progress < def.goal) {
      throw new TaskNotCompleteError(taskId);
    }

    // Reward amount for the check-in scales with the current streak.
    let rewardAmount = def.reward.amount;
    if (def.id === "login") {
      const [streakRow] = await tx
        .select({ current: playerStreaksTable.currentStreak })
        .from(playerStreaksTable)
        .where(eq(playerStreaksTable.userId, userId));
      rewardAmount = loginRewardAmount(streakRow?.current ?? 1);
    }

    if (row.claimed) {
      const balance = await getOrCreateWallet(userId);
      return {
        claimed: false,
        alreadyClaimed: true,
        rewardCurrency: def.reward.currency,
        rewardAmount,
        balance,
      };
    }

    const { balance } = await adjustWithinTx(
      tx,
      userId,
      def.reward.currency,
      rewardAmount,
      `daily:${taskId}:${dayKey}`,
      `daily:${taskId}:${dayKey}`,
    );

    await tx
      .update(dailyTaskProgressTable)
      .set({ claimed: true, claimedAt: new Date(), updatedAt: new Date() })
      .where(eq(dailyTaskProgressTable.id, row.id));

    return {
      claimed: true,
      alreadyClaimed: false,
      rewardCurrency: def.reward.currency,
      rewardAmount,
      balance,
    };
  });
}

export class UnknownTaskError extends Error {
  readonly name = "UnknownTaskError";
  constructor(taskId: string) {
    super(`Unknown daily task: ${taskId}`);
  }
}

export class TaskNotCompleteError extends Error {
  readonly name = "TaskNotCompleteError";
  constructor(taskId: string) {
    super(`Daily task not complete: ${taskId}`);
  }
}
