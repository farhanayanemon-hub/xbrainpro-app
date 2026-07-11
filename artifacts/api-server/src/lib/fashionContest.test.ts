import { afterAll, describe, expect, it } from "vitest";
import { eq, inArray } from "drizzle-orm";
import {
  contestEntriesTable,
  contestRoundsTable,
  contestVotesTable,
  db,
  playerProfilesTable,
  usersTable,
} from "@workspace/db";
import { hashPassword } from "./auth";
import { getBalance, getOrCreateWallet } from "./wallet";
import {
  AlreadyEnteredError,
  AlreadyVotedError,
  REWARDS,
  SelfVoteError,
  castVote,
  ensureActiveRound,
  submitEntry,
} from "./fashionContest";

/**
 * DB-backed test for the Fashion Contest. Seeds real users + profiles in the dev
 * database and exercises the server-authoritative rules: one entry per player,
 * no self-voting, one vote per entry, and a settlement that ranks entries and
 * pays the top placements exactly once. Cleans up its own rows afterward.
 */

const userIds: number[] = [];
const roundIds: number[] = [];

async function seedUser(tag: string, gender = "male"): Promise<number> {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const [user] = await db
    .insert(usersTable)
    .values({
      email: `contest-test-${tag}-${stamp}@test.local`,
      passwordHash: await hashPassword("test-password"),
      name: `ContestTest ${tag}`,
    })
    .returning({ id: usersTable.id });
  if (!user) throw new Error("failed to seed user");
  userIds.push(user.id);
  await db.insert(playerProfilesTable).values({
    userId: user.id,
    displayName: `Tester ${tag}`,
    gender,
  });
  return user.id;
}

afterAll(async () => {
  // Rounds cascade to their entries + votes; users cascade to theirs too.
  if (roundIds.length) {
    await db
      .delete(contestRoundsTable)
      .where(inArray(contestRoundsTable.id, roundIds));
  }
  if (userIds.length) {
    await db.delete(usersTable).where(inArray(usersTable.id, userIds));
  }
});

describe("fashion contest", () => {
  it("enters the active round with the equipped look", async () => {
    const userId = await seedUser("enter");

    const state = await submitEntry(userId, "maya");
    expect(state.myEntryId).not.toBeNull();

    const mine = state.entries.find((e) => e.id === state.myEntryId);
    expect(mine).toBeDefined();
    expect(mine!.avatarId).toBe("maya");
    expect(mine!.isMine).toBe(true);
  });

  it("rejects a second entry from the same player in a round", async () => {
    const userId = await seedUser("dup-entry");

    await submitEntry(userId, "ryan");
    await expect(submitEntry(userId, "maya")).rejects.toBeInstanceOf(
      AlreadyEnteredError,
    );
  });

  it("refuses a vote for your own entry", async () => {
    const userId = await seedUser("self-vote");

    const state = await submitEntry(userId, "ryan");
    const entryId = state.myEntryId!;

    await expect(castVote(userId, entryId)).rejects.toBeInstanceOf(
      SelfVoteError,
    );
  });

  it("records a vote and rejects a duplicate from the same voter", async () => {
    const authorId = await seedUser("vote-author");
    const voterId = await seedUser("voter");

    const authored = await submitEntry(authorId, "maya");
    const entryId = authored.myEntryId!;

    const afterVote = await castVote(voterId, entryId);
    const voted = afterVote.entries.find((e) => e.id === entryId);
    expect(voted!.votedByMe).toBe(true);

    await expect(castVote(voterId, entryId)).rejects.toBeInstanceOf(
      AlreadyVotedError,
    );
  });

  it("settles a due round, ranking entries and paying winners exactly once", async () => {
    // Seeds several users (each with a bcrypt hash), so give it room.
    const first = REWARDS[0]!;
    const second = REWARDS[1]!;

    // Three entrants + two independent voters, all with starting wallets.
    const xId = await seedUser("winner-1st");
    const yId = await seedUser("winner-2nd");
    const zId = await seedUser("no-votes");
    const v1 = await seedUser("ballot-1");
    const v2 = await seedUser("ballot-2");
    for (const id of [xId, yId, zId]) await getOrCreateWallet(id);

    const beforeX = await getBalance(xId);
    const beforeY = await getBalance(yId);
    const beforeZ = await getBalance(zId);

    // A round that is already due (closesAt in the past) so the next
    // ensureActiveRound() call settles it.
    const now = Date.now();
    const [round] = await db
      .insert(contestRoundsTable)
      .values({
        theme: "Test Runway",
        status: "open",
        opensAt: new Date(now - 60_000),
        closesAt: new Date(now - 1_000),
      })
      .returning();
    roundIds.push(round!.id);

    const [ex] = await db
      .insert(contestEntriesTable)
      .values({
        roundId: round!.id,
        userId: xId,
        avatarId: "ryan",
        displayName: "X",
        gender: "male",
      })
      .returning({ id: contestEntriesTable.id });
    const [ey] = await db
      .insert(contestEntriesTable)
      .values({
        roundId: round!.id,
        userId: yId,
        avatarId: "maya",
        displayName: "Y",
        gender: "female",
      })
      .returning({ id: contestEntriesTable.id });
    await db.insert(contestEntriesTable).values({
      roundId: round!.id,
      userId: zId,
      avatarId: "ryan",
      displayName: "Z",
      gender: "male",
    });

    // X gets 2 votes, Y gets 1, Z gets 0 → X 1st, Y 2nd, Z 3rd (unrewarded).
    await db.insert(contestVotesTable).values([
      { roundId: round!.id, entryId: ex!.id, voterId: v1 },
      { roundId: round!.id, entryId: ex!.id, voterId: v2 },
      { roundId: round!.id, entryId: ey!.id, voterId: v1 },
    ]);

    // Settle.
    await ensureActiveRound();

    const afterX = await getBalance(xId);
    const afterY = await getBalance(yId);
    const afterZ = await getBalance(zId);

    expect(afterX.coins).toBe(beforeX.coins + first.coins);
    expect(afterX.gems).toBe(beforeX.gems + first.gems);
    expect(afterY.coins).toBe(beforeY.coins + second.coins);
    expect(afterY.gems).toBe(beforeY.gems + second.gems);
    // Z earned no votes, so no reward despite placing.
    expect(afterZ.coins).toBe(beforeZ.coins);
    expect(afterZ.gems).toBe(beforeZ.gems);

    // The round is now closed and ranks were written back.
    const [settled] = await db
      .select()
      .from(contestRoundsTable)
      .where(eq(contestRoundsTable.id, round!.id));
    expect(settled!.status).toBe("closed");
    expect(settled!.settledAt).not.toBeNull();

    // Idempotency: force the round due again and re-settle — the idempotent
    // reward references must prevent any double payout.
    await db
      .update(contestRoundsTable)
      .set({ status: "open", settledAt: null, closesAt: new Date(Date.now() - 1_000) })
      .where(eq(contestRoundsTable.id, round!.id));
    await ensureActiveRound();

    const finalX = await getBalance(xId);
    const finalY = await getBalance(yId);
    expect(finalX.coins).toBe(afterX.coins);
    expect(finalX.gems).toBe(afterX.gems);
    expect(finalY.coins).toBe(afterY.coins);
    expect(finalY.gems).toBe(afterY.gems);
  }, 30_000);
});
