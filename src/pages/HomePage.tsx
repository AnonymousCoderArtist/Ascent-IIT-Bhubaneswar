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
import { StreakWeek, NextQuestNudge } from "../components/system/HabitHooks";
import AiSettingsPanel from "../components/system/AiSettingsPanel";
import RankRoadmap from "../components/system/RankRoadmap";
import { useGameStore } from "../hooks/useGameStore";
import { seedAwakeningQuestIfEmpty } from "../services/awakeningSeed";
import { seedDailyQuestsIfNewDay, regenerateDailyQuests } from "../services/dailyQuests";
import { useSystemMessage } from "../components/system/SystemMessage";
import { isAiConfigured } from "../lib/aiSettings";

export default function HomePage() {
  const { tasks, loading, error, removeTask, refresh, profile } = useGameStore();
  const { push } = useSystemMessage();
  const [formState, setFormState] = useState<QuestFormState>({ open: false, task: null });
  const [booting, setBooting] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiReady, setAiReady] = useState(isAiConfigured());

  // Daily quest engine: first load of the day seeds necessary + AI quests.
  // Brand-new players (no tasks at all) get the AWAKENING QUEST first (PRD 5.3).
  useEffect(() => {
    if (loading || error) return;
    if (tasks.length === 0) {
      seedAwakeningQuestIfEmpty()
        .then((t) => {
          if (t) push("[SYSTEM] AWAKENING QUEST REGISTERED.");
        })
        .then(() => refresh());
      return;
    }
    if (!profile) return;
    seedDailyQuestsIfNewDay(profile.level, {
      STR: profile.str,
      INT: profile.int,
      DISC: profile.disc,
      VIT: profile.vit,
      CRE: profile.cre,
    })
      .then((n) => {
        if (n > 0) {
          push(`[SYSTEM] ${n} DAILY QUEST${n > 1 ? "S" : ""} REGISTERED.`);
          refresh();
        }
      })
      .catch(console.error);
  }, [loading, error, tasks.length, profile, refresh, push]);

  const active = useMemo(() => tasks.filter((t) => !t.completed), [tasks]);
  const cleared = useMemo(() => tasks.filter((t) => t.completed), [tasks]);

  async function generateMore() {
    if (!profile || generating) return;
    setGenerating(true);
    try {
      const n = await regenerateDailyQuests(profile.level, {
        STR: profile.str,
        INT: profile.int,
        DISC: profile.disc,
        VIT: profile.vit,
        CRE: profile.cre,
      });
      push(
        n > 0
          ? `[SYSTEM] ${n} NEW QUEST${n > 1 ? "S" : ""} GENERATED${isAiConfigured() ? " [AI]" : ""}.`
          : "[SYSTEM] No new quests generated — clear a few first."
      );
      if (n > 0) refresh();
    } catch (e) {
      console.error(e);
      push("[SYSTEM] Generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  }

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

        {/* TODAY'S QUESTS + habits — left panel */}
        <div className="absolute left-20 top-36 bottom-20 z-30 w-80 sm:left-24 sm:w-96 hidden sm:block overflow-y-auto">
          <div className="hud-panel rounded-sm p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-[10px] tracking-[0.3em] text-violet">TODAY'S QUESTS</p>
              <div className="flex items-center gap-2">
                {aiReady ? (
                  <span className="rounded-full border border-arc/40 bg-arc/10 px-2 py-0.5 text-[9px] font-bold tracking-widest text-arc">AI DAILY</span>
                ) : (
                  <button onClick={() => setAiOpen(true)} className="font-display rounded-full border border-arc/40 bg-arc/10 px-2 py-0.5 text-[9px] font-bold tracking-widest text-arc transition-colors hover:bg-arc/25">+ AI KEY</button>
                )}
                <span className="text-[10px] tabular-nums text-mist">{active.length} active · {cleared.length} cleared</span>
              </div>
            </div>
            {active.length === 0 && cleared.length === 0 ? (
              <div className="mt-3 flex flex-col items-center rounded-sm border border-violet/10 bg-ink/50 p-6 text-center">
                <p className="text-xs text-mist">No quests registered. The System awaits your first command.</p>
                <button onClick={() => setFormState({ open: true, task: null })} className="mt-3 font-display rounded-sm border border-violet/50 bg-violet px-4 py-2 text-[10px] uppercase tracking-widest text-ivory">REGISTER FIRST QUEST</button>
              </div>
            ) : (
              <>
                <ul className="mt-3 space-y-2">
                  <AnimatePresence initial={false}>
                    {[...active, ...cleared].map((task) => (
                      <QuestCard key={task.id} task={task} onEdit={(t) => setFormState({ open: true, task: t })} onDelete={(t) => { if (confirm(`Delete "${t.title}"?`)) removeTask(t.id); }} />
                    ))}
                  </AnimatePresence>
                </ul>
                <button onClick={generateMore} disabled={generating} className="mt-3 flex w-full items-center justify-center rounded-sm border border-arc/50 bg-arc/15 px-4 py-2.5 text-[10px] uppercase tracking-widest text-arc transition-colors hover:bg-arc/30 disabled:opacity-50">{generating ? "GENERATING..." : aiReady ? "GENERATE NEW QUESTS [AI]" : "GENERATE NEW QUESTS"}</button>
                <div className="mt-4 flex flex-col gap-3">
                  <StreakWeek />
                  <NextQuestNudge onRegister={() => setFormState({ open: true, task: null })} />
                </div>
              </>
            )}
          </div>
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

      {/* Habit zone (visible on mobile only; desktop uses left panel) */}
      <section aria-label="Today's quests" className="relative mx-auto max-w-2xl px-4 pb-16 pt-10 sm:hidden">
        <div className="grid gap-4 md:grid-cols-[1fr_240px]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm tracking-[0.35em] text-violet">TODAY&apos;S QUESTS</h2>
              <div className="flex items-center gap-2">
                {aiReady ? (
                  <span className="rounded-full border border-arc/40 bg-arc/10 px-2 py-0.5 text-[9px] font-bold tracking-widest text-arc">
                    AI DAILY
                  </span>
                ) : (
                  <button
                    onClick={() => setAiOpen(true)}
                    className="font-display rounded-full border border-arc/40 bg-arc/10 px-2.5 py-1 text-[9px] font-bold tracking-widest text-arc transition-colors hover:bg-arc/25"
                  >
                    + ADD AI KEY
                  </button>
                )}
                <span className="text-xs tabular-nums text-mist">
                  {active.length} active · {cleared.length} cleared
                </span>
              </div>
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
              <>
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
                <button
                  onClick={generateMore}
                  disabled={generating}
                  className="font-display mt-4 w-full rounded-sm border border-arc/50 bg-arc/15 px-4 py-3 text-xs uppercase tracking-widest text-arc transition-colors hover:bg-arc/30 disabled:opacity-50"
                >
                  {generating
                    ? "GENERATING..."
                    : aiReady
                      ? "GENERATE NEW QUESTS [AI]"
                      : "GENERATE NEW QUESTS"}
                </button>
              </>
            )}
          </div>
          {/* Retention sidebar */}
          <div className="flex flex-col gap-4 md:max-w-xs">
            <StreakWeek />
            <NextQuestNudge onRegister={() => setFormState({ open: true, task: null })} />
          </div>
        </div>
      </section>

      <QuestForm state={formState} onClose={() => setFormState({ open: false, task: null })} />
      <AiSettingsPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onSaved={() => setAiReady(isAiConfigured())}
      />
      <RankRoadmap />
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
