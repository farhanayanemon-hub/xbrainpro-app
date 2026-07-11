import {
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
 * The Fashion Contest: themed rounds players enter their equipped look into,
 * everyone votes on the entries, and top-voted looks win currency when the
 * round closes.
 *
 * The whole thing is server-authoritative:
 * - one entry per player per round (unique index on (round, user)),
 * - one vote per voter per entry (unique index on (entry, voter)), and no
 *   self-voting (enforced in the lib), so nobody can duplicate or self-boost,
 * - rounds open/close on a schedule and pay out exactly once at close (rewards
 *   go through the idempotent wallet ledger; the settled results are snapshotted
 *   onto the entry rows for history).
 */

/**
 * A single contest round. Exactly one round is "open" at a time; older rounds
 * are "closed" once their `closesAt` passes and they have been settled.
 */
export const contestRoundsTable = pgTable("contest_rounds", {
  id: serial("id").primaryKey(),
  /** The round's fashion theme, e.g. "Neon Nights". */
  theme: text("theme").notNull(),
  /** "open" while accepting entries/votes, "closed" once settled. */
  status: text("status").notNull().default("open"),
  opensAt: timestamp("opens_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /** When the round stops accepting entries/votes and is eligible to settle. */
  closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
  /** Set once the round has been ranked and rewards paid; null until then. */
  settledAt: timestamp("settled_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A player's entry into a round: an immutable snapshot of their look at submit
 * time. The look is just the equipped `avatarId` (clothing is baked into the
 * avatar model); name + gender are snapshotted for display so later profile
 * edits don't rewrite past entries. Final placement + reward are written back
 * here when the round settles.
 */
export const contestEntriesTable = pgTable(
  "contest_entries",
  {
    id: serial("id").primaryKey(),
    roundId: integer("round_id")
      .notNull()
      .references(() => contestRoundsTable.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    /** Snapshot of the equipped look (store avatar id). */
    avatarId: text("avatar_id").notNull(),
    /** Snapshot of the player's display name at submit time. */
    displayName: text("display_name").notNull(),
    /** Snapshot of the player's gender at submit time. */
    gender: text("gender").notNull(),
    /** Final 1-based placement, set at settlement; null while the round is open. */
    rank: integer("rank"),
    /** Coins awarded at settlement (0 if none); null while the round is open. */
    rewardCoins: integer("reward_coins"),
    /** Gems awarded at settlement (0 if none); null while the round is open. */
    rewardGems: integer("reward_gems"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    roundIdx: index("contest_entry_round_idx").on(t.roundId),
    // One entry per player per round — the server refuses a second submit.
    entryUnique: uniqueIndex("contest_entry_round_user_unique").on(
      t.roundId,
      t.userId,
    ),
  }),
);

/**
 * A single vote a player cast on an entry. The unique (entry, voter) index
 * enforces one vote per voter per entry; self-votes are rejected in the lib.
 */
export const contestVotesTable = pgTable(
  "contest_votes",
  {
    id: serial("id").primaryKey(),
    roundId: integer("round_id")
      .notNull()
      .references(() => contestRoundsTable.id, { onDelete: "cascade" }),
    entryId: integer("entry_id")
      .notNull()
      .references(() => contestEntriesTable.id, { onDelete: "cascade" }),
    voterId: integer("voter_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    entryIdx: index("contest_vote_entry_idx").on(t.entryId),
    roundIdx: index("contest_vote_round_idx").on(t.roundId),
    // One vote per voter per entry — a repeat is rejected by this index.
    voteUnique: uniqueIndex("contest_vote_entry_voter_unique").on(
      t.entryId,
      t.voterId,
    ),
  }),
);

export type ContestRound = typeof contestRoundsTable.$inferSelect;
export type ContestEntry = typeof contestEntriesTable.$inferSelect;
export type ContestVote = typeof contestVotesTable.$inferSelect;
