import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { useState } from "react";
import { useGameStore } from "../../hooks/useGameStore";
import { characterAssetForLevel, worldAssetForLevel, WORLD_MILESTONE_LABELS } from "../../lib/milestones";
import { levelDisplay, rankForLevel, thresholdForLevel } from "../../lib/progression";
import { RankBadge } from "../ui/GameArt";
import { uiTick } from "../../lib/sfx";

export default function RankRoadmap() {
  const { profile } = useGameStore();
  const [open, setOpen] = useState(false);
  if (!profile) return null;

  const disp = levelDisplay(profile.totalXp, profile.level);
  const currentLevel = disp.level;
  const currentRank = disp.rank;
  const milestones = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 51];

  return (
    <>
      <button
        onClick={() => { uiTick(); setOpen(true); }}
        className="pointer-events-auto fixed top-16 right-16 z-40 flex items-center gap-1 rounded-full border border-fuchsia/30 bg-ink/80 px-2 py-1.5 text-[9px] font-display font-bold tracking-[0.3em] text-ivory backdrop-blur-sm transition-colors hover:border-fuchsia/50"
        aria-label="Rank roadmap"
      >
        <Star size={10} className="text-fuchsia" aria-hidden="true" />
        ROADMAP
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[200] grid place-items-center bg-void/90 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-sm border border-violet/20 bg-ink p-6"
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { uiTick(); setOpen(false); }}
                className="absolute right-4 top-4 text-mist hover:text-ivory"
                aria-label="Close"
              >
                <X size={18} />
              </button>

              <p className="font-display text-xs tracking-[0.4em] text-violet">[SYSTEM]</p>
              <h2 className="mt-1 font-display text-2xl tracking-wider text-ivory">RANK ROADMAP</h2>

              <div className="mt-5 flex items-center gap-3">
                <RankBadge rank={currentRank as any} size={36} />
                <div>
                  <p className="font-display text-lg text-ivory">LV.{String(currentLevel).padStart(2, "0")} — {currentRank}-RANK</p>
                  <p className="text-[10px] tracking-wider text-mist">{disp.xpToNext.toLocaleString()} XP to next</p>
                </div>
              </div>

              <div className="relative mt-6 pl-4">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-violet/30" />
                {milestones.map((ml) => {
                  const reached = ml <= currentLevel;
                  const isCurrent = ml === currentLevel;
                  const worldLabel = ml in WORLD_MILESTONE_LABELS ? WORLD_MILESTONE_LABELS[ml] : null;
                  return (
                    <div key={ml} className={`relative flex items-center gap-3 py-1.5 ${reached ? "opacity-100" : "opacity-25"}`}>
                      <div className={`relative z-10 flex h-5 w-5 items-center justify-center rounded-full border ${reached ? "border-violet bg-violet/20" : "border-mist/30 bg-ink"}`}>
                        {reached && <div className="h-1.5 w-1.5 rounded-full bg-violet" />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-display text-xs ${reached ? "text-ivory" : "text-mist"}`}>
                          LV.{String(ml).padStart(2, "0")} — {rankForLevel(ml)}-RANK
                        </p>
                        {worldLabel && reached && (
                          <p className="text-[8px] tracking-wider text-arc">{worldLabel.title.toUpperCase()}</p>
                        )}
                      </div>
                      {isCurrent && <span className="text-[8px] font-bold tracking-widest text-violet">NOW</span>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-sm border border-void/40 bg-void/30">
                  <img src={worldAssetForLevel(currentLevel)} alt="" className="h-20 w-full object-cover opacity-60" />
                  <p className="px-2 py-1 text-[9px] tracking-wider text-mist">MAP — LV.{String(currentLevel).padStart(2, "0")}</p>
                </div>
                <div className="overflow-hidden rounded-sm border border-void/40 bg-void/30">
                  <img src={characterAssetForLevel(currentLevel)} alt="" className="h-20 w-full object-contain bg-void/50" />
                  <p className="px-2 py-1 text-[9px] tracking-wider text-mist">CHARACTER — LV.{String(currentLevel).padStart(2, "0")}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-sm border border-fuchsia/20 bg-fuchsia/5 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-fuchsia" />
                  <p className="font-display text-xs tracking-wider text-fuchsia">S RANK — LV.51</p>
                </div>
                <p className="text-[10px] text-mist">{Math.max(0, thresholdForLevel(51) - profile.totalXp).toLocaleString()} XP away</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
