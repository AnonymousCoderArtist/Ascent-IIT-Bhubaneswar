import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/ui/Button";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  if (session) {
    navigate("/home", { replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } =
        mode === "signup"
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate("/awakening", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-void px-6">
      <div className="hud-frame hud-panel w-full max-w-sm p-8">
        <p className="font-display text-xs tracking-[0.4em] text-violet">[SYSTEM]</p>
        <h1 className="font-display mt-2 text-3xl text-ivory">
          {mode === "signup" ? "AWAKEN ACCOUNT" : "RE-ENTER SYSTEM"}
        </h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs tracking-widest text-mist">
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-violet/20 bg-ink px-3 py-2.5 text-sm text-ivory placeholder:text-mist/50 focus:border-violet"
              placeholder="player@ascent.dev"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs tracking-widest text-mist">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-violet/20 bg-ink px-3 py-2.5 text-sm text-ivory placeholder:text-mist/50 focus:border-violet"
              placeholder="min 6 characters"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-danger">
              [SYSTEM] {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "CONNECTING..." : mode === "signup" ? "AWAKEN" : "ENTER"}
          </Button>
        </form>

        <button
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          className="mt-6 w-full text-center text-xs text-mist hover:text-ivory"
        >
          {mode === "signup" ? "Already awakened? Log in" : "New player? Sign up"}
        </button>
        <Link to="/" className="mt-2 block text-center text-xs text-mist/60 hover:text-mist">
          Back to surface
        </Link>
      </div>
    </div>
  );
}
