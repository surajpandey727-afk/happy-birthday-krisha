'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { PuzzleProgress } from './PuzzleProgress';

/** Detective-archive chrome shared by every level: a dark, faintly gridded
 * "case board" surface with a level kicker/title and the progress rail. */
export function PuzzleShell({
  levelIndex,
  totalLevels,
  completed,
  kicker,
  title,
  children,
}: {
  levelIndex: number;
  totalLevels: number;
  completed: number[];
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-brown-warm/40 bg-[linear-gradient(160deg,var(--color-surface-alt),var(--color-void)_75%)] px-5 py-8 sm:px-10 sm:py-12"
      style={{
        backgroundImage:
          'linear-gradient(160deg, var(--color-surface-alt), var(--color-void) 75%), repeating-linear-gradient(0deg, rgba(40,71,158,0.06) 0px, rgba(40,71,158,0.06) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(40,71,158,0.06) 0px, rgba(40,71,158,0.06) 1px, transparent 1px, transparent 32px)',
      }}
    >
      <PuzzleProgress totalLevels={totalLevels} currentLevel={levelIndex} completed={completed} />

      <motion.div
        key={levelIndex}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8"
      >
        <p className="font-nebulica text-[10px] uppercase tracking-[0.5em] text-royal-vivid">{kicker}</p>
        <h2 className="mt-2 font-magnode text-3xl text-parchment sm:text-4xl">{title}</h2>
        <div className="mt-8">{children}</div>
      </motion.div>
    </div>
  );
}
