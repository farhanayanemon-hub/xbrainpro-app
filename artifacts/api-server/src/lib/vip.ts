import { eq } from "drizzle-orm";
import { db, vipMembershipsTable } from "@workspace/db";
import {
  adjustWithinTx,
  getOrCreateWallet,
  type Balance,
} from "./wallet";

/**
 * VIP membership for Neura City.
 *
 * VIP is server-authoritative. A membership is a single `expiresAt` per player;
 * perks are active only while that instant is in the future. Buying VIP charges
 * gems atomically (locking the wallet row so an unaffordable purchase is
 * rejected before anything changes) and pushes the expiry forward — stacking
 * onto whatever time is left. Perks read live off `expiresAt`, so they simply
 * stop applying the moment it lapses, with nothing to clean up.
 */

/** Gem cost of one membership period. */
export const VIP_COST_GEMS = 100;
/** Length of one membership period, in days. */
export const VIP_DURATION_DAYS = 30;
/** How much VIP boosts Daily Task rewards, as a percentage. */
export const VIP_DAILY_BONUS_PCT = 50;

const VIP_MULTIPLIER = 1 + VIP_DAILY_BONUS_PCT / 100;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface VipStatus {
  /** True while the membership is currently active. */
  active: boolean;
  /** ISO expiry of the membership, or null if the player never bought VIP. */
  expiresAt: string | null;
  costGems: number;
  durationDays: number;
  dailyBonusPct: number;
}

export interface VipPurchaseResult {
  status: VipStatus;
  balance: Balance;
}

function isActive(expiresAt: Date | null | undefined, now: Date): boolean {
  return !!expiresAt && expiresAt.getTime() > now.getTime();
}

function buildStatus(expiresAt: Date | null, now: Date): VipStatus {
  return {
    active: isActive(expiresAt, now),
    expiresAt: expiresAt ? expiresAt.toISOString() : null,
    costGems: VIP_COST_GEMS,
    durationDays: VIP_DURATION_DAYS,
    dailyBonusPct: VIP_DAILY_BONUS_PCT,
  };
}

/** The player's current VIP status (active flag + expiry + the offer terms). */
export async function getVipStatus(
  userId: number,
  now: Date = new Date(),
): Promise<VipStatus> {
  const [row] = await db
    .select({ expiresAt: vipMembershipsTable.expiresAt })
    .from(vipMembershipsTable)
    .where(eq(vipMembershipsTable.userId, userId));
  return buildStatus(row?.expiresAt ?? null, now);
}

/** Whether the player's VIP perks are currently active. */
export async function isVipActive(
  userId: number,
  now: Date = new Date(),
): Promise<boolean> {
  const [row] = await db
    .select({ expiresAt: vipMembershipsTable.expiresAt })
    .from(vipMembershipsTable)
    .where(eq(vipMembershipsTable.userId, userId));
  return isActive(row?.expiresAt, now);
}

/**
 * Apply the VIP Daily Task reward bonus to a base amount. Returns the amount
 * unchanged for non-VIP players; VIP players get it rounded up by the bonus.
 */
export function applyVipBonus(amount: number, vip: boolean): number {
  return vip ? Math.round(amount * VIP_MULTIPLIER) : amount;
}

/**
 * Buy (or extend) VIP with gems. Atomic: the wallet row is locked first so an
 * unaffordable purchase throws {@link InsufficientFundsError} before the
 * membership is touched, and concurrent purchases serialize on that lock. The
 * new expiry stacks onto any remaining time, so it only moves forward.
 */
export async function purchaseVip(
  userId: number,
  now: Date = new Date(),
): Promise<VipPurchaseResult> {
  await getOrCreateWallet(userId);

  return db.transaction(async (tx) => {
    // Charge first — this locks the wallet row (serializing concurrent buys)
    // and rejects an unaffordable purchase before the membership changes.
    const { balance } = await adjustWithinTx(
      tx,
      userId,
      "gems",
      -VIP_COST_GEMS,
      "purchase:vip",
    );

    const [existing] = await tx
      .select({ expiresAt: vipMembershipsTable.expiresAt })
      .from(vipMembershipsTable)
      .where(eq(vipMembershipsTable.userId, userId));

    // Stack onto remaining time, otherwise start from now.
    const base = isActive(existing?.expiresAt, now)
      ? existing!.expiresAt
      : now;
    const newExpiry = new Date(base.getTime() + VIP_DURATION_DAYS * DAY_MS);

    await tx
      .insert(vipMembershipsTable)
      .values({ userId, expiresAt: newExpiry })
      .onConflictDoUpdate({
        target: vipMembershipsTable.userId,
        set: { expiresAt: newExpiry, updatedAt: now },
      });

    return { status: buildStatus(newExpiry, now), balance };
  });
}
