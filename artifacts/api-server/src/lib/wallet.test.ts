import { afterAll, describe, expect, it } from "vitest";
import { inArray } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashPassword } from "./auth";
import {
  InsufficientFundsError,
  STARTING_COINS,
  STARTING_GEMS,
  earn,
  getBalance,
  getOrCreateWallet,
  spend,
} from "./wallet";

/**
 * DB-backed test for the currency wallet. Seeds real users in the dev database,
 * exercises the one-time starting grant, earn/spend, the insufficient-funds
 * guard, and reference idempotency, then cleans up after itself.
 */

const userIds: number[] = [];

async function seedUser(tag: string): Promise<number> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [user] = await db
    .insert(usersTable)
    .values({
      email: `wallet-test-${tag}-${stamp}@test.local`,
      passwordHash: await hashPassword("test-password"),
      name: `WalletTest ${tag}`,
    })
    .returning({ id: usersTable.id });
  if (!user) throw new Error("failed to seed user");
  userIds.push(user.id);
  return user.id;
}

afterAll(async () => {
  if (userIds.length) {
    await db.delete(usersTable).where(inArray(usersTable.id, userIds));
  }
});

describe("wallet", () => {
  it("grants the starting balance exactly once", async () => {
    const userId = await seedUser("grant");

    const first = await getOrCreateWallet(userId);
    expect(first).toEqual({ coins: STARTING_COINS, gems: STARTING_GEMS });

    // A second call must not grant again.
    const second = await getOrCreateWallet(userId);
    expect(second).toEqual({ coins: STARTING_COINS, gems: STARTING_GEMS });
  });

  it("earns and spends currency", async () => {
    const userId = await seedUser("earn-spend");
    await getOrCreateWallet(userId);

    const earned = await earn(userId, "coins", 100, "test:earn");
    expect(earned.applied).toBe(true);
    expect(earned.balance.coins).toBe(STARTING_COINS + 100);

    const spent = await spend(userId, "coins", 250, "test:spend");
    expect(spent.applied).toBe(true);
    expect(spent.balance.coins).toBe(STARTING_COINS + 100 - 250);
  });

  it("refuses to overspend and leaves the balance unchanged", async () => {
    const userId = await seedUser("overspend");
    await getOrCreateWallet(userId);

    await expect(
      spend(userId, "coins", STARTING_COINS + 1, "test:overspend"),
    ).rejects.toBeInstanceOf(InsufficientFundsError);

    const after = await getBalance(userId);
    expect(after.coins).toBe(STARTING_COINS);
  });

  it("is idempotent for a repeated reference", async () => {
    const userId = await seedUser("idempotent");
    await getOrCreateWallet(userId);

    const ref = "test:purchase:once";
    const first = await spend(userId, "coins", 250, "test:purchase", ref);
    expect(first.applied).toBe(true);
    expect(first.balance.coins).toBe(STARTING_COINS - 250);

    const second = await spend(userId, "coins", 250, "test:purchase", ref);
    expect(second.applied).toBe(false);
    expect(second.balance.coins).toBe(STARTING_COINS - 250);
  });

  it("charges only once for concurrent duplicate references", async () => {
    const userId = await seedUser("concurrent");
    await getOrCreateWallet(userId);

    const ref = "test:purchase:concurrent";
    // Fire the same purchase twice at once — the wallet row lock must serialize
    // them so exactly one charge lands and neither call throws.
    const results = await Promise.all([
      spend(userId, "coins", 250, "test:purchase", ref),
      spend(userId, "coins", 250, "test:purchase", ref),
    ]);

    const applied = results.filter((r) => r.applied);
    expect(applied).toHaveLength(1);

    const after = await getBalance(userId);
    expect(after.coins).toBe(STARTING_COINS - 250);
  });
});
