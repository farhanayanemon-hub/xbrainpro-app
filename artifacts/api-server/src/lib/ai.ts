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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOpenRouter(
  messages: ChatTurn[],
  opts: { json?: boolean; temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const maxAttempts = 3;
  let lastError: Error = new Error("OpenRouter request failed");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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

    if (res.status === 429 || res.status >= 500) {
      const text = await res.text().catch(() => "");
      logger.warn(
        { status: res.status, body: text.slice(0, 300), attempt },
        "OpenRouter transient error, retrying",
      );
      lastError = new Error(`OpenRouter error ${res.status}`);
      if (attempt < maxAttempts) {
        await sleep(attempt * 3000);
        continue;
      }
      throw lastError;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.error(
        { status: res.status, body: text.slice(0, 500) },
        "OpenRouter request failed",
      );
      throw new Error(`OpenRouter error ${res.status}`);
    }

    const data = (await res.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter returned no content");
    }
    return content;
  }

  throw lastError;
}

/**
 * Best-effort extraction of a JSON object from model output. Handles code
 * fences, leading/trailing prose, and repairs common model mistakes
 * (trailing commas, unquoted values) that free-tier models produce.
 */
export function extractJsonObject(raw: string): string {
  let text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  return text;
}

function tryParseJson<T>(raw: string): T | null {
  const text = extractJsonObject(raw);
  try {
    return JSON.parse(text) as T;
  } catch {
    // Repair pass: remove trailing commas before } or ]
    const repaired = text.replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(repaired) as T;
    } catch {
      return null;
    }
  }
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

  const messages: ChatTurn[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  let parsed: GeneratedPlan | null = null;
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Lower temperature on retry: creative output matters less than valid JSON.
    const temperature = attempt === 1 ? 0.7 : 0.3;
    const raw = await callOpenRouter(messages, {
      json: true,
      temperature,
      maxTokens: 8000,
    });

    const candidate = tryParseJson<GeneratedPlan>(raw);
    if (
      candidate &&
      Array.isArray(candidate.levels) &&
      candidate.levels.length > 0
    ) {
      parsed = candidate;
      break;
    }
    logger.warn(
      { attempt, raw: raw.slice(0, 500) },
      "AI plan JSON invalid, retrying",
    );
  }

  if (!parsed) {
    logger.error("AI plan generation failed after retries");
    throw new Error("AI returned invalid plan");
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
