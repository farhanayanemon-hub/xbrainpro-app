import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, tasksTable, programsTable, earnedBadgesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { levelFromXp } from "../lib/badges";
import { serializeProgram, serializeTask, serializeBadges } from "../lib/serialize";
import { getActiveProgram } from "../lib/programs";
import { countCompletedTasks } from "../lib/progression";

const router: IRouter = Router();

const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Small steps every day build the person you are becoming.",
  "You do not rise to the level of your goals; you fall to the level of your systems.",
  "The work you avoid is usually the work that changes everything.",
  "Consistency beats intensity. Show up again today.",
  "Your future self is watching you right now through memories.",
  "Progress, not perfection. Just do the next task.",
];

function quoteOfDay(): string {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return QUOTES[day % QUOTES.length];
}

router.get("/dashboard", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;
  const loaded = await getActiveProgram(user.id);

  if (!loaded) {
    res.json({
      hasProgram: false,
      xp: user.xp,
      level: levelFromXp(user.xp),
      streak: user.streak,
      longestStreak: user.longestStreak,
      todayTotal: 0,
      todayCompleted: 0,
      todayTasks: [],
      quote: quoteOfDay(),
    });
    return;
  }

  const currentLevel = loaded.program.currentLevel;
  const todayTasks = loaded.tasks
    .filter((t) => t.levelNumber === currentLevel)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const nextLevel = loaded.levels
    .sort((a, b) => a.levelNumber - b.levelNumber)
    .find((l) => l.levelNumber === currentLevel + 1);

  res.json({
    hasProgram: true,
    program: serializeProgram(loaded.program, loaded.levels, loaded.tasks),
    xp: user.xp,
    level: levelFromXp(user.xp),
    streak: user.streak,
    longestStreak: user.longestStreak,
    todayTotal: todayTasks.length,
    todayCompleted,
    todayTasks: todayTasks.map(serializeTask),
    nextLevelTitle: nextLevel?.title ?? null,
    quote: quoteOfDay(),
  });
});

router.get("/progress", requireAuth, async (req, res): Promise<void> => {
  const user = req.user!;

  const totalCompleted = await countCompletedTasks(user.id);
  const [totals] = await db
    .select({ total: sql<number>`count(*)` })
    .from(tasksTable)
    .innerJoin(programsTable, eq(tasksTable.programId, programsTable.id))
    .where(eq(programsTable.userId, user.id));
  const totalTasks = Number(totals?.total ?? 0);
  const completionRate =
    totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  // Weekly activity: completed tasks per day for the last 7 days.
  const rows = await db
    .select({
      day: sql<string>`to_char(${tasksTable.completedAt}, 'YYYY-MM-DD')`,
      c: sql<number>`count(*)`,
    })
    .from(tasksTable)
    .innerJoin(programsTable, eq(tasksTable.programId, programsTable.id))
    .where(
      and(
        eq(programsTable.userId, user.id),
        eq(tasksTable.completed, true),
        sql`${tasksTable.completedAt} >= now() - interval '7 days'`,
      ),
    )
    .groupBy(sql`to_char(${tasksTable.completedAt}, 'YYYY-MM-DD')`);

  const counts = new Map(rows.map((r) => [r.day, Number(r.c)]));
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    weeklyActivity.push({ date: key, completed: counts.get(key) ?? 0 });
  }

  const earned = await db
    .select()
    .from(earnedBadgesTable)
    .where(eq(earnedBadgesTable.userId, user.id));

  res.json({
    xp: user.xp,
    level: levelFromXp(user.xp),
    streak: user.streak,
    longestStreak: user.longestStreak,
    totalTasksCompleted: totalCompleted,
    completionRate,
    weeklyActivity,
    badges: serializeBadges(earned),
  });
});

router.get("/badges", requireAuth, async (req, res): Promise<void> => {
  const earned = await db
    .select()
    .from(earnedBadgesTable)
    .where(eq(earnedBadgesTable.userId, req.user!.id));
  res.json(serializeBadges(earned));
});

export default router;
