// Central client store: authoritative profile + tasks from the backend.
// Optimistic updates for CRUD; completion always takes the server response.

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { Profile, Task } from "../types/contract";
import * as api from "../services/api";
import { useAuth } from "./useAuth";
import { useSystemMessage } from "../components/system/SystemMessage";

export interface NewTaskInput {
  title: string;
  description?: string;
  category: Task["category"];
  difficulty: Task["difficulty"];
  estimatedMinutes: number;
  dueDate?: string | null;
  recurrence: Task["recurrence"];
}

interface GameStoreValue {
  profile: Profile | null;
  tasks: Task[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<Task>;
  editTask: (id: string, input: Partial<NewTaskInput>) => Promise<Task>;
  removeTask: (id: string) => Promise<void>;
}

const GameStoreContext = createContext<GameStoreValue | null>(null);

export function GameStoreProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { push } = useSystemMessage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setProfile(null);
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [p, t] = await Promise.all([api.getProfile(), api.listTasks()]);
      setProfile(p);
      setTasks(t);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to reach the System.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTask = useCallback(
    async (input: NewTaskInput) => {
      const task = await api.createTask(input);
      setTasks((prev) => [task, ...prev]);
      push("[SYSTEM] QUEST REGISTERED.");
      return task;
    },
    [push]
  );

  const editTask = useCallback(async (id: string, input: Partial<NewTaskInput>) => {
    const task = await api.updateTask(id, input);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
    return task;
  }, []);

  const removeTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await api.deleteTask(id);
        push("[SYSTEM] QUEST REMOVED.");
      } catch (e) {
        console.error(e);
        push("[SYSTEM] Connection unstable. Quest removal is not yet confirmed.");
        refresh();
      }
    },
    [push, refresh]
  );

  return (
    <GameStoreContext.Provider
      value={{ profile, tasks, loading, error, refresh, addTask, editTask, removeTask }}
    >
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGameStore() {
  const ctx = useContext(GameStoreContext);
  if (!ctx) throw new Error("useGameStore must be used inside GameStoreProvider");
  return ctx;
}
