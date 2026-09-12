// Stub WorldCanvas — full Three.js particle field lands on the frontend branch.
// Renders a lightweight CSS starfield fallback for now; never blocks the UI.
import { useEffect, useRef } from "react";

export default function WorldCanvas({ density = 40 }: { density?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    for (let i = 0; i < density; i++) {
      const star = document.createElement("div");
      star.className = "absolute rounded-full bg-violet/60";
      const size = Math.random() * 2 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.opacity = `${Math.random() * 0.5 + 0.2}`;
      star.style.animation = `float ${6 + Math.random() * 8}s ease-in-out ${Math.random() * 4}s infinite`;
      el.appendChild(star);
    }
  }, [density]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    />
  );
}
