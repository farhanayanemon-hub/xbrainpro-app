/** In-memory per-NPC conversation history — persists for the app session. */

export interface NpcMessage {
  role: "user" | "npc";
  content: string;
}

const sessions = new Map<string, NpcMessage[]>();

export function getSession(npcId: string, greeting: string): NpcMessage[] {
  let msgs = sessions.get(npcId);
  if (!msgs) {
    msgs = [{ role: "npc", content: greeting }];
    sessions.set(npcId, msgs);
  }
  return msgs;
}

export function appendMessage(npcId: string, msg: NpcMessage) {
  const msgs = sessions.get(npcId);
  if (msgs) msgs.push(msg);
}
