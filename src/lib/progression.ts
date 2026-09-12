// Display-only progression math. The backend is authoritative; this exists
// purely to render bars, badges and previews from authoritative totalXp.
// Mirrors supabase xp_required_for_level: round(80 + 25*L + 15*L^1.35)

export function thresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(80 + 25 * level + 15 * Math.pow(level, 1.35));
}

export function levelForXp(totalXp: number): number {
  let level = 1;
  while (thresholdForLevel(level + 1) <= totalXp) {
    level++;
    if (level > 99) break;
  }
  return level;
}

export type Rank = "E" | "D" | "C" | "B" | "A" | "S";

export function rankForLevel(level: number): Rank {
  if (level >= 51) return "S";
  if (level >= 36) return "A";
  if (level >= 21) return "B";
  if (level >= 11) return "C";
  if (level >= 6) return "D";
  return "E";
}

export interface LevelDisplay {
  level: number;
  rank: Rank;
  xpIntoLevel: number;
  xpForLevel: number;
  pct: number;
  xpToNext: number;
}

export function levelDisplay(totalXp: number, level?: number): LevelDisplay {
  const lv = level ?? levelForXp(totalXp);
  const base = thresholdForLevel(lv);
  const next = thresholdForLevel(lv + 1);
  const into = Math.max(0, totalXp - base);
  const need = Math.max(1, next - base);
  return {
    level: lv,
    rank: rankForLevel(lv),
    xpIntoLevel: into,
    xpForLevel: need,
    pct: Math.min(100, (into / need) * 100),
    xpToNext: Math.max(0, next - totalXp),
  };
}

// Per-level reward hooks (PRD 5.5) for the "next reward" preview panel.
export const LEVEL_HOOKS: Record<number, string> = {
  2: "Aura I ignition + first title",
  3: "Essence chest + new System accent",
  4: "Achievement badge + stronger XP burst",
  5: "World Restoration I: first structure rises",
  6: "Streak reward chest + new quest variant",
  7: "Character Evolution I",
  8: "Cosmetic unlock + stronger aura",
  9: "Ambient world effect + streak flame upgrade",
  10: "Training Ground + Character Evolution II",
  11: "Hard quests become available",
  12: "Achievement + Essence bonus",
  13: "Title / cosmetic unlock",
  14: "System mastery visual effect",
  15: "Knowledge Library + Character Evolution III",
  16: "Cosmetic unlock",
  17: "Essence bonus",
  18: "Title unlock",
  19: "System effect upgrade",
  20: "Forge District + major evolution reward",
  21: "Cosmetic unlock",
  25: "Mastery title",
  30: "Central Tower + Ascended showcase",
};

export function nextHook(level: number): string {
  return LEVEL_HOOKS[level + 1] ?? "Keep ascending. The System is watching.";
}
