// AI provider settings — user-supplied, stored only in this browser (localStorage).
// Supports Google Gemini (native API) or any OpenAI-compatible endpoint
// (custom base URL + API key + model name). No keys are ever committed.

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
  return { provider: "gemini", baseUrl: "", apiKey: "", model: PROVIDER_DEFAULTS.gemini.model };
}

export function saveAiSettings(s: AiSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* private mode */
  }
}

/** True when the user configured an API key in settings. */
export function isAiConfigured(): boolean {
  return loadAiSettings().apiKey.trim().length > 0;
}
