'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WorldShell } from '@/components/world/WorldShell';
import { LETTER_DB } from '@content/letters';
import { totalPuzzles, subscribeTotals } from '@/games/framework/progress';
import { sound } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';
import type { Letter } from '@/lib/types';

export default function LettersPage() {
  const [puzzles, setPuzzles] = useState(0);
  const [open, setOpen] = useState<Letter | null>(null);
  const [stage, setStage] = useState<'envelope' | 'paper' | 'text'>('envelope');

  useEffect(() => subscribeTotals(() => setPuzzles(totalPuzzles())), []);

  const unlocked = (l: Letter) => (l.requiresProgress ?? 0) <= puzzles;

  const openLetter = (l: Letter) => {
    sound.select();
    haptics.tap();
    setOpen(l);
    setStage('envelope');
    window.setTimeout(() => setStage('paper'), 650);
    window.setTimeout(() => setStage('text'), 1300);
  };

  const letters = LETTER_DB.filter((l) => !l.hidden).sort(
    (a, b) => (a.requiresProgress ?? 0) - (b.requiresProgress ?? 0)
  );
  const whispers = LETTER_DB.filter((l) => l.hidden);

  return (
    <WorldShell kicker="open when…" title="letters" blurb="some words keep for the right moment.">
      <div className="grid gap-3 sm:grid-cols-2">
        {letters.map((l, i) => {
          const ok = unlocked(l);
          return (
            <motion.button
              key={l.id}
              onClick={() => ok && openLetter(l)}
              disabled={!ok}
              className="group rounded-3xl bg-warm-white p-5 text-left shadow-soft ring-1 ring-pink-cloud/30 transition-all enabled:hover:-translate-y-1 enabled:hover:shadow-card disabled:opacity-55"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`text-xl ${ok ? 'text-flamingo' : 'text-pink-cloud'}`}>
                  {ok ? '✉' : '🔒'}
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-ink-soft">{l.date}</span>
              </div>
              <h2 className="font-display text-2xl text-ink">{l.heading}</h2>
              {!ok ? (
                <p className="mt-2 font-hand text-lg text-ink-soft">
                  {l.requiresProgress} little puzzles, and this one opens.
                </p>
              ) : (
                <p className="mt-2 font-hand text-lg text-ink-soft">tap to unfold</p>
              )}
            </motion.button>
          );
        })}
      </div>

      {whispers.map((l) => (
        <button
          key={l.id}
          onClick={() => openLetter(l)}
          className="mt-8 block w-full rounded-2xl border border-dashed border-pink-cloud bg-pink-wash/40 px-4 py-4 text-center font-hand text-xl text-ink-soft hover:border-flamingo"
        >
          {l.heading} . . .
        </button>
      ))}

      {/* letter reveal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[95] flex items-center justify-center bg-ultramarine-deep/80 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <motion.div
              className="relative flex h-[70dvh] w-full max-w-md items-center justify-center"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute h-48 w-72 rounded-2xl bg-pink-cloud/80 shadow-card">
                <motion.div
                  className="absolute left-0 top-0 h-0 w-0 origin-top border-l-[144px] border-r-[144px] border-t-[70px] border-l-transparent border-r-transparent border-t-pink-wash"
                  animate={{ rotateX: stage === 'envelope' ? 0 : 180 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformStyle: 'preserve-3d' }}
                />
                <span className="absolute inset-0 flex items-center justify-center font-hand text-2xl text-ink/80">
                  {open.heading}
                </span>
              </div>

              <motion.div
                className="absolute h-[58dvh] w-[92%] max-w-sm overflow-y-auto rounded-2xl bg-warm-white p-6 shadow-card paper"
                animate={stage === 'envelope' ? { y: 0, opacity: 0.4 } : { y: 158, opacity: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: stage === 'text' ? 1 : 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  {open.greeting && (
                    <p className="font-hand text-2xl text-flamingo">{open.greeting}</p>
                  )}
                  <p className="mt-4 whitespace-pre-line font-display text-xl leading-relaxed text-ink">
                    {open.body}
                  </p>
                  <p className="mt-6 text-right font-hand text-2xl text-ink-soft">
                    — {open.signature}
                  </p>
                  <p className="mt-2 text-center text-[10px] uppercase tracking-[0.3em] text-pink-cloud">
                    i ❤ kripi
                  </p>
                </motion.div>
              </motion.div>

              <button
                onClick={() => setOpen(null)}
                className="tap-target absolute -bottom-10 right-0 rounded-full glass text-ink"
                aria-label="close letter"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </WorldShell>
  );
}
