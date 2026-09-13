// Awakening — onboarding: choose display name, growth goals, see character preview.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, BookOpen, CalendarCheck, HeartPulse, Sparkles, Check } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useGameStore } from "../hooks/useGameStore";
import { updateDisplayName } from "../services/api";
import { saveGoals } from "../lib/questGenerator";
import { characterAssetForLevel } from "../lib/milestones";
import Button from "../components/ui/Button";

const GOALS = [
  { key: "STR", label: "Get Stronger", icon: Dumbbell },
  { key: "INT", label: "Learn More", icon: BookOpen },
  { key: "DISC", label: "Build Discipline", icon: CalendarCheck },
  { key: "VIT", label: "Feel Alive", icon: HeartPulse },
  { key: "CRE", label: "Create Things", icon: Sparkles },
] as const;

export default function AwakeningPage() {
  const { session } = useAuth();
  const { refresh } = useGameStore();
  const navigate = useNavigate();
  const [name, setName] = useState(session?.user?.email?.split("@")[0] ?? "");
  const [goals, setGoals] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);

  async function enterSystem() {
    setBusy(true);
    try {
      saveGoals(goals);
      await updateDisplayName(name.trim() || "Player");
      await refresh();
      navigate("/home");
    } catch (e) {
      console.error(e);
      navigate("/home");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-6 py-12">
      {/* backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(139,92,246,0.12),transparent_60%)]" />
      <div className="relative grid w-full max-w-4xl gap-10 md:grid-cols-2">
        {/* Left: character + copy */}
        <motion.div
          className="flex flex-col justify-center"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-display text-xs tracking-[0.5em] text-violet">[SYSTEM]</p>
          <h1 className="font-display mt-3 text-5xl tracking-[0.06em] text-ivory">AWAKENING</h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist">
            Every quest you clear in the real world makes you stronger here. Your world rebuilds
            itself around your effort. Choose who you are becoming.
          </p>
          <motion.img
            src={characterAssetForLevel(1)}
            alt="Your awakening form"
            className="mt-8 max-h-72 w-auto self-start object-contain drop-shadow-[0_0_40px_rgba(139,92,246,0.35)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          />
        </motion.div>

        {/* Right: steps */}
        <motion.div
          className="hud-frame hud-panel self-center rounded-sm p-6 sm:p-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <ol className="mb-6 flex items-center gap-2" aria-label="Awakening progress">
            {[1, 2, 3].map((s) => (
              <li
                key={s}
                className={`h-1 flex-1 rounded-full ${step >= s ? "bg-violet" : "bg-ink"}`}
                aria-label={`Step ${s}${step >= s ? " complete" : ""}`}
              />
            ))}
          </ol>

          {step === 1 && (
            <div>
              <h2 className="font-display text-lg tracking-[0.2em] text-ivory">WHAT SHOULD THE SYSTEM CALL YOU?</h2>
              <label htmlFor="awaken-name" className="sr-only">
                Display name
              </label>
              <input
                id="awaken-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="e.g. Arjun"
                className="mt-5 w-full rounded-sm border border-violet/20 bg-ink px-4 py-3 text-lg text-ivory placeholder:text-mist/40 focus:border-violet"
              />
              <Button onClick={() => setStep(2)} className="mt-6 w-full">
                CONTINUE
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-lg tracking-[0.2em] text-ivory">CHOOSE YOUR GROWTH GOALS</h2>
              <p className="mt-1 text-xs text-mist">Pick any that resonate. The System adapts.</p>
              <div className="mt-5 space-y-2">
                {GOALS.map(({ key, label, icon: Icon }) => {
                  const on = goals.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        setGoals((prev) => (on ? prev.filter((g) => g !== key) : [...prev, key]))
                      }
                      aria-pressed={on}
                      className={`flex w-full items-center gap-3 rounded-sm border px-4 py-3 text-left text-sm transition-colors ${
                        on ? "border-violet bg-violet/20 text-ivory" : "border-ink bg-ink/40 text-mist hover:border-violet/40"
                      }`}
                    >
                      <Icon size={16} className={on ? "text-violet" : "text-mist/60"} aria-hidden="true" />
                      <span className="flex-1">{label}</span>
                      {on && <Check size={16} className="text-violet" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
              <Button onClick={() => setStep(3)} className="mt-6 w-full">
                CONTINUE
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <h2 className="font-display text-lg tracking-[0.2em] text-ivory">
                WELCOME, {name.toUpperCase() || "PLAYER"}.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-mist">
                You begin at <span className="text-violet">LV.01</span> — E-Rank, in a Ruined
                Settlement. Clear your first quest to level up.
              </p>
              <div className="mt-6 rounded-sm border border-violet/20 bg-ink/60 p-4 text-left">
                <p className="font-display text-[10px] tracking-[0.35em] text-violet">FIRST QUEST</p>
                <p className="mt-2 text-sm text-ivory">AWAKENING QUEST</p>
                <p className="mt-1 text-xs text-mist">Drink a glass of water and take a 5-minute walk.</p>
                <p className="mt-2 text-xs text-essence">+50 XP · +VIT · +10 ESSENCE</p>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-mist">
                The System issues <span className="text-arc">AI-generated daily quests</span> built
                around your goals and weakest attributes.
              </p>
              <Button onClick={enterSystem} disabled={busy} className="mt-6 w-full">
                {busy ? "ENTERING..." : "ENTER THE SYSTEM"}
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
