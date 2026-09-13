// CharacterStage — center of the home screen: complete character artwork
// over the living world background, with aura ring and parallax.

import { motion, useReducedMotion } from "framer-motion";
import { characterAssetForLevel, worldAssetForLevel } from "../../lib/milestones";
import { useGameStore } from "../../hooks/useGameStore";

export default function CharacterStage() {
  const { profile } = useGameStore();
  const level = profile?.level ?? 1;
  const reduced = useReducedMotion();

  const worldImg = worldAssetForLevel(level);
  const charImg = characterAssetForLevel(level);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* World background — full-bleed behind everything */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.img
          src={worldImg}
          alt=""
          aria-hidden="true"
          className="h-full w-full scale-110 object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.55 : 0.65 }}
          transition={{ duration: 1.4 }}
        />
        {/* Light vignettes only */}
        <div className="absolute inset-0 bg-gradient-to-t from-void/40 via-transparent to-void/40" />
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-void/50 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-48 bg-gradient-to-l from-void/50 to-transparent" />
      </div>

      {/* Aura ring behind character */}
      {!reduced && (
        <motion.div
          aria-hidden="true"
          className="absolute h-56 w-56 rounded-full border border-violet/40 sm:h-72 sm:w-72"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.8, 0.5], rotate: 360 }}
          transition={{
            scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 40, repeat: Infinity, ease: "linear" },
          }}
          style={{ borderStyle: "dashed" }}
        />
      )}

      {/* The complete character artwork (one image, milestone-swapped) */}
      <motion.img
        key={charImg}
        src={charImg}
        alt={`Your character at level ${level}`}
        className="relative z-10 mt-24 max-h-[56vh] max-w-[80vw] object-contain drop-shadow-[0_12px_50px_rgba(7,8,11,0.9)] sm:mt-32 sm:max-h-[62vh]"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />

      {/* Level tag under character */}
      <div className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2">
        <p className="font-display text-[10px] tracking-[0.45em] text-violet/90">
          {profile?.displayName?.toUpperCase() ?? "PLAYER"}
        </p>
      </div>
    </div>
  );
}
