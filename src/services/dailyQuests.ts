// Daily quest seeding — the System issues today's quests on first load of the day:
// 4 necessary baseline quests + 3 AI-generated quests (or deterministic fallback).
// Runs once per calendar day per player; manual "GENERATE" triggers a fresh AI call.
// Uses localStorage for daily dedup and task storage.

import { localGetSession } from "./localBackend";
import type { Task } from "../types/contract";
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

function readTasks(): Record<string, Task> {
  return JSON.parse(localStorage.getItem("ascent:tasks") ?? "{}");
}

function writeTasks(tasks: Record<string, Task>): void {
  localStorage.setItem("ascent:tasks", JSON.stringify(tasks));
}

/** Insert quests for today. Skips titles that already exist (idempotent). */
async function insertDaily(inputs: Array<{ title: string; description?: string; category: Task["category"]; difficulty: Task["difficulty"]; estimatedMinutes: number; dueDate?: string | null; recurrence: Task["recurrence"] }>): Promise<number> {
  if (inputs.length === 0) return 0;
  const tasks = readTasks();
  const existingTitles = new Set(Object.values(tasks).map((t) => t.title));
  const session = localGetSession();
  if (!session) return 0;
  const fresh = inputs.filter((t) => !existingTitles.has(t.title));
  if (fresh.length === 0) return 0;

  for (const t of fresh) {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: session.user.id,
      title: t.title,
      description: t.description ?? undefined,
      category: t.category,
      difficulty: t.difficulty,
      estimatedMinutes: t.estimatedMinutes,
      dueDate: t.dueDate ?? null,
      recurrence: t.recurrence,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    tasks[task.id] = task;
  }
  writeTasks(tasks);
  return fresh.length;
}

/** Seed today's quests if this is the first load of the day. */
export async function seedDailyQuestsIfNewDay(
  level: number,
  stats: { STR: number; INT: number; DISC: number; VIT: number; CRE: number }
): Promise<number> {
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
