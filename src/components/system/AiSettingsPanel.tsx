// AiSettingsPanel — modal for the user's own AI provider setup:
// Gemini (default) or any OpenAI-compatible endpoint (base URL + key + model).
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, Loader2 } from "lucide-react";
import {
  loadAiSettings,
  saveAiSettings,
  PROVIDER_DEFAULTS,
  type AiProvider,
  type AiSettings,
} from "../../lib/aiSettings";
import { testAiConnection } from "../../lib/aiClient";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Called after settings are saved so parents can re-render badges/buttons. */
  onSaved?: () => void;
}

const PROVIDERS: AiProvider[] = ["gemini", "openai"];

export default function AiSettingsPanel({ open, onClose, onSaved }: Props) {
  const [settings, setSettings] = useState<AiSettings>(loadAiSettings());
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  // Re-sync from localStorage each time the panel opens (other instances may have saved).
  useEffect(() => {
    if (open) {
      setSettings(loadAiSettings());
      setStatus(null);
    }
  }, [open]);

  function set<K extends keyof AiSettings>(key: K, value: AiSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setStatus(null);
  }

  function switchProvider(provider: AiProvider) {
    const d = PROVIDER_DEFAULTS[provider];
    setSettings((s) => ({ ...s, provider, baseUrl: d.baseUrl, model: d.model }));
    setStatus(null);
  }

  function save() {
    const trimmed: AiSettings = {
      ...settings,
      baseUrl: settings.baseUrl.trim(),
      apiKey: settings.apiKey.trim(),
      model: settings.model.trim() || PROVIDER_DEFAULTS[settings.provider].model,
    };
    if (!trimmed.apiKey) {
      setStatus({ ok: false, text: "Enter an API key first." });
      return;
    }
    if (trimmed.provider === "openai" && !trimmed.baseUrl) {
      setStatus({ ok: false, text: "Enter the endpoint base URL (e.g. https://api.openai.com/v1)." });
      return;
    }
    saveAiSettings(trimmed);
    onSaved?.();
    setStatus({ ok: true, text: "Saved. AI daily quests enabled." });
  }

  function reset() {
    saveAiSettings({ provider: "gemini", baseUrl: "", apiKey: "", model: PROVIDER_DEFAULTS.gemini.model });
    setSettings(loadAiSettings());
    setStatus({ ok: true, text: "AI cleared. Deterministic quests will be used." });
    onSaved?.();
  }

  async function test() {
    setTesting(true);
    setStatus(null);
    try {
      await testAiConnection(settings);
      setStatus({ ok: true, text: "Connection OK." });
    } catch (e) {
      setStatus({ ok: false, text: `Connection failed: ${e instanceof Error ? e.message : "unknown error"}` });
    } finally {
      setTesting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-void/80 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="AI provider settings"
          onClick={onClose}
        >
          <motion.div
            className="hud-frame hud-panel w-full max-w-md rounded-sm p-6"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display flex items-center gap-2 text-lg tracking-[0.15em] text-ivory">
                <Sparkles size={18} className="text-arc" aria-hidden="true" />
                AI SETTINGS
              </h2>
              <button
                onClick={onClose}
                aria-label="Close AI settings"
                className="rounded p-1.5 text-mist transition-colors hover:text-ivory"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-mist">
              Bring your own key to unlock AI-generated daily quests. Stored only in this browser.
            </p>

            {/* Provider switch */}
            <fieldset className="mt-4">
              <legend className="mb-1.5 text-[10px] uppercase tracking-widest text-mist">Provider</legend>
              <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="AI provider">
                {PROVIDERS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={settings.provider === p}
                    onClick={() => switchProvider(p)}
                    className={`rounded-sm border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      settings.provider === p
                        ? "border-arc bg-arc/20 text-ivory"
                        : "border-ink bg-ink/50 text-mist hover:border-arc/40"
                    }`}
                  >
                    {PROVIDER_DEFAULTS[p].label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Base URL (OpenAI-compatible only) */}
            {settings.provider === "openai" && (
              <div className="mt-3">
                <label htmlFor="ai-base" className="mb-1.5 block text-[10px] uppercase tracking-widest text-mist">
                  Base URL
                </label>
                <input
                  id="ai-base"
                  value={settings.baseUrl}
                  onChange={(e) => set("baseUrl", e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  spellCheck={false}
                  className="w-full rounded-sm border border-arc/20 bg-ink px-3 py-2.5 text-sm text-ivory placeholder:text-mist/40 focus:border-arc"
                />
              </div>
            )}

            {/* API key */}
            <div className="mt-3">
              <label htmlFor="ai-key" className="mb-1.5 block text-[10px] uppercase tracking-widest text-mist">
                API Key
              </label>
              <div className="relative">
                <input
                  id="ai-key"
                  type={showKey ? "text" : "password"}
                  value={settings.apiKey}
                  onChange={(e) => set("apiKey", e.target.value)}
                  placeholder={settings.provider === "gemini" ? "AIza..." : "sk-..."}
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full rounded-sm border border-arc/20 bg-ink px-3 py-2.5 pr-14 text-sm text-ivory placeholder:text-mist/40 focus:border-arc"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest text-mist hover:text-ivory"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Model */}
            <div className="mt-3">
              <label htmlFor="ai-model" className="mb-1.5 block text-[10px] uppercase tracking-widest text-mist">
                Model
              </label>
              <input
                id="ai-model"
                value={settings.model}
                onChange={(e) => set("model", e.target.value)}
                placeholder={PROVIDER_DEFAULTS[settings.provider].model}
                spellCheck={false}
                className="w-full rounded-sm border border-arc/20 bg-ink px-3 py-2.5 text-sm text-ivory placeholder:text-mist/40 focus:border-arc"
              />
            </div>

            {status && (
              <p
                role="status"
                className={`mt-3 text-xs ${status.ok ? "text-essence" : "text-danger"}`}
              >
                {status.text}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={test}
                disabled={testing || !settings.apiKey.trim()}
                className="font-display inline-flex items-center justify-center gap-1.5 rounded-sm border border-arc/50 bg-arc/15 px-4 py-2.5 text-xs uppercase tracking-widest text-arc transition-colors hover:bg-arc/30 disabled:opacity-40"
              >
                {testing ? (
                  <>
                    <Loader2 size={13} className="animate-spin" aria-hidden="true" /> TESTING
                  </>
                ) : (
                  "TEST"
                )}
              </button>
              <button
                onClick={save}
                className="font-display rounded-sm border border-violet/60 bg-violet px-4 py-2.5 text-xs uppercase tracking-widest text-ivory transition-colors hover:bg-violet-deep"
              >
                SAVE
              </button>
            </div>
            <button
              onClick={reset}
              className="mt-2 w-full rounded-sm px-4 py-2 text-[10px] uppercase tracking-widest text-mist transition-colors hover:text-danger"
            >
              Clear AI settings
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
