interface Env {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_APP_URL?: string;
}

export const env: Env = import.meta.env as unknown as Env;

export function isBackendConfigured(): boolean {
  return Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
}
