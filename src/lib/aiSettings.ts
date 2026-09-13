// AI provider settings — user-supplied key stored in localStorage, with an
// optional env-key default for the project owner (VITE_GEMINI_API_KEY).
// Supports Google Gemini (native API) or any OpenAI-compatible endpoint
// (custom base URL + API key + model name). No keys are committed.

import { env } from "./env";

export type AiProvider = "gemini" | "openai";

export interface AiSettings {
  provider: AiProvider;
  baseUrl: string; // OpenAI-compatible: base incl. /v1 (e.g. https://api.openai.com/v1)
  apiKey: string;
  model: string;
}

const SETTINGS_KEY = "ascent:ai-settings";

export const PROVIDER_DEFAULTS: Record<AiProvider, { baseUrl: string; model: string; label: string }> = {
  gemini: { baseUrl: "", model: "gemini-2.5-flash", label: "Google Gemini" },
  openai: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini", label: "OpenAI-compatible" },
};

export function saveAiSettings(s: AiSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* private mode */
  }
}

/** Env-provided default (owner's key). Empty for other users. */
function envDefault(): AiSettings | null {
  const key = (env.VITE_GEMINI_API_KEY ?? "").trim();
  if (!key) return null;
  return { provider: "gemini", baseUrl: "", apiKey: key, model: PROVIDER_DEFAULTS.gemini.model };
}

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const s = JSON.parse(raw) as Partial<AiSettings> & { provider?: string };
      if (s.provider === "gemini" || s.provider === "openai") {
        const provider = s.provider;
        const defaults = PROVIDER_DEFAULTS[provider];
        return {
          provider,
          baseUrl: typeof s.baseUrl === "string" ? s.baseUrl : defaults.baseUrl,
          apiKey: typeof s.apiKey === "string" ? s.apiKey : "",
          model: (typeof s.model === "string" && s.model.trim()) || defaults.model,
        };
      }
    }
  } catch {
    /* corrupt storage */
  }
  // No saved settings: fall back to the env default (owner) or unconfigured.
  return envDefault() ?? { provider: "gemini", baseUrl: "", apiKey: "", model: PROVIDER_DEFAULTS.gemini.model };
}

/** True when a usable key exists (user-saved or env default). */
export function isAiConfigured(): boolean {
  return loadAiSettings().apiKey.trim().length > 0;
}

/** True when the user explicitly saved their own settings (panel overrides env). */
export function hasUserAiSettings(): boolean {
  try {
    return localStorage.getItem(SETTINGS_KEY) !== null;
  } catch {
    return false;
  }
}
