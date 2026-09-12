import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import WorldCanvas from "../components/world/WorldCanvas";

export default function LandingPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <WorldCanvas />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,8,11,0.9)_75%)]" />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 text-xs tracking-[0.5em] text-mist"
        >
          A LIFE RPG SYSTEM
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-display text-7xl text-ivory sm:text-8xl md:text-9xl"
        >
          ASCENT
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 max-w-md text-balance text-sm leading-relaxed text-mist sm:text-base"
        >
          Your life. Your quests. Your evolution.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-10"
        >
          <Button
            onClick={() => navigate(session ? "/home" : "/auth")}
            className="px-10 py-4 text-base"
            aria-label={session ? "Enter the System" : "Begin — sign up or log in"}
          >
            {session ? "ENTER THE SYSTEM" : "ENTER THE SYSTEM"}
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
