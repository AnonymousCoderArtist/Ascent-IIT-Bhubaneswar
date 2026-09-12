// QuestForm — modal sheet for creating/editing quests.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Task } from "../../types/contract";
import { useGameStore } from "../../hooks/useGameStore";
import { STAT_META, DIFFICULTY_META } from "../../lib/catalog";
import * as sfx from "../../lib/sfx";

export interface QuestFormState {
  open: boolean;
  task: Task | null;
}

const CATEGORIES = ["STR", "INT", "DISC", "VIT", "CRE"] as const;
const DIFFICULTIES = ["easy", "standard", "hard"] as const;

export default function QuestForm({ state, onClose }: { state: QuestFormState; onClose: () => void }) {
  const { addTask, editTask, profile } = useGameStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("STR");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("easy");
  const [minutes, setMinutes] = useState(15);
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | "daily">("none");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (state.open) {
      const t = state.task;
      setTitle(t?.title ?? "");
      setDescription(t?.description ?? "");
      setCategory(t?.category ?? "STR");
      setDifficulty(t?.difficulty ?? "easy");
      setMinutes(t?.estimatedMinutes ?? 15);
      setDueDate(t?.dueDate ?? "");
      setRecurrence(t?.recurrence ?? "none");
      setError(null);
    }
  }, [state]);

  const hardUnlocked = (profile?.level ?? 1) >= DIFFICULTY_META.hard.unlocksAt;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError("[SYSTEM] A quest needs a title.");
      return;
    }
    if (minutes < 1 || minutes > 600) {
      setError("[SYSTEM] Duration must be between 1 and 600 minutes.");
      return;
    }
    setBusy(true);
    setError(null);
    const input = {
      title: trimmed,
      description: description.trim() || undefined,
      category,
      difficulty,
      estimatedMinutes: minutes,
      dueDate: dueDate || null,
      recurrence,
    };
    try {
      if (state.task) await editTask(state.task.id, input);
      else {
        await addTask(input);
        sfx.questRegistered();
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("[SYSTEM] Registration failed. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-void/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={state.task ? "Edit quest" : "Register new quest"}
          onClick={onClose}
        >
          <motion.div
            className="hud-frame hud-panel w-full max-w-md rounded-sm p-6"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg tracking-[0.15em] text-ivory">
                {state.task ? "EDIT QUEST" : "REGISTER QUEST"}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close quest form"
                className="rounded p-1.5 text-mist transition-colors hover:text-ivory"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="q-title" className="mb-1.5 block text-[10px] tracking-widest text-mist uppercase">
                  Title
                </label>
                <input
                  id="q-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Morning workout"
                  className="w-full rounded-sm border border-violet/20 bg-ink px-3 py-2.5 text-sm text-ivory placeholder:text-mist/40 focus:border-violet"
                />
              </div>

              <div>
                <label htmlFor="q-desc" className="mb-1.5 block text-[10px] tracking-widest text-mist uppercase">
                  Description <span className="normal-case text-mist/50">(optional)</span>
                </label>
                <textarea
                  id="q-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What does success look like?"
                  className="w-full resize-none rounded-sm border border-violet/20 bg-ink px-3 py-2.5 text-sm text-ivory placeholder:text-mist/40 focus:border-violet"
                />
              </div>

              <fieldset>
                <legend className="mb-1.5 text-[10px] tracking-widest text-mist uppercase">Attribute</legend>
                <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Attribute">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={category === c}
                      onClick={() => setCategory(c)}
                      title={STAT_META[c].label}
                      className={`rounded-sm border px-1 py-2 text-[10px] font-bold tracking-wider transition-colors ${
                        category === c
                          ? "border-violet bg-violet/25 text-ivory"
                          : "border-ink bg-ink/50 text-mist hover:border-violet/40"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-1.5 text-[10px] tracking-widest text-mist uppercase">Difficulty</legend>
                <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Difficulty">
                  {DIFFICULTIES.map((d) => {
                    const locked = d === "hard" && !hardUnlocked;
                    return (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={difficulty === d}
                        disabled={locked}
                        onClick={() => setDifficulty(d)}
                        title={locked ? `Unlocks at level ${DIFFICULTY_META.hard.unlocksAt}` : DIFFICULTY_META[d].xpRange}
                        className={`rounded-sm border px-1 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          difficulty === d
                            ? "border-violet bg-violet/25 text-ivory"
                            : "border-ink bg-ink/50 text-mist hover:border-violet/40"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="q-min" className="mb-1.5 block text-[10px] tracking-widest text-mist uppercase">
                    Minutes
                  </label>
                  <input
                    id="q-min"
                    type="number"
                    min={1}
                    max={600}
                    value={minutes}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                    className="w-full rounded-sm border border-violet/20 bg-ink px-3 py-2.5 text-sm tabular-nums text-ivory focus:border-violet"
                  />
                </div>
                <div>
                  <label htmlFor="q-due" className="mb-1.5 block text-[10px] tracking-widest text-mist uppercase">
                    Due <span className="normal-case text-mist/50">(opt.)</span>
                  </label>
                  <input
                    id="q-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-sm border border-violet/20 bg-ink px-3 py-2.5 text-sm text-ivory focus:border-violet [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-widest text-mist uppercase">Repeats</span>
                <div className="flex gap-1.5" role="radiogroup" aria-label="Recurrence">
                  {(["none", "daily"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      role="radio"
                      aria-checked={recurrence === r}
                      onClick={() => setRecurrence(r)}
                      className={`rounded-sm border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        recurrence === r
                          ? "border-violet bg-violet/25 text-ivory"
                          : "border-ink bg-ink/50 text-mist hover:border-violet/40"
                      }`}
                    >
                      {r === "none" ? "Once" : "Daily"}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p role="alert" className="text-xs text-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="font-display w-full rounded-sm border border-violet/60 bg-violet px-4 py-3 text-sm uppercase tracking-widest text-ivory shadow-[0_0_20px_rgba(139,92,246,0.25)] transition-colors hover:bg-violet-deep disabled:opacity-50"
              >
                {busy ? "REGISTERING..." : state.task ? "UPDATE QUEST" : "REGISTER QUEST"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
