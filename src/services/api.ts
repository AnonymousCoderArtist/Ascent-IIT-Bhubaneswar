// API service layer — one place for every backend call.
// Shapes match agents/SHARED_CONTRACT.md. When the backend agent lands real
// endpoints, only these files change; components stay untouched.

import { supabase } from "../lib/supabase";
import type { Profile, Task, CompleteQuestResponse, InventoryItem } from "../types/contract";

// ---- Tasks ----

export async function listTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return mapTasks(data ?? []);
}

export async function createTask(input: NewTaskInput): Promise<Task> {
  const { data, error } = await supabase.from("tasks").insert(mapTaskInput(input)).select().single();
  if (error) throw error;
  return mapTask(data);
}

export async function updateTask(id: string, input: Partial<NewTaskInput>): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(mapTaskInput(input))
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return mapTask(data);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

export interface NewTaskInput {
  title: string;
  description?: string;
  category: Task["category"];
  difficulty: Task["difficulty"];
  estimatedMinutes: number;
  dueDate?: string | null;
  recurrence: Task["recurrence"];
}

// ---- Profile ----

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").single();
  if (error && error.code !== "PGRST116") throw error;
  return data ? mapProfile(data) : null;
}

// ---- Completion (server-authoritative) ----

export async function completeQuest(taskId: string): Promise<CompleteQuestResponse> {
  const { data, error } = await supabase.functions.invoke("complete-quest", { body: { taskId } });
  if (error) throw error;
  return data as CompleteQuestResponse;
}

// ---- Inventory ----

export async function listInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from("inventory").select("*");
  if (error) throw error;
  return (data ?? []).map(mapInventoryItem);
}

// ---- Mapping: snake_case DB -> camelCase contract ----

type Row = Record<string, any>;

function mapTask(row: Row): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    category: row.stat,
    difficulty: row.difficulty,
    estimatedMinutes: row.estimated_minutes,
    dueDate: row.due_date ?? null,
    recurrence: row.recurrence,
    completed: row.completed,
    createdAt: row.created_at,
  };
}

function mapTasks(rows: Row[]): Task[] {
  return rows.map(mapTask);
}

function mapTaskInput(input: Partial<NewTaskInput>): Row {
  const out: Row = {};
  if (input.title !== undefined) out.title = input.title.trim();
  if (input.description !== undefined) out.description = input.description?.trim() || null;
  if (input.category !== undefined) out.stat = input.category;
  if (input.difficulty !== undefined) out.difficulty = input.difficulty;
  if (input.estimatedMinutes !== undefined) out.estimated_minutes = input.estimatedMinutes;
  if (input.dueDate !== undefined) out.due_date = input.dueDate || null;
  if (input.recurrence !== undefined) out.recurrence = input.recurrence;
  return out;
}

function mapProfile(row: Row): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    level: row.level,
    totalXp: row.total_xp,
    essence: row.essence,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActivityDate: row.last_activity_date,
    rank: row.rank,
    str: row.str,
    int: row.int,
    disc: row.disc,
    vit: row.vit,
    cre: row.cre,
  };
}

function mapInventoryItem(row: Row): InventoryItem {
  return {
    id: row.id,
    itemKey: row.item_key,
    itemType: row.item_type,
    acquiredAt: row.acquired_at,
    equipped: row.equipped,
  };
}
