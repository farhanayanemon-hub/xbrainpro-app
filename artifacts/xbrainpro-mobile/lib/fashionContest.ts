/**
 * Fashion Contest client helpers.
 *
 * The server owns the round lifecycle, entry/vote rules, and reward payouts.
 * The client only reads the state and posts an entry / vote; every mutation
 * returns the refreshed {@link ContestState} so the UI re-syncs from one place.
 */
import {
  enterContest,
  getContest,
  voteContest,
  type ContestEntry,
  type ContestLastResults,
  type ContestResult,
  type ContestState,
} from "@workspace/api-client-react";

export type { ContestState, ContestEntry, ContestResult, ContestLastResults };

/** Fetch the live round, its entries + vote counts, and past winners. */
export function fetchContest(): Promise<ContestState> {
  return getContest();
}

/** Enter the current round with the equipped look. */
export function submitEntry(avatarId: string): Promise<ContestState> {
  return enterContest({ avatarId });
}

/** Vote for an entry in the current round. */
export function castVote(entryId: number): Promise<ContestState> {
  return voteContest({ entryId });
}

/** A short "closes in Xh Ym" label from an ISO close time. */
export function formatCountdown(closesAt: string, now: Date = new Date()): string {
  const ms = new Date(closesAt).getTime() - now.getTime();
  if (ms <= 0) return "closing…";
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
