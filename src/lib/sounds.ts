/** Tiny, machine-written, non-intrusive sound design using WebAudio. */

let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}
export function isSoundEnabled() {
  return enabled;
}

function ac(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Must be called from a user gesture to unlock audio on mobile. */
export function unlockAudio() {
  ac();
}

interface ToneOpts {
  freq: number;
  end?: number;
  type?: OscillatorType;
  gain?: number;
  dur?: number;
  attack?: number;
}

function tone(o: ToneOpts) {
  const c = ac();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  const now = c.currentTime;
  const peak = o.gain ?? 0.12;
  const dur = o.dur ?? 0.18;
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, now);
  if (o.end) osc.frequency.exponentialRampToValueAtTime(o.end, now + dur);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + (o.attack ?? 0.008));
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + dur + 0.02);
}

export const sound = {
  tap() {
    tone({ freq: 720, end: 500, type: "sine", gain: 0.06, dur: 0.08 });
  },
  select() {
    tone({ freq: 560, end: 880, type: "triangle", gain: 0.08, dur: 0.1 });
  },
  pour() {
    tone({ freq: 300, end: 140, type: "sine", gain: 0.05, dur: 0.3 });
  },
  connect() {
    tone({ freq: 440, end: 660, type: "sine", gain: 0.08, dur: 0.12 });
  },
  chain() {
    tone({ freq: 523, end: 784, type: "triangle", gain: 0.07, dur: 0.1 });
  },
  success() {
    tone({ freq: 523, type: "triangle", gain: 0.08, dur: 0.14 });
    setTimeout(() => tone({ freq: 784, type: "triangle", gain: 0.08, dur: 0.16 }), 110);
    setTimeout(() => tone({ freq: 1047, type: "triangle", gain: 0.08, dur: 0.22 }), 230);
  },
  error() {
    tone({ freq: 210, end: 160, type: "sine", gain: 0.05, dur: 0.16 });
  },
  pop() {
    tone({ freq: 990, end: 780, type: "sine", gain: 0.05, dur: 0.07 });
  },
};