// GSAP game-feel animations: boot sequence, text scramble, count-up, shake.
// Framer Motion handles layout transitions; these are the "juice" layer.

import { useEffect, useRef } from "react";
import type React from "react";
import gsap from "gsap";

export function usePrefersReducedMotion(): boolean {
  const ref = useRef(false);
  useEffect(() => {
    ref.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  return ref.current;
}

// Scramble random glyphs -> resolve to target text.
const GLYPHS = "ABCDEFGHIKLMNOPRSTUVXYZ<>[]{}#%*+=/\\0123456789";

export function scrambleText(el: HTMLElement, text: string, duration = 0.9): gsap.core.Tween {
  const chars: string[] = text.split("");
  const proxy: { p: number } = { p: 0 };
  return gsap.to(proxy, {
    p: chars.length,
    duration,
    ease: "power2.out",
    onUpdate() {
      const progress = Math.floor(proxy.p);
      el.textContent =
        chars.slice(0, progress).join("") +
        chars
          .slice(progress)
          .map(() => GLYPHS[Math.floor(Math.random() * GLYPHS.length)])
          .join("");
    },
    onComplete() {
      el.textContent = text;
    },
  });
}

// Hook: scramble text on mount (used for [SYSTEM] headers).
export function useScrambleIn(text: string, delay = 0): React.RefObject<HTMLHeadingElement> {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = text;
      return;
    }
    const tween = scrambleText(el, text);
    tween.delay(delay);
    return () => {
      tween.kill();
    };
  }, [text, delay]);
  return ref;
}

// Number count-up: animates innerText from 0 (or from) to the target value.
export function countUp(
  el: HTMLElement,
  target: number,
  opts: { from?: number; duration?: number; prefix?: string; suffix?: string; decimals?: number } = {}
): gsap.core.Tween {
  const { from = 0, duration = 1.1, prefix = "", suffix = "", decimals = 0 } = opts;
  const proxy = { v: from };
  const fmt = (n: number) =>
    prefix +
    n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) +
    suffix;
  return gsap.to(proxy, {
    v: target,
    duration,
    ease: "power3.out",
    onUpdate: () => {
      el.textContent = fmt(proxy.v);
    },
    onComplete: () => {
      el.textContent = fmt(target);
    },
  });
}

// Camera-shake style impact (used on quest clear / level up).
export function shake(el: HTMLElement, strength = 6): gsap.core.Timeline {
  return gsap
    .timeline()
    .to(el, { x: -strength * 0.4, duration: 0.05, ease: "none" })
    .to(el, { x: strength * 0.6, y: strength * 0.3, duration: 0.06, ease: "none" })
    .to(el, { x: -strength * 0.5, y: -strength * 0.2, duration: 0.06, ease: "none" })
    .to(el, { x: strength * 0.3, y: strength * 0.15, duration: 0.05, ease: "none" })
    .to(el, { x: 0, y: 0, duration: 0.12, ease: "power2.out" });
}

// System boot sequence helper: animates all [data-boot-line] elements in order.
export function bootSequence(
  opts: { onDone?: () => void; lineDelay?: number } = {}
): gsap.core.Timeline | null {
  const { onDone, lineDelay = 0.14 } = opts;
  const items = document.querySelectorAll<HTMLElement>("[data-boot-line]");
  if (items.length === 0) return null;
  const tl = gsap.timeline({ onComplete: onDone });
  items.forEach((item, i) => {
    tl.fromTo(item, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.22, ease: "power2.out" });
    if (i < items.length - 1) tl.to({}, { duration: lineDelay });
  });
  return tl;
}

// Slow ambient float loop (aura, sigil).
export function floatLoop(el: HTMLElement, amp = 8, dur = 3): gsap.core.Tween {
  return gsap.to(el, {
    y: `+=${amp}`,
    duration: dur,
    yoyo: true,
    repeat: -1,
    ease: "sine.inOut",
  });
}

// Radial burst of shards from center (level-up halo accents).
export function radialBurst(container: HTMLElement, count = 12): void {
  const rect = container.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  for (let i = 0; i < count; i++) {
    const shard = document.createElement("div");
    const angle = (i / count) * Math.PI * 2;
    const dist = 90 + Math.random() * 120;
    shard.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:3px;height:10px;background:linear-gradient(180deg,#8B5CF6,transparent);border-radius:2px;pointer-events:none;`;
    container.appendChild(shard);
    gsap.fromTo(
      shard,
      { x: 0, y: 0, opacity: 1, rotation: (angle * 180) / Math.PI },
      {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        opacity: 0,
        duration: 0.8 + Math.random() * 0.4,
        ease: "power3.out",
        onComplete: () => shard.remove(),
      }
    );
  }
}
