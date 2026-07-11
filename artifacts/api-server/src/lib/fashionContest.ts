import { and, asc, count, desc, eq, gt, lte, sql } from "drizzle-orm";
import {
  contestEntriesTable,
  contestRoundsTable,
  contestVotesTable,
  db,
  playerProfilesTable,
  playerWalletsTable,
  walletTransactionsTable,
  type ContestRound,
} from "@workspace/db";
import { adjustWithinTx, STARTING_COINS, STARTING_GEMS, type Tx } from "./wallet";

/**
 * The Fashion Contest — themed rounds players enter their equipped look into,
 * vote on, and win currency from.
 *
 * Everything here is server-authoritative:
 * - Rounds open/close on a fixed schedule, evaluated lazily on each request so
 *   no background worker is needed. {@link ensureActiveRound} takes a Postgres
 *   advisory lock so exactly one request settles a due round + opens the next.
 * - Settlement ranks entries by vote count and pays the top placements once,
 *   using the idempotent wallet ledger (a repeat with the same reference is a
 *   no-op), so rewards can never be double-paid.
 * - One entry per player per round and one vote per voter per entry are enforced
 *   by unique indexes; self-votes are rejected here. Nobody can duplicate or
 *   self-boost.
 */

/** How long each round stays open before it closes and pays out. */
export const ROUND_DURATION_MS = 24 * 60 * 60 * 1000;

/** Themes cycle in order, one per round, so the contest always feels fresh. */
export const THEMES = [
  "Neon Nights",
  "Street Style",
  "Future Formal",
  "Summer Vibes",
  "Midnight Gala",
  "Retro Rewind",
];

/**
 * Currency paid to the top placements when a round settles. Index 0 = 1st place.
 * Only entries that received at least one vote are eligible for a reward.
 */
export const REWARDS: { coins: number; gems: number }[] = [
  { coins: 500, gems: 10 },
  { coins: 250, gems: 5 },
  { coins: 100, gems: 0 },
];

/** Arbitrary constant key for the contest scheduling advisory lock. */
const CONTEST_LOCK_KEY = 748213;

export class ContestClosedError extends Error {
  readonly name = "ContestClosedError";
  constructor() {
    super("The contest round is closed");
  }
}
export class AlreadyEnteredError extends Error {
  readonly name = "AlreadyEnteredError";
  constructor() {
    super("You have already entered this round");
  }
}
export class SelfVoteError extends Error {
  readonly name = "SelfVoteError";
  constructor() {
    super("You can't vote for your own entry");
  }
}
export class AlreadyVotedError extends Error {
  readonly name = "AlreadyVotedError";
  constructor() {
    super("You have already voted for this entry");
  }
}
export class EntryNotFoundError extends Error {
  readonly name = "EntryNotFoundError";
  constructor() {
    super("That entry is not in the current round");
  }
}
export class NoProfileError extends Error {
  readonly name = "NoProfileError";
  constructor() {
    super("Create your profile before entering the contest");
  }
}

export interface ContestEntryView {
  id: number;
  avatarId: string;
  displayName: string;
  gender: string;
  votes: number;
  /** True when this entry belongs to the requesting player. */
  isMine: boolean;
  /** True when the requesting player has already voted for this entry. */
  votedByMe: boolean;
}

export interface ContestResultView {
  entryId: number;
  rank: number;
  avatarId: string;
  displayName: string;
  votes: number;
  rewardCoins: number;
  rewardGems: number;
}

export interface ContestState {
  round: {
    id: number;
    theme: string;
    opensAt: string;
    closesAt: string;
  };
  entries: ContestEntryView[];
  /** The requesting player's entry id in this round, or null if not entered. */
  myEntryId: number | null;
  /** The most recent settled round's ranked results, for a "past winners" view. */
  lastResults: {
    roundId: number;
    theme: string;
    settledAt: string;
    winners: ContestResultView[];
  } | null;
}

/** Pick the theme for the Nth round (0-based), cycling through {@link THEMES}. */
function themeForIndex(index: number): string {
  return THEMES[index % THEMES.length]!;
}

/**
 * Ensure a wallet row exists for `userId` inside the given transaction, granting
 * the one-time starting balance if it is missing. Mirrors getOrCreateWallet but
 * composes into a caller-supplied transaction (settlement pays many winners in
 * one tx). Existing players already have a wallet, so this is usually a no-op.
 */
async function ensureWalletTx(tx: Tx, userId: number): Promise<void> {
  const [existing] = await tx
    .select({ id: playerWalletsTable.id })
    .from(playerWalletsTable)
    .where(eq(playerWalletsTable.userId, userId));
  if (existing) return;

  const [created] = await tx
    .insert(playerWalletsTable)
    .values({ userId, coins: STARTING_COINS, gems: STARTING_GEMS })
    .onConflictDoNothing({ target: playerWalletsTable.userId })
    .returning();
  if (!created) return; // lost a race — another writer created it

  await tx
    .insert(walletTransactionsTable)
    .values([
      {
        userId,
        currency: "coins",
        amount: STARTING_COINS,
        reason: "grant:new-player",
        reference: "grant:new-player:coins",
        balanceAfter: STARTING_COINS,
      },
      {
        userId,
        currency: "gems",
        amount: STARTING_GEMS,
        reason: "grant:new-player",
        reference: "grant:new-player:gems",
        balanceAfter: STARTING_GEMS,
      },
    ])
    .onConflictDoNothing();
}

/**
 * Rank the entries of a due round and pay the top placements, then mark the
 * round closed. Runs inside the advisory-locked transaction so it happens once.
 * Rewards use idempotent references so even a duplicate settlement can't
 * double-pay. Every entry gets its final `rank`; winners also get their reward
 * columns filled for the history view.
 */
async function settleRoundTx(tx: Tx, round: ContestRound): Promise<void> {
  // Guard: never settle a round twice.
  if (round.status === "closed" || round.settledAt) return;

  const rows = await tx
    .select({
      id: contestEntriesTable.id,
      userId: contestEntriesTable.userId,
      createdAt: contestEntriesTable.createdAt,
      votes: count(contestVotesTable.id),
    })
    .from(contestEntriesTable)
    .leftJoin(
      contestVotesTable,
      eq(contestVotesTable.entryId, contestEntriesTable.id),
    )
    .where(eq(contestEntriesTable.roundId, round.id))
    .groupBy(contestEntriesTable.id)
    // Most votes first; earliest submission breaks ties.
    .orderBy(desc(count(contestVotesTable.id)), asc(contestEntriesTable.createdAt));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const rank = i + 1;
    const tier = REWARDS[i];
    // Only reward top placements that actually earned a vote.
    const eligible = !!tier && row.votes > 0;
    const rewardCoins = eligible ? tier!.coins : 0;
    const rewardGems = eligible ? tier!.gems : 0;

    if (rewardCoins > 0 || rewardGems > 0) {
      await ensureWalletTx(tx, row.userId);
      if (rewardCoins > 0) {
        await adjustWithinTx(
          tx,
          row.userId,
          "coins",
          rewardCoins,
          `contest:reward:${round.id}:${row.id}`,
          `contest:reward:${round.id}:${row.id}:coins`,
        );
      }
      if (rewardGems > 0) {
        await adjustWithinTx(
          tx,
          row.userId,
          "gems",
          rewardGems,
          `contest:reward:${round.id}:${row.id}`,
          `contest:reward:${round.id}:${row.id}:gems`,
        );
      }
    }

    await tx
      .update(contestEntriesTable)
      .set({ rank, rewardCoins, rewardGems })
      .where(eq(contestEntriesTable.id, row.id));
  }

  await tx
    .update(contestRoundsTable)
    .set({ status: "closed", settledAt: new Date() })
    .where(eq(contestRoundsTable.id, round.id));
}

/**
 * Return the current open round, settling+rotating first if the previous one is
 * due. Serialized across requests with a transaction-scoped advisory lock so a
 * due round is settled and the next opened exactly once.
 */
export async function ensureActiveRound(): Promise<ContestRound> {
  return db.transaction((tx) => ensureActiveRoundTx(tx));
}

/**
 * The lock+settle+rotate body, runnable inside a caller's transaction so a write
 * (entry/vote) can happen in the *same* locked transaction as round resolution.
 * This closes the round-boundary race: because the advisory lock is held until
 * the caller's transaction commits, no concurrent request can settle/rotate the
 * round between the time we hand it back and the time the caller writes to it.
 */
async function ensureActiveRoundTx(tx: Tx): Promise<ContestRound> {
  await tx.execute(sql`SELECT pg_advisory_xact_lock(${CONTEST_LOCK_KEY})`);
  const now = new Date();

  // Settle every open round whose time is up (normally at most one).
  const due = await tx
    .select()
    .from(contestRoundsTable)
    .where(
      and(
        eq(contestRoundsTable.status, "open"),
        lte(contestRoundsTable.closesAt, now),
      ),
    );
  for (const round of due) {
    await settleRoundTx(tx, round);
  }

  // Reuse a still-live open round if one exists.
  const [live] = await tx
    .select()
    .from(contestRoundsTable)
    .where(
      and(
        eq(contestRoundsTable.status, "open"),
        gt(contestRoundsTable.closesAt, now),
      ),
    )
    .orderBy(desc(contestRoundsTable.id))
    .limit(1);
  if (live) return live;

  const [{ total }] = await tx
    .select({ total: count() })
    .from(contestRoundsTable);
  const theme = themeForIndex(total ?? 0);

  const [created] = await tx
    .insert(contestRoundsTable)
    .values({
      theme,
      status: "open",
      opensAt: now,
      closesAt: new Date(now.getTime() + ROUND_DURATION_MS),
    })
    .returning();
  return created!;
}

/** The most recent settled round's ranked winners, for the "past results" view. */
async function getLastResults(
  excludeRoundId: number,
): Promise<ContestState["lastResults"]> {
  const [last] = await db
    .select()
    .from(contestRoundsTable)
    .where(eq(contestRoundsTable.status, "closed"))
    .orderBy(desc(contestRoundsTable.settledAt))
    .limit(1);
  if (!last || last.id === excludeRoundId) return null;

  const winners = await db
    .select({
      entryId: contestEntriesTable.id,
      rank: contestEntriesTable.rank,
      avatarId: contestEntriesTable.avatarId,
      displayName: contestEntriesTable.displayName,
      rewardCoins: contestEntriesTable.rewardCoins,
      rewardGems: contestEntriesTable.rewardGems,
      votes: count(contestVotesTable.id),
    })
    .from(contestEntriesTable)
    .leftJoin(
      contestVotesTable,
      eq(contestVotesTable.entryId, contestEntriesTable.id),
    )
    .where(eq(contestEntriesTable.roundId, last.id))
    .groupBy(contestEntriesTable.id)
    .orderBy(asc(contestEntriesTable.rank))
    .limit(REWARDS.length);

  return {
    roundId: last.id,
    theme: last.theme,
    settledAt: (last.settledAt ?? last.closesAt).toISOString(),
    winners: winners.map((w) => ({
      entryId: w.entryId,
      rank: w.rank ?? 0,
      avatarId: w.avatarId,
      displayName: w.displayName,
      votes: w.votes,
      rewardCoins: w.rewardCoins ?? 0,
      rewardGems: w.rewardGems ?? 0,
    })),
  };
}

/** The full contest view for a player: the live round, its entries, and history. */
export async function getContestState(userId: number): Promise<ContestState> {
  const round = await ensureActiveRound();

  const rows = await db
    .select({
      id: contestEntriesTable.id,
      userId: contestEntriesTable.userId,
      avatarId: contestEntriesTable.avatarId,
      displayName: contestEntriesTable.displayName,
      gender: contestEntriesTable.gender,
      votes: count(contestVotesTable.id),
      // 1 when the requesting player has a vote on this entry, else 0.
      myVotes: sql<number>`count(*) filter (where ${contestVotesTable.voterId} = ${userId})`,
    })
    .from(contestEntriesTable)
    .leftJoin(
      contestVotesTable,
      eq(contestVotesTable.entryId, contestEntriesTable.id),
    )
    .where(eq(contestEntriesTable.roundId, round.id))
    .groupBy(contestEntriesTable.id)
    .orderBy(desc(count(contestVotesTable.id)), asc(contestEntriesTable.createdAt));

  let myEntryId: number | null = null;
  const entries: ContestEntryView[] = rows.map((r) => {
    const isMine = r.userId === userId;
    if (isMine) myEntryId = r.id;
    return {
      id: r.id,
      avatarId: r.avatarId,
      displayName: r.displayName,
      gender: r.gender,
      votes: Number(r.votes),
      isMine,
      votedByMe: Number(r.myVotes) > 0,
    };
  });

  const lastResults = await getLastResults(round.id);

  return {
    round: {
      id: round.id,
      theme: round.theme,
      opensAt: round.opensAt.toISOString(),
      closesAt: round.closesAt.toISOString(),
    },
    entries,
    myEntryId,
    lastResults,
  };
}

/**
 * Submit the player's equipped look into the active round. Snapshots their name
 * + gender so later profile edits don't rewrite past entries. Throws
 * {@link AlreadyEnteredError} on a second submit (enforced by a unique index).
 */
export async function submitEntry(
  userId: number,
  avatarId: string,
): Promise<ContestState> {
  const clean = avatarId.trim().slice(0, 64);
  if (!clean) throw new EntryNotFoundError();

  const [profile] = await db
    .select({
      displayName: playerProfilesTable.displayName,
      gender: playerProfilesTable.gender,
    })
    .from(playerProfilesTable)
    .where(eq(playerProfilesTable.userId, userId));
  if (!profile) throw new NoProfileError();

  // Resolve the round and insert in one locked transaction so the round cannot
  // settle/rotate between resolution and the write.
  await db.transaction(async (tx) => {
    const round = await ensureActiveRoundTx(tx);
    try {
      await tx.insert(contestEntriesTable).values({
        roundId: round.id,
        userId,
        avatarId: clean,
        displayName: profile.displayName,
        gender: profile.gender,
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw new AlreadyEnteredError();
      throw err;
    }
  });

  return getContestState(userId);
}

/**
 * Cast a vote for an entry in the active round. Rejects voting for your own
 * entry ({@link SelfVoteError}) and a repeat vote ({@link AlreadyVotedError},
 * enforced by a unique index). Returns the refreshed state.
 */
export async function castVote(
  voterId: number,
  entryId: number,
): Promise<ContestState> {
  // Resolve the round, validate, and insert in one locked transaction so the
  // round cannot settle/rotate between the check and the write.
  await db.transaction(async (tx) => {
    const round = await ensureActiveRoundTx(tx);

    const [entry] = await tx
      .select({
        id: contestEntriesTable.id,
        userId: contestEntriesTable.userId,
        roundId: contestEntriesTable.roundId,
      })
      .from(contestEntriesTable)
      .where(eq(contestEntriesTable.id, entryId));

    // Only entries in the live round are votable.
    if (!entry || entry.roundId !== round.id) throw new EntryNotFoundError();
    if (entry.userId === voterId) throw new SelfVoteError();

    try {
      await tx.insert(contestVotesTable).values({
        roundId: round.id,
        entryId: entry.id,
        voterId,
      });
    } catch (err) {
      if (isUniqueViolation(err)) throw new AlreadyVotedError();
      throw err;
    }
  });

  return getContestState(voterId);
}

/**
 * Postgres unique-violation detector (error code 23505). Drizzle wraps the
 * driver error, so walk the `cause` chain to find the original pg error code.
 */
function isUniqueViolation(err: unknown): boolean {
  let cur: unknown = err;
  for (let depth = 0; depth < 5 && cur; depth++) {
    if (
      typeof cur === "object" &&
      cur !== null &&
      "code" in cur &&
      (cur as { code?: unknown }).code === "23505"
    ) {
      return true;
    }
    cur =
      typeof cur === "object" && cur !== null && "cause" in cur
        ? (cur as { cause?: unknown }).cause
        : undefined;
  }
  return false;
}
