import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, chatMessagesTable } from "@workspace/db";
import { SendChatMessageBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { serializeChatMessage } from "../lib/serialize";
import { coachReply, type ChatTurn } from "../lib/ai";
import { levelFromXp } from "../lib/badges";
import { getActiveProgram } from "../lib/programs";
import { PATH_MAP } from "../lib/paths";

const router: IRouter = Router();

router.get("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.user!.id))
    .orderBy(chatMessagesTable.createdAt);
  res.json(rows.map(serializeChatMessage));
});

router.post("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = req.user!;
  const content = parsed.data.content.trim();
  if (!content) {
    res.status(400).json({ error: "Message cannot be empty" });
    return;
  }

  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, user.id))
    .orderBy(chatMessagesTable.createdAt);

  const [userMessage] = await db
    .insert(chatMessagesTable)
    .values({ userId: user.id, role: "user", content })
    .returning();

  const active = await getActiveProgram(user.id);
  const pathTitle = active
    ? PATH_MAP[active.program.pathKey]?.title
    : undefined;

  const turns: ChatTurn[] = history.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  let replyText: string;
  try {
    replyText = await coachReply(turns, content, {
      name: user.name,
      pathTitle,
      streak: user.streak,
      level: levelFromXp(user.xp),
    });
  } catch (err) {
    req.log.error({ err }, "AI coach reply failed");
    res
      .status(502)
      .json({ error: "The coach is unavailable right now. Please try again." });
    return;
  }

  const [assistantMessage] = await db
    .insert(chatMessagesTable)
    .values({ userId: user.id, role: "assistant", content: replyText })
    .returning();

  res.json({
    userMessage: serializeChatMessage(userMessage),
    assistantMessage: serializeChatMessage(assistantMessage),
  });
});

export default router;
