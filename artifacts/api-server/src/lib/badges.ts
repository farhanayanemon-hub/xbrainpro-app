export interface BadgeDef {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export const BADGES: BadgeDef[] = [
  {
    key: "first_step",
    title: "First Step",
    description: "Complete your very first task",
    icon: "flag",
  },
  {
    key: "streak_3",
    title: "On a Roll",
    description: "Reach a 3-day streak",
    icon: "flame",
  },
  {
    key: "streak_7",
    title: "Week Warrior",
    description: "Reach a 7-day streak",
    icon: "flame",
  },
  {
    key: "streak_30",
    title: "Unstoppable",
    description: "Reach a 30-day streak",
    icon: "trophy",
  },
  {
    key: "level_2",
    title: "Level Up",
    description: "Reach account level 2",
    icon: "arrow-up",
  },
  {
    key: "level_5",
    title: "Rising Star",
    description: "Reach account level 5",
    icon: "star",
  },
  {
    key: "xp_500",
    title: "Grinder",
    description: "Earn 500 total XP",
    icon: "zap",
  },
  {
    key: "xp_1000",
    title: "Machine",
    description: "Earn 1000 total XP",
    icon: "zap",
  },
  {
    key: "tasks_25",
    title: "Consistent",
    description: "Complete 25 tasks",
    icon: "check",
  },
  {
    key: "level_complete",
    title: "Milestone",
    description: "Complete an entire level",
    icon: "medal",
  },
];

export const BADGE_MAP: Record<string, BadgeDef> = Object.fromEntries(
  BADGES.map((b) => [b.key, b]),
);

// XP thresholds: level N requires (N-1) * XP_PER_LEVEL total XP.
export const XP_PER_LEVEL = 200;

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}
