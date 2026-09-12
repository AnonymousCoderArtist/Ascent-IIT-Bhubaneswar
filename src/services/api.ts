// API service layer — one place for every backend call.
// Shapes match agents/SHARED_CONTRACT.md + supabase/migrations RPCs.

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
  return (data ?? []).map(mapTask);
}

export async function createTask(input: Partial<TaskInput>): Promise<Task> {
  const { data, error } = await supabase.from("tasks").insert(mapTaskInput(input)).select().single();
  if (error) throw error;
  return mapTask(data);
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
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

export interface TaskInput {
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

export async function updateDisplayName(name: string): Promise<void> {
  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
  if (error) throw error;
}

// ---- Completion (server-authoritative via Edge Function -> RPC) ----

export async function completeQuest(taskId: string): Promise<CompleteQuestResponse> {
  const { data, error } = await supabase.functions.invoke("complete-quest", { body: { taskId } });
  if (error) throw error;
  if (data && typeof data === "object" && "error" in data && !("success" in data)) {
    throw new Error((data as { message?: string }).message ?? "Completion failed.");
  }
  return data as CompleteQuestResponse;
}

// ---- Inventory & store ----

export async function listInventory(): Promise<InventoryItem[]> {
  const { data, error } = await supabase.from("inventory").select("*");
  if (error) throw error;
  return (data ?? []).map(mapInventoryItem);
}

export interface CatalogItem {
  key: string;
  name: string;
  itemType: "aura" | "outfit" | "weapon" | "title" | "world";
  essenceCost: number;
  description: string | null;
  unlocksAtLevel: number;
}

export async function listCatalog(): Promise<CatalogItem[]> {
  const { data, error } = await supabase.from("item_catalog").select("*");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    key: r.key,
    name: r.name,
    itemType: r.item_type,
    essenceCost: r.essence_cost,
    description: r.description,
    unlocksAtLevel: r.unlocks_at_level ?? 1,
  }));
}

export interface QuestExample {
  id: string;
  title: string;
  description: string | null;
  stat: Task["category"];
  difficulty: Task["difficulty"];
  estimatedMinutes: number;
}

export async function listQuestExamples(): Promise<QuestExample[]> {
  const { data, error } = await supabase.from("quest_examples").select("*");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    stat: r.stat,
    difficulty: r.difficulty,
    estimatedMinutes: r.estimated_minutes,
  }));
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

function mapTaskInput(input: Partial<TaskInput>): Row {
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
