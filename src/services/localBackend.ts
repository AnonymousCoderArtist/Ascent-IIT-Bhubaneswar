// Local backend — localStorage-backed implementation of the same interface as services/api.ts.
// Activated when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are absent.
// Reward math MIRRORS supabase/migrations/002_functions.sql complete_quest EXACTLY.

import type { Profile, Task, CompleteQuestResponse, InventoryItem, CatalogItem, Rank, BackendErrorCode } from "../types/contract";
import { thresholdForLevel, rankForLevel } from "../lib/progression";

const LS = {
  profile: "ascent:profile",
  tasks: "ascent:tasks",
  completions: "ascent:completions",
  xpEvents: "ascent:xp_events",
  inventory: "ascent:inventory",
  session: "ascent:session",
  achievements: "ascent:achievements",
};

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode */
  }
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function hashPassword(pw: string): string {
  let hash = 0;
  for (let i = 0; i < pw.length; i++) {
    const c = pw.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}`;
}

const SEED_CATALOG: CatalogItem[] = [
  { key: "starter_aura", name: "Starter Aura", itemType: "aura", essenceCost: 0, description: "A dormant violet spark. Your first companion.", unlocksAtLevel: 1 },
  { key: "starter_outfit", name: "Adventurer Garb", itemType: "outfit", essenceCost: 0, description: "Simple dark jacket and trousers.", unlocksAtLevel: 1 },
  { key: "aura_i", name: "Aura Ignition", itemType: "aura", essenceCost: 100, description: "A glowing violet aura ring. Level 2 reward.", unlocksAtLevel: 2 },
  { key: "training_blade", name: "Training Blade", itemType: "weapon", essenceCost: 150, description: "A graphite training blade with violet energy.", unlocksAtLevel: 7 },
  { key: "essence_crystal", name: "Essence Crystal", itemType: "aura", essenceCost: 80, description: "Faceted crystal radiating violet light.", unlocksAtLevel: 3 },
  { key: "badge_awakened", name: "Awakened Badge", itemType: "title", essenceCost: 50, description: "A silver and violet achievement emblem.", unlocksAtLevel: 4 },
  { key: "forge_outfit", name: "Forge Attire", itemType: "outfit", essenceCost: 200, description: "Craft-oriented dark futuristic-fantasy attire.", unlocksAtLevel: 20 },
];

const SEED_QUEST_EXAMPLES: Array<{ id: string; title: string; description: string | null; stat: Task["category"]; difficulty: Task["difficulty"]; estimatedMinutes: number }> = [
  { id: "qe1", title: "AWAKENING QUEST", description: "Drink a glass of water and take a 5-minute walk.", stat: "VIT", difficulty: "easy", estimatedMinutes: 5 },
  { id: "qe2", title: "FRESH AIR", description: "Step outside and walk for 10 minutes.", stat: "STR", difficulty: "easy", estimatedMinutes: 10 },
  { id: "qe3", title: "STUDY SESSION", description: "Review your notes for 20 minutes.", stat: "INT", difficulty: "standard", estimatedMinutes: 20 },
  { id: "qe4", title: "CODE FLOW", description: "Write code for 30 minutes.", stat: "CRE", difficulty: "standard", estimatedMinutes: 30 },
  { id: "qe5", title: "CLEAN SPACE", description: "Tidy your workspace for 10 minutes.", stat: "DISC", difficulty: "easy", estimatedMinutes: 10 },
  { id: "qe6", title: "STRETCH ROUTINE", description: "Do a 15-minute stretching routine.", stat: "VIT", difficulty: "standard", estimatedMinutes: 15 },
];

function emptyProfile(id: string, email: string): Profile {
  return {
    id,
    displayName: email.split("@")[0] || "Player",
    level: 1,
    totalXp: 0,
    essence: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    rank: "E",
    str: 0,
    int: 0,
    disc: 0,
    vit: 0,
    cre: 0,
  };
}

function seedLocalInventory(): void {
  const inventory: InventoryItem[] = [
    { id: genId(), itemKey: "starter_aura", itemType: "aura", acquiredAt: new Date().toISOString(), equipped: true },
    { id: genId(), itemKey: "starter_outfit", itemType: "outfit", acquiredAt: new Date().toISOString(), equipped: false },
  ];
  lsSet(LS.inventory, inventory);
}

function makeError(code: BackendErrorCode, message: string): Error & { code: string } {
  const err = new Error(message) as Error & { code: string };
  err.code = code;
  return err;
}

// ---- Auth ----

export async function localSignUp(email: string, password: string): Promise<{ id: string; email: string }> {
  const users = lsGet<Record<string, { email: string; passwordHash: string; id: string }>>("ascent:users", {});
  if (users[email]) {
    throw makeError("AUTH_CONFLICT", "Email already registered.");
  }
  const id = genId();
  users[email] = { email, passwordHash: hashPassword(password), id };
  lsSet("ascent:users", users);
  const session = { user: { id, email } };
  lsSet(LS.session, session);
  const profile = emptyProfile(id, email);
  const profiles = lsGet<Record<string, Profile>>(LS.profile, {});
  profiles[id] = profile;
  lsSet(LS.profile, profiles);
  seedLocalInventory();
  return { id, email };
}

export async function localSignIn(email: string, password: string): Promise<{ id: string; email: string }> {
  const users = lsGet<Record<string, { email: string; passwordHash: string; id: string }>>("ascent:users", {});
  const user = users[email];
  if (!user || user.passwordHash !== hashPassword(password)) {
    throw makeError("AUTH_INVALID", "Invalid email or password.");
  }
  lsSet(LS.session, { user: { id: user.id, email } });
  return { id: user.id, email };
}

export async function localSignOut(): Promise<void> {
  localStorage.removeItem(LS.session);
}

export function localGetSession(): { user: { id: string; email: string } } | null {
  return lsGet<{ user: { id: string; email: string } } | null>(LS.session, null);
}

export async function localEnsureSession(): Promise<{ id: string; email: string }> {
  const session = localGetSession();
  if (!session) throw makeError("AUTH_REQUIRED", "Authentication required.");
  return { id: session.user.id, email: session.user.email };
}

// ---- Profile ----

export async function localGetProfile(): Promise<Profile | null> {
  const session = localGetSession();
  if (!session) return null;
  const profiles = lsGet<Record<string, Profile>>(LS.profile, {});
  return profiles[session.user.id] ?? null;
}

export async function localUpdateDisplayName(name: string): Promise<void> {
  const session = localGetSession();
  if (!session) throw makeError("AUTH_REQUIRED", "Not authenticated.");
  const profiles = lsGet<Record<string, Profile>>(LS.profile, {});
  if (!profiles[session.user.id]) throw makeError("AUTH_REQUIRED", "Profile not found.");
  profiles[session.user.id].displayName = name.trim() || "Player";
  lsSet(LS.profile, profiles);
}

// ---- Tasks ----

export async function localListTasks(): Promise<Task[]> {
  const session = localGetSession();
  if (!session) throw makeError("AUTH_REQUIRED", "Not authenticated.");
  const tasks = lsGet<Record<string, Task>>(LS.tasks, {});
  return Object.values(tasks).filter((t) => t.userId === session.user.id);
}

export async function localCreateTask(input: Partial<Task> & { title: string }): Promise<Task> {
  const session = localGetSession();
  if (!session) throw makeError("AUTH_REQUIRED", "Not authenticated.");
  if (!input.title || input.title.trim().length === 0) throw makeError("INVALID_TASK", "Title is required.");
  if (input.title.length > 120) throw makeError("INVALID_TASK", "Title too long.");
  if (!["STR", "INT", "DISC", "VIT", "CRE"].includes(input.category as string)) throw makeError("INVALID_TASK", "Invalid category.");
  if (!["easy", "standard", "hard"].includes(input.difficulty as string)) throw makeError("INVALID_TASK", "Invalid difficulty.");
  if ((input.estimatedMinutes ?? 0) < 1 || (input.estimatedMinutes ?? 0) > 600) throw makeError("INVALID_TASK", "Invalid estimated minutes.");

  const task: Task = {
    id: genId(),
    userId: session.user.id,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    category: input.category as Task["category"],
    difficulty: input.difficulty as Task["difficulty"],
    estimatedMinutes: input.estimatedMinutes as number,
    ...(input.dueDate !== undefined && { dueDate: input.dueDate as string | null | undefined }),
    recurrence: input.recurrence as Task["recurrence"],
    completed: false,
    createdAt: new Date().toISOString(),
  };
  const tasks = lsGet<Record<string, Task>>(LS.tasks, {});
  tasks[task.id] = task;
  lsSet(LS.tasks, tasks);
  return task;
}

export async function localUpdateTask(id: string, input: Partial<{ title: string; description?: string; category: Task["category"]; difficulty: Task["difficulty"]; estimatedMinutes: number; dueDate?: string | null; recurrence: Task["recurrence"] }>): Promise<Task> {
  const session = localGetSession();
  if (!session) throw makeError("AUTH_REQUIRED", "Not authenticated.");
  const tasks = lsGet<Record<string, Task>>(LS.tasks, {});
  const task = tasks[id];
  if (!task || task.userId !== session.user.id) throw makeError("TASK_NOT_FOUND", "Task not found.");
  if (input.title !== undefined) {
    if (!input.title.trim()) throw makeError("INVALID_TASK", "Title cannot be empty.");
    task.title = input.title.trim();
  }
  if (input.description !== undefined) task.description = input.description?.trim();
  if (input.category !== undefined) task.category = input.category;
  if (input.difficulty !== undefined) task.difficulty = input.difficulty;
  if (input.estimatedMinutes !== undefined) task.estimatedMinutes = input.estimatedMinutes;
  if (input.dueDate !== undefined) task.dueDate = input.dueDate as any;
  if (input.recurrence !== undefined) task.recurrence = input.recurrence;
  lsSet(LS.tasks, tasks);
  return task;
}

export async function localDeleteTask(id: string): Promise<void> {
  const session = localGetSession();
  if (!session) throw makeError("AUTH_REQUIRED", "Not authenticated.");
  const tasks = lsGet<Record<string, Task>>(LS.tasks, {});
  if (!tasks[id] || tasks[id].userId !== session.user.id) throw makeError("TASK_NOT_FOUND", "Task not found.");
  delete tasks[id];
  lsSet(LS.tasks, tasks);
}

// ---- Completion — EXACT mirror of SQL complete_quest ----

export async function localCompleteQuest(taskId: string): Promise<CompleteQuestResponse> {
  const session = localGetSession();
  if (!session) throw makeError("AUTH_REQUIRED", "Authentication required.");

  const tasks = lsGet<Record<string, Task>>(LS.tasks, {});
  const task = tasks[taskId];
  if (!task || task.userId !== session.user.id) throw makeError("TASK_NOT_FOUND", "Task not found or access denied.");
  if (task.completed) throw makeError("TASK_ALREADY_COMPLETED", "Quest already cleared.");

  const profiles = lsGet<Record<string, Profile>>(LS.profile, {});
  const profile = profiles[session.user.id];
  if (!profile) throw makeError("AUTH_REQUIRED", "Profile not found.");

  // ---- REWARD CALCULATION (mirror SQL exactly) ----
  let baseXp: number;
  let baseEssence: number;
  switch (task.difficulty) {
    case "easy": baseXp = 25; baseEssence = 6; break;
    case "hard": baseXp = 90; baseEssence = 20; break;
    default: baseXp = 50; baseEssence = 12; break;
  }

  const today = todayStr();
  let currentStreak = profile.currentStreak;
  let streakExtended = false;
  let streakMultiplier = 1.0;

  if (profile.lastActivityDate === null) {
    currentStreak = 1;
    streakExtended = true;
  } else if (profile.lastActivityDate === today) {
    streakExtended = false;
  } else if (profile.lastActivityDate === yesterdayStr()) {
    currentStreak += 1;
    streakExtended = true;
    if (currentStreak >= 7) streakMultiplier = 1.15;
    else if (currentStreak >= 3) streakMultiplier = 1.10;
    else if (currentStreak >= 2) streakMultiplier = 1.05;
  } else {
    currentStreak = 1;
    streakExtended = true;
  }

  const attributeXp = 2;
  switch (task.category) {
    case "STR": profile.str += attributeXp; break;
    case "INT": profile.int += attributeXp; break;
    case "DISC": profile.disc += attributeXp; break;
    case "VIT": profile.vit += attributeXp; break;
    case "CRE": profile.cre += attributeXp; break;
  }

  const xpAwarded = Math.round(baseXp * streakMultiplier);
  const essenceAwarded = Math.round(baseEssence * streakMultiplier);

  const totalXpBefore = profile.totalXp;
  const essenceBefore = profile.essence;
  const levelBefore = profile.level;
  const rankBefore = profile.rank;

  const totalXpAfter = totalXpBefore + xpAwarded;
  const essenceAfter = essenceBefore + essenceAwarded;
  profile.totalXp = totalXpAfter;
  profile.essence = essenceAfter;
  profile.currentStreak = currentStreak;
  profile.longestStreak = Math.max(profile.longestStreak, currentStreak);
  profile.lastActivityDate = today;

  const levelAfter = levelFromXp(totalXpAfter);
  const rankAfter = rankForLevel(levelAfter) as Rank;
  profile.level = levelAfter;
  profile.rank = rankAfter;

  task.completed = true;

  const completions = lsGet<Array<any>>(LS.completions, []);
  completions.push({
    taskId,
    userId: session.user.id,
    completedAt: new Date().toISOString(),
    xpAwarded,
    attributeXpAwarded: attributeXp,
    essenceAwarded,
  });
  lsSet(LS.completions, completions);

  const xpEvents = lsGet<Array<{ id: string; userId: string; amount: number; reason: string; createdAt: string }>>("ascent:xp_events", []);
  xpEvents.push({
    id: genId(),
    userId: session.user.id,
    taskCompletionId: `comp_${Date.now()}`,
    amount: xpAwarded,
    reason: `QUEST_CLEAR: ${task.title}`,
    createdAt: new Date().toISOString(),
  } as any);
  lsSet("ascent:xp_events", xpEvents);

  // Achievement checks
  const profileAchievements = lsGet<string[]>("ascent:profile_achievements", []);
  const achKey = (s: string) => `${s}_${session.user.id}`;

  if (!profileAchievements.includes(achKey("first_quest"))) {
    profileAchievements.push(achKey("first_quest"));
    lsSet("ascent:profile_achievements", profileAchievements);
    profile.essence += 10;
  }
  if (currentStreak >= 3 && !profileAchievements.includes(achKey("three_day_streak"))) {
    profileAchievements.push(achKey("three_day_streak"));
    lsSet("ascent:profile_achievements", profileAchievements);
    profile.essence += 25;
  }
  if (levelAfter >= 5 && !profileAchievements.includes(achKey("level_five"))) {
    profileAchievements.push(achKey("level_five"));
    lsSet("ascent:profile_achievements", profileAchievements);
    profile.essence += 40;
  }

  lsSet(LS.profile, profiles);

  const unlocks: Array<{ type: "world"; key: string }> = [];
  if (levelBefore < 5 && levelAfter >= 5) unlocks.push({ type: "world", key: "restored_structure" });
  if (levelBefore < 10 && levelAfter >= 10) unlocks.push({ type: "world", key: "training_ground" });
  if (levelBefore < 15 && levelAfter >= 15) unlocks.push({ type: "world", key: "library" });
  if (levelBefore < 20 && levelAfter >= 20) unlocks.push({ type: "world", key: "forge" });
  if (levelBefore < 30 && levelAfter >= 30) unlocks.push({ type: "world", key: "central_tower" });

  return {
    success: true,
    task: { id: taskId, completed: true },
    reward: { xp: xpAwarded, attribute: task.category, attributeXp, essence: essenceAwarded },
    progression: {
      levelBefore,
      levelAfter,
      rankBefore,
      rankAfter,
      totalXp: totalXpAfter,
      xpToNextLevel: thresholdForLevel(levelAfter + 1) - thresholdForLevel(levelAfter),
      leveledUp: levelAfter > levelBefore,
    },
    streak: { current: currentStreak, extended: streakExtended },
    unlocks: unlocks as any,
  } as CompleteQuestResponse;
}

function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.round(80 + 25 * level + 15 * Math.pow(level, 1.35));
}

function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= totalXp && level < 100) level++;
  return level;
}

// ---- Inventory / Catalog ----

export async function localListInventory(): Promise<InventoryItem[]> {
  const session = localGetSession();
  if (!session) throw makeError("AUTH_REQUIRED", "Not authenticated.");
  return lsGet<InventoryItem[]>(LS.inventory, []).filter((i) => i.itemKey.startsWith("") || true);
}

export async function localListCatalog(): Promise<CatalogItem[]> {
  return SEED_CATALOG;
}

export async function localListQuestExamples(): Promise<Array<{ id: string; title: string; description: string | null; stat: Task["category"]; difficulty: Task["difficulty"]; estimatedMinutes: number }>> {
  return SEED_QUEST_EXAMPLES;
}

export async function localRecommendQuest(_prefs: unknown, _level: number, stats: Record<string, number>): Promise<{ title: string; category: string; difficulty: string; estimatedMinutes: number; reason: string }> {
  const statOrder: Array<keyof typeof stats> = ["STR", "INT", "DISC", "VIT", "CRE"];
  let weakest: string = "STR";
  let weakestVal = Infinity;
  for (const s of statOrder) {
    const val = stats[s] ?? 0;
    if (val < weakestVal) { weakestVal = val; weakest = s; }
  }
  const titles: Record<string, string> = {
    STR: "20 minute walk", INT: "Read 10 pages", DISC: "Clean your workspace for 10 minutes",
    VIT: "Drink water and stretch for 10 minutes", CRE: "Sketch for 15 minutes",
  };
  return {
    title: titles[weakest] ?? "Take a 15 minute walk",
    category: weakest,
    difficulty: "easy",
    estimatedMinutes: 15,
    reason: `Your ${weakest.toLowerCase()} progression is trailing your other attributes.`,
  };
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function ensureLocalSeeds(): void {
  if (!localStorage.getItem("ascent:catalog")) {
    localStorage.setItem("ascent:catalog", JSON.stringify(SEED_CATALOG));
  }
  if (!localStorage.getItem("ascent:quest_examples")) {
    localStorage.setItem("ascent:quest_examples", JSON.stringify(SEED_QUEST_EXAMPLES));
  }
  if (!localStorage.getItem("ascent:achievements")) {
    localStorage.setItem("ascent:achievements", JSON.stringify([
      { key: "first_quest", title: "Awakened", description: "Complete your first quest.", essenceReward: 10 },
      { key: "three_day_streak", title: "Momentum", description: "Complete quests on three consecutive days.", essenceReward: 25 },
      { key: "level_five", title: "First Evolution", description: "Reach level 5.", essenceReward: 40 },
    ]));
  }
}

// ---- Cross-device sync ----

export async function localExportData(): Promise<string> {
  const session = localGetSession();
  if (!session) throw makeError("AUTH_REQUIRED", "Not authenticated.");
  const data = {
    session: localGetSession(),
    profile: lsGet<Record<string, Profile>>(LS.profile, {}),
    tasks: lsGet<Record<string, Task>>(LS.tasks, {}),
    completions: lsGet(LS.completions, []),
    xpEvents: lsGet("ascent:xp_events", []),
    inventory: lsGet(LS.inventory, []),
    users: lsGet("ascent:users", {}),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data);
}

export async function localImportData(json: string): Promise<void> {
  const session = localGetSession();
  if (!session) throw makeError("AUTH_REQUIRED", "Not authenticated.");
  const data = JSON.parse(json) as {
    profile?: Record<string, Profile>;
    tasks?: Record<string, Task>;
    completions?: Array<any>;
    xpEvents?: Array<any>;
    inventory?: InventoryItem[];
    users?: Record<string, any>;
  };
  if (data.profile) lsSet(LS.profile, data.profile);
  if (data.tasks) lsSet(LS.tasks, data.tasks);
  if (data.completions) lsSet(LS.completions, data.completions);
  if (data.xpEvents) lsSet("ascent:xp_events", data.xpEvents);
  if (data.inventory) lsSet(LS.inventory, data.inventory);
  if (data.users) lsSet("ascent:users", data.users);
}
