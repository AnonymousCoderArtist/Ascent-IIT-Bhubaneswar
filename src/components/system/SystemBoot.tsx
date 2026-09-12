// SystemBoot — cinematic console boot when entering the System.
// Shows scanning lines, then a pulse reveal. Auto-advances or skip on click.

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SystemSigil } from "../ui/GameArt";

const LINES = [
  "AUTH TOKEN VERIFIED",
  "PLAYER PROFILE LOCATED",
  "ATTRIBUTE MATRIX SYNCED",
  "WORLD STATE RECONSTRUCTED",
  "SYSTEM ONLINE",
];

export default function SystemBoot({ onDone }: { onDone: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const t = setTimeout(onDone, 700);
      return () => clearTimeout(t);
    }

    const tl = gsap.timeline({ onComplete: () => finish() });
    const items = root.querySelectorAll<HTMLElement>("[data-boot-line]");
    items.forEach((item, i) => {
      tl.fromTo(item, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.22, ease: "power2.out" });
      if (i < items.length - 1) tl.to({}, { duration: 0.14 });
    });
    tl.to(root.querySelector("[data-boot-core]"), {
      scale: 1.15,
      opacity: 1,
      duration: 0.5,
      ease: "back.out(2.2)",
    });
    tl.to(root, { opacity: 0, duration: 0.45, delay: 0.25 });

    function finish() {
      setLeaving(true);
      onDone();
    }

    return () => {
      tl.kill();
    };
  }, [onDone]);

  return (
    <div
      ref={rootRef}
      onClick={onDone}
      className={`fixed inset-0 z-[95] grid cursor-pointer place-items-center bg-void transition-opacity ${leaving ? "opacity-0" : ""}`}
      role="status"
      aria-label="System booting"
    >
      <div className="w-full max-w-sm px-8">
        <div className="mx-auto mb-8 w-fit" data-boot-core style={{ opacity: 0 }}>
          <SystemSigil size={64} glow />
        </div>
        <ul className="space-y-1.5 font-mono text-[11px] tracking-[0.2em] text-violet/90">
          {LINES.map((l) => (
            <li key={l} data-boot-line style={{ opacity: 0 }}>
              <span className="text-mist/50">&gt;_</span> {l}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-[9px] tracking-[0.4em] text-mist/40">CLICK TO SKIP</p>
      </div>
    </div>
  );
}
