import { Router, type IRouter } from "express";
import { NpcChatBody } from "@workspace/api-zod";
import { npcReply, UnknownNpcError, type NpcHistoryTurn } from "../lib/npc";

const router: IRouter = Router();

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_TURNS = 20;
const MAX_TURN_CHARS = 2000;

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 20;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (rateBuckets.size > 10_000) {
    for (const [k, b] of rateBuckets) {
      if (b.resetAt <= now) rateBuckets.delete(k);
    }
  }
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_MAX_REQUESTS;
}

router.post("/npc/chat", async (req, res): Promise<void> => {
  if (isRateLimited(req.ip ?? "unknown")) {
    res.status(429).json({
      error: "Too many messages. Give the NPC a moment to breathe.",
    });
    return;
  }

  const parsed = NpcChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { npcId, history } = parsed.data;

  const message = parsed.data.message.trim().slice(0, MAX_MESSAGE_CHARS);
  if (!message) {
    res.status(400).json({ error: "Message cannot be empty." });
    return;
  }

  const turns: NpcHistoryTurn[] = (history ?? [])
    .map((t) => ({
      role: t.role,
      content: t.content.trim().slice(0, MAX_TURN_CHARS),
    }))
    .filter((t) => t.content.length > 0)
    .slice(-MAX_HISTORY_TURNS);

  let reply: string;
  try {
    reply = await npcReply(npcId, turns, message);
  } catch (err) {
    if (err instanceof UnknownNpcError) {
      res.status(404).json({ error: "That citizen doesn't live here." });
      return;
    }
    req.log.error({ err }, "NPC reply failed");
    res.status(502).json({
      error: "The NPC is unavailable right now. Please try again.",
    });
    return;
  }

  res.json({ reply });
});

export default router;
