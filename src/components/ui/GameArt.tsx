// Custom SVG game art — original geometric designs in the ASCENT palette.
// Animated variants use SMIL/CSS; all honor prefers-reduced-motion via CSS.

import type { Rank } from "../../types/contract";

// Rank badge: hexagonal frame with tier-colored core + rotating outer ring.
export function RankBadge({ rank, size = 44 }: { rank: Rank; size?: number }) {
  const colors: Record<Rank, string> = {
    E: "#9AA0AE",
    D: "#4F8CFF",
    C: "#8B5CF6",
    B: "#34D399",
    A: "#FBBF24",
    S: "#F87171",
  };
  const c = colors[rank];
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label={`${rank} rank badge`}>
      <defs>
        <linearGradient id={`rg-${rank}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.9" />
          <stop offset="100%" stopColor={c} stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {/* rotating dashed outer ring */}
      <circle
        cx="24"
        cy="24"
        r="22.5"
        fill="none"
        stroke={c}
        strokeOpacity="0.4"
        strokeWidth="1"
        strokeDasharray="3 7"
        className="origin-center animate-[spin_14s_linear_infinite]"
        style={{ transformOrigin: "24px 24px" }}
      />
      <path
        d="M24 3 L42 13.5 V34.5 L24 45 L6 34.5 V13.5 Z"
        fill="none"
        stroke={c}
        strokeOpacity="0.5"
        strokeWidth="1.5"
      />
      <path
        d="M24 9 L36.5 16.25 V31.75 L24 39 L11.5 31.75 V16.25 Z"
        fill={`url(#rg-${rank})`}
        fillOpacity="0.35"
        stroke={c}
        strokeWidth="1"
      />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontFamily="Valorant, Anton, sans-serif"
        fontSize="17"
        fill={c}
      >
        {rank}
      </text>
    </svg>
  );
}

// Essence crystal: faceted gem with inner shimmer.
export function EssenceCrystal({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Essence crystal">
      <defs>
        <linearGradient id="essg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#34D399" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="essshine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4F4F0" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F4F4F0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M12 2 L19 9 L12 22 L5 9 Z" fill="url(#essg)" fillOpacity="0.85" stroke="#34D399" strokeWidth="0.8" />
      <path d="M12 2 L12 22 M5 9 L19 9" stroke="#F4F4F0" strokeOpacity="0.5" strokeWidth="0.6" />
      {/* shimmer facet */}
      <path d="M12 2 L15 9 L12 13 L9 9 Z" fill="url(#essshine)" fillOpacity="0.35">
        <animate attributeName="fill-opacity" values="0.15;0.5;0.15" dur="3s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

// Streak flame: angular energy flame with flicker.
export function StreakFlame({ size = 20, lit = true }: { size?: number; lit?: boolean }) {
  const color = lit ? "#FBBF24" : "#3A3F4E";
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" role="img" aria-label="Streak flame">
      <path
        d="M12 2 C15 6 18 8 18 13 A6 6 0 0 1 6 13 C6 8 9 6 12 2 Z"
        fill={color}
        fillOpacity={lit ? 0.9 : 0.4}
        className={lit ? "animate-[flicker_1.8s_ease-in-out_infinite]" : ""}
        style={{ transformOrigin: "12px 20px" }}
      />
      <path
        d="M12 8 C13.5 10 15 11 15 13.5 A3 3 0 0 1 9 13.5 C9 11 10.5 10 12 8 Z"
        fill={lit ? "#F4F4F0" : "#2A2E3A"}
        fillOpacity={lit ? 0.85 : 0.5}
      />
      <style>{`@keyframes flicker { 0%,100% { transform: scale(1) rotate(0deg); } 25% { transform: scale(1.06,0.95) rotate(-2deg); } 60% { transform: scale(0.96,1.05) rotate(2deg); } }`}</style>
    </svg>
  );
}

// System sigil: upward chevrons in a ring — slow rotation when idle.
export function SystemSigil({ size = 40, glow = false }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="ASCENT system sigil">
      <g className={glow ? "origin-center animate-[spin_30s_linear_infinite]" : ""} style={{ transformOrigin: "24px 24px" }}>
        <circle cx="24" cy="24" r="22" fill="none" stroke="#8B5CF6" strokeOpacity={glow ? "0.9" : "0.4"} strokeWidth="1.2" strokeDasharray="6 5" />
      </g>
      <circle cx="24" cy="24" r="18" fill="none" stroke="#8B5CF6" strokeOpacity="0.15" strokeWidth="0.6" />
      <path d="M24 10 L32 20 H16 Z" fill="#8B5CF6" />
      <path d="M24 18 L34 30 H14 Z" fill="#8B5CF6" fillOpacity="0.6" />
      <path d="M24 26 L36 40 H12 Z" fill="#8B5CF6" fillOpacity="0.3" />
    </svg>
  );
}

// XP burst star: four-point spark.
export function XpSpark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0 Z" fill="#8B5CF6" fillOpacity="0.9" />
      <circle cx="12" cy="12" r="2" fill="#F4F4F0" />
    </svg>
  );
}

// Level-up halo: concentric dashed rings with counter-rotation.
export function LevelHalo({ size = 200 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true" className="opacity-70">
      <g className="origin-center animate-[spin_20s_linear_infinite]" style={{ transformOrigin: "100px 100px" }}>
        <circle cx="100" cy="100" r="96" fill="none" stroke="#8B5CF6" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="4 8" />
      </g>
      <g className="origin-center animate-[spin_26s_linear_infinite_reverse]" style={{ transformOrigin: "100px 100px" }}>
        <circle cx="100" cy="100" r="80" fill="none" stroke="#4F8CFF" strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="2 10" />
      </g>
      <circle cx="100" cy="100" r="60" fill="none" stroke="#F4F4F0" strokeOpacity="0.2" strokeWidth="0.6" />
    </svg>
  );
}
