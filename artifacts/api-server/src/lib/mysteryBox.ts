import { randomInt } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  db,
  mysteryBoxOpensTable,
  playerWalletsTable,
} from "@workspace/db";
import {
  adjustWithinTx,
  getOrCreateWallet,
  InsufficientFundsError,
  type Balance,
  type Currency,
} from "./wallet";

/**
 * The Mystery Box: spend gems to open, receive a weighted random reward
 * (currency or a store look).
 *
 * Correctness rules:
 * - The whole open — charge, reward roll, and payout — happens in ONE
 *   transaction, so a player can never be charged without getting the reward.
 * - `openId` is a client idempotency key. A retry with the same id returns the
 *   already-rolled reward instead of charging again, so a dropped response or
 *   double-tap can't drain gems or re-roll for a better prize.
 * - The reward is chosen with a cryptographically-seeded weighted draw on the
 *   server; the client never influences the outcome.
 */

/** Gems charged to open one box. */
export const MYSTERY_BOX_COST = 15;

export type MysteryRewardType = "coins" | "gems" | "avatar";

interface PoolEntry {
  type: MysteryRewardType;
  /** Currency amount, for coins/gems rewards. */
  amount?: number;
  /** Avatar look id, for avatar rewards. */
  avatarId?: string;
  /** Relative likelihood; need not sum to any particular total. */
  weight: number;
}

/**
 * The reward pool. Reuses existing store looks and currency — no new art. Coins
 * are common, gems rarer, a store look is the rare top prize.
 */
const POOL: PoolEntry[] = [
  { type: "coins", amount: 50, weight: 34 },
  { type: "coins", amount: 150, weight: 24 },
  { type: "coins", amount: 400, weight: 11 },
  { type: "gems", amount: 8, weight: 16 },
  { type: "gems", amount: 25, weight: 8 },
  { type: "avatar", avatarId: "ryan", weight: 3.5 },
  { type: "avatar", avatarId: "maya", weight: 3.5 },
];

export interface MysteryReward {
  type: MysteryRewardType;
  /** Currency amount for coins/gems rewards, 0 for an avatar. */
  amount: number;
  /** Currency kind for coins/gems rewards, null for an avatar. */
  currency: Currency | null;
  /** Avatar look id for an avatar reward, null otherwise. */
  avatarId: string | null;
}

export interface OpenResult {
  reward: MysteryReward;
  balance: Balance;
  /** False when this was a replay of a previous open (idempotent). */
  charged: boolean;
}

/** Describe the box so the client can render cost + odds before opening. */
export function getBoxInfo(): {
  cost: number;
  currency: Currency;
  pool: MysteryReward[];
} {
  return {
    cost: MYSTERY_BOX_COST,
    currency: "gems",
    pool: POOL.map(toReward),
  };
}

function toReward(entry: PoolEntry): MysteryReward {
  if (entry.type === "avatar") {
    return { type: "avatar", amount: 0, currency: null, avatarId: entry.avatarId ?? null };
  }
  return {
    type: entry.type,
    amount: entry.amount ?? 0,
    currency: entry.type,
    avatarId: null,
  };
}

/** Weighted random draw from the pool using a crypto-seeded integer. */
function rollReward(): PoolEntry {
  const total = POOL.reduce((sum, e) => sum + e.weight, 0);
  // randomInt is [min, max); scale weights to integers for an unbiased draw.
  const SCALE = 1000;
  let ticket = randomInt(0, Math.round(total * SCALE));
  for (const entry of POOL) {
    ticket -= Math.round(entry.weight * SCALE);
    if (ticket < 0) return entry;
  }
  return POOL[POOL.length - 1]!;
}

/**
 * Open a box for `userId`. `openId` is the client idempotency key for this
 * attempt. Charges gems, rolls a reward, and credits any currency — all
 * atomically. Throws {@link InsufficientFundsError} when the player can't
 * afford it. A repeat with the same `openId` returns the original reward.
 */
export async function openBox(userId: number, openId: string): Promise<OpenResult> {
  await getOrCreateWallet(userId);

  return db.transaction(async (tx) => {
    // Lock the wallet row FIRST so concurrent opens (incl. duplicate openIds)
    // serialize; then the existing-open check below sees any committed twin.
    const [wallet] = await tx
      .select()
      .from(playerWalletsTable)
      .where(eq(playerWalletsTable.userId, userId))
      .for("update");

    const [prior] = await tx
      .select()
      .from(mysteryBoxOpensTable)
      .where(
        and(
          eq(mysteryBoxOpensTable.userId, userId),
          eq(mysteryBoxOpensTable.openId, openId),
        ),
      );
    if (prior) {
      // Replay: return the reward we already rolled, no extra charge.
      return {
        reward: {
          type: prior.rewardType as MysteryRewardType,
          amount: prior.rewardAmount,
          currency: (prior.rewardCurrency as Currency | null) ?? null,
          avatarId: prior.rewardAvatarId ?? null,
        },
        balance: { coins: wallet!.coins, gems: wallet!.gems },
        charged: false,
      };
    }

    if (wallet!.gems < MYSTERY_BOX_COST) {
      throw new InsufficientFundsError("gems", MYSTERY_BOX_COST, wallet!.gems);
    }

    // Charge the cost.
    await adjustWithinTx(
      tx,
      userId,
      "gems",
      -MYSTERY_BOX_COST,
      `mysterybox:open:${openId}`,
      `mysterybox:open:${openId}`,
    );

    const entry = rollReward();
    const reward = toReward(entry);

    // Credit currency rewards; avatar rewards are unlocked client-side. Either
    // way, read back the authoritative balance for the response.
    let balance: Balance;
    if (reward.currency && reward.amount > 0) {
      const res = await adjustWithinTx(
        tx,
        userId,
        reward.currency,
        reward.amount,
        `mysterybox:reward:${openId}`,
        `mysterybox:reward:${openId}`,
      );
      balance = res.balance;
    } else {
      const [w] = await tx
        .select()
        .from(playerWalletsTable)
        .where(eq(playerWalletsTable.userId, userId));
      balance = { coins: w!.coins, gems: w!.gems };
    }

    await tx.insert(mysteryBoxOpensTable).values({
      userId,
      openId,
      rewardType: reward.type,
      rewardCurrency: reward.currency,
      rewardAmount: reward.amount,
      rewardAvatarId: reward.avatarId,
      cost: MYSTERY_BOX_COST,
    });

    return { reward, balance, charged: true };
  });
}
