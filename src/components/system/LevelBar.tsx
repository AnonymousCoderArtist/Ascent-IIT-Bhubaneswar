// LevelBar — bottom progress bar: rank, level, XP progress toward the next level.
import { motion } from "framer-motion";
import { levelDisplay } from "../../lib/progression";
import { useGameStore } from "../../hooks/useGameStore";
import { RankBadge } from "../ui/GameArt";

export default function LevelBar() {
  const { profile } = useGameStore();
  if (!profile) return null;
  const d = levelDisplay(profile.totalXp, profile.level);

  return (
    <div className="pointer-events-auto w-full max-w-3xl">
      <div className="flex items-center gap-3">
        <RankBadge rank={d.rank} size={40} />
        <div className="flex-1">
          <div className="flex items-end justify-between">
            <span className="font-display text-2xl text-ivory sm:text-3xl">
              LV.{String(d.level).padStart(2, "0")}
            </span>
            <span className="text-xs tabular-nums text-mist">
              {d.xpIntoLevel.toLocaleString()} / {d.xpForLevel.toLocaleString()} XP
              <span className="ml-2 hidden text-mist/60 sm:inline">({d.xpToNext.toLocaleString()} to next)</span>
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round(d.pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Level ${d.level} progress: ${Math.round(d.pct)} percent, ${d.rank} rank`}
            className="relative mt-1.5 h-2.5 overflow-hidden rounded-full border border-violet/20 bg-ink"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-deep via-violet to-arc"
              initial={false}
              animate={{ width: `${d.pct}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 18 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
