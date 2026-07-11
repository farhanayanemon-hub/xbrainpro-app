/**
 * Daily Tasks + login streak client helpers.
 *
 * The server owns all progress and rewards; the client only reads the board,
 * reports client-tracked progress (e.g. visiting the store), and claims
 * completed rewards. Claims are idempotent server-side, so a double-tap can't
 * double-pay.
 */
import {
  advanceDailyTask,
  claimDailyTask,
  getDailyTasks,
  type ClaimResult,
  type DailyState,
  type DailyTask,
} from "@workspace/api-client-react";

export type { DailyState, DailyTask, ClaimResult };

/** Fetch the daily task board (also counts today's login on the server). */
export function fetchDailyTasks(): Promise<DailyState> {
  return getDailyTasks();
}

/** Report progress on a client-tracked task; resolves with the refreshed board. */
export function advanceTask(taskId: string): Promise<DailyState> {
  return advanceDailyTask(taskId);
}

/** Claim a completed task's reward; resolves with the payout + new balance. */
export function claimTask(taskId: string): Promise<ClaimResult> {
  return claimDailyTask(taskId);
}
