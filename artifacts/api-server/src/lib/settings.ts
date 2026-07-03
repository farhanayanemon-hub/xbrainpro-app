import { eq } from "drizzle-orm";
import { db, appSettingsTable } from "@workspace/db";

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: string | null; expires: number }>();

export async function getSetting(key: string): Promise<string | null> {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  const [row] = await db
    .select()
    .from(appSettingsTable)
    .where(eq(appSettingsTable.key, key));
  const value = row?.value ?? null;
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(appSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({
      target: appSettingsTable.key,
      set: { value, updatedAt: new Date() },
    });
  cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
}

export const SETTING_KEYS = {
  openrouterModel: "openrouter_model",
} as const;
