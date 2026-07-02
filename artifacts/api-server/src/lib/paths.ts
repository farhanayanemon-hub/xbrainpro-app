export interface PathDef {
  key: string;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  outcomes: string[];
}

export const PATHS: PathDef[] = [
  {
    key: "millionaire",
    title: "Millionaire Mindset",
    tagline: "Rewire how you think about money and wealth",
    description:
      "Build the psychology, habits, and daily discipline of people who create lasting wealth. Move from scarcity to ownership.",
    accent: "#E0B341",
    outcomes: [
      "Master money psychology",
      "Design multiple income streams",
      "Build wealth-creating daily habits",
      "Think in assets, not expenses",
    ],
  },
  {
    key: "business",
    title: "Business Builder",
    tagline: "Turn ideas into a real, growing business",
    description:
      "Go from concept to launch to traction. Learn to validate, build, sell, and scale with the operating rhythm of a founder.",
    accent: "#3B82F6",
    outcomes: [
      "Validate a real idea",
      "Build an offer people pay for",
      "Land your first customers",
      "Operate like a founder",
    ],
  },
  {
    key: "heartbreak",
    title: "Heartbreak Recovery",
    tagline: "Heal, rebuild, and come back stronger",
    description:
      "A guided path through grief, closure, and rediscovery. Rebuild your identity and self-worth after loss.",
    accent: "#EC4899",
    outcomes: [
      "Process the pain healthily",
      "Rebuild your self-worth",
      "Create healthy boundaries",
      "Fall back in love with your life",
    ],
  },
  {
    key: "happiness",
    title: "Inner Peace & Happiness",
    tagline: "Find calm, gratitude, and lasting contentment",
    description:
      "Cultivate presence, gratitude, and emotional balance. Build a daily practice that makes peace your default state.",
    accent: "#10B981",
    outcomes: [
      "Build a mindfulness practice",
      "Master your inner dialogue",
      "Cultivate daily gratitude",
      "Find calm under pressure",
    ],
  },
  {
    key: "superhuman",
    title: "Superhuman",
    tagline: "Optimize your body, energy, and performance",
    description:
      "Upgrade your sleep, energy, fitness, and focus. Engineer a body and mind that perform at the highest level.",
    accent: "#EF4444",
    outcomes: [
      "Engineer elite energy",
      "Master sleep and recovery",
      "Build unbreakable discipline",
      "Peak physical performance",
    ],
  },
  {
    key: "confidence",
    title: "Confidence & Social",
    tagline: "Become magnetic, bold, and socially fearless",
    description:
      "Develop genuine confidence and social mastery. Speak, connect, and lead without fear or hesitation.",
    accent: "#8B5CF6",
    outcomes: [
      "Kill social anxiety",
      "Speak with authority",
      "Build magnetic presence",
      "Connect with anyone",
    ],
  },
  {
    key: "focus",
    title: "Deep Focus",
    tagline: "Reclaim your attention and do deep work",
    description:
      "Beat distraction and build the ability to focus for hours. Train the deep-work muscle that produces real results.",
    accent: "#06B6D4",
    outcomes: [
      "Beat digital distraction",
      "Build deep-work stamina",
      "Design a focus environment",
      "Ship meaningful work daily",
    ],
  },
];

export const PATH_MAP: Record<string, PathDef> = Object.fromEntries(
  PATHS.map((p) => [p.key, p]),
);
