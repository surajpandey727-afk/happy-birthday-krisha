'use client';
import { motion } from 'framer-motion';

/** An "evidence card" reveal — clue text framed like a case-file annotation. */
export function PuzzleClue({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-xl border border-royal-vivid/40 bg-brown-deep/30 px-5 py-4"
    >
      <span className="absolute -top-2.5 left-4 bg-surface-alt px-2 font-nebulica text-[9px] uppercase tracking-[0.35em] text-royal-vivid">
        {label}
      </span>
      <p className="font-monigue text-lg italic leading-relaxed text-parchment">{children}</p>
    </motion.div>
  );
}
