import { and, eq } from "drizzle-orm";
import {
  db,
  playerWalletsTable,
  walletTransactionsTable,
  type PlayerWallet,
} from "@workspace/db";

/**
 * Server-authoritative currency wallet for Neura City.
 *
 * Every balance change goes through {@link adjustBalance}, which runs inside a
 * transaction, locks the wallet row with `FOR UPDATE`, refuses to go negative,
 * and (when a `reference` is supplied) is idempotent — so purchases and grants
 * can be safely retried without double-charging. Other features should call the
 * {@link earn} / {@link spend} helpers rather than touching the tables.
 */

/** Soft currency handed to a brand-new player. */
export const STARTING_COINS = 500;
/** Premium currency handed to a brand-new player. */
export const STARTING_GEMS = 25;

export type Currency = "coins" | "gems";

export interface Balance {
  coins: number;
  gems: number;
}

export interface AdjustResult {
  balance: Balance;
  /** False when a duplicate `reference` meant the change was skipped. */
  applied: boolean;
}

export class InsufficientFundsError extends Error {
  readonly name = "InsufficientFundsError";
  readonly currency: Currency;
  readonly required: number;
  readonly available: number;
  constructor(currency: Currency, required: number, available: number) {
    super(`Not enough ${currency}`);
    this.currency = currency;
    this.required = required;
    this.available = available;
  }
}

function toBalance(w: PlayerWallet): Balance {
  return { coins: w.coins, gems: w.gems };
}

/**
 * Ensure the player has a wallet, granting the one-time starting balance the
 * first time it is created. Safe to call on every request.
 */
export async function getOrCreateWallet(userId: number): Promise<Balance> {
  const [existing] = await db
    .select()
    .from(playerWalletsTable)
    .where(eq(playerWalletsTable.userId, userId));
  if (existing) return toBalance(existing);

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(playerWalletsTable)
      .values({ userId, coins: STARTING_COINS, gems: STARTING_GEMS })
      .onConflictDoNothing({ target: playerWalletsTable.userId })
      .returning();

    if (!created) {
      // Lost a race — another request created it first; read it back.
      const [w] = await tx
        .select()
        .from(playerWalletsTable)
        .where(eq(playerWalletsTable.userId, userId));
      return toBalance(w!);
    }

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

    return toBalance(created);
  });
}

/** Read the current balance (creating the wallet + grant if missing). */
export async function getBalance(userId: number): Promise<Balance> {
  return getOrCreateWallet(userId);
}

/**
 * Atomically move currency. `delta` may be positive (earn) or negative
 * (spend). Locks the wallet row, refuses to go below zero (throws
 * {@link InsufficientFundsError}), and writes a ledger entry. When `reference`
 * is supplied the operation is idempotent: a repeat with the same
 * (userId, reference) leaves the balance untouched and returns applied=false.
 */
export async function adjustBalance(
  userId: number,
  currency: Currency,
  delta: number,
  reason: string,
  reference?: string,
): Promise<AdjustResult> {
  await getOrCreateWallet(userId);

  return db.transaction(async (tx) => {
    // Lock the wallet row FIRST so all balance changes for this user serialize.
    // This makes the duplicate-reference check below race-safe: two concurrent
    // requests with the same reference can't both pass it — the second blocks
    // on the lock until the first commits, then sees the ledger row and returns
    // applied=false instead of colliding on the unique index.
    const [wallet] = await tx
      .select()
      .from(playerWalletsTable)
      .where(eq(playerWalletsTable.userId, userId))
      .for("update");

    if (reference) {
      const [dup] = await tx
        .select({ id: walletTransactionsTable.id })
        .from(walletTransactionsTable)
        .where(
          and(
            eq(walletTransactionsTable.userId, userId),
            eq(walletTransactionsTable.reference, reference),
          ),
        );
      if (dup) {
        return { balance: toBalance(wallet!), applied: false };
      }
    }

    const current = currency === "coins" ? wallet!.coins : wallet!.gems;
    const next = current + delta;
    if (next < 0) {
      throw new InsufficientFundsError(currency, -delta, current);
    }

    const set =
      currency === "coins"
        ? { coins: next, updatedAt: new Date() }
        : { gems: next, updatedAt: new Date() };
    const [updated] = await tx
      .update(playerWalletsTable)
      .set(set)
      .where(eq(playerWalletsTable.userId, userId))
      .returning();

    await tx.insert(walletTransactionsTable).values({
      userId,
      currency,
      amount: delta,
      reason,
      reference: reference ?? null,
      balanceAfter: next,
    });

    return { balance: toBalance(updated!), applied: true };
  });
}

/** Award currency. `amount` is treated as positive. */
export function earn(
  userId: number,
  currency: Currency,
  amount: number,
  reason: string,
  reference?: string,
): Promise<AdjustResult> {
  return adjustBalance(userId, currency, Math.abs(amount), reason, reference);
}

/** Charge currency. `amount` is treated as positive; fails if unaffordable. */
export function spend(
  userId: number,
  currency: Currency,
  amount: number,
  reason: string,
  reference?: string,
): Promise<AdjustResult> {
  return adjustBalance(userId, currency, -Math.abs(amount), reason, reference);
}
