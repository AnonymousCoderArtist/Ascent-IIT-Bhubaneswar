// Progress — stats overview, rank trajectory, and completion history.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Trophy } from "lucide-react";
import { localGetSession } from "../services/localBackend";
import SystemMenu from "../components/system/SystemMenu";
import LevelBar from "../components/system/LevelBar";
import { StreakWeek } from "../components/system/HabitHooks";
import { useGameStore } from "../hooks/useGameStore";
import { levelDisplay } from "../lib/progression";

interface CompletionRow {
  id: string;
  xpAwarded: number;
  essenceAwarded: number;
  completedAt: string;
  taskTitle: string | null;
}

export default function ProgressPage() {
  const navigate = useNavigate();
  const { profile, tasks } = useGameStore();
  const [history, setHistory] = useState<CompletionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = localGetSession();
    if (!session) { setLoading(false); return; }
    const completions = JSON.parse(localStorage.getItem("ascent:completions") ?? "[]");
    const tasks = JSON.parse(localStorage.getItem("ascent:tasks") ?? "{}");
    setHistory(
      completions
        .filter((c: any) => c.userId === session.user.id)
        .sort((a: any, b: any) => (b.completedAt < a.completedAt ? 1 : -1))
        .slice(0, 10)
        .map((r: any) => ({
          id: r.taskId,
          xpAwarded: r.xpAwarded,
          essenceAwarded: r.essenceAwarded,
          completedAt: r.completedAt,
          taskTitle: tasks[r.taskId]?.title ?? null,
        }))
    );
    setLoading(false);
  }, []);

  if (!profile) return null;
  const d = levelDisplay(profile.totalXp, profile.level);
  const cleared = tasks.filter((t) => t.completed).length;

  const stats: Array<[string, number]> = [
    ["STR", profile.str],
    ["INT", profile.int],
    ["DISC", profile.disc],
    ["VIT", profile.vit],
    ["CRE", profile.cre],
  ];
  const maxStat = Math.max(...stats.map(([, v]) => v), 1);

  return (
    <div className="relative min-h-screen bg-void">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.08),transparent_55%)]" />
      <SystemMenu />

      <main className="relative mx-auto max-w-3xl px-4 pb-16 pt-24">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-mist transition-colors hover:text-ivory"
        >
          <ArrowLeft size={14} aria-hidden="true" /> System
        </button>

        <h1 className="font-display mt-4 text-2xl tracking-[0.15em] text-ivory">PROGRESS</h1>

        <div className="mt-6">
          <LevelBar />
        </div>

        {/* Weekly activity */}
        <div className="mt-8">
          <StreakWeek />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="hud-panel rounded-sm p-4">
            <p className="font-display text-[10px] tracking-[0.3em] text-violet">TOTAL XP</p>
            <p className="mt-1 font-display text-2xl tabular-nums text-ivory">
              {profile.totalXp.toLocaleString()}
            </p>
          </div>
          <div className="hud-panel rounded-sm p-4">
            <p className="font-display text-[10px] tracking-[0.3em] text-amber">
              <Flame size={10} className="mr-1 inline" aria-hidden="true" />
              STREAK / BEST
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums text-ivory">
              {profile.currentStreak} <span className="text-mist/50 text-base">/ {profile.longestStreak}</span>
            </p>
          </div>
          <div className="hud-panel rounded-sm p-4">
            <p className="font-display text-[10px] tracking-[0.3em] text-essence">
              <Trophy size={10} className="mr-1 inline" aria-hidden="true" />
              QUESTS CLEARED
            </p>
            <p className="mt-1 font-display text-2xl tabular-nums text-ivory">{cleared}</p>
          </div>
        </div>

        <section aria-label="Attributes" className="mt-8">
          <h2 className="font-display text-[10px] tracking-[0.35em] text-violet">ATTRIBUTES</h2>
          <ul className="mt-3 space-y-3">
            {stats.map(([key, value]) => (
              <li key={key}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold tracking-widest text-ivory">{key}</span>
                  <span className="tabular-nums text-mist">{value}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-violet-deep to-violet"
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / maxStat) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Completion history" className="mt-8">
          <h2 className="font-display text-[10px] tracking-[0.35em] text-violet">RECENT CLEARS</h2>
          {loading ? (
            <p className="mt-3 text-sm text-mist animate-pulse-slow">LOADING...</p>
          ) : history.length === 0 ? (
            <p className="mt-3 text-sm text-mist">No clears yet. Your history begins with the first quest.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="hud-panel flex items-center justify-between gap-3 rounded-sm px-4 py-3 text-sm"
                >
                  <span className="min-w-0 truncate text-ivory">{h.taskTitle ?? "Quest"}</span>
                  <span className="shrink-0 tabular-nums text-xs text-mist">
                    <span className="text-violet">+{h.xpAwarded} XP</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span className="text-essence">+{h.essenceAwarded} ESS</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-10 text-center text-[10px] tracking-[0.3em] text-mist/50">
          NEXT RANK AT LV.{d.level >= 51 ? 51 : d.level >= 36 ? 51 : d.level >= 21 ? 36 : d.level >= 11 ? 21 : d.level >= 6 ? 11 : 6}
        </p>
      </main>
    </div>
  );
}
