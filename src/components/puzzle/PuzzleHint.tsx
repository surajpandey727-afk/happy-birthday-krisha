'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { recordHint } from '@/lib/puzzleProgress';

/** Two-stage hint reveal. Hints are never the answer — they narrow the
 * search, never name it. Each reveal is recorded to progress state. */
export function PuzzleHint({ level, hints }: { level: number; hints: string[] }) {
  const [revealed, setRevealed] = useState(0);

  const revealNext = () => {
    if (revealed >= hints.length) return;
    recordHint(level, revealed);
    setRevealed((r) => r + 1);
  };

  return (
    <div className="mt-8 border-t border-brown-warm/30 pt-5">
      <AnimatePresence initial={false}>
        {hints.slice(0, revealed).map((hint, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-monigue mb-2 text-sm italic text-muted"
          >
            <span className="font-nebulica not-italic text-[9px] uppercase tracking-[0.3em] text-brown-warm">
              hint {i + 1} —{' '}
            </span>
            {hint}
          </motion.p>
        ))}
      </AnimatePresence>

      {revealed < hints.length && (
        <button
          onClick={revealNext}
          className="font-nebulica text-[10px] uppercase tracking-[0.3em] text-muted-dim underline decoration-dotted underline-offset-4 transition-colors hover:text-royal-vivid"
        >
          {revealed === 0 ? 'need a hint?' : 'another hint'}
        </button>
      )}
    </div>
  );
}
