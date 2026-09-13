// Quest generator — real AI daily quests via Gemini, with deterministic fallback.
// Client-side key (VITE_GEMINI_API_KEY) for the hackathon MVP. Called at most
// once per day per player (localStorage dedup) plus manual "GENERATE" button.

import { env } from "./env";
import type { StatKey, Difficulty } from "../types/contract";

export interface GeneratedQuest {
  title: string;
  description: string;
  category: StatKey;
  difficulty: Difficulty;
  estimatedMinutes: number;
  source: "ai" | "daily";
}

const CATEGORIES: StatKey[] = ["STR", "INT", "DISC", "VIT", "CRE"];
const DIFFICULTIES: Difficulty[] = ["easy", "standard", "hard"];
const DAILY_KEY = "ascent:ai-generated-on";
const GOALS_KEY = "ascent:goals";
const DAILY_NECESSARY = [
  // Non-AI baseline quests every day: body + mind fundamentals.
  { title: "Drink 8 glasses of water", description: "Stay hydrated through the day.", category: "VIT", difficulty: "easy", estimatedMinutes: 5 },
  { title: "10-minute walk", description: "Step outside and move.", category: "VIT", difficulty: "easy", estimatedMinutes: 10 },
  { title: "Read 10 pages", description: "Any book counts.", category: "INT", difficulty: "standard", estimatedMinutes: 20 },
  { title: "Tidy your space for 10 minutes", description: "Clear desk, clear mind.", category: "DISC", difficulty: "easy", estimatedMinutes: 10 },
] as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Did the AI already generate quests today? (localStorage dedup) */
export function aiGeneratedToday(): boolean {
  try {
    return localStorage.getItem(DAILY_KEY) === today();
  } catch {
    return false;
  }
}

function markGenerated(): void {
  try {
    localStorage.setItem(DAILY_KEY, today());
  } catch {
    /* private mode */
  }
}

/** Saved onboarding goals (localStorage) — feed the AI generator. */
export function getSavedGoals(): string[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveGoals(goals: string[]): void {
  try {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
  } catch {
    /* private mode */
  }
}

/** The four necessary baseline quests (water, walk, read, tidy). */
export function necessaryQuests() {
  return DAILY_NECESSARY.map((q) => ({
    title: q.title,
    description: q.description,
    category: q.category as StatKey,
    difficulty: q.difficulty as Difficulty,
    estimatedMinutes: q.estimatedMinutes,
    dueDate: null,
    recurrence: "daily" as const,
  }));
}

/** Deterministic fallback if AI is unavailable: weakest-stat based quests. */
function fallbackQuests(
  level: number,
  stats: Record<StatKey, number>,
  goals: string[]
): GeneratedQuest[] {
  const weakest = [...CATEGORIES].sort((a, b) => (stats[a] ?? 0) - (stats[b] ?? 0))[0];
  const target = goals.length > 0 ? (goals[0] as StatKey) : weakest;
  const pool: Record<StatKey, GeneratedQuest[]> = {
    STR: [
      { title: "20 push-ups in sets", description: "Split however needed. Done when 20 are done.", category: "STR", difficulty: "easy", estimatedMinutes: 10, source: "daily" },
      { title: "Stretch routine", description: "Full-body stretch, hold each 20s.", category: "STR", difficulty: "easy", estimatedMinutes: 12, source: "daily" },
    ],
    INT: [
      { title: "Study one topic 25 minutes", description: "No phone. One topic only.", category: "INT", difficulty: "standard", estimatedMinutes: 25, source: "daily" },
      { title: "Review yesterday's notes", description: "Read them once, flag gaps.", category: "INT", difficulty: "easy", estimatedMinutes: 10, source: "daily" },
    ],
    DISC: [
      { title: "Make your bed", description: "First win of the day, 30 seconds.", category: "DISC", difficulty: "easy", estimatedMinutes: 1, source: "daily" },
      { title: "Plan tomorrow in 5 lines", description: "Five lines, five priorities.", category: "DISC", difficulty: "easy", estimatedMinutes: 5, source: "daily" },
    ],
    VIT: [
      { title: "10-minute walk", description: "Step outside and move.", category: "VIT", difficulty: "easy", estimatedMinutes: 10, source: "daily" },
      { title: "No screens 30 min before bed", description: "Tonight. Let the eyes rest.", category: "VIT", difficulty: "easy", estimatedMinutes: 30, source: "daily" },
    ],
    CRE: [
      { title: "Sketch or write for 15 minutes", description: "Anything. Bad on purpose is fine.", category: "CRE", difficulty: "easy", estimatedMinutes: 15, source: "daily" },
      { title: "Photograph one interesting thing", description: "One frame, anywhere.", category: "CRE", difficulty: "easy", estimatedMinutes: 10, source: "daily" },
    ],
  };
  const picks = [pool[weakest][0], pool[target === weakest ? weakest : target][1] ?? pool[target][0], pool[weakest][1]];
  return picks.map((q) => ({ ...q, source: "daily" as const, estimatedMinutes: Math.max(5, Math.round(q.estimatedMinutes * (1 + level * 0.02))) }));
}

/**
 * Generate today's quests with Gemini. Returns AI quests, or the deterministic
 * fallback if no key / network / parse failure. Never throws.
 */
export async function generateDailyQuests(
  level: number,
  stats: Record<StatKey, number>,
  goals: string[]
): Promise<GeneratedQuest[]> {
  if (!env.VITE_GEMINI_API_KEY) return fallbackQuests(level, stats, goals);

  try {
    const prompt = [
      "You are the quest generator for ASCENT, a life gamification app.",
      `Player: level ${level}. Attributes: STR ${stats.STR}, INT ${stats.INT}, DISC ${stats.DISC}, VIT ${stats.VIT}, CRE ${stats.CRE}.`,
      goals.length ? `Stated goals: ${goals.join(", ")}.` : "No stated goals.",
      "Create 3 concrete 5-45 minute real-world quests for today, targeting the weakest attributes and stated goals. No gym-membership or equipment-heavy quests.",
      "Each quest has ONE clear success criterion.",
      'Return JSON only: array of {"title": string (max 60 chars, imperative), "description": string (max 120 chars, one success criterion), "category": "STR"|"INT"|"DISC"|"VIT"|"CRE", "difficulty": "easy"|"standard", "estimatedMinutes": number}',
    ].join("\n");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.VITE_GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", maxOutputTokens: 1024 },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const json = await res.json();
    const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : (parsed.quests ?? []);
    const valid: GeneratedQuest[] = rows
      .filter(
        (r: any) =>
          typeof r?.title === "string" &&
          r.title.trim().length > 0 &&
          CATEGORIES.includes(r.category) &&
          DIFFICULTIES.includes(r.difficulty)
      )
      .slice(0, 3)
      .map((r: any) => ({
        title: r.title.trim().slice(0, 60),
        description: (typeof r.description === "string" ? r.description : "").trim().slice(0, 140),
        category: r.category as StatKey,
        difficulty: r.difficulty === "standard" ? "standard" : "easy",
        estimatedMinutes: Math.min(60, Math.max(5, Number(r.estimatedMinutes) || 15)),
        source: "ai" as const,
      }));
    if (valid.length === 0) throw new Error("no valid quests");
    markGenerated();
    return valid;
  } catch (err) {
    console.warn("AI quest generation failed, using fallback:", err);
    return fallbackQuests(level, stats, goals);
  }
}
