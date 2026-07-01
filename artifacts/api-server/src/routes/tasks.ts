import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, tasksTable, levelsTable, programsTable, usersTable } from "@workspace/db";
import { CompleteTaskParams, UncompleteTaskParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { serializeTask } from "../lib/serialize";
import { getActiveProgram } from "../lib/programs";
import { awardTaskCompletion, newBadgesResponse } from "../lib/progression";

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

async function ownsTask(userId: number, taskId: number) {
  const [row] = await db
    .select({ task: tasksTable, program: programsTable })
    .from(tasksTable)
    .innerJoin(programsTable, eq(tasksTable.programId, programsTable.id))
    .where(and(eq(tasksTable.id, taskId), eq(programsTable.userId, userId)));
  return row;
}

async function maybeAdvanceLevel(programId: number, levelId: number) {
  const levelTasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.levelId, levelId));
  const allDone = levelTasks.length > 0 && levelTasks.every((t) => t.completed);
  if (!allDone) return;

  const [level] = await db
    .select()
    .from(levelsTable)
    .where(eq(levelsTable.id, levelId));
  if (!level || level.status === "completed") return;

  await db
    .update(levelsTable)
    .set({ status: "completed" })
    .where(eq(levelsTable.id, levelId));

  const [next] = await db
    .select()
    .from(levelsTable)
    .where(
      and(
        eq(levelsTable.programId, programId),
        eq(levelsTable.levelNumber, level.levelNumber + 1),
      ),
    );
  if (next) {
    await db
      .update(levelsTable)
      .set({ status: "active" })
      .where(eq(levelsTable.id, next.id));
    await db
      .update(programsTable)
      .set({ currentLevel: next.levelNumber })
      .where(eq(programsTable.id, programId));
  } else {
    await db
      .update(programsTable)
      .set({ status: "completed" })
      .where(eq(programsTable.id, programId));
  }
}

router.post("/tasks/:id/complete", requireAuth, async (req, res): Promise<void> => {
  const params = CompleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const row = await ownsTask(req.user!.id, params.data.id);
  if (!row) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  if (row.task.completed) {
    res.json({
      task: serializeTask(row.task),
      xpAwarded: 0,
      totalXp: req.user!.xp,
      streak: req.user!.streak,
      leveledUp: false,
      newBadges: [],
    });
    return;
  }

  const [updated] = await db
    .update(tasksTable)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(tasksTable.id, row.task.id))
    .returning();

  const outcome = await awardTaskCompletion(req.user!, updated.xp);
  await maybeAdvanceLevel(row.program.id, updated.levelId);
  const newBadges = await newBadgesResponse(req.user!.id, outcome.newBadgeKeys);

  res.json({
    task: serializeTask(updated),
    xpAwarded: outcome.xpAwarded,
    totalXp: outcome.user.xp,
    streak: outcome.user.streak,
    leveledUp: outcome.leveledUp,
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
    const row = await ownsTask(req.user!.id, params.data.id);
    if (!row) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (!row.task.completed) {
      res.json(serializeTask(row.task));
      return;
    }

    const [updated] = await db
      .update(tasksTable)
      .set({ completed: false, completedAt: null })
      .where(eq(tasksTable.id, row.task.id))
      .returning();

    // Roll back XP, never below zero.
    await db
      .update(usersTable)
      .set({ xp: sql`GREATEST(${usersTable.xp} - ${updated.xp}, 0)` })
      .where(eq(usersTable.id, req.user!.id));

    // Reopen the level if it had been completed.
    if (row.program.status === "completed") {
      await db
        .update(programsTable)
        .set({ status: "active" })
        .where(eq(programsTable.id, row.program.id));
    }
    await db
      .update(levelsTable)
      .set({ status: "active" })
      .where(
        and(
          eq(levelsTable.id, updated.levelId),
          eq(levelsTable.status, "completed"),
        ),
      );

    res.json(serializeTask(updated));
  },
);

export default router;
