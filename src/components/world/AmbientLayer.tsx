// AmbientLayer — cheap DOM sparkle particles + perspective grid floor.
// Sits between the WorldCanvas and the HUD chrome. Pauses when tab hidden.

import { useEffect, useRef } from "react";

export default function AmbientLayer() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const mobile = window.innerWidth < 640;
    const COUNT = mobile ? 10 : 18;
    const parts: HTMLSpanElement[] = [];

    for (let i = 0; i < COUNT; i++) {
      const p = document.createElement("span");
      const size = 2 + Math.random() * 3;
      const violet = Math.random() > 0.4;
      p.style.cssText = `position:absolute;border-radius:9999px;pointer-events:none;
        width:${size}px;height:${size}px;
        left:${Math.random() * 100}%;
        top:${40 + Math.random() * 55}%;
        background:${violet ? "#8B5CF6" : "#4F8CFF"};
        box-shadow:0 0 ${4 + Math.random() * 6}px ${violet ? "rgba(139,92,246,0.8)" : "rgba(79,140,255,0.8)"};
        opacity:0;`;
      el.appendChild(p);
      parts.push(p);

      // Gentle rise + twinkle, staggered forever.
      const animate = () => {
        const dur = 7 + Math.random() * 8;
        const drift = (Math.random() - 0.5) * 60;
        const rise = -(40 + Math.random() * 50);
        p.animate(
          [
            { transform: "translate(0,0)", opacity: "0" },
            { transform: `translate(${drift * 0.2}px, ${rise * 0.25}px)`, opacity: "0.9", offset: 0.3 },
            { transform: `translate(${drift * 0.7}px, ${rise * 0.7}px)`, opacity: "0.9", offset: 0.7 },
            { transform: `translate(${drift}px, ${rise}px)`, opacity: "0" },
          ],
          { duration: dur * 1000, delay: Math.random() * 6000, iterations: Infinity, easing: "ease-in-out" }
        );
      };
      animate();
    }

    return () => {
      parts.forEach((p) => {
        p.getAnimations().forEach((a) => a.cancel());
        p.remove();
      });
    };
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Perspective grid floor */}
      <div
        className="absolute inset-x-0 bottom-0 h-[38%] opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          transform: "perspective(500px) rotateX(62deg)",
          transformOrigin: "top center",
          maskImage: "linear-gradient(to bottom, transparent, black 30%, transparent 95%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 30%, transparent 95%)",
        }}
      />
    </div>
  );
}
