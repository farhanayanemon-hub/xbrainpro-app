import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import {
  advanceTaskFromClient,
  claimTask,
  getDailyState,
  TaskNotCompleteError,
  UnknownTaskError,
} from "../lib/dailyTasks";
import { getBoxInfo, openBox } from "../lib/mysteryBox";
import { InsufficientFundsError } from "../lib/wallet";

const router: IRouter = Router();

/** The authenticated player's daily task board (also counts today's login). */
router.get("/daily-tasks", requireAuth, async (req, res): Promise<void> => {
  const state = await getDailyState(req.user!.id);
  res.json(state);
});

/**
 * Record progress on a client-tracked task (only "visit_store" today). Progress
 * is capped at the task's goal server-side, and server-event tasks (login,
 * play_city, send_chat) are refused here so a modified client can't forge them.
 * Returns the refreshed board regardless, so the client just re-syncs.
 */
router.post(
  "/daily-tasks/:taskId/advance",
  requireAuth,
  async (req, res): Promise<void> => {
    await advanceTaskFromClient(req.user!.id, String(req.params.taskId));
    const state = await getDailyState(req.user!.id);
    res.json(state);
  },
);

/** Claim a completed task's reward. Idempotent — pays out at most once a day. */
router.post(
  "/daily-tasks/:taskId/claim",
  requireAuth,
  async (req, res): Promise<void> => {
    try {
      const result = await claimTask(req.user!.id, String(req.params.taskId));
      res.json(result);
    } catch (err) {
      if (err instanceof UnknownTaskError) {
        res.status(404).json({ error: "Unknown task" });
        return;
      }
      if (err instanceof TaskNotCompleteError) {
        res.status(400).json({ error: "Task isn't finished yet" });
        return;
      }
      throw err;
    }
  },
);

/** Mystery Box cost + reward odds, so the client can render before opening. */
router.get("/mystery-box", requireAuth, (_req, res): void => {
  res.json(getBoxInfo());
});

/**
 * Open the Mystery Box. Charges gems and returns a random reward, atomically.
 * The client sends a unique `openId` per attempt so a retry is idempotent.
 */
router.post("/mystery-box/open", requireAuth, async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as { openId?: unknown };
  const openId =
    typeof body.openId === "string" && body.openId.trim()
      ? body.openId.trim().slice(0, 64)
      : null;
  if (!openId) {
    res.status(400).json({ error: "Missing openId" });
    return;
  }

  try {
    const result = await openBox(req.user!.id, openId);
    res.json(result);
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      res.status(400).json({
        error: `Not enough gems — need ${err.required}, you have ${err.available}`,
      });
      return;
    }
    throw err;
  }
});

export default router;
