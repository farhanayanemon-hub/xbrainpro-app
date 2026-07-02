import { logger } from "./logger";
import type { PathDef } from "./paths";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterChoice {
  message?: { content?: string };
}
interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
}

function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }
  return key;
}

async function callOpenRouter(
  messages: ChatTurn[],
  opts: { json?: boolean; temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://xbrainpro.app",
      "X-Title": "XBrainPro",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts.temperature ?? 0.8,
      max_tokens: opts.maxTokens ?? 4000,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    logger.error({ status: res.status, body: text }, "OpenRouter request failed");
    throw new Error(`OpenRouter error ${res.status}`);
  }

  const data = (await res.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenRouter returned no content");
  }
  return content;
}

export interface GeneratedTask {
  title: string;
  description: string;
  timeOfDay: string | null;
  durationMinutes: number | null;
}
export interface GeneratedLevel {
  title: string;
  description: string;
  tasks: GeneratedTask[];
}
export interface GeneratedPlan {
  title: string;
  summary: string;
  levels: GeneratedLevel[];
}

interface PlanContext {
  about?: string | null;
  currentSituation?: string | null;
  biggestChallenge?: string | null;
  motivation?: string | null;
}

export async function generatePlan(
  path: PathDef,
  durationDays: number,
  ctx: PlanContext,
): Promise<GeneratedPlan> {
  const levelCount = durationDays >= 60 ? 6 : 5;
  const tasksPerLevel = durationDays >= 60 ? 7 : 6;

  const system = `You are an elite personal transformation coach who designs highly personalized, actionable ${durationDays}-day programs. You always return strictly valid JSON that matches the requested schema. Tasks must be concrete, specific, and doable in a single day. Never use emojis.`;

  const user = `Design a ${durationDays}-day transformation program for the path "${path.title}" (${path.tagline}). ${path.description}

The person shared:
- About them: ${ctx.about || "not provided"}
- Current situation: ${ctx.currentSituation || "not provided"}
- Biggest challenge: ${ctx.biggestChallenge || "not provided"}
- Their motivation: ${ctx.motivation || "not provided"}

Create exactly ${levelCount} progressive levels. Each level should build on the previous one and have exactly ${tasksPerLevel} daily tasks. Each task is one specific action the person does that day.

Return ONLY valid JSON in this exact shape:
{
  "title": "an inspiring name for THIS person's program",
  "summary": "2-3 sentence overview of the journey",
  "levels": [
    {
      "title": "level name",
      "description": "one sentence on what this level develops",
      "tasks": [
        { "title": "short action title", "description": "1-2 sentences of clear instruction", "timeOfDay": "HH:MM 24h or null", "durationMinutes": number or null }
      ]
    }
  ]
}`;

  const raw = await callOpenRouter(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { json: true, temperature: 0.85, maxTokens: 6000 },
  );

  let parsed: GeneratedPlan;
  try {
    parsed = JSON.parse(raw) as GeneratedPlan;
  } catch (err) {
    logger.error({ err, raw: raw.slice(0, 500) }, "Failed to parse AI plan JSON");
    throw new Error("AI returned invalid plan");
  }

  if (!parsed.levels || !Array.isArray(parsed.levels) || parsed.levels.length === 0) {
    throw new Error("AI plan had no levels");
  }

  // Normalize / clamp
  parsed.title = parsed.title?.trim() || `${path.title} Program`;
  parsed.summary = parsed.summary?.trim() || path.description;
  parsed.levels = parsed.levels.slice(0, 8).map((lvl) => ({
    title: lvl.title?.trim() || "Level",
    description: lvl.description?.trim() || "",
    tasks: (lvl.tasks || []).slice(0, 10).map((t) => ({
      title: t.title?.trim() || "Daily task",
      description: t.description?.trim() || "",
      timeOfDay:
        typeof t.timeOfDay === "string" && t.timeOfDay.trim()
          ? t.timeOfDay.trim()
          : null,
      durationMinutes:
        typeof t.durationMinutes === "number" ? t.durationMinutes : null,
    })),
  }));

  return parsed;
}

export async function coachReply(
  history: ChatTurn[],
  userMessage: string,
  context: { name: string; pathTitle?: string; streak?: number; level?: number },
): Promise<string> {
  const system = `You are the XBrainPro AI coach — a warm, sharp, motivating personal transformation coach. You are speaking with ${context.name}${
    context.pathTitle ? `, who is on the "${context.pathTitle}" path` : ""
  }${
    typeof context.streak === "number"
      ? ` with a ${context.streak}-day streak`
      : ""
  }. Give concise, practical, encouraging guidance. Be direct and personal. Keep replies focused and under 180 words. Never use emojis.`;

  const messages: ChatTurn[] = [
    { role: "system", content: system },
    ...history.slice(-10),
    { role: "user", content: userMessage },
  ];

  return callOpenRouter(messages, { temperature: 0.9, maxTokens: 600 });
}
