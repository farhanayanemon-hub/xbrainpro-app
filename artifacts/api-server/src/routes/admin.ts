import { Router, type IRouter } from "express";
import { sql } from "drizzle-orm";
import { db, usersTable, programsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { getSetting, setSetting, SETTING_KEYS } from "../lib/settings";
import { DEFAULT_MODEL, resolveModel } from "../lib/ai";

const router: IRouter = Router();

const MODEL_OPTIONS = [
  {
    id: "openai/gpt-oss-20b:free",
    label: "GPT-OSS 20B (Free)",
    tier: "free",
    note: "No cost. Slower (1-2 min) and lower quality. Rate-limited.",
  },
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o Mini (Paid)",
    tier: "paid",
    note: "Fast and high quality. Requires OpenRouter credits.",
  },
  {
    id: "anthropic/claude-3.5-haiku",
    label: "Claude 3.5 Haiku (Paid)",
    tier: "paid",
    note: "Fast, great writing quality. Requires OpenRouter credits.",
  },
];

router.get("/admin/settings", requireAdmin, async (_req, res): Promise<void> => {
  const stored = await getSetting(SETTING_KEYS.openrouterModel);
  const effective = await resolveModel();
  res.json({
    model: effective,
    storedModel: stored,
    envModel: process.env.OPENROUTER_MODEL?.trim() || null,
    defaultModel: DEFAULT_MODEL,
    options: MODEL_OPTIONS,
  });
});

router.put("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const model = typeof req.body?.model === "string" ? req.body.model.trim() : "";
  if (!model || model.length > 200 || !/^[\w.\/:-]+$/.test(model)) {
    res.status(400).json({ error: "Invalid model id" });
    return;
  }
  await setSetting(SETTING_KEYS.openrouterModel, model);
  req.log.info({ model, adminId: req.user!.id }, "AI model changed via admin panel");
  res.json({ model });
});

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [userCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable);
  const [programCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(programsTable);
  res.json({
    users: userCount?.count ?? 0,
    programs: programCount?.count ?? 0,
  });
});

export default router;
