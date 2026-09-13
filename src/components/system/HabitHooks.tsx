// HabitHooks — retention mechanics: 7-day streak strip, next-quest nudge,
// daily focus. Pure display from authoritative profile data.

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, ChevronRight } from "lucide-react";
import { useGameStore } from "../../hooks/useGameStore";
import { useScrambleIn } from "../../lib/animations";

// 7-day activity strip: shows this week's Mon-Sun with active dots.
export function StreakWeek() {
  const { profile } = useGameStore();
  const titleRef = useScrambleIn("ASCENSION LOG");
  if (!profile) return null;

  // Deterministic week view: last_activity_date marks the last active day.
  const last = profile.lastActivityDate ? new Date(profile.lastActivityDate + "T00:00:00") : null;
  const today = new Date();
  const days: { label: string; active: boolean; isToday: boolean }[] = [];
  const labels = ["M", "T", "W", "T", "F", "S", "S"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const active = last ? Math.abs(d.getTime() - last.getTime()) < 86400000 * 1.5 : false;
    days.push({ label: labels[(d.getDay() + 6) % 7], active, isToday: d.toDateString() === today.toDateString() });
  }

  return (
    <div className="hud-panel rounded-sm p-4">
      <div className="flex items-center justify-between">
        <h3 ref={titleRef} className="font-display text-[10px] tracking-[0.35em] text-violet">ASCENSION LOG</h3>
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-mist">
          <Flame size={11} className={profile.currentStreak > 0 ? "text-amber" : "text-mist/40"} aria-hidden="true" />
          {profile.currentStreak}d
        </span>
      </div>
      <div className="mt-3 flex justify-between" role="img" aria-label={`Weekly activity: ${days.filter((d) => d.active).length} of 7 days active`}>
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <motion.span
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`h-3.5 w-3.5 rounded-full ${
                d.active
                  ? "bg-gradient-to-br from-amber to-violet shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                  : d.isToday
                    ? "border border-violet/50 bg-ink"
                    : "bg-ink"
              }`}
            />
            <span className={`text-[9px] ${d.isToday ? "text-violet" : "text-mist/60"}`}>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Nudge card: shows the player's current weakest attribute — pure data, no canned copy.
export function NextQuestNudge({ onRegister }: { onRegister: () => void }) {
  const { profile, tasks } = useGameStore();
  const active = tasks.filter((t) => !t.completed);

  const hookRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!hookRef.current) return;
    hookRef.current.textContent = "[FOCUS]";
  }, []);

  if (!profile) return null;
  const statEntries: [string, number][] = [
    ["STR", profile.str],
    ["INT", profile.int],
    ["DISC", profile.disc],
    ["VIT", profile.vit],
    ["CRE", profile.cre],
  ];
  const weakest = statEntries.reduce((a, b) => (b[1] < a[1] ? b : a));
  const weakestLabel: Record<string, string> = {
    STR: "Strength",
    INT: "Intellect",
    DISC: "Discipline",
    VIT: "Vitality",
    CRE: "Creativity",
  };
  const hasWeakQuest = active.some((t) => t.category === weakest[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="hud-frame relative overflow-hidden rounded-sm border border-violet/25 bg-gradient-to-br from-ink/80 to-void-2/80 p-5"
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet/15 blur-2xl" />
      <h3 ref={hookRef} className="font-display text-[10px] tracking-[0.35em] text-arc">[FOCUS]</h3>
      <p className="mt-2 text-sm font-medium text-ivory">
        Weakest attribute: <span className="text-arc">{weakest[0]} ({weakest[1]})</span>
      </p>
      <p className="mt-1 text-xs leading-relaxed text-mist">
        {weakestLabel[weakest[0]]} is trailing. {hasWeakQuest
          ? `A ${weakest[0]} quest is already registered today.`
          : `Clear a ${weakest[0]} quest to rebalance.`}
      </p>
      {!hasWeakQuest && (
        <button
          onClick={onRegister}
          className="font-display mt-4 inline-flex items-center gap-1.5 rounded-sm border border-violet/50 bg-violet/20 px-4 py-2 text-[10px] uppercase tracking-widest text-ivory transition-colors hover:bg-violet/40"
        >
          <Zap size={12} aria-hidden="true" />
          REGISTER QUEST
          <ChevronRight size={12} aria-hidden="true" />
        </button>
      )}
    </motion.div>
  );
}
