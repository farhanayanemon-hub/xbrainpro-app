import { logger } from "./logger";

import { getSetting, SETTING_KEYS } from "./settings";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_MODEL = "openai/gpt-4o-mini";

/** Model priority: admin panel setting > OPENROUTER_MODEL env > default. */
export async function resolveModel(): Promise<string> {
  try {
    const fromSetting = await getSetting(SETTING_KEYS.openrouterModel);
    if (fromSetting?.trim()) return fromSetting.trim();
  } catch (err) {
    logger.warn({ err }, "Failed to read model setting, using env/default");
  }
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
}

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

export async function callOpenRouter(
  messages: ChatTurn[],
  opts: { json?: boolean; temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const maxAttempts = 3;
  let lastError: Error = new Error("OpenRouter request failed");

  const model = await resolveModel();
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
        model,
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
 * fences, leading/trailing prose, and repairs trailing-comma mistakes
 * that free-tier models produce.
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
