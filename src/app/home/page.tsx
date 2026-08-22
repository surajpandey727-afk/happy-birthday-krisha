'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { NOTES } from '@content/site';
import { useIsFirstVisit } from '@/hooks/useVisit';
import { usePrefersReducedMotion } from '@/hooks/useMedia';
import { fireEgg } from '@/lib/easterEggEngine';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';
import { totalPuzzles, subscribeTotals } from '@/lib/progress';
import ParticleText from '@/components/reactbits/ParticleText';

function PlantIcon() {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 48 48" className="h-9 w-9">
      <path d="M20 30 v8 h8 v-8" {...common} />
      <path d="M24 30 q0 -10 -10 -12 q8 2 10 12 z" {...common} />
      <path d="M24 28 q0 -10 10 -12 q-8 2 -10 12 z" {...common} />
    </svg>
  );
}

/** Our room — not a table of contents (the sidebar already covers
 * navigation), just the quiet space this world opens from: the moon that
 * hides the secret door, a little growth counter, and a note. */
export default function HomeWorld() {
  const first = useIsFirstVisit();
  const reduced = usePrefersReducedMotion();
  const [moonTaps, setMoonTaps] = useState(0);
  const [secretOpen, setSecretOpen] = useState(false);
  const [puzzles, setPuzzles] = useState(0);
  const [eggSeen, setEggSeen] = useState(false);
  const [note, setNote] = useState<(typeof NOTES)[number]>(NOTES[0]);

  useEffect(() => subscribeTotals(() => setPuzzles(totalPuzzles())), []);

  // Random note is client-only (no "randomness" a server can agree with a
  // client on), so it's picked post-mount to avoid a hydration mismatch.
  useEffect(() => {
    setNote(NOTES[Math.floor(Math.random() * NOTES.length)]);
  }, []);

  const onMoonTap = () => {
    sound.tap();
    haptics.tap();
    setMoonTaps((prev) => prev + 1);
  };

  // Side effects react to the committed tap count rather than living inline
  // in the click handler — rapid taps (very plausible on a moon someone's
  // excitedly tapping) can fire before a re-render lands, and computing the
  // new count from the `moonTaps` closure would undercount every tap in
  // that window. Same fix as /secret's constellation counter.
  useEffect(() => {
    if (moonTaps === 7 && !secretOpen) {
      const egg = fireEgg('taps');
      if (egg) pushToast(egg.message, egg.id);
      setSecretOpen(true);
      sound.success();
      haptics.success();
    } else if (moonTaps >= 3 && moonTaps % 3 === 0) {
      pushToast('curious, are we? . . .');
    }
  }, [moonTaps, secretOpen]);

  // rare idle egg: a secret whispered while the room is quiet
  useEffect(() => {
    if (eggSeen) return;
    const t = window.setTimeout(() => {
      const egg = fireEgg('rare');
      if (egg) {
        pushToast(egg.message, egg.id);
        setEggSeen(true);
      }
    }, 26000);
    return () => window.clearTimeout(t);
  }, [eggSeen]);

  return (
    <main className="safe-top min-h-dvh pb-32 safe-bottom">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 50% -10%, color-mix(in srgb, var(--color-royal-deep) 60%, transparent), transparent 60%), linear-gradient(180deg, color-mix(in srgb, var(--color-void) 65%, transparent), color-mix(in srgb, var(--color-base) 60%, transparent) 55%, color-mix(in srgb, var(--color-surface-alt) 65%, transparent))',
          }}
        />
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(70% 50% at 50% 0%, color-mix(in srgb, var(--color-royal-vivid) 22%, transparent), transparent 65%)' }}
          animate={reduced ? undefined : { opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative mx-auto max-w-3xl px-5 pt-10 sm:pt-14">
          <div className="card-tactile relative overflow-hidden">
            {/* moon + secret door */}
            <div className="absolute right-4 top-3 z-10 flex flex-col items-center gap-1">
              <button
                aria-label="the moon"
                onClick={onMoonTap}
                className="tap-target group relative flex h-12 w-12 items-center justify-center"
              >
                <span className="absolute h-8 w-8 rounded-full bg-parchment/90 shadow-[0_0_26px_6px_rgba(239,228,208,0.35)] transition-transform duration-300 group-hover:scale-110" />
                <span className="absolute right-1 top-0 h-6 w-6 rounded-full bg-void/70" />
              </button>
              {/* the moon-tap discovery path into the secret door — an
                  alternate route to the same unlock as finding /secret
                  directly, so it can't risk sitting invisible either. */}
              {secretOpen && (
                <div className="pop-in flex flex-col items-center gap-1">
                  <p className="font-monigue text-sm italic text-muted">a door appeared.</p>
                  <Link
                    href="/secret"
                    onClick={() => sound.select()}
                    className="rounded-2xl bg-royal-vivid px-5 py-2 font-nebulica text-[11px] uppercase tracking-[0.25em] text-parchment shadow-soft transition-transform hover:scale-105"
                  >
                    open the door →
                  </Link>
                </div>
              )}
            </div>

            {/* header — "our room" is the headline now, not a small label
                above a differently-worded greeting */}
            <div className="px-6 pb-6 pt-10 text-center">
              <div className="fade-in-up -mx-6 h-24 sm:h-32" style={{ '--fade-delay': '0.2s' } as CSSProperties}>
                <ParticleText
                  text="our room"
                  color="#efe4d0"
                  highlightColor="#28479e"
                  fontFamily="var(--font-apestron)"
                  fontWeight={700}
                  fontSize="clamp(2.6rem, 10vw, 5rem)"
                  particleSize={2}
                  density={3.4}
                  glow={false}
                  idleDrift={0.35}
                  className="!min-h-0"
                />
              </div>
              <p
                className="fade-in font-nebulica mt-1 text-[10px] uppercase tracking-[0.5em] text-royal-vivid"
                style={{ '--fade-delay': '0.7s' } as CSSProperties}
              >
                {first ? 'come in.' : 'welcome back.'}
              </p>
              <p
                className="fade-in font-monigue mt-3 text-lg italic text-muted"
                style={{ '--fade-delay': '0.9s' } as CSSProperties}
              >
                {note.text}
              </p>
            </div>

            {/* our growth — the puzzle-progress plant, the one interactive
                object worth keeping here now that the link shelf is gone */}
            <div className="fade-in-up flex justify-center pb-6" style={{ '--fade-delay': '1.1s' } as CSSProperties}>
              <button
                onClick={() =>
                  pushToast(`our little garden: ${puzzles} ${puzzles === 1 ? 'discovery' : 'discoveries'} growing here.`)
                }
                className="group flex flex-col items-center gap-1.5 rounded-2xl px-5 py-3 transition-colors hover:bg-royal-vivid/10"
                aria-label="our growth plant"
              >
                <span className="text-muted transition-transform duration-300 group-hover:scale-110">
                  <PlantIcon />
                </span>
                <span className="font-magnode text-sm text-parchment">our growth</span>
              </button>
            </div>
          </div>

          {/* a drifting mote for texture */}
          <motion.div
            className="pointer-events-none relative mx-auto mt-8 h-1.5 w-1.5 rounded-full bg-royal-vivid/70"
            animate={
              reduced
                ? undefined
                : { x: [0, 40, -30, 20, 0], y: [0, -20, -34, -14, 0], opacity: [0.2, 0.6, 0.4, 0.7, 0.2] }
            }
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </main>
  );
}
