// QuestCard — a single quest with complete action and edit/delete.
import { motion } from "framer-motion";
import { Dumbbell, BookOpen, CalendarCheck, HeartPulse, Sparkles, Pencil, Trash2, Clock, Repeat } from "lucide-react";
import type { Task } from "../../types/contract";
import { useReward } from "../../hooks/useReward";

const STAT_ICONS = { STR: Dumbbell, INT: BookOpen, DISC: CalendarCheck, VIT: HeartPulse, CRE: Sparkles };

export default function QuestCard({
  task,
  onEdit,
  onDelete,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { completingIds, completeQuest } = useReward();
  const busy = completingIds.has(task.id);
  const Icon = STAT_ICONS[task.category];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: task.completed ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25 }}
      className="hud-frame hud-panel rounded-sm"
    >
      <div className="flex items-center gap-3 p-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-violet/20 bg-ink">
          <Icon size={16} className="text-violet" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold ${task.completed ? "text-mist line-through" : "text-ivory"}`}>
            {task.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-[10px] text-mist">
            <span className={`rounded border px-1.5 py-px font-semibold uppercase tracking-wider ${
              task.difficulty === "hard" ? "border-danger/40 text-danger"
              : task.difficulty === "standard" ? "border-arc/40 text-arc"
              : "border-essence/40 text-essence"
            } bg-transparent`}>
              {task.difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} aria-hidden="true" />
              {task.estimatedMinutes}m
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <span aria-hidden="true">·</span> +{task.category}
            </span>
            {task.recurrence === "daily" && (
              <span className="flex items-center gap-1 text-violet/80">
                <Repeat size={10} aria-hidden="true" /> DAILY
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => onEdit(task)}
            aria-label={`Edit quest: ${task.title}`}
            className="rounded p-2 text-mist transition-colors hover:text-ivory"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
          <button
            onClick={() => onDelete(task)}
            aria-label={`Delete quest: ${task.title}`}
            className="rounded p-2 text-mist transition-colors hover:text-danger"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
          {!task.completed && (
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={() => completeQuest(task)}
              disabled={busy}
              aria-label={`Complete quest: ${task.title}`}
              className="font-display rounded-sm border border-violet/50 bg-violet px-3.5 py-2 text-xs uppercase tracking-widest text-ivory shadow-[0_0_16px_rgba(139,92,246,0.3)] transition-colors hover:bg-violet-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "..." : "CLEAR"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.li>
  );
}
