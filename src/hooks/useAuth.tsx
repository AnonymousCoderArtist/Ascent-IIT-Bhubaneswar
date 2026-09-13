import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { localGetSession, localSignIn, localSignOut as localLogout, type Session } from "./localBackend";
import type { Session as SupaSession } from "@supabase/supabase-js";

interface AuthContextValue {
  session: SupaSession | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

function toSupaSession(local: { user: { id: string; email: string } } | null): SupaSession | null {
  if (!local) return null;
  return {
    access_token: local.user.id,
    refresh_token: local.user.id,
    token_type: "bearer",
    expires_at: 0,
    expires_in: 0,
    user: {
      id: local.user.id,
      email: local.user.email,
      email_confirmed_at: new Date().toISOString(),
      role: "authenticated",
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      aud: "authenticated",
      confirmation_sent_at: null,
      recovered_at: null,
      last_sign_in_at: new Date().toISOString(),
      role: "authenticated",
    } as any,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SupaSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const local = localGetSession();
    if (local) {
      setSession(toSupaSession(local));
    }
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    await localLogout();
    setSession(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const local = localGetSession();
    setSession(toSupaSession(local));
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
