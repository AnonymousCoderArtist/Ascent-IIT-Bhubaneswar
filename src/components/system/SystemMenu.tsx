// SystemMenu — top-center menu bar with HUD styling.
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Backpack, TrendingUp, LogOut, Volume2, VolumeX, Sparkles } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useGameStore } from "../../hooks/useGameStore";
import { uiTick, isMuted, toggleMute } from "../../lib/sfx";
import { isAiConfigured } from "../../lib/aiSettings";
import AiSettingsPanel from "./AiSettingsPanel";
import { useState } from "react";

const ITEMS = [
  { path: "/home", label: "System", icon: Home },
  { path: "/inventory", label: "Inventory", icon: Backpack },
  { path: "/progress", label: "Progress", icon: TrendingUp },
];

export default function SystemMenu() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { signOut } = useAuth();
  const { profile } = useGameStore();
  const [muted, setMuted] = useState(isMuted());
  const [aiOpen, setAiOpen] = useState(false);
  const [aiReady, setAiReady] = useState(isAiConfigured());

  return (
    <header className="pointer-events-auto absolute left-1/2 top-4 z-40 -translate-x-1/2">
      <nav aria-label="System menu" className="hud-panel flex items-center gap-1 rounded-full px-2 py-1.5">
        {ITEMS.map(({ path, label, icon: Icon }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => { uiTick(); navigate(path); }}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium tracking-widest uppercase transition-colors sm:px-4 sm:py-2 ${
                active ? "bg-violet/20 text-ivory" : "text-mist hover:text-ivory"
              }`}
            >
              <Icon size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </button>
          );
        })}
        <div className="mx-1 h-4 w-px bg-violet/20" aria-hidden="true" />
        <div className="hidden items-center gap-2 pr-2 md:flex">
          <span className="text-xs tracking-widest text-mist uppercase">
            {profile?.displayName ?? "Player"}
          </span>
        </div>
        <button
          onClick={() => { uiTick(); setAiOpen(true); }}
          aria-label="AI provider settings"
          title="AI settings — bring your own key"
          className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs uppercase tracking-widest transition-colors sm:px-3 sm:py-2 ${
            aiReady ? "text-arc hover:text-ivory" : "text-mist hover:text-ivory"
          }`}
        >
          <Sparkles size={14} aria-hidden="true" />
          <span className="sr-only">AI settings</span>
          {aiReady && (
            <span className="h-1.5 w-1.5 rounded-full bg-arc shadow-[0_0_6px_rgba(79,140,255,0.9)]" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={() => { uiTick(); setMuted(toggleMute()) }}
          aria-label={muted ? "Unmute system sounds" : "Mute system sounds"}
          aria-pressed={muted}
          className="flex items-center rounded-full px-2.5 py-1.5 text-xs uppercase tracking-widest text-mist transition-colors hover:text-ivory sm:px-3 sm:py-2"
        >
          {muted ? <VolumeX size={14} aria-hidden="true" /> : <Volume2 size={14} aria-hidden="true" />}
          <span className="sr-only">{muted ? "Unmute" : "Mute"}</span>
        </button>
        <button
          onClick={() => { uiTick(); signOut().then(() => navigate("/")); }}
          className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs uppercase tracking-widest text-mist transition-colors hover:text-danger sm:px-3 sm:py-2"
        >
          <LogOut size={14} aria-hidden="true" />
          <span className="sr-only">Sign out</span>
        </button>
      </nav>
      <AiSettingsPanel open={aiOpen} onClose={() => setAiOpen(false)} onSaved={() => setAiReady(isAiConfigured())} />
    </header>
  );
}
