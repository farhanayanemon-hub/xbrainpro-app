import { Router, type IRouter } from "express";
import { requireAuth } from "../lib/auth";
import {
  AlreadyEnteredError,
  AlreadyVotedError,
  castVote,
  EntryNotFoundError,
  getContestState,
  NoProfileError,
  SelfVoteError,
  submitEntry,
} from "../lib/fashionContest";

const router: IRouter = Router();

/** The live Fashion Contest round, its entries + vote counts, and past winners. */
router.get("/contest", requireAuth, async (req, res): Promise<void> => {
  const state = await getContestState(req.user!.id);
  res.json(state);
});

/**
 * Enter the current round with the player's equipped look. The server snapshots
 * their name + gender and refuses a second entry in the same round.
 */
router.post("/contest/entry", requireAuth, async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as { avatarId?: unknown };
  const avatarId =
    typeof body.avatarId === "string" && body.avatarId.trim()
      ? body.avatarId.trim()
      : null;
  if (!avatarId) {
    res.status(400).json({ error: "Missing avatarId" });
    return;
  }

  try {
    const state = await submitEntry(req.user!.id, avatarId);
    res.json(state);
  } catch (err) {
    if (err instanceof AlreadyEnteredError) {
      res.status(409).json({ error: "You've already entered this round" });
      return;
    }
    if (err instanceof NoProfileError) {
      res.status(400).json({ error: "Set up your profile first" });
      return;
    }
    if (err instanceof EntryNotFoundError) {
      res.status(400).json({ error: "Pick a look to enter" });
      return;
    }
    throw err;
  }
});

/**
 * Vote for an entry in the current round. Rejects self-votes and duplicate
 * votes; both entry and vote are validated server-side.
 */
router.post("/contest/vote", requireAuth, async (req, res): Promise<void> => {
  const body = (req.body ?? {}) as { entryId?: unknown };
  const entryId =
    typeof body.entryId === "number" && Number.isInteger(body.entryId)
      ? body.entryId
      : null;
  if (entryId === null) {
    res.status(400).json({ error: "Missing entryId" });
    return;
  }

  try {
    const state = await castVote(req.user!.id, entryId);
    res.json(state);
  } catch (err) {
    if (err instanceof SelfVoteError) {
      res.status(400).json({ error: "You can't vote for your own look" });
      return;
    }
    if (err instanceof AlreadyVotedError) {
      res.status(409).json({ error: "You've already voted for this look" });
      return;
    }
    if (err instanceof EntryNotFoundError) {
      res.status(404).json({ error: "That entry isn't in the current round" });
      return;
    }
    throw err;
  }
});

export default router;
