import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { usersTable } from "./users";

/**
 * Per-player, per-day progress on a Daily Task. One row per
 * (player, day, task). `dayKey` is a UTC calendar day (YYYY-MM-DD) so tasks
 * reset at the day boundary simply by writing to a new key. `claimed` guards
 * the reward payout — a task can only be claimed once, and the matching
 * wallet ledger reference makes the payout idempotent even under retries.
 */
export const dailyTaskProgressTable = pgTable(
  "daily_task_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** UTC calendar day this progress belongs to, e.g. "2026-07-11". */
    dayKey: text("day_key").notNull(),
    /** Stable task identifier, e.g. "login", "play_city". */
    taskId: text("task_id").notNull(),
    /** How many times the tracked action has happened today. */
    progress: integer("progress").notNull().default(0),
    /** True once the reward has been paid out for this day. */
    claimed: boolean("claimed").notNull().default(false),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userDayTaskUnique: uniqueIndex("daily_task_user_day_task_unique").on(
      t.userId,
      t.dayKey,
      t.taskId,
    ),
    userDayIdx: index("daily_task_user_day_idx").on(t.userId, t.dayKey),
  }),
);

/**
 * A player's login-streak counter. One row per account. Advanced once per day
 * the first time the player is seen: consecutive days increment the streak,
 * a gap resets it to 1. Drives the escalating daily check-in reward.
 */
export const playerStreaksTable = pgTable("player_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  /** Number of consecutive days logged in, including today. */
  currentStreak: integer("current_streak").notNull().default(0),
  /** Best streak the player has ever reached. */
  longestStreak: integer("longest_streak").notNull().default(0),
  /** UTC calendar day of the most recent login, e.g. "2026-07-11". */
  lastLoginDay: text("last_login_day"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Append-only record of every Mystery Box open. `openId` is a client-supplied
 * idempotency key: replaying the same open (a retry) returns the stored reward
 * instead of charging gems again. The reward is rolled once, server-side, and
 * frozen here so a retry can never re-roll for a better prize.
 */
export const mysteryBoxOpensTable = pgTable(
  "mystery_box_opens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** Client-generated idempotency key for this open attempt. */
    openId: text("open_id").notNull(),
    /** "coins" | "gems" | "avatar". */
    rewardType: text("reward_type").notNull(),
    /** "coins" | "gems" for currency rewards, NULL for an avatar reward. */
    rewardCurrency: text("reward_currency"),
    /** Currency amount awarded (0 for an avatar reward). */
    rewardAmount: integer("reward_amount").notNull().default(0),
    /** The avatar look id awarded, NULL for a currency reward. */
    rewardAvatarId: text("reward_avatar_id"),
    /** Gems spent to open the box. */
    cost: integer("cost").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userOpenUnique: uniqueIndex("mystery_box_user_open_unique").on(
      t.userId,
      t.openId,
    ),
    userIdx: index("mystery_box_user_idx").on(t.userId),
  }),
);

export type DailyTaskProgress = typeof dailyTaskProgressTable.$inferSelect;
export type PlayerStreak = typeof playerStreaksTable.$inferSelect;
export type MysteryBoxOpen = typeof mysteryBoxOpensTable.$inferSelect;
