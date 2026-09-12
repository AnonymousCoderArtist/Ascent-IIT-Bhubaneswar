// Supabase client. Backend agent owns schema/functions; this file is shared
// infrastructure and must keep the same export names.

import { createClient } from "@supabase/supabase-js";
import { env, isBackendConfigured } from "./env";

const url = env.VITE_SUPABASE_URL ?? "https://placeholder.supabase.co";
const anonKey = env.VITE_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient(url, anonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const backendReady = isBackendConfigured();
