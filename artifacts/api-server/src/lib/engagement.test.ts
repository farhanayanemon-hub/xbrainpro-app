import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  playerStreaksTable,
  playerWalletsTable,
  usersTable,
} from "@workspace/db";
import { hashPassword } from "./auth";
import { getOrCreateWallet, STARTING_GEMS } from "./wallet";
import {
  advanceTask,
  advanceTaskFromClient,
  claimTask,
  getDailyState,
  TaskNotCompleteError,
  UnknownTaskError,
} from "./dailyTasks";
import { MYSTERY_BOX_COST, openBox } from "./mysteryBox";
import { InsufficientFundsError } from "./wallet";

/**
 * DB-backed tests for Daily Tasks + Mystery Box. Seeds real users in the dev
 * database, exercises claim-once idempotency, the login streak, and the box's
 * atomic charge + openId dedup + insufficient-gems guard, then cleans up.
 */

const userIds: number[] = [];

async function seedUser(tag: string): Promise<number> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [user] = await db
    .insert(usersTable)
    .values({
      email: `engagement-test-${tag}-${stamp}@test.local`,
      passwordHash: await hashPassword("test-password"),
      name: `EngagementTest ${tag}`,
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

describe("daily tasks", () => {
  it("auto-completes the check-in and starts the streak on first login", async () => {
    const userId = await seedUser("login");

    const state = await getDailyState(userId);
    expect(state.streak).toBe(1);
    expect(state.longestStreak).toBe(1);

    const login = state.tasks.find((t) => t.id === "login");
    expect(login?.completed).toBe(true);
    expect(login?.claimed).toBe(false);
    // First-day check-in pays the base reward.
    expect(login?.rewardAmount).toBe(50);
  });

  it("does not advance the streak twice in the same day", async () => {
    const userId = await seedUser("streak-same-day");

    const first = await getDailyState(userId);
    const second = await getDailyState(userId);
    expect(first.streak).toBe(1);
    expect(second.streak).toBe(1);
  });

  it("claims a completed task exactly once and pays into the wallet", async () => {
    const userId = await seedUser("claim-once");
    const before = await getOrCreateWallet(userId);
    await getDailyState(userId); // completes the login task

    const first = await claimTask(userId, "login");
    expect(first.claimed).toBe(true);
    expect(first.alreadyClaimed).toBe(false);
    expect(first.balance.coins).toBe(before.coins + first.rewardAmount);

    // A second claim must not pay again.
    const second = await claimTask(userId, "login");
    expect(second.claimed).toBe(false);
    expect(second.alreadyClaimed).toBe(true);
    expect(second.balance.coins).toBe(first.balance.coins);
  });

  it("refuses to claim an incomplete task", async () => {
    const userId = await seedUser("claim-incomplete");
    await getDailyState(userId);

    // play_city has no progress yet.
    await expect(claimTask(userId, "play_city")).rejects.toBeInstanceOf(
      TaskNotCompleteError,
    );
  });

  it("rejects an unknown task id", async () => {
    const userId = await seedUser("claim-unknown");
    await expect(claimTask(userId, "not_a_task")).rejects.toBeInstanceOf(
      UnknownTaskError,
    );
  });

  it("caps client-reported progress at the task goal", async () => {
    const userId = await seedUser("progress-cap");
    await getDailyState(userId);

    // visit_store has goal 1; advancing many times must not exceed it.
    await advanceTask(userId, "visit_store");
    await advanceTask(userId, "visit_store");
    await advanceTask(userId, "visit_store");

    const state = await getDailyState(userId);
    const task = state.tasks.find((t) => t.id === "visit_store");
    expect(task?.progress).toBe(1);
    expect(task?.completed).toBe(true);
  });

  it("refuses client-reported progress for server-event tasks (farm-proof)", async () => {
    const userId = await seedUser("farm-guard");
    await getDailyState(userId);

    // A modified client trying to self-complete server-driven tasks must fail.
    for (const taskId of ["play_city", "send_chat", "login"]) {
      const accepted = await advanceTaskFromClient(userId, taskId);
      expect(accepted).toBe(false);
    }
    // The one legitimately client-advancable task is accepted.
    expect(await advanceTaskFromClient(userId, "visit_store")).toBe(true);
    // Unknown ids are rejected too.
    expect(await advanceTaskFromClient(userId, "not_a_task")).toBe(false);

    const state = await getDailyState(userId);
    expect(state.tasks.find((t) => t.id === "play_city")?.progress).toBe(0);
    expect(state.tasks.find((t) => t.id === "send_chat")?.progress).toBe(0);
    expect(state.tasks.find((t) => t.id === "visit_store")?.progress).toBe(1);

    // Server-side hooks (advanceTask) can still drive those tasks.
    await advanceTask(userId, "play_city");
    const after = await getDailyState(userId);
    expect(after.tasks.find((t) => t.id === "play_city")?.progress).toBe(1);
  });

  it("grows the check-in reward with the login streak", async () => {
    const userId = await seedUser("streak-reward");
    await getDailyState(userId); // day 1

    // Backdate the streak to simulate 3 consecutive days ending yesterday.
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yKey = yesterday.toISOString().slice(0, 10);
    await db
      .update(playerStreaksTable)
      .set({ currentStreak: 3, longestStreak: 3, lastLoginDay: yKey })
      .where(eq(playerStreaksTable.userId, userId));

    const state = await getDailyState(userId);
    expect(state.streak).toBe(4);
    const login = state.tasks.find((t) => t.id === "login");
    // 50 base + (4-1)*25 = 125.
    expect(login?.rewardAmount).toBe(125);

    const claim = await claimTask(userId, "login");
    expect(claim.rewardAmount).toBe(125);
  });
});

describe("mystery box", () => {
  it("charges the cost once and returns a valid reward", async () => {
    const userId = await seedUser("box-open");
    const before = await getOrCreateWallet(userId);

    const res = await openBox(userId, "open-1");
    expect(res.charged).toBe(true);
    // Net gems = start - cost + any gem reward.
    const gemReward = res.reward.type === "gems" ? res.reward.amount : 0;
    expect(res.balance.gems).toBe(before.gems - MYSTERY_BOX_COST + gemReward);
    expect(["coins", "gems", "avatar"]).toContain(res.reward.type);
  });

  it("is idempotent for a repeated openId", async () => {
    const userId = await seedUser("box-dedup");
    await getOrCreateWallet(userId);

    const first = await openBox(userId, "dup-key");
    const second = await openBox(userId, "dup-key");

    expect(second.charged).toBe(false);
    // Same reward and same balance — no second charge or re-roll.
    expect(second.reward).toEqual(first.reward);
    expect(second.balance).toEqual(first.balance);
  });

  it("charges only once for concurrent duplicate openIds", async () => {
    const userId = await seedUser("box-concurrent");
    const before = await getOrCreateWallet(userId);

    const [a, b] = await Promise.all([
      openBox(userId, "race-key"),
      openBox(userId, "race-key"),
    ]);

    const charged = [a, b].filter((r) => r.charged);
    expect(charged).toHaveLength(1);
    // Both see the same final reward.
    expect(a.reward).toEqual(b.reward);

    const gemReward = a.reward.type === "gems" ? a.reward.amount : 0;
    const [wallet] = await db
      .select()
      .from(playerWalletsTable)
      .where(eq(playerWalletsTable.userId, userId));
    expect(wallet!.gems).toBe(before.gems - MYSTERY_BOX_COST + gemReward);
  });

  it("refuses to open without enough gems", async () => {
    const userId = await seedUser("box-poor");
    await getOrCreateWallet(userId);
    // Drain gems below the cost.
    await db
      .update(playerWalletsTable)
      .set({ gems: MYSTERY_BOX_COST - 1 })
      .where(eq(playerWalletsTable.userId, userId));

    await expect(openBox(userId, "broke-key")).rejects.toBeInstanceOf(
      InsufficientFundsError,
    );

    const [wallet] = await db
      .select()
      .from(playerWalletsTable)
      .where(eq(playerWalletsTable.userId, userId));
    // Balance unchanged after the refused open.
    expect(wallet!.gems).toBe(MYSTERY_BOX_COST - 1);
  });

  it("exposes a starting gem balance high enough to open at least once", async () => {
    // Sanity: default grant must afford a box so the feature is reachable.
    expect(STARTING_GEMS).toBeGreaterThanOrEqual(MYSTERY_BOX_COST);
  });
});
