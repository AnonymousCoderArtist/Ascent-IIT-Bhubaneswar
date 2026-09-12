// Reward/level-up orchestration: calls the authoritative completion endpoint,
// then sequences the visual payoff (XP burst -> LEVEL UP -> evolution reveal).

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CompleteQuestResponse, Task, Rank } from "../types/contract";
import * as api from "../services/api";
import { useGameStore } from "./useGameStore";
import { useSystemMessage } from "../components/system/SystemMessage";
import { worldAssetForLevel, characterAssetForLevel, WORLD_MILESTONE_LABELS } from "../lib/milestones";

interface RewardEvent {
  id: number;
  response: CompleteQuestResponse;
  phase: "burst" | "levelup" | "evolution";
}

interface RewardContextValue {
  completingIds: Set<string>;
  completeQuest: (task: Task) => Promise<void>;
}

const RewardContext = createContext<RewardContextValue>({ completingIds: new Set(), completeQuest: async () => {} });

let rewardId = 1;

export function RewardProvider({ children }: { children: ReactNode }) {
  const { refresh } = useGameStore();
  const { push } = useSystemMessage();
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [event, setEvent] = useState<RewardEvent | null>(null);

  const completeQuest = useCallback(
    async (task: Task) => {
      if (completingIds.has(task.id)) return;
      setCompletingIds((prev) => new Set(prev).add(task.id));
      try {
        const response = await api.completeQuest(task.id);
        if (!response.success) throw new Error("Completion rejected.");
        const id = rewardId++;
        const leveled = response.progression.leveledUp;
        setEvent({ id, response, phase: "burst" });
        push(
          `[SYSTEM] QUEST CLEARED. +${response.reward.xp} XP · +${response.reward.attributeXp} ${response.reward.attribute} · +${response.reward.essence} ESSENCE`
        );

        // Phase timing: burst 1.6s -> LEVEL UP -> evolution swap (if milestone).
        if (leveled) {
          setTimeout(() => setEvent((e) => (e && e.id === id ? { ...e, phase: "levelup" } : e)), 1600);
          const hasEvolution = response.unlocks.some((u) => u.type === "world" || u.type === "character");
          if (hasEvolution) {
            setTimeout(() => setEvent((e) => (e && e.id === id ? { ...e, phase: "evolution" } : e)), 3200);
            setTimeout(() => setEvent((e) => (e && e.id === id ? null : e)), 7600);
          } else {
            setTimeout(() => setEvent((e) => (e && e.id === id ? null : e)), 4200);
          }
        } else {
          setTimeout(() => setEvent((e) => (e && e.id === id ? null : e)), 2400);
        }

        refresh();
      } catch (e) {
        console.error(e);
        push("[SYSTEM] Connection unstable. Reward is not yet confirmed.");
      } finally {
        setCompletingIds((prev) => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }
    },
    [completingIds, push, refresh]
  );

  return (
    <RewardContext.Provider value={{ completingIds, completeQuest }}>
      {children}
      <AnimatePresence>
        {event && (
          <RewardOverlay
            key={event.id}
            event={event}
            level={event.response.progression.levelAfter}
            rank={event.response.progression.rankAfter}
          />
        )}
      </AnimatePresence>
    </RewardContext.Provider>
  );
}

function RewardOverlay({ event, level, rank }: { event: RewardEvent; level: number; rank: Rank }) {
  const { response } = event;
  const worldUnlock = response.unlocks.find((u) => u.type === "world");
  const worldMilestone = worldUnlock
    ? Object.values(WORLD_MILESTONE_LABELS).find((m) => m.key === worldUnlock.key)
    : null;
  const worldImg = worldAssetForLevel(level);
  const charImg = characterAssetForLevel(level);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="presentation"
    >
      {/* Darkening veil */}
      <div className="absolute inset-0 bg-void/75 backdrop-blur-[2px]" />

      {/* Phase 1: XP burst */}
      {event.phase === "burst" && (
        <motion.div key="burst" className="absolute inset-0 grid place-items-center"
          initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.06 }}>
          <div className="relative text-center">
            <motion.div className="absolute -inset-20 rounded-full bg-violet/20 blur-3xl"
              initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 1.5, 1.2], opacity: [0, 0.9, 0.5] }}
              transition={{ duration: 1.3 }} />
            <motion.div className="font-display text-5xl text-ivory drop-shadow-[0_0_24px_rgba(139,92,246,0.8)] sm:text-7xl"
              initial={{ scale: 0.7, filter: "blur(10px)" }} animate={{ scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: "easeOut" }}>
              +{response.reward.xp} XP
            </motion.div>
            <motion.div className="mt-3 text-xs tracking-[0.3em] text-arc sm:text-sm"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              +{response.reward.attributeXp} {response.reward.attribute} · +{response.reward.essence} ESSENCE
            </motion.div>
            {Array.from({ length: 16 }).map((_, i) => (
              <motion.span key={i} className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-violet"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((i / 16) * Math.PI * 2) * (70 + (i % 4) * 30),
                  y: Math.sin((i / 16) * Math.PI * 2) * (70 + (i % 5) * 25),
                  opacity: 0, scale: [1, 2, 0.4],
                }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.03 }} />
            ))}
            {/* Particles converging toward bottom XP bar */}
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.span key={`t${i}`} className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-arc"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0], y: ["0vh", "-5vh", "38vh", "46vh"], x: `${(i - 2.5) * 12}vh`, scale: [0.5, 1.4, 1] }}
                transition={{ duration: 1.1, delay: 0.3 + i * 0.06, ease: "easeIn" }} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Phase 2: LEVEL UP typography */}
      {event.phase === "levelup" && (
        <motion.div key="levelup" className="absolute inset-0 grid place-items-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="text-center">
            <motion.div
              className="font-display text-6xl tracking-[0.12em] sm:text-8xl"
              style={{ backgroundImage: "linear-gradient(180deg,#F4F4F0 20%,#8B5CF6 130%)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}
              initial={{ scale: 1.2, filter: "blur(18px)", opacity: 0 }}
              animate={{ scale: 1, filter: "blur(0px)", opacity: 1 }}
              transition={{ duration: 0.55, ease: "easeOut" }}>
              LEVEL UP
            </motion.div>
            <motion.p className="mt-5 font-display text-lg tracking-[0.5em] text-violet sm:text-2xl"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              LV.{String(level).padStart(2, "0")} · {rank}-RANK
            </motion.p>
          </div>
          {[0, 1].map((r) => (
            <motion.div key={r} className="absolute h-40 w-40 rounded-full border border-violet/60"
              initial={{ scale: 0.2, opacity: 0.9 }} animate={{ scale: 16, opacity: 0 }}
              transition={{ duration: 1.6, delay: r * 0.3, ease: "easeOut" }} />
          ))}
        </motion.div>
      )}

      {/* Phase 3: EVOLUTION reveal — character/world swap */}
      {event.phase === "evolution" && (
        <motion.div key="evolution" className="absolute inset-0 grid place-items-center overflow-hidden"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0">
            <img src={worldImg} alt="" className="h-full w-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/30 to-void/70" />
          </div>
          <div className="relative flex flex-col items-center">
            <motion.div className="absolute top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-violet/20 blur-3xl"
              initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: [0.3, 1.7], opacity: [0, 0.9, 0.5] }}
              transition={{ duration: 1.5 }} />
            <motion.img src={charImg} alt="Your evolved character"
              className="relative max-h-[52vh] object-contain drop-shadow-[0_0_50px_rgba(139,92,246,0.5)]"
              initial={{ opacity: 0, scale: 0.9, filter: "blur(14px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: "easeOut" }} />
            <motion.div className="relative mt-6 text-center"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <p className="font-display text-sm tracking-[0.6em] text-violet">[SYSTEM]</p>
              <p className="font-display mt-2 text-2xl tracking-[0.18em] text-ivory sm:text-4xl">EVOLUTION COMPLETE.</p>
              {worldMilestone && (
                <p className="mt-3 text-xs tracking-[0.3em] text-arc sm:text-sm">
                  {worldMilestone.title.toUpperCase()} — UNLOCKED
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function useReward() {
  return useContext(RewardContext);
}
