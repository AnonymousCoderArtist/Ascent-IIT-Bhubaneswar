// AI client — one call path for both providers:
//   gemini: POST generativelanguage.googleapis.com (native API, x-goog-api-key)
//   openai: POST {baseUrl}/chat/completions (Authorization: Bearer, any compatible endpoint)

import type { AiSettings } from "./aiSettings";

export interface CallOptions {
  json?: boolean; // request JSON-mode output (best effort)
  maxTokens?: number;
}

async function callGemini(s: AiSettings, prompt: string, opts: CallOptions): Promise<string> {
  const model = s.model.trim() || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": s.apiKey.trim() },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 2048,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
          // Flash models support disabling thinking — prevents JSON truncation.
          ...(model.includes("flash") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const body = await res.json();
  return body?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callOpenAiCompatible(s: AiSettings, prompt: string, opts: CallOptions): Promise<string> {
  const base = s.baseUrl.trim().replace(/\/+$/, "");
  if (!base) throw new Error("No base URL set");
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.apiKey.trim()}` },
    body: JSON.stringify({
      model: s.model.trim(),
      messages: [{ role: "user", content: prompt }],
      max_tokens: opts.maxTokens ?? 1024,
    }),
  });
  if (!res.ok) throw new Error(`AI endpoint ${res.status}`);
  const body = await res.json();
  return body?.choices?.[0]?.message?.content ?? "";
}

/** Send a prompt, get raw text back. Throws on network/HTTP/empty failures. */
export async function callAi(s: AiSettings, prompt: string, opts: CallOptions = {}): Promise<string> {
  const text = s.provider === "openai" ? await callOpenAiCompatible(s, prompt, opts) : await callGemini(s, prompt, opts);
  if (!text) throw new Error("Empty response");
  return text;
}

/** Minimal round-trip check used by the settings panel's TEST button. */
export async function testAiConnection(s: AiSettings): Promise<void> {
  await callAi(s, "Reply with exactly: OK", { maxTokens: 512 });
}
