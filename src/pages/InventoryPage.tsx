// Inventory — owned items, loadout, and unlockable character/world milestones.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkle, Shirt, Sword, Award, Package, ArrowLeft } from "lucide-react";
import { listInventory, listCatalog, type CatalogItem } from "../services/api";
import { catalogFor } from "../lib/catalog";
import { characterAssetForLevel } from "../lib/milestones";
import { useGameStore } from "../hooks/useGameStore";
import SystemMenu from "../components/system/SystemMenu";
import type { InventoryItem } from "../types/contract";

const TYPE_ICONS: Record<string, typeof Package> = {
  aura: Sparkle,
  outfit: Shirt,
  weapon: Sword,
  title: Award,
  world: Package,
};

export default function InventoryPage() {
  const navigate = useNavigate();
  const { profile } = useGameStore();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [store, setStore] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listInventory(), listCatalog()])
      .then(([inv, cat]) => {
        setItems(inv);
        setStore(cat);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ownedKeys = new Set(items.map((i) => i.itemKey));
  const level = profile?.level ?? 1;
  // Level-unlocked free items only — the essence store is cut for the MVP
  // (no backend purchase endpoint yet).
  const unlocked = store.filter((c) => !ownedKeys.has(c.key) && level >= c.unlocksAtLevel && c.essenceCost === 0);

  return (
    <div className="relative min-h-screen bg-void">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.08),transparent_55%)]" />
      <SystemMenu />

      <main className="relative mx-auto max-w-4xl px-4 pb-16 pt-24">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-mist transition-colors hover:text-ivory"
        >
          <ArrowLeft size={14} aria-hidden="true" /> System
        </button>

        <div className="mt-4 flex flex-col items-start gap-6 md:flex-row md:items-center">
          <div className="hud-frame hud-panel rounded-sm p-6 md:w-56">
            <p className="font-display text-[10px] tracking-[0.35em] text-violet">CHARACTER</p>
            <img
              src={characterAssetForLevel(level)}
              alt="Your current character"
              className="mx-auto mt-3 max-h-44 object-contain drop-shadow-[0_0_24px_rgba(139,92,246,0.35)]"
            />
            <p className="mt-3 text-center font-display text-sm tracking-widest text-ivory">
              {(profile?.displayName ?? "PLAYER").toUpperCase()}
            </p>
            <p className="text-center text-[10px] tracking-widest text-mist">
              LV.{String(level).padStart(2, "0")} · {profile?.essence ?? 0} ESSENCE
            </p>
          </div>

          <div className="flex-1">
            <h1 className="font-display text-2xl tracking-[0.15em] text-ivory">INVENTORY</h1>
            {loading ? (
              <p className="mt-4 text-sm text-mist animate-pulse-slow">SCANNING...</p>
            ) : (
              <>
                <section aria-label="Owned items" className="mt-5">
                  <h2 className="font-display text-[10px] tracking-[0.35em] text-violet">OWNED</h2>
                  {items.length === 0 ? (
                    <p className="mt-2 text-sm text-mist">Empty. Earn Essence by clearing quests.</p>
                  ) : (
                    <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {items.map((item) => {
                        const meta = catalogFor(item.itemKey);
                        const Icon = TYPE_ICONS[meta.type] ?? Package;
                        return (
                          <motion.li
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="hud-panel rounded-sm p-3"
                          >
                            <Icon size={18} className="text-violet" aria-hidden="true" />
                            <p className="mt-2 truncate text-xs font-semibold text-ivory">{meta.name}</p>
                            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-mist">{meta.desc}</p>
                            <p className="mt-2 text-[9px] uppercase tracking-widest text-essence">
                              {item.equipped ? "EQUIPPED" : "OWNED"}
                            </p>
                          </motion.li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                {unlocked.length > 0 && (
                  <section aria-label="Unlocked rewards" className="mt-6">
                    <h2 className="font-display text-[10px] tracking-[0.35em] text-arc">RECENT UNLOCKS</h2>
                    <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {unlocked.map((c) => {
                        const Icon = TYPE_ICONS[c.itemType] ?? Package;
                        return (
                          <li key={c.key} className="rounded-sm border border-arc/25 bg-arc/5 p-3">
                            <Icon size={18} className="text-arc" aria-hidden="true" />
                            <p className="mt-2 truncate text-xs font-semibold text-ivory">{c.name}</p>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
