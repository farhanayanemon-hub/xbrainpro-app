import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  programsTable,
  levelsTable,
  tasksTable,
  profilesTable,
} from "@workspace/db";
import {
  CreateProgramBody,
  GetProgramParams,
  DeleteProgramParams,
  ActivateProgramParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { PATH_MAP } from "../lib/paths";
import { generatePlan } from "../lib/ai";
import {
  serializeProgram,
  serializeProgramDetail,
} from "../lib/serialize";
import { loadProgram, getActiveProgram } from "../lib/programs";

const router: IRouter = Router();

router.get("/programs", requireAuth, async (req, res): Promise<void> => {
  const programs = await db
    .select()
    .from(programsTable)
    .where(eq(programsTable.userId, req.user!.id))
    .orderBy(programsTable.createdAt);

  const results = [];
  for (const p of programs) {
    const loaded = await loadProgram(p.id);
    if (loaded) {
      results.push(
        serializeProgram(loaded.program, loaded.levels, loaded.tasks),
      );
    }
  }
  res.json(results);
});

router.get("/programs/current", requireAuth, async (req, res): Promise<void> => {
  const loaded = await getActiveProgram(req.user!.id);
  if (!loaded) {
    res.status(404).json({ error: "No active program" });
    return;
  }
  res.json(
    serializeProgramDetail(loaded.program, loaded.levels, loaded.tasksByLevel),
  );
});

router.post("/programs", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProgramBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const path = PATH_MAP[parsed.data.pathKey];
  if (!path) {
    res.status(400).json({ error: "Unknown path" });
    return;
  }
  const durationDays = parsed.data.durationDays === 60 ? 60 : 30;

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.userId, req.user!.id));

  let plan;
  try {
    plan = await generatePlan(path, durationDays, {
      about: parsed.data.about ?? profile?.about,
      currentSituation:
        parsed.data.currentSituation ?? profile?.currentSituation,
      biggestChallenge:
        parsed.data.biggestChallenge ?? profile?.biggestChallenge,
      motivation: parsed.data.motivation ?? profile?.motivation,
    });
  } catch (err) {
    req.log.error({ err }, "AI plan generation failed");
    res
      .status(502)
      .json({ error: "Could not generate your plan right now. Please try again." });
    return;
  }

  // Archive any existing active programs.
  await db
    .update(programsTable)
    .set({ status: "archived" })
    .where(
      and(
        eq(programsTable.userId, req.user!.id),
        eq(programsTable.status, "active"),
      ),
    );

  const [program] = await db
    .insert(programsTable)
    .values({
      userId: req.user!.id,
      pathKey: path.key,
      title: plan.title,
      summary: plan.summary,
      durationDays,
      status: "active",
      currentLevel: 1,
      accent: path.accent,
    })
    .returning();

  let dayNumber = 1;
  for (let i = 0; i < plan.levels.length; i++) {
    const lvl = plan.levels[i];
    const levelNumber = i + 1;
    const [level] = await db
      .insert(levelsTable)
      .values({
        programId: program.id,
        levelNumber,
        title: lvl.title,
        description: lvl.description,
        status: levelNumber === 1 ? "active" : "locked",
        xpReward: 50,
      })
      .returning();

    if (lvl.tasks.length > 0) {
      await db.insert(tasksTable).values(
        lvl.tasks.map((t, idx) => ({
          programId: program.id,
          levelId: level.id,
          levelNumber,
          dayNumber: dayNumber++,
          orderIndex: idx,
          title: t.title,
          description: t.description,
          timeOfDay: t.timeOfDay,
          durationMinutes: t.durationMinutes,
          xp: 15,
        })),
      );
    }
  }

  const loaded = await loadProgram(program.id);
  res
    .status(201)
    .json(
      serializeProgramDetail(loaded!.program, loaded!.levels, loaded!.tasksByLevel),
    );
});

router.get("/programs/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetProgramParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const loaded = await loadProgram(params.data.id);
  if (!loaded || loaded.program.userId !== req.user!.id) {
    res.status(404).json({ error: "Program not found" });
    return;
  }
  res.json(
    serializeProgramDetail(loaded.program, loaded.levels, loaded.tasksByLevel),
  );
});

router.delete("/programs/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProgramParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(programsTable)
    .where(
      and(
        eq(programsTable.id, params.data.id),
        eq(programsTable.userId, req.user!.id),
      ),
    );
  res.sendStatus(204);
});

router.post(
  "/programs/:id/activate",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ActivateProgramParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const loaded = await loadProgram(params.data.id);
    if (!loaded || loaded.program.userId !== req.user!.id) {
      res.status(404).json({ error: "Program not found" });
      return;
    }

    await db
      .update(programsTable)
      .set({ status: "archived" })
      .where(
        and(
          eq(programsTable.userId, req.user!.id),
          eq(programsTable.status, "active"),
        ),
      );
    await db
      .update(programsTable)
      .set({ status: "active" })
      .where(eq(programsTable.id, params.data.id));

    const refreshed = await loadProgram(params.data.id);
    res.json(
      serializeProgramDetail(
        refreshed!.program,
        refreshed!.levels,
        refreshed!.tasksByLevel,
      ),
    );
  },
);

export default router;
