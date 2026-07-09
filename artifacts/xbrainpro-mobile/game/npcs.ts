export interface NpcDef {
  /** Server-driven NPCs can have any id; "lumi" and "rex" are the built-ins. */
  id: string;
  name: string;
  title: string;
  /** Body color of the low-poly character. */
  color: string;
  /** Accent used for glows / chat bubbles. */
  accent: string;
  x: number;
  z: number;
  greeting: string;
  suggestions: string[];
}

export const NPCS: NpcDef[] = [
  {
    id: "lumi",
    name: "Lumi",
    title: "AI Citizen • Plaza District",
    color: "#ffb3d9",
    accent: "#ff5c8a",
    x: 3.2,
    z: -4.2,
    greeting:
      "Hey! First time in the Plaza? I can show you around ✦ It gets pretty lively here at night.",
    suggestions: ["Show me around", "Who lives here?", "What is Neura City?"],
  },
  {
    id: "rex",
    name: "Rex",
    title: "Street Food Vendor • Market Street",
    color: "#9adbb0",
    accent: "#ffd166",
    x: -9.2,
    z: 4.6,
    greeting: "Hmph. You look hungry. Noodles are hot, neon's too bright. What do you want?",
    suggestions: ["What's cooking?", "Tell me about the market", "Bye!"],
  },
];

export const TALK_DISTANCE = 2.8;
