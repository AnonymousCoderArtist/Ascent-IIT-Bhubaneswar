import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { supabase, backendReady } from "../lib/supabase";
import { AuthProvider, useAuth } from "../hooks/useAuth";
import { GameStoreProvider } from "../hooks/useGameStore";
import { RewardProvider } from "../hooks/useReward";
import { SystemMessageProvider } from "../components/system/SystemMessage";
import LandingPage from "../pages/LandingPage";
import AuthPage from "../pages/AuthPage";
import AwakeningPage from "../pages/AwakeningPage";
import HomePage from "../pages/HomePage";
import InventoryPage from "../pages/InventoryPage";
import ProgressPage from "../pages/ProgressPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <SplashScreen label="AUTHENTICATING" />;
  if (!session) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function SplashScreen({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 grid place-items-center bg-void">
      <div className="text-center">
        <p className="font-display text-2xl tracking-widest text-ivory">ASCENT</p>
        <p className="mt-2 text-xs tracking-[0.3em] text-violet animate-pulse-slow">{label}</p>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Shell() {
  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-void text-ivory">
      <ScrollToTop />
      {!backendReady && (
        <div className="fixed top-3 right-3 z-50 rounded border border-essence/20 bg-ink/60 px-2.5 py-1 text-[9px] font-bold tracking-[0.2em] uppercase text-essence/70">
          LOCAL
        </div>
      )}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/awakening"
          element={
            <RequireAuth>
              <AwakeningPage />
            </RequireAuth>
          }
        />
        <Route
          path="/home"
          element={
            <RequireAuth>
              <HomePage />
            </RequireAuth>
          }
        />
        <Route
          path="/inventory"
          element={
            <RequireAuth>
              <InventoryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/progress"
          element={
            <RequireAuth>
              <ProgressPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {});
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthProvider>
      <SystemMessageProvider>
        <GameStoreProvider>
          <RewardProvider>
            <Shell />
          </RewardProvider>
        </GameStoreProvider>
      </SystemMessageProvider>
    </AuthProvider>
  );
}
