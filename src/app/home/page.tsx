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
import { PHOTO_DB } from '@content/photos';
import { MediaFigure } from '@/components/media/MediaFigure';

/* ---------- tiny hand-drawn icons for the room objects ---------- */

function Icon({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (name) {
    case 'frame':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10">
          <rect x="8" y="8" width="32" height="30" rx="3" {...common} />
          <rect x="13" y="13" width="12" height="9" rx="1.5" fill="currentColor" opacity="0.35" stroke="none" />
          <path d="M16 38 L24 30 L32 38" {...common} />
        </svg>
      );
    case 'tv':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10">
          <rect x="6" y="10" width="36" height="24" rx="3" {...common} />
          <path d="M18 4 L24 10 L30 4" {...common} />
          <path d="M10 38 h28" {...common} />
        </svg>
      );
    case 'letter':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10">
          <rect x="6" y="10" width="36" height="28" rx="3" {...common} />
          <path d="M8 13 L24 27 L40 13" {...common} />
        </svg>
      );
    case 'play':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10">
          <rect x="10" y="6" width="28" height="34" rx="7" {...common} />
          <circle cx="18" cy="15" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="30" cy="15" r="2.4" fill="currentColor" stroke="none" />
          <path d="M18 22 l8 4 -8 4 z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'doodle':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10">
          <path d="M14 34 L18 20 L38 6 L42 10 L24 30 L20 38 z" {...common} />
          <path d="M18 20 L30 8" {...common} />
        </svg>
      );
    case 'jar':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10">
          <path d="M16 14 h16 v22 a8 8 0 0 1 -16 0 z" {...common} />
          <path d="M18 8 h12" {...common} />
          <path d="M20 22 q4 4 8 0 q-4 3 -8 0" fill="currentColor" opacity="0.4" stroke="none" />
        </svg>
      );
    case 'plant':
      return (
        <svg viewBox="0 0 48 48" className="h-10 w-10">
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

  useEffect(() => subscribeTotals(() => setPuzzles(totalPuzzles())), []);

  // Time-of-day and the random note are client-only (server has no "now" or
  // randomness to agree on), so they're picked post-mount to avoid a
  // hydration mismatch — the SSR/first-paint value is a fixed daytime default.
  const [sky, setSky] = useState('linear-gradient(180deg,#9b9be0,#e6e9f4 60%,#f6c4d6)');
  const [note, setNote] = useState<(typeof NOTES)[number]>(NOTES[0]);

  useEffect(() => {
    const hour = new Date().getHours();
    setSky(
      hour < 6
        ? 'linear-gradient(180deg,#1d1666,#3027a0 55%,#9b9be0)'
        : hour < 17
          ? 'linear-gradient(180deg,#9b9be0,#e6e9f4 60%,#f6c4d6)'
          : 'linear-gradient(180deg,#3027a0,#1d1666 60%,#5650c2)'
    );
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

  const polaroids = PHOTO_DB.slice(0, 3);

  return (
    <main className="safe-top min-h-dvh pb-32 safe-bottom">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: sky }} />
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(90% 60% at 50% 0%, rgba(255,255,255,0.22), transparent 60%)' }}
          animate={reduced ? undefined : { opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 10, repeat: Infinity }}
        />

        <div className="relative mx-auto max-w-3xl px-5 pt-10 sm:pt-14">
          <div className="relative rounded-3xl border-[6px] border-warm-white/80 bg-ultramarine-deep/20 shadow-card">
            {/* moon + secret door */}
            <div className="absolute right-4 top-3 z-10 flex flex-col items-center gap-1">
              <button
                aria-label="the moon"
                onClick={onMoonTap}
                className="tap-target group relative flex h-12 w-12 items-center justify-center"
              >
                <span className="absolute h-8 w-8 rounded-full bg-warm-white/90 shadow-[0_0_26px_6px_rgba(253,250,245,0.45)] transition-transform duration-300 group-hover:scale-110" />
                <span className="absolute right-1 top-0 h-6 w-6 rounded-full bg-ultramarine-deep/60" />
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
                    <p className="font-hand text-lg text-warm-white">a door appeared.</p>
                    <Link
                      href="/secret"
                      onClick={() => sound.select()}
                      className="rounded-2xl bg-flamingo px-5 py-2 font-hand text-xl text-warm-white shadow-soft hover:scale-105 transition-transform"
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
                className="text-[11px] uppercase tracking-[0.5em] text-warm-white/75"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.3 }}
              >
                our room
              </motion.p>
              <motion.h1
                className="mt-2 font-display text-5xl text-warm-white sm:text-6xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                {first ? 'come in.' : 'welcome back.'}
              </motion.h1>
              <motion.p
                className="mt-2 font-hand text-2xl text-pink-cloud"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.8 }}
              >
                {note.text}
              </motion.p>
            </div>
            {/* polaroid strip — a wall of us */}
            <motion.div
              className="flex justify-center gap-3 px-5 pb-6"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              {polaroids.map((ph, i) => (
                <Link
                  key={ph.src}
                  href="/us"
                  onClick={() => sound.tap()}
                  className={`w-24 rounded-md bg-warm-white p-1.5 pb-2 shadow-soft transition-transform hover:-translate-y-1.5 sm:w-28 ${i === 1 ? 'rotate-2' : i === 2 ? '-rotate-3' : '-rotate-1'}`}
                >
                  <div className="aspect-square overflow-hidden rounded-sm">
                    <MediaFigure media={ph} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1 text-center font-hand text-xs text-ink-soft">{ph.caption}</p>
                </Link>
              ))}
            </motion.div>
          </div>

          {/* shelf of objects */}
          <motion.div
            className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 1.1 } } }}
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
                  className="group flex w-full flex-col items-center gap-1.5 rounded-2xl bg-warm-white/85 px-2 py-4 text-ink shadow-soft ring-1 ring-pink-cloud/40 transition-all hover:-translate-y-1.5 hover:shadow-card"
                >
                  <span className="text-ultramarine transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon name={o.icon} />
                  </span>
                  <span className="font-hand text-lg leading-tight text-ink">{o.label}</span>
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
                  pushToast(`our little garden — ${puzzles} ${puzzles === 1 ? 'memory' : 'memories'} growing here.`)
                }
                className="group flex w-full flex-col items-center gap-1.5 rounded-2xl bg-warm-white/85 px-2 py-4 text-ink shadow-soft ring-1 ring-pink-cloud/40 transition-all hover:-translate-y-1.5 hover:shadow-card"
                aria-label="our growth plant"
              >
                <span className="text-ink-soft transition-transform duration-300 group-hover:scale-110">
                  <Icon name="plant" />
                </span>
                <span className="font-hand text-lg text-ink">our growth</span>
              </button>
            </motion.div>
          </motion.div>

          {/* a drifting little heart for texture */}
          <motion.div
            className="pointer-events-none relative mx-auto mt-8 h-2 w-2 rounded-full bg-flamingo/70"
            animate={
              reduced
                ? undefined
                : { x: [0, 40, -30, 20, 0], y: [0, -20, -34, -14, 0], opacity: [0.25, 0.7, 0.5, 0.8, 0.25] }
            }
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </main>
  );
}


