// Local display catalog: names/icons/descriptions for backend item keys.
// Purely cosmetic mapping — costs and unlocks come from item_catalog table.

import type { StatKey } from "../types/contract";

export interface CatalogEntry {
  key: string;
  name: string;
  type: "aura" | "outfit" | "weapon" | "title" | "world";
  desc: string;
  icon: string;
}

// Keys aligned with supabase/migrations/004_item_catalog_and_seeds.sql
export const ITEM_CATALOG: Record<string, CatalogEntry> = {
  starter_aura: { key: "starter_aura", name: "Starter Aura", type: "aura", desc: "A dormant violet spark. Your first companion.", icon: "Sparkle" },
  starter_outfit: { key: "starter_outfit", name: "Adventurer Garb", type: "outfit", desc: "Simple dark jacket and trousers.", icon: "Shirt" },
  aura_i: { key: "aura_i", name: "Aura Ignition", type: "aura", desc: "A glowing violet aura ring. Level 2 reward.", icon: "Radiation" },
  training_blade: { key: "training_blade", name: "Training Blade", type: "weapon", desc: "A graphite training blade with violet energy.", icon: "Sword" },
  essence_crystal: { key: "essence_crystal", name: "Essence Crystal", type: "aura", desc: "Faceted crystal radiating violet light.", icon: "Gem" },
  badge_awakened: { key: "badge_awakened", name: "Awakened Badge", type: "title", desc: "A silver and violet achievement emblem.", icon: "Award" },
  forge_outfit: { key: "forge_outfit", name: "Forge Attire", type: "outfit", desc: "Craft-oriented dark futuristic-fantasy attire.", icon: "Shirt" },
};

export function catalogFor(key: string): CatalogEntry {
  return ITEM_CATALOG[key] ?? { key, name: key.replace(/_/g, " "), type: "aura", desc: "A system artifact.", icon: "Package" };
}

export const STAT_ICONS: Record<StatKey, string> = {
  STR: "Dumbbell",
  INT: "BookOpen",
  DISC: "CalendarCheck",
  VIT: "HeartPulse",
  CRE: "Sparkles",
};

export const STAT_LABELS: Record<StatKey, string> = {
  STR: "Strength",
  INT: "Intellect",
  DISC: "Discipline",
  VIT: "Vitality",
  CRE: "Creativity",
};

// World zones for the left rail — milestones the world evolves through.
export interface Zone {
  level: number;
  key: string;
  name: string;
  icon: string;
  blurb: string;
}

export const ZONES: Zone[] = [
  { level: 1, key: "settlement", name: "Ruined Settlement", icon: "Home", blurb: "Where every ascent begins." },
  { level: 5, key: "restored_structure", name: "Restored Outpost", icon: "Landmark", blurb: "The first structure rises." },
  { level: 10, key: "training_ground", name: "Training Ground", icon: "Dumbbell", blurb: "A courtyard for practice." },
  { level: 15, key: "library", name: "Knowledge Library", icon: "BookOpen", blurb: "Luminous archives of the mind." },
  { level: 20, key: "forge", name: "Forge District", icon: "Hammer", blurb: "Where worlds are shaped." },
  { level: 30, key: "central_tower", name: "Central Tower", icon: "TowerControl", blurb: "The awakened tower." },
];

export const STAT_META: Record<StatKey, { label: string; hint: string }> = {
  STR: { label: "Strength", hint: "Physical action" },
  INT: { label: "Intellect", hint: "Learning and knowledge" },
  DISC: { label: "Discipline", hint: "Consistency and habits" },
  VIT: { label: "Vitality", hint: "Wellbeing and recovery" },
  CRE: { label: "Creativity", hint: "Building and making" },
};

export const DIFFICULTY_META: Record<string, { label: string; xpRange: string; unlocksAt: number }> = {
  easy: { label: "Quick Win", xpRange: "20-50 XP", unlocksAt: 1 },
  standard: { label: "Standard", xpRange: "45-90 XP", unlocksAt: 1 },
  hard: { label: "Hard", xpRange: "100-180 XP", unlocksAt: 11 },
};
