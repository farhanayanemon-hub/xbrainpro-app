import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db, usersTable, vipMembershipsTable } from "@workspace/db";
import { hashPassword } from "./auth";
import {
  InsufficientFundsError,
  adjustBalance,
  getBalance,
  getOrCreateWallet,
} from "./wallet";
import {
  VIP_COST_GEMS,
  VIP_DURATION_DAYS,
  applyVipBonus,
  getVipStatus,
  isVipActive,
  purchaseVip,
} from "./vip";

/**
 * DB-backed test for VIP membership. Seeds real users in the dev database and
 * exercises the server-authoritative rules: buying charges gems and sets an
 * expiry, an unaffordable purchase changes nothing, buying again stacks time,
 * status lapses once the expiry passes, and the Daily Task bonus only applies
 * while active. Cleans up its own rows afterward.
 */

const userIds: number[] = [];
const DAY_MS = 24 * 60 * 60 * 1000;

async function seedUser(tag: string): Promise<number> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [user] = await db
    .insert(usersTable)
    .values({
      email: `vip-test-${tag}-${stamp}@test.local`,
      passwordHash: await hashPassword("test-password"),
      name: `VipTest ${tag}`,
    })
    .returning({ id: usersTable.id });
  if (!user) throw new Error("failed to seed user");
  userIds.push(user.id);
  return user.id;
}

/** Set a freshly-seeded wallet to an exact gem balance for the test. */
async function setGems(userId: number, target: number): Promise<void> {
  await getOrCreateWallet(userId);
  const current = await getBalance(userId);
  const delta = target - current.gems;
  if (delta !== 0) {
    await adjustBalance(userId, "gems", delta, `vip-test-set:${userId}`);
  }
}

afterAll(async () => {
  if (userIds.length) {
    await db.delete(usersTable).where(inArray(usersTable.id, userIds));
  }
});

describe("vip membership", () => {
  it("charges gems and sets an expiry when buying", async () => {
    const userId = await seedUser("buy");
    await setGems(userId, VIP_COST_GEMS);

    const before = await getBalance(userId);
    const now = new Date();
    const result = await purchaseVip(userId, now);

    expect(result.balance.gems).toBe(before.gems - VIP_COST_GEMS);
    expect(result.status.active).toBe(true);
    expect(result.status.expiresAt).not.toBeNull();

    const expiry = new Date(result.status.expiresAt!).getTime();
    const expected = now.getTime() + VIP_DURATION_DAYS * DAY_MS;
    // Allow a small delta for clock drift within the transaction.
    expect(Math.abs(expiry - expected)).toBeLessThan(5_000);

    // Status reads back as active from a fresh query.
    expect(await isVipActive(userId, now)).toBe(true);
  }, 30_000);

  it("rejects an unaffordable purchase without activating VIP", async () => {
    const userId = await seedUser("poor");
    await setGems(userId, VIP_COST_GEMS - 1); // one short

    const before = await getBalance(userId);
    await expect(purchaseVip(userId)).rejects.toBeInstanceOf(
      InsufficientFundsError,
    );

    // Nothing changed: gems untouched, no membership row, not active.
    const after = await getBalance(userId);
    expect(after.gems).toBe(before.gems);
    expect(await isVipActive(userId)).toBe(false);

    const [row] = await db
      .select()
      .from(vipMembershipsTable)
      .where(eq(vipMembershipsTable.userId, userId));
    expect(row).toBeUndefined();
  }, 30_000);

  it("stacks a second purchase onto the remaining time", async () => {
    const userId = await seedUser("stack");
    await setGems(userId, VIP_COST_GEMS * 2);

    const now = new Date();
    const first = await purchaseVip(userId, now);
    const firstExpiry = new Date(first.status.expiresAt!).getTime();

    // Buying again a moment later extends by another full period.
    const later = new Date(now.getTime() + 1_000);
    const second = await purchaseVip(userId, later);
    const secondExpiry = new Date(second.status.expiresAt!).getTime();

    const delta = secondExpiry - firstExpiry;
    // Another full period was added (minus the ~1s elapsed).
    expect(Math.abs(delta - VIP_DURATION_DAYS * DAY_MS)).toBeLessThan(5_000);
  }, 30_000);

  it("reports inactive once the expiry has passed", async () => {
    const userId = await seedUser("expired");
    // Write an already-lapsed membership directly.
    const past = new Date(Date.now() - DAY_MS);
    await db
      .insert(vipMembershipsTable)
      .values({ userId, expiresAt: past });

    expect(await isVipActive(userId)).toBe(false);
    const status = await getVipStatus(userId);
    expect(status.active).toBe(false);
    expect(status.expiresAt).not.toBeNull();
  }, 30_000);

  it("boosts daily rewards only while VIP is active", () => {
    // +50% rounded: 50 -> 75, 150 -> 225, 80 -> 120, 3 -> 5.
    expect(applyVipBonus(50, true)).toBe(75);
    expect(applyVipBonus(150, true)).toBe(225);
    expect(applyVipBonus(80, true)).toBe(120);
    expect(applyVipBonus(3, true)).toBe(5);
    // Non-VIP amounts pass through untouched.
    expect(applyVipBonus(50, false)).toBe(50);
    expect(applyVipBonus(3, false)).toBe(3);
  });
});
