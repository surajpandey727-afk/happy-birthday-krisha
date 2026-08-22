'use client';
import { useState } from 'react';
import { recordHint } from '@/lib/puzzleProgress';

/** Two-stage hint reveal. Hints are never the answer — they narrow the
 * search, never name it. Each reveal is recorded to progress state. Plain
 * CSS @keyframes (`.fade-in-up`), not framer-motion/AnimatePresence — a
 * hint that doesn't visibly appear after clicking "need a hint?" reads as
 * a broken button, right when someone's stuck and needs it most. */
export function PuzzleHint({ level, hints }: { level: number; hints: string[] }) {
  const [revealed, setRevealed] = useState(0);

  const revealNext = () => {
    if (revealed >= hints.length) return;
    recordHint(level, revealed);
    setRevealed((r) => r + 1);
  };

  return (
    <div className="mt-8 border-t border-brown-warm/30 pt-5">
      {hints.slice(0, revealed).map((hint, i) => (
        <p key={i} className="fade-in-up mb-2 font-monigue text-sm italic text-muted">
          <span className="font-nebulica not-italic text-[9px] uppercase tracking-[0.3em] text-brown-warm">
            hint {i + 1}:{' '}
          </span>
          {hint}
        </p>
      ))}

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
