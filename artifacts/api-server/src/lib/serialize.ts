import type { User } from "@workspace/db";

/** Level curve kept for API shape compatibility (100 XP per level). */
function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(xp / 100) + 1);
}

export function serializeUser(u: User, hasProgram: boolean, onboarded: boolean) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
    xp: u.xp,
    level: levelFromXp(u.xp),
    streak: u.streak,
    hasProgram,
    onboarded,
    createdAt: u.createdAt.toISOString(),
  };
}
