// Seeds the PRD 5.3 AWAKENING QUEST for brand-new players so the first win
// is always one tap away. Uses the local quest_examples entry.

import { localGetSession, localListTasks } from "../services/localBackend";
import type { Task } from "../types/contract";

export async function seedAwakeningQuestIfEmpty(): Promise<Task | null> {
  const session = localGetSession();
  if (!session) return null;

  const tasks = await localListTasks();
  if (tasks.length !== 0) return null;

  let stat: Task["category"] = "VIT";
  let difficulty: Task["difficulty"] = "easy";
  let estimatedMinutes = 5;
  let description = "Drink a glass of water and take a 5-minute walk.";

  try {
    const examples = JSON.parse(localStorage.getItem("ascent:quest_examples") ?? "[]");
    const aw = examples.find((e: any) => e.title === "AWAKENING QUEST");
    if (aw) {
      stat = aw.stat;
      difficulty = aw.difficulty;
      estimatedMinutes = aw.estimated_minutes;
      description = aw.description;
    }
  } catch {
    /* use defaults */
  }

  const task: Task = {
    id: `task_${Date.now()}`,
    userId: session.user.id,
    title: "AWAKENING QUEST",
    description,
    category: stat,
    difficulty,
    estimatedMinutes,
    dueDate: null,
    recurrence: "none",
    completed: false,
    createdAt: new Date().toISOString(),
  };

  const tasks2 = JSON.parse(localStorage.getItem("ascent:tasks") ?? "{}");
  tasks2[task.id] = task;
  localStorage.setItem("ascent:tasks", JSON.stringify(tasks2));

  return task;
}
