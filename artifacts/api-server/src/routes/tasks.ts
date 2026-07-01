import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, tasksTable, levelsTable, programsTable, usersTable } from "@workspace/db";
import { CompleteTaskParams, UncompleteTaskParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { serializeTask } from "../lib/serialize";
import { getActiveProgram } from "../lib/programs";
import {
  awardTaskCompletion,
  grantBadges,
  newBadgesResponse,
} from "../lib/progression";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const router: IRouter = Router();

router.get("/tasks/today", requireAuth, async (req, res): Promise<void> => {
  const loaded = await getActiveProgram(req.user!.id);
  if (!loaded) {
    res.json([]);
    return;
  }
  const currentLevel = loaded.program.currentLevel;
  const tasks = loaded.tasks
    .filter((t) => t.levelNumber === currentLevel)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  res.json(tasks.map(serializeTask));
});

async function ownsTask(exec: typeof db | Tx, userId: number, taskId: number) {
  const [row] = await exec
    .select({ task: tasksTable, program: programsTable })
    .from(tasksTable)
    .innerJoin(programsTable, eq(tasksTable.programId, programsTable.id))
    .where(and(eq(tasksTable.id, taskId), eq(programsTable.userId, userId)));
  return row;
}

/**
 * When every task in a level is complete, mark the level completed, unlock the
 * next one (or complete the program), and award the level_complete badge.
 * Returns any newly-granted badge keys.
 */
async function maybeAdvanceLevel(
  tx: Tx,
  userId: number,
  programId: number,
  levelId: number,
): Promise<string[]> {
  const levelTasks = await tx
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.levelId, levelId));
  const allDone = levelTasks.length > 0 && levelTasks.every((t) => t.completed);
  if (!allDone) return [];

  const [level] = await tx
    .select()
    .from(levelsTable)
    .where(eq(levelsTable.id, levelId));
  if (!level || level.status === "completed") return [];

  await tx
    .update(levelsTable)
    .set({ status: "completed" })
    .where(eq(levelsTable.id, levelId));

  const [next] = await tx
    .select()
    .from(levelsTable)
    .where(
      and(
        eq(levelsTable.programId, programId),
        eq(levelsTable.levelNumber, level.levelNumber + 1),
      ),
    );
  if (next) {
    await tx
      .update(levelsTable)
      .set({ status: "active" })
      .where(eq(levelsTable.id, next.id));
    await tx
      .update(programsTable)
      .set({ currentLevel: next.levelNumber })
      .where(eq(programsTable.id, programId));
  } else {
    await tx
      .update(programsTable)
      .set({ status: "completed" })
      .where(eq(programsTable.id, programId));
  }

  return grantBadges(tx, userId, ["level_complete"]);
}

type CompleteResult =
  | { kind: "not_found" }
  | { kind: "already_done"; task: typeof tasksTable.$inferSelect }
  | {
      kind: "awarded";
      task: typeof tasksTable.$inferSelect;
      xpAwarded: number;
      totalXp: number;
      streak: number;
      leveledUp: boolean;
      newBadgeKeys: string[];
    };

router.post("/tasks/:id/complete", requireAuth, async (req, res): Promise<void> => {
  const params = CompleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const userId = req.user!.id;

  const result = await db.transaction<CompleteResult>(async (tx) => {
    const row = await ownsTask(tx, userId, params.data.id);
    if (!row) return { kind: "not_found" };
    if (row.task.completed) return { kind: "already_done", task: row.task };

    // Conditional update guards against a concurrent double-complete.
    const [updated] = await tx
      .update(tasksTable)
      .set({ completed: true, completedAt: new Date() })
      .where(and(eq(tasksTable.id, row.task.id), eq(tasksTable.completed, false)))
      .returning();
    if (!updated) return { kind: "already_done", task: row.task };

    const outcome = await awardTaskCompletion(tx, userId, updated.xp);
    const levelBadges = await maybeAdvanceLevel(
      tx,
      userId,
      updated.programId,
      updated.levelId,
    );

    return {
      kind: "awarded",
      task: updated,
      xpAwarded: outcome.xpAwarded,
      totalXp: outcome.user.xp,
      streak: outcome.user.streak,
      leveledUp: outcome.leveledUp,
      newBadgeKeys: [...outcome.newBadgeKeys, ...levelBadges],
    };
  });

  if (result.kind === "not_found") {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  if (result.kind === "already_done") {
    res.json({
      task: serializeTask(result.task),
      xpAwarded: 0,
      totalXp: req.user!.xp,
      streak: req.user!.streak,
      leveledUp: false,
      newBadges: [],
    });
    return;
  }

  const newBadges = await newBadgesResponse(userId, result.newBadgeKeys);
  res.json({
    task: serializeTask(result.task),
    xpAwarded: result.xpAwarded,
    totalXp: result.totalXp,
    streak: result.streak,
    leveledUp: result.leveledUp,
    newBadges,
  });
});

router.post(
  "/tasks/:id/uncomplete",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = UncompleteTaskParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const userId = req.user!.id;

    const result = await db.transaction<
      { kind: "not_found" } | { kind: "ok"; task: typeof tasksTable.$inferSelect }
    >(async (tx) => {
      const row = await ownsTask(tx, userId, params.data.id);
      if (!row) return { kind: "not_found" };
      if (!row.task.completed) return { kind: "ok", task: row.task };

      const [updated] = await tx
        .update(tasksTable)
        .set({ completed: false, completedAt: null })
        .where(and(eq(tasksTable.id, row.task.id), eq(tasksTable.completed, true)))
        .returning();
      if (!updated) return { kind: "ok", task: row.task };

      // Roll back XP, never below zero.
      await tx
        .update(usersTable)
        .set({ xp: sql`GREATEST(${usersTable.xp} - ${updated.xp}, 0)` })
        .where(eq(usersTable.id, userId));

      // Reopen the level/program if they had been marked completed.
      if (row.program.status === "completed") {
        await tx
          .update(programsTable)
          .set({ status: "active" })
          .where(eq(programsTable.id, row.program.id));
      }
      await tx
        .update(levelsTable)
        .set({ status: "active" })
        .where(
          and(
            eq(levelsTable.id, updated.levelId),
            eq(levelsTable.status, "completed"),
          ),
        );

      return { kind: "ok", task: updated };
    });

    if (result.kind === "not_found") {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(serializeTask(result.task));
  },
);

export default router;
