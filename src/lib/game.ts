// Display-only RPG constants. All math that decides rewards is server-side.

export const STATS = ["STR", "INT", "DISC", "VIT", "CRE"] as const;

export const STAT_META: Record<string, { label: string; hint: string }> = {
  STR: { label: "Strength", hint: "Physical action" },
  INT: { label: "Intellect", hint: "Learning and knowledge" },
  DISC: { label: "Discipline", hint: "Consistency and habits" },
  VIT: { label: "Vitality", hint: "Wellbeing and recovery" },
  CRE: { label: "Creativity", hint: "Building and making" },
};

export const DIFFICULTY_META: Record<string, { label: string; xpRange: string }> = {
  easy: { label: "Quick Win", xpRange: "20-50 XP" },
  standard: { label: "Standard", xpRange: "45-90 XP" },
  hard: { label: "Hard", xpRange: "100-180 XP" },
};

export const DIFFICULTY_UNLOCKS_AT: Record<string, number> = {
  easy: 1,
  standard: 1,
  hard: 11,
};

export const RANK_META: Record<string, { min: number; max: number }> = {
  E: { min: 1, max: 5 },
  D: { min: 6, max: 10 },
  C: { min: 11, max: 20 },
  B: { min: 21, max: 35 },
  A: { min: 36, max: 50 },
  S: { min: 51, max: Infinity },
};

// [SYSTEM] message styles
export const SYSTEM_MESSAGES = {
  questRegistered: "QUEST REGISTERED.",
  questCleared: "QUEST CLEARED.",
  connectionUnstable: "[SYSTEM] Connection unstable. Reward is not yet confirmed.",
  evolutionComplete: "EVOLUTION COMPLETE.",
};

export function formatXp(n: number): string {
  return n.toLocaleString("en-US");
}
