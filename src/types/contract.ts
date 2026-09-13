// ASCENT shared domain types — mirrors agents/SHARED_CONTRACT.md exactly.
// The backend agent builds against the same contract. Do not drift.

export type StatKey = "STR" | "INT" | "DISC" | "VIT" | "CRE";
export type Difficulty = "easy" | "standard" | "hard";
export type Rank = "E" | "D" | "C" | "B" | "A" | "S";

export interface Profile {
  id: string;
  displayName: string;
  level: number;
  totalXp: number;
  essence: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  rank: Rank;
  str: number;
  int: number;
  disc: number;
  vit: number;
  cre: number;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: StatKey;
  difficulty: Difficulty;
  estimatedMinutes: number;
  dueDate?: string | null;
  recurrence: "none" | "daily";
  completed: boolean;
  createdAt: string;
}

// Complete-quest response — POST /functions/v1/complete-quest { taskId }
// Everything in here is server-authoritative. Never fake these numbers.
export interface CompletionReward {
  xp: number;
  attribute: StatKey;
  attributeXp: number;
  essence: number;
}

export interface CompletionProgression {
  levelBefore: number;
  levelAfter: number;
  rankBefore: Rank;
  rankAfter: Rank;
  totalXp: number;
  xpToNextLevel: number;
  leveledUp: boolean;
}

export interface CompletionStreak {
  current: number;
  extended: boolean;
}

export type UnlockType = "world" | "character" | "cosmetic" | "title" | "system";

export interface Unlock {
  type: UnlockType;
  key: string;
  label?: string;
}

export interface CompleteQuestResponse {
  success: boolean;
  task: { id: string; completed: boolean };
  reward: CompletionReward;
  progression: CompletionProgression;
  streak: CompletionStreak;
  unlocks: Unlock[];
}

export interface InventoryItem {
  id: string;
  itemKey: string;
  itemType: "aura" | "outfit" | "weapon" | "title" | "world";
  acquiredAt: string;
  equipped: boolean;
}

export interface CatalogItem {
  key: string;
  name: string;
  itemType: "aura" | "outfit" | "weapon" | "title" | "world";
  essenceCost: number;
  description: string | null;
  unlocksAtLevel: number;
}

export interface QuestExample {
  id: string;
  title: string;
  description: string | null;
  stat: StatKey;
  difficulty: Difficulty;
  estimatedMinutes: number;
}

// Stable backend error codes (BACKEND_AGENT.md)
export type BackendErrorCode =
  | "AUTH_REQUIRED"
  | "TASK_NOT_FOUND"
  | "TASK_ALREADY_COMPLETED"
  | "INVALID_TASK"
  | "REWARD_TRANSACTION_FAILED"
  | "AI_UNAVAILABLE"
  | "AUTH_CONFLICT"
  | "AUTH_INVALID";
