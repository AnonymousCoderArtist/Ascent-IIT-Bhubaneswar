// SFX — procedural WebAudio sound design. No audio assets; everything is
// synthesized. Muted by default until the user's first interaction unlocks
// AudioContext (browser policy). Respects a persisted mute toggle.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = localStorage.getItem("ascent:sfx-muted") === "0" ? false : true;

function ensureCtx(): boolean {
  if (muted) return false;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.16;
      master.connect(ctx.destination);
    } catch {
      return false;
    }
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return true;
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMute(): boolean {
  muted = !muted;
  localStorage.setItem("ascent:sfx-muted", muted ? "1" : "0");
  if (!muted) {
    ensureCtx();
    uiTick(); // confirmation blip
  }
  return muted;
}

interface ToneOpts {
  freq: number;
  dur?: number;
  type?: OscillatorType;
  at?: number; // seconds from now
  slideTo?: number;
  vol?: number;
}

function tone({ freq, dur = 0.15, type = "sine", at = 0, slideTo, vol = 1 }: ToneOpts): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  }
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// Small UI feedback blips.
export function uiTick(): void {
  if (!ensureCtx()) return;
  tone({ freq: 880, dur: 0.06, type: "triangle", vol: 0.5 });
}

export function uiOpen(): void {
  if (!ensureCtx()) return;
  tone({ freq: 520, slideTo: 780, dur: 0.12, type: "sine", vol: 0.6 });
}

export function uiClose(): void {
  if (!ensureCtx()) return;
  tone({ freq: 780, slideTo: 420, dur: 0.12, type: "sine", vol: 0.5 });
}

// Quest registered: two quick ascending blips.
export function questRegistered(): void {
  if (!ensureCtx()) return;
  tone({ freq: 660, dur: 0.09, type: "triangle", vol: 0.7 });
  tone({ freq: 990, dur: 0.12, type: "triangle", at: 0.1, vol: 0.7 });
}

// Quest cleared: bright major chime.
export function questCleared(): void {
  if (!ensureCtx()) return;
  tone({ freq: 523.25, dur: 0.35, type: "sine", vol: 0.9 }); // C5
  tone({ freq: 659.25, dur: 0.35, type: "sine", at: 0.07, vol: 0.9 }); // E5
  tone({ freq: 783.99, dur: 0.5, type: "sine", at: 0.14, vol: 0.9 }); // G5
  tone({ freq: 1046.5, dur: 0.6, type: "sine", at: 0.21, vol: 0.7 }); // C6
}

// Level up: rising arpeggio fanfare.
export function levelUp(): void {
  if (!ensureCtx()) return;
  const seq = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
  seq.forEach((f, i) => {
    tone({ freq: f, dur: 0.28, type: "triangle", at: i * 0.09, vol: 0.85 });
  });
  tone({ freq: 1567.98, dur: 0.9, type: "sine", at: seq.length * 0.09, vol: 0.5 }); // G6 sparkle
}

// Evolution: deep swell + shimmering fifth.
export function evolution(): void {
  if (!ensureCtx()) return;
  tone({ freq: 130.81, dur: 1.4, type: "sawtooth", vol: 0.35 }); // C3 swell
  tone({ freq: 196.0, dur: 1.4, type: "sine", at: 0.05, vol: 0.5 }); // G3
  tone({ freq: 523.25, dur: 1.0, type: "sine", at: 0.3, vol: 0.5 });
  tone({ freq: 783.99, dur: 1.2, type: "sine", at: 0.45, vol: 0.45 });
  tone({ freq: 1567.98, dur: 1.0, type: "sine", at: 0.7, vol: 0.3 });
}

// Error / fault: low dissonant buzz.
export function fault(): void {
  if (!ensureCtx()) return;
  tone({ freq: 220, dur: 0.2, type: "square", vol: 0.35 });
  tone({ freq: 233, dur: 0.2, type: "square", at: 0.02, vol: 0.35 });
}

// Boot line blip.
export function bootBlip(): void {
  if (!ensureCtx()) return;
  tone({ freq: 1200, dur: 0.04, type: "square", vol: 0.25 });
}
