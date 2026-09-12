// System Home — the main HUD screen.
// Layout: top-center menu / left zone rail / center character on world bg /
// right stats + next-level / bottom XP bar / today's quests below the fold.

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, ChevronDown } from "lucide-react";
import SystemMenu from "../components/system/SystemMenu";
import ZoneRail from "../components/system/ZoneRail";
import StatPanel from "../components/system/StatPanel";
import LevelBar from "../components/system/LevelBar";
import { StreakFlame, EssenceCrystal } from "../components/ui/GameArt";
import CharacterStage from "../components/character/CharacterStage";
import QuestCard from "../components/quest/QuestCard";
import QuestForm, { type QuestFormState } from "../components/quest/QuestForm";
import WorldCanvas from "../components/world/WorldCanvas";
import AmbientLayer from "../components/world/AmbientLayer";
import SystemBoot from "../components/system/SystemBoot";
import { useGameStore } from "../hooks/useGameStore";
import { seedAwakeningQuestIfEmpty } from "../services/awakeningSeed";
import { useSystemMessage } from "../components/system/SystemMessage";

export default function HomePage() {
  const { tasks, loading, error, removeTask, refresh } = useGameStore();
  const { push } = useSystemMessage();
  const [formState, setFormState] = useState<QuestFormState>({ open: false, task: null });
  const [booting, setBooting] = useState(true);

  // PRD 5.3: brand-new players always have an achievable first quest.
  useEffect(() => {
    if (!loading && !error && tasks.length === 0) {
      seedAwakeningQuestIfEmpty()
        .then((t) => {
          if (t) push("[SYSTEM] AWAKENING QUEST REGISTERED.");
        })
        .then(() => refresh());
    }
  }, [loading, error, tasks.length, refresh, push]);

  const active = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const cleared = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-void">
        <div className="text-center">
          <p className="font-display text-2xl tracking-widest text-ivory">ASCENT</p>
          <p className="mt-2 text-xs tracking-[0.3em] text-violet animate-pulse-slow">SYSTEM BOOTING...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center bg-void px-6">
        <div className="hud-frame hud-panel max-w-md p-8 text-center">
          <p className="font-display text-xs tracking-[0.4em] text-danger">[SYSTEM FAULT]</p>
          <p className="mt-3 text-sm text-mist">{error}</p>
          <button
            onClick={() => location.reload()}
            className="font-display mt-6 rounded-sm border border-violet/50 bg-violet px-6 py-2.5 text-xs uppercase tracking-widest text-ivory"
          >
            RECONNECT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-void">
      {booting && <SystemBoot onDone={() => setBooting(false)} />}

      {/* Full-viewport HUD stage */}
      <div className="relative h-[100svh] min-h-[560px] overflow-hidden">
        <WorldCanvas />
        <AmbientLayer />
        <CharacterStage />

        <SystemMenu />

        {/* Left rail: world zones */}
        <div className="absolute left-3 top-1/2 z-30 -translate-y-1/2 sm:left-5">
          <ZoneRail />
        </div>

        {/* Right: stats + next level (>= sm) */}
        <div className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 sm:right-5 sm:block">
          <StatPanel />
        </div>

        {/* Mobile: compact stats row above the XP bar */}
        <div className="absolute bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 sm:hidden">
          <MobileStats />
        </div>

        {/* Register quest button: top-right on mobile, bottom-right on desktop */}
        <button
          onClick={() => setFormState({ open: true, task: null })}
          className="font-display pointer-events-auto absolute right-3 top-20 z-30 flex items-center gap-2 rounded-full border border-violet/60 bg-violet px-4 py-3 text-xs uppercase tracking-widest text-ivory shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-colors hover:bg-violet-deep sm:right-5 md:top-auto md:bottom-28"
          aria-label="Register a new quest"
        >
          <Plus size={16} aria-hidden="true" />
          NEW QUEST
        </button>

        {/* Bottom: XP bar */}
        <div className="absolute bottom-5 left-1/2 z-30 w-full max-w-3xl -translate-x-1/2 px-4 sm:bottom-7">
          <LevelBar />
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-1 left-1/2 z-20 hidden -translate-x-1/2 text-mist/50 sm:block"
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          aria-hidden="true"
        >
          <ChevronDown size={16} />
        </motion.div>
      </div>

      {/* Today's quests */}
      <section aria-label="Today's quests" className="relative mx-auto max-w-2xl px-4 pb-16 pt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm tracking-[0.35em] text-violet">TODAY&apos;S QUESTS</h2>
          <span className="text-xs tabular-nums text-mist">
            {active.length} active · {cleared.length} cleared
          </span>
        </div>
        {active.length === 0 && cleared.length === 0 ? (
          <div className="hud-frame hud-panel mt-4 rounded-sm p-8 text-center">
            <p className="text-sm text-mist">
              No quests registered. The System awaits your first command.
            </p>
            <button
              onClick={() => setFormState({ open: true, task: null })}
              className="font-display mt-5 rounded-sm border border-violet/50 bg-violet px-6 py-2.5 text-xs uppercase tracking-widest text-ivory"
            >
              REGISTER FIRST QUEST
            </button>
          </div>
        ) : (
          <ul className="mt-4 space-y-2.5">
            <AnimatePresence initial={false}>
              {[...active, ...cleared].map((task) => (
                <QuestCard
                  key={task.id}
                  task={task}
                  onEdit={(t) => setFormState({ open: true, task: t })}
                  onDelete={(t) => {
                    if (confirm(`Delete quest "${t.title}"?`)) removeTask(t.id);
                  }}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>

      <QuestForm state={formState} onClose={() => setFormState({ open: false, task: null })} />
    </div>
  );
}

// Compact stats strip shown above the XP bar on mobile only.
function MobileStats() {
  const { profile } = useGameStore();
  if (!profile) return null;
  const stats: Array<[string, number]> = [
    ["STR", profile.str],
    ["INT", profile.int],
    ["DISC", profile.disc],
    ["VIT", profile.vit],
    ["CRE", profile.cre],
  ];
  return (
    <div className="hud-panel flex items-center justify-between gap-2 rounded-sm px-3 py-2">
      {stats.map(([k, v]) => (
        <div key={k} className="text-center">
          <p className="text-[9px] font-semibold tracking-wider text-mist">{k}</p>
          <p className="font-display text-sm tabular-nums text-ivory">{v}</p>
        </div>
      ))}
      <div className="flex items-center gap-2 border-l border-violet/15 pl-2">
        <StreakFlame size={16} lit={profile.currentStreak > 0} />
        <span className="font-display text-sm tabular-nums text-ivory">{profile.currentStreak}</span>
        <EssenceCrystal size={16} />
        <span className="font-display text-sm tabular-nums text-ivory">{profile.essence}</span>
      </div>
    </div>
  );
}
