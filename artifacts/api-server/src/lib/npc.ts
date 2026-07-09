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

export async function npcReply(
  npcId: NpcId,
  history: NpcHistoryTurn[],
  message: string,
): Promise<string> {
  const persona = NPCS[npcId];

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
