// Seeds the PRD 5.3 AWAKENING QUEST for brand-new players so the first win
// is always one tap away. Uses the quest_examples row if it exists.

import { supabase } from "../lib/supabase";
import type { Task } from "../types/contract";

export async function seedAwakeningQuestIfEmpty(): Promise<Task | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { count } = await supabase.from("tasks").select("id", { count: "exact", head: true });
  if (count !== 0) return null;

  // Try the seeded example first
  const { data: example } = await supabase
    .from("quest_examples")
    .select("*")
    .eq("title", "AWAKENING QUEST")
    .maybeSingle();

  const payload = example
    ? {
        title: example.title,
        description: example.description,
        stat: example.stat,
        difficulty: example.difficulty,
        estimated_minutes: example.estimated_minutes,
      }
    : {
        title: "AWAKENING QUEST",
        description: "Drink a glass of water and take a 5-minute walk.",
        stat: "VIT",
        difficulty: "easy",
        estimated_minutes: 5,
      };

  const { data, error } = await supabase.from("tasks").insert(payload).select().single();
  if (error) {
    console.error("awakening seed failed:", error);
    return null;
  }
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    description: data.description ?? undefined,
    category: data.stat,
    difficulty: data.difficulty,
    estimatedMinutes: data.estimated_minutes,
    dueDate: data.due_date ?? null,
    recurrence: data.recurrence,
    completed: data.completed,
    createdAt: data.created_at,
  };
}
