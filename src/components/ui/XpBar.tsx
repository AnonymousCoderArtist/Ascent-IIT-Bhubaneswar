import { motion } from "framer-motion";

interface XpBarProps {
  level: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  rank?: string;
}

export default function XpBar({ level, totalXp, xpIntoLevel, xpForNextLevel, rank }: XpBarProps) {
  const pct = xpForNextLevel > 0 ? Math.min(100, (xpIntoLevel / xpForNextLevel) * 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xs tracking-[0.3em] text-violet">{rank}-RANK</span>
          <span className="font-display text-2xl text-ivory">LV.{String(level).padStart(2, "0")}</span>
        </div>
        <span className="text-xs tabular-nums text-mist">
          {xpIntoLevel.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level ${level} XP progress`}
        className="relative h-2.5 overflow-hidden rounded-full bg-ink border border-violet/20"
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet via-arc to-violet"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,transparent_0,rgba(244,244,240,0.15)_50%,transparent_100%)] bg-[length:200%_100%] animate-[shine_3s_linear_infinite]" />
      </div>
      <p className="sr-only">
        Level {level}, rank {rank}, total {totalXp.toLocaleString()} XP.
      </p>
    </div>
  );
}
