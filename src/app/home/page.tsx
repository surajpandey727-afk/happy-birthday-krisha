'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { NOTES } from '@content/site';
import { useIsFirstVisit } from '@/hooks/useVisit';
import { usePrefersReducedMotion } from '@/hooks/useMedia';
import { fireEgg } from '@/lib/easterEggEngine';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';
import { totalPuzzles, subscribeTotals } from '@/lib/progress';
import { PHOTO_PREVIEW } from '@content/photos';
import { MediaFigure } from '@/components/media/MediaFigure';
import ParticleText from '@/components/reactbits/ParticleText';

/* ---------- tiny hand-drawn icons for the room objects ---------- */

function Icon({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'frame':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9">
          <rect x="8" y="8" width="32" height="30" rx="3" {...common} />
          <rect x="13" y="13" width="12" height="9" rx="1.5" fill="currentColor" opacity="0.35" stroke="none" />
          <path d="M16 38 L24 30 L32 38" {...common} />
        </svg>
      );
    case 'doodle':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9">
          <path d="M14 34 L18 20 L38 6 L42 10 L24 30 L20 38 z" {...common} />
          <path d="M18 20 L30 8" {...common} />
        </svg>
      );
    case 'case':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9">
          <rect x="6" y="16" width="36" height="24" rx="3" {...common} />
          <path d="M18 16 v-4 a2 2 0 0 1 2 -2 h8 a2 2 0 0 1 2 2 v4" {...common} />
          <path d="M6 26 h36" {...common} />
        </svg>
      );
    case 'jar':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9">
          <path d="M16 14 h16 v22 a8 8 0 0 1 -16 0 z" {...common} />
          <path d="M18 8 h12" {...common} />
          <path d="M20 22 q4 4 8 0 q-4 3 -8 0" fill="currentColor" opacity="0.4" stroke="none" />
        </svg>
      );
    case 'plant':
      return (
        <svg viewBox="0 0 48 48" className="h-9 w-9">
          <path d="M20 30 v8 h8 v-8" {...common} />
          <path d="M24 30 q0 -10 -10 -12 q8 2 10 12 z" {...common} />
          <path d="M24 28 q0 -10 10 -12 q-8 2 -10 12 z" {...common} />
        </svg>
      );
    default:
      return null;
  }
}

const OBJECTS = [
  { id: 'us', label: 'a wall of us', icon: 'frame', href: '/us' },
  { id: 'case', label: 'the case', icon: 'case', href: '/case' },
  { id: 'doodle', label: 'the notebook', icon: 'doodle', href: '/doodle' },
  { id: 'little', label: 'little things', icon: 'jar', href: '/little-things' },
] as const;

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
    const n = moonTaps + 1;
    setMoonTaps(n);
    if (n === 7) {
      const egg = fireEgg('taps');
      if (egg) pushToast(egg.message, egg.id);
      setSecretOpen(true);
      sound.success();
      haptics.success();
    } else if (n >= 3 && n % 3 === 0) {
      pushToast('curious, are we? . . .');
    }
  };

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

  const polaroids = PHOTO_PREVIEW.slice(0, 3);

  return (
    <main className="safe-top min-h-dvh pb-32 safe-bottom">
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 90% at 50% -10%, var(--color-royal-deep), transparent 60%), linear-gradient(180deg, var(--color-void), var(--color-base) 55%, var(--color-surface-alt))',
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
              <AnimatePresence>
                {secretOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <p className="font-monigue text-sm italic text-muted">a door appeared.</p>
                    <Link
                      href="/secret"
                      onClick={() => sound.select()}
                      className="rounded-2xl bg-royal-vivid px-5 py-2 font-nebulica text-[11px] uppercase tracking-[0.25em] text-parchment shadow-soft transition-transform hover:scale-105"
                    >
                      open the door →
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* header */}
            <div className="px-6 pb-4 pt-10 text-center">
              <motion.p
                className="font-nebulica text-[10px] uppercase tracking-[0.5em] text-royal-vivid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                our room
              </motion.p>
              <motion.div
                className="-mx-6 mt-1 h-20 sm:h-24"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <ParticleText
                  text={first ? 'come in.' : 'welcome back.'}
                  color="#efe4d0"
                  highlightColor="#28479e"
                  fontFamily="var(--font-apestron)"
                  fontWeight={700}
                  fontSize="clamp(2.4rem, 9vw, 3.8rem)"
                  particleSize={2}
                  density={3}
                  glow={false}
                  idleDrift={0.35}
                  className="!min-h-0"
                />
              </motion.div>
              <motion.p
                className="font-monigue mt-2 text-lg italic text-muted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.9 }}
              >
                {note.text}
              </motion.p>
            </div>
            {/* polaroid strip — a wall of us */}
            <motion.div
              className="flex justify-center gap-3 px-5 pb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {polaroids.map((ph, i) => (
                <Link
                  key={ph.src}
                  href="/us"
                  onClick={() => sound.tap()}
                  className={`w-24 rounded-md border border-brown-warm/40 bg-surface-alt p-1.5 pb-2 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)] transition-transform hover:-translate-y-1.5 sm:w-28 ${i === 1 ? 'rotate-2' : i === 2 ? '-rotate-3' : '-rotate-1'}`}
                >
                  <div className="aspect-square overflow-hidden rounded-sm">
                    <MediaFigure media={ph} variant="thumb" className="h-full w-full object-cover" />
                  </div>
                  <p className="font-monigue mt-1 text-center text-[11px] italic text-muted-dim">{ph.caption}</p>
                </Link>
              ))}
            </motion.div>
          </div>

          {/* shelf of objects */}
          <motion.div
            className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-5"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 1.3 } } }}
          >
            {OBJECTS.map((o) => (
              <motion.div
                key={o.id}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
                }}
              >
                <Link
                  href={o.href}
                  onClick={() => sound.tap()}
                  className="card-tactile card-tactile-lift group flex w-full flex-col items-center gap-1.5 px-2 py-4"
                >
                  <span className="text-royal-vivid transition-transform duration-300 group-hover:scale-110">
                    <Icon name={o.icon} />
                  </span>
                  <span className="font-magnode text-sm leading-tight text-parchment">{o.label}</span>
                </Link>
              </motion.div>
            ))}

            {/* plant — the growth object */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 18 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <button
                onClick={() =>
                  pushToast(`our little garden — ${puzzles} ${puzzles === 1 ? 'discovery' : 'discoveries'} growing here.`)
                }
                className="card-tactile card-tactile-lift group flex w-full flex-col items-center gap-1.5 px-2 py-4"
                aria-label="our growth plant"
              >
                <span className="text-muted transition-transform duration-300 group-hover:scale-110">
                  <Icon name="plant" />
                </span>
                <span className="font-magnode text-sm text-parchment">our growth</span>
              </button>
            </motion.div>
          </motion.div>

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
