// ZoneRail — left column: world zone icons that light up as the world evolves.
import { Home, Landmark, Dumbbell, BookOpen, Hammer, TowerControl, Lock } from "lucide-react";
import { ZONES } from "../../lib/catalog";
import { useGameStore } from "../../hooks/useGameStore";

const ICONS: Record<string, typeof Home> = {
  Home,
  Landmark,
  Dumbbell,
  BookOpen,
  Hammer,
  TowerControl,
};

export default function ZoneRail() {
  const { profile } = useGameStore();
  const level = profile?.level ?? 1;

  return (
    <nav aria-label="World zones" className="pointer-events-auto flex flex-col gap-2">
      {ZONES.map((zone) => {
        const unlocked = level >= zone.level;
        const Icon = ICONS[zone.icon] ?? Home;
        const current =
          unlocked && level < (ZONES[ZONES.indexOf(zone) + 1]?.level ?? Infinity);
        return (
          <div key={zone.key} className="group relative">
            <button
              disabled={!unlocked}
              aria-label={`${zone.name}${unlocked ? "" : ` — unlocks at level ${zone.level}`}`}
              className={`hud-frame flex h-11 w-11 items-center justify-center rounded-sm transition-all ${
                unlocked
                  ? "border-violet/30 bg-ink/70 text-violet hover:bg-violet/20"
                  : "cursor-not-allowed border-ink bg-ink/40 text-mist/40"
              } ${current ? "shadow-[0_0_18px_rgba(139,92,246,0.35)]" : ""}`}
            >
              {unlocked ? <Icon size={18} aria-hidden="true" /> : <Lock size={14} aria-hidden="true" />}
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded border border-violet/20 bg-ink px-3 py-1.5 text-xs tracking-wider text-ivory group-hover:block"
            >
              {zone.name}
              <span className="mt-0.5 block text-[10px] text-mist">{unlocked ? zone.blurb : `LV.${zone.level} required`}</span>
            </span>
          </div>
        );
      })}
    </nav>
  );
}
