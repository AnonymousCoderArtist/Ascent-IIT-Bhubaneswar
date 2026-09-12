// StatPanel — right column: current stats, streak, essence, and the next-level preview.
import { motion } from "framer-motion";
import { Dumbbell, BookOpen, CalendarCheck, HeartPulse, Sparkles, ChevronRight } from "lucide-react";
import { levelDisplay, nextHook, thresholdForLevel } from "../../lib/progression";
import { useGameStore } from "../../hooks/useGameStore";
import { StreakFlame, EssenceCrystal } from "../ui/GameArt";
import { useScrambleIn } from "../../lib/animations";
import type { Profile } from "../../types/contract";

const STAT_ICONS = { STR: Dumbbell, INT: BookOpen, DISC: CalendarCheck, VIT: HeartPulse, CRE: Sparkles };

export default function StatPanel() {
  const { profile } = useGameStore();
  const attrHeaderRef = useScrambleIn("ATTRIBUTES");
  const nextHeaderRef = useScrambleIn("NEXT", 0.3);
  if (!profile) return null;
  const p: Profile = profile;
  const disp = levelDisplay(p.totalXp, p.level);

  const stats: Array<[string, number]> = [
    ["STR", p.str],
    ["INT", p.int],
    ["DISC", p.disc],
    ["VIT", p.vit],
    ["CRE", p.cre],
  ];
  const maxStat = Math.max(...stats.map(([, v]) => v), 1);

  const nextLevelXp = thresholdForLevel(disp.level + 1);
  const nextWorldMilestone = [30, 20, 15, 10, 5].find((l) => l > disp.level);

  return (
    <aside aria-label="Stats and next level" className="pointer-events-auto flex w-52 flex-col gap-3 lg:w-56">
      {/* Current stats */}
      <div className="hud-panel rounded-sm p-4">
        <h2 ref={attrHeaderRef} className="font-display text-[10px] tracking-[0.35em] text-violet">ATTRIBUTES</h2>
        <ul className="mt-3 space-y-2.5">
          {stats.map(([key, value]) => {
            const Icon = STAT_ICONS[key as keyof typeof STAT_ICONS];
            return (
              <li key={key} className="flex items-center gap-2.5">
                <Icon size={13} className="shrink-0 text-violet/80" aria-hidden="true" />
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-semibold tracking-widest text-ivory">{key}</span>
                    <span className="text-xs tabular-nums text-mist">{value}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet"
                      initial={{ width: 0 }}
                      animate={{ width: `${(value / maxStat) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Streak + essence */}
      <div className="hud-panel flex items-center justify-between rounded-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <StreakFlame size={20} lit={p.currentStreak > 0} />
          <div>
            <p className="font-display text-lg leading-none text-ivory tabular-nums">{p.currentStreak}</p>
            <p className="text-[9px] tracking-widest text-mist uppercase">Streak</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EssenceCrystal size={20} />
          <div>
            <p className="font-display text-lg leading-none text-ivory tabular-nums">{p.essence.toLocaleString()}</p>
            <p className="text-[9px] tracking-widest text-mist uppercase">Essence</p>
          </div>
        </div>
      </div>

      {/* Next level preview */}
      <div className="hud-panel rounded-sm p-4">
        <h2 ref={nextHeaderRef} className="font-display text-[10px] tracking-[0.35em] text-arc">NEXT</h2>
        <p className="mt-2 flex items-center gap-1 font-display text-xl text-ivory">
          LV.{String(disp.level + 1).padStart(2, "0")}
          <ChevronRight size={16} className="text-violet" aria-hidden="true" />
          {disp.level + 1 >= 51 ? "S" : disp.level + 1 >= 36 ? "A" : disp.level + 1 >= 21 ? "B" : disp.level + 1 >= 11 ? "C" : disp.level + 1 >= 6 ? "D" : "E"}-RANK
        </p>
        <p className="mt-1 text-[11px] text-mist tabular-nums">
          {disp.xpToNext.toLocaleString()} XP TO GO · {nextLevelXp.toLocaleString()} total
        </p>
        <div className="mt-2 border-t border-violet/10 pt-2">
          <p className="text-[11px] leading-relaxed text-violet/90">{nextHook(disp.level)}</p>
          {nextWorldMilestone && (
            <p className="mt-1.5 text-[10px] tracking-wider text-mist">
              World evolution at LV.{nextWorldMilestone}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
