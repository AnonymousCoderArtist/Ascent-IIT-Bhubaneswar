// Landing — hero: ASCENT, tagline, ENTER THE SYSTEM, particles + world art.
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import WorldCanvas from "../components/world/WorldCanvas";
import { SystemSigil, XpSpark } from "../components/ui/GameArt";
import { useAuth } from "../hooks/useAuth";

export default function LandingPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <WorldCanvas />
      {/* Depth vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,8,11,0.85)_75%)]" />
      {/* Horizon glow */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_50%_100%,rgba(109,40,217,0.18),transparent_70%)]" />

      <header className="absolute left-1/2 top-8 z-20 -translate-x-1/2">
        <SystemSigil size={44} glow />
      </header>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-5 flex items-center gap-2"
        >
          <XpSpark size={14} />
          <p className="text-[10px] tracking-[0.55em] text-mist sm:text-xs">A LIFE RPG SYSTEM</p>
          <XpSpark size={14} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-display text-7xl tracking-[0.08em] text-ivory drop-shadow-[0_0_60px_rgba(139,92,246,0.35)] sm:text-8xl md:text-9xl"
        >
          ASCENT
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-6 text-balance text-sm leading-relaxed text-mist sm:text-base"
        >
          Your life. Your quests. Your evolution.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="mt-12"
        >
          <Button
            onClick={() => navigate(session ? "/home" : "/auth")}
            className="px-12 py-4 text-base"
          >
            ENTER THE SYSTEM
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 flex items-center justify-center gap-8 text-[10px] tracking-[0.3em] text-mist/60 sm:gap-14"
        >
          <span>QUEST → XP</span>
          <span className="text-violet" aria-hidden="true">→</span>
          <span>LEVEL → RANK</span>
          <span className="text-violet" aria-hidden="true">→</span>
          <span>WORLD EVOLVES</span>
        </motion.div>
      </main>
    </div>
  );
}
