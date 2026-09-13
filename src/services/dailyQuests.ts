// Daily quest seeding — the System issues today's quests on first load of the day:
// 4 necessary baseline quests + 3 AI-generated quests (or deterministic fallback).
// Runs once per calendar day per player; manual "GENERATE" triggers a fresh AI call.

import { supabase } from "../lib/supabase";
import type { TaskInput } from "./api";
import { necessaryQuests, generateDailyQuests, getSavedGoals } from "../lib/questGenerator";

const DAILY_SEED_KEY = "ascent:daily-seeded-on";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function dailySeededToday(): boolean {
  try {
    return localStorage.getItem(DAILY_SEED_KEY) === today();
  } catch {
    return false;
  }
}

function markDailySeeded(): void {
  try {
    localStorage.setItem(DAILY_SEED_KEY, today());
  } catch {
    /* private mode */
  }
}

/** Insert quests for today. Skips titles that already exist (idempotent). */
async function insertDaily(inputs: TaskInput[]): Promise<number> {  if (inputs.length === 0) return 0;
  const { data: existing } = await supabase.from("tasks").select("title");
  const existingTitles = new Set((existing ?? []).map((r: any) => r.title));
  const fresh = inputs.filter((t) => !existingTitles.has(t.title));
  if (fresh.length === 0) return 0;
  const { data, error } = await supabase
    .from("tasks")
    .insert(
      fresh.map((t) => ({
        title: t.title,
        description: t.description ?? null,
        stat: t.category,
        difficulty: t.difficulty,
        estimated_minutes: t.estimatedMinutes,
        due_date: t.dueDate ?? null,
        recurrence: t.recurrence,
      }))
    )
    .select();
  if (error) {
    console.error("daily quest insert failed:", error);
    return 0;
  }
  return data?.length ?? 0;
}

/**
 * Seed today's quests if this is the first load of the day.
 * Returns number inserted (0 = already seeded today / offline).
 */
export async function seedDailyQuestsIfNewDay(
  level: number,
  stats: { STR: number; INT: number; DISC: number; VIT: number; CRE: number }
): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  if (dailySeededToday()) return 0;

  const inserted = await insertDaily(necessaryQuests());
  const goals = getSavedGoals();
  const ai = await generateDailyQuests(level, stats, goals);
  const insertedAi = await insertDaily(ai.map((q) => ({ ...q, dueDate: null, recurrence: "none" as const })));

  markDailySeeded();
  return inserted + insertedAi;
}

/** Manual regenerate: fresh AI call ignoring the daily dedup. */
export async function regenerateDailyQuests(
  level: number,
  stats: { STR: number; INT: number; DISC: number; VIT: number; CRE: number }
): Promise<number> {
  localStorage.removeItem(DAILY_SEED_KEY);
  localStorage.removeItem("ascent:ai-generated-on");
  return seedDailyQuestsIfNewDay(level, stats);
}
