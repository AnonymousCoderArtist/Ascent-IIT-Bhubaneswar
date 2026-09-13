// API service layer — one place for every backend call.
// Branches between Supabase (VITE_SUPABASE_URL set) and local mode (cached on user PC).
// Shapes match agents/SHARED_CONTRACT.md + supabase/migrations RPCs.

import { supabase } from "../lib/supabase";
import { env } from "../lib/env";
import {
  localSignUp, localSignIn, localSignOut, localGetSession, localEnsureSession,
  localGetProfile, localUpdateDisplayName,
  localListTasks, localCreateTask, localUpdateTask, localDeleteTask,
  localCompleteQuest, localListInventory, localListCatalog, localListQuestExamples, localRecommendQuest,
  ensureLocalSeeds,
} from "./localBackend";
import type { Profile, Task, CompleteQuestResponse, InventoryItem, CatalogItem, QuestExample } from "../types/contract";

ensureLocalSeeds();

const useLocal = (): boolean => !(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);

// ---- Tasks ----

export async function listTasks(): Promise<Task[]> {
  if (useLocal()) return localListTasks();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTask);
}

export async function createTask(input: Partial<TaskInput>): Promise<Task> {
  if (useLocal()) return localCreateTask(input);
  const { data, error } = await supabase.from("tasks").insert(mapTaskInput(input)).select().single();
  if (error) throw error;
  return mapTask(data);
}

export async function updateTask(id: string, input: Partial<TaskInput>): Promise<Task> {
  if (useLocal()) return localUpdateTask(id, input);
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
  if (useLocal()) { await localDeleteTask(id); return; }
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
  if (useLocal()) return localGetProfile();
  const { data, error } = await supabase.from("profiles").select("*").single();
  if (error && error.code !== "PGRST116") throw error;
  return data ? mapProfile(data) : null;
}

export async function updateDisplayName(name: string): Promise<void> {
  if (useLocal()) { await localUpdateDisplayName(name); return; }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { error } = await supabase.from("profiles").update({ display_name: name }).eq("id", user.id);
  if (error) throw error;
}

// ---- Completion (server-authoritative via Edge Function -> RPC) ----

export class QuestError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function completeQuest(taskId: string): Promise<CompleteQuestResponse> {
  if (useLocal()) return localCompleteQuest(taskId);
  const { data, error } = await supabase.functions.invoke("complete-quest", { body: { taskId } });
  // Network / FunctionsError: surface the message if we have it.
  if (error) {
    const fnData = (error as { context?: { payload?: unknown } }).context?.payload as
      | { code?: string; message?: string }
      | undefined;
    throw new QuestError(
      fnData?.code ?? "REWARD_TRANSACTION_FAILED",
      fnData?.message ?? error.message ?? "Completion failed."
    );
  }
  // RPC-level error body: { code, message } without success flag.
  if (data && typeof data === "object" && "error" in (data as object) && !("success" in (data as object))) {
    const body = data as { code?: string; message?: string; error?: string };
    throw new QuestError(body.code ?? body.error ?? "REWARD_TRANSACTION_FAILED", body.message ?? "Completion failed.");
  }
  return data as CompleteQuestResponse;
}

// ---- Inventory & store ----

export async function listInventory(): Promise<InventoryItem[]> {
  if (useLocal()) return localListInventory();
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
  if (useLocal()) return localListCatalog();
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
  if (useLocal()) return localListQuestExamples();
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
