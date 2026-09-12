// LevelBar — bottom progress bar: rank badge, level, XP progress with GSAP shine sweep.
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { levelDisplay } from "../../lib/progression";
import { useGameStore } from "../../hooks/useGameStore";
import { RankBadge } from "../ui/GameArt";
import { countUp } from "../../lib/animations";

export default function LevelBar() {
  const { profile } = useGameStore();
  const xpTextRef = useRef<HTMLSpanElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile || !xpTextRef.current) return;
    const tween = countUp(xpTextRef.current, profile.totalXp, { duration: 1.2 });
    return () => {
      tween.kill();
    };
  }, [profile?.totalXp]);

  useEffect(() => {
    const shine = shineRef.current;
    if (!shine) return;
    let x = -120;
    const id = setInterval(() => {
      x += 14;
      if (x > 130) x = -120;
      shine.style.transform = `translateX(${x}%)`;
    }, 60);
    return () => clearInterval(id);
  }, []);

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
              <span ref={xpTextRef}>{d.xpIntoLevel.toLocaleString()}</span> / {d.xpForLevel.toLocaleString()} XP
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
            {/* GSAP shine sweep */}
            <div ref={shineRef} className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}
