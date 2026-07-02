import type {
  User,
  Profile,
  Program,
  Level,
  Task,
  Reminder,
  ChatMessage,
  EarnedBadge,
} from "@workspace/db";
import { levelFromXp } from "./badges";
import { BADGES } from "./badges";
import { PATH_MAP } from "./paths";

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

export function serializeProfile(p: Profile) {
  return {
    userId: p.userId,
    onboarded: p.onboarded,
    about: p.about,
    currentSituation: p.currentSituation,
    biggestChallenge: p.biggestChallenge,
    motivation: p.motivation,
    focusMinutesPerDay: p.focusMinutesPerDay,
  };
}

export function serializeTask(t: Task) {
  return {
    id: t.id,
    levelId: t.levelId,
    levelNumber: t.levelNumber,
    dayNumber: t.dayNumber,
    title: t.title,
    description: t.description,
    timeOfDay: t.timeOfDay,
    durationMinutes: t.durationMinutes,
    completed: t.completed,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    xp: t.xp,
  };
}

export function serializeLevel(l: Level, tasks: Task[]) {
  return {
    id: l.id,
    levelNumber: l.levelNumber,
    title: l.title,
    description: l.description,
    status: l.status,
    xpReward: l.xpReward,
    tasks: tasks.map(serializeTask),
  };
}

function progressPct(tasks: Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((t) => t.completed).length;
  return Math.round((done / tasks.length) * 100);
}

export function serializeProgram(p: Program, levels: Level[], tasks: Task[]) {
  const path = PATH_MAP[p.pathKey];
  return {
    id: p.id,
    pathKey: p.pathKey,
    pathTitle: path?.title ?? p.pathKey,
    title: p.title,
    durationDays: p.durationDays,
    status: p.status,
    currentLevel: p.currentLevel,
    totalLevels: levels.length,
    progressPct: progressPct(tasks),
    accent: p.accent,
    createdAt: p.createdAt.toISOString(),
  };
}

export function serializeProgramDetail(
  p: Program,
  levels: Level[],
  tasksByLevel: Map<number, Task[]>,
) {
  const path = PATH_MAP[p.pathKey];
  const allTasks = levels.flatMap((l) => tasksByLevel.get(l.id) ?? []);
  return {
    id: p.id,
    pathKey: p.pathKey,
    pathTitle: path?.title ?? p.pathKey,
    title: p.title,
    summary: p.summary,
    durationDays: p.durationDays,
    status: p.status,
    currentLevel: p.currentLevel,
    totalLevels: levels.length,
    progressPct: progressPct(allTasks),
    accent: p.accent,
    createdAt: p.createdAt.toISOString(),
    levels: levels
      .sort((a, b) => a.levelNumber - b.levelNumber)
      .map((l) =>
        serializeLevel(
          l,
          (tasksByLevel.get(l.id) ?? []).sort(
            (a, b) => a.orderIndex - b.orderIndex,
          ),
        ),
      ),
  };
}

export function serializeReminder(r: Reminder) {
  return {
    id: r.id,
    title: r.title,
    timeOfDay: r.timeOfDay,
    enabled: r.enabled,
    daysOfWeek: r.daysOfWeek,
  };
}

export function serializeChatMessage(m: ChatMessage) {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

export function serializeBadges(earned: EarnedBadge[]) {
  const earnedMap = new Map(earned.map((e) => [e.badgeKey, e]));
  return BADGES.map((b) => {
    const e = earnedMap.get(b.key);
    return {
      key: b.key,
      title: b.title,
      description: b.description,
      icon: b.icon,
      earned: Boolean(e),
      earnedAt: e ? e.earnedAt.toISOString() : null,
    };
  });
}
