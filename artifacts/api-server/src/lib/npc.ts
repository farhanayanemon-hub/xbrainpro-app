import { eq } from "drizzle-orm";
import { db, worldObjectsTable } from "@workspace/db";
import { callOpenRouter, type ChatTurn } from "./ai";

export type NpcId = "lumi" | "rex";

export interface NpcHistoryTurn {
  role: "user" | "npc";
  content: string;
}

interface NpcPersona {
  id: NpcId;
  name: string;
  systemPrompt: string;
}

const SHARED_RULES = `You are an AI character living in Neura City, a small stylized city. Always stay in character. Never mention being a language model, an AI assistant, or anything about how you were made. Keep replies under about 80 words. Always reply in the same language the player writes in.`;

export const NPCS: Record<NpcId, NpcPersona> = {
  lumi: {
    id: "lumi",
    name: "Lumi",
    systemPrompt: `You are Lumi ✦, a cheerful young AI citizen who works as a guide of the Plaza district in Neura City. You are warm, playful, and curious about visitors, and you occasionally use light emoji or sparkles ✦. You know the city well: the Plaza with its fountain and neon cafes, the market street, and the harbor viewpoint. ${SHARED_RULES}`,
  },
  rex: {
    id: "rex",
    name: "Rex",
    systemPrompt: `You are Rex, a gruff old street-food vendor and ex-mechanic near the market street in Neura City. You have dry humor and speak in short sentences, but you are secretly kind. You complain about the noisy neon signs, and you love talking about your noodle stall and old machines. ${SHARED_RULES}`,
  },
};

/**
 * Look up an NPC persona. Server-driven NPCs (world objects of kind "npc")
 * take precedence so new citizens added via the admin API can chat without
 * an app update; the built-in registry is the fallback.
 */
async function resolvePersona(npcId: string): Promise<NpcPersona | null> {
  try {
    const rows = await db
      .select()
      .from(worldObjectsTable)
      .where(eq(worldObjectsTable.kind, "npc"));
    for (const row of rows) {
      const data = row.data as Record<string, unknown> | null;
      if (!data || data.id !== npcId) continue;
      if (typeof data.systemPrompt === "string" && data.systemPrompt.trim()) {
        return {
          id: npcId as NpcId,
          name: typeof data.name === "string" ? data.name : npcId,
          systemPrompt: `${data.systemPrompt} ${SHARED_RULES}`,
        };
      }
      break;
    }
  } catch {
    // DB unavailable — fall back to the built-in registry
  }
  return NPCS[npcId as NpcId] ?? null;
}

export class UnknownNpcError extends Error {
  constructor(npcId: string) {
    super(`Unknown NPC: ${npcId}`);
    this.name = "UnknownNpcError";
  }
}

export async function npcReply(
  npcId: string,
  history: NpcHistoryTurn[],
  message: string,
): Promise<string> {
  const persona = await resolvePersona(npcId);
  if (!persona) throw new UnknownNpcError(npcId);

  const historyTurns: ChatTurn[] = history.slice(-20).map((turn) => ({
    role: turn.role === "npc" ? "assistant" : "user",
    content: turn.content,
  }));

  const messages: ChatTurn[] = [
    { role: "system", content: persona.systemPrompt },
    ...historyTurns,
    { role: "user", content: message },
  ];

  return callOpenRouter(messages, { temperature: 0.9, maxTokens: 400 });
}
