import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, remindersTable } from "@workspace/db";
import {
  CreateReminderBody,
  UpdateReminderBody,
  UpdateReminderParams,
  DeleteReminderParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { serializeReminder } from "../lib/serialize";

const router: IRouter = Router();

router.get("/reminders", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(remindersTable)
    .where(eq(remindersTable.userId, req.user!.id))
    .orderBy(remindersTable.timeOfDay);
  res.json(rows.map(serializeReminder));
});

router.post("/reminders", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateReminderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [reminder] = await db
    .insert(remindersTable)
    .values({
      userId: req.user!.id,
      title: parsed.data.title,
      timeOfDay: parsed.data.timeOfDay,
      enabled: parsed.data.enabled ?? true,
      daysOfWeek: parsed.data.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6],
    })
    .returning();
  res.status(201).json(serializeReminder(reminder));
});

router.patch("/reminders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateReminderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateReminderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [reminder] = await db
    .update(remindersTable)
    .set(parsed.data)
    .where(
      and(
        eq(remindersTable.id, params.data.id),
        eq(remindersTable.userId, req.user!.id),
      ),
    )
    .returning();

  if (!reminder) {
    res.status(404).json({ error: "Reminder not found" });
    return;
  }
  res.json(serializeReminder(reminder));
});

router.delete("/reminders/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteReminderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(remindersTable)
    .where(
      and(
        eq(remindersTable.id, params.data.id),
        eq(remindersTable.userId, req.user!.id),
      ),
    );
  res.sendStatus(204);
});

export default router;
