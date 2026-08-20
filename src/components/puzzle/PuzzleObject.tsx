'use client';
import { motion } from 'framer-motion';

/** A single interactive hotspot in a scene — "decorative" until you look
 * closer. `tell` is a barely-there visual cue (a hairline offset, a glow)
 * that only shows on hover/focus, so nothing is obviously clickable at a
 * glance — the whole point of the observation level. */
export function PuzzleObject({
  label,
  significant,
  state,
  onClick,
  children,
}: {
  label: string;
  significant?: boolean;
  state?: 'idle' | 'correct' | 'incorrect';
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={label}
      data-significant={significant ? 'true' : undefined}
      whileHover={{ scale: 1.04 }}
      whileFocus={{ scale: 1.04 }}
      className={`group relative flex aspect-square items-center justify-center rounded-2xl border p-4 text-center transition-colors ${
        state === 'correct'
          ? 'border-royal-vivid bg-royal-vivid/10'
          : state === 'incorrect'
            ? 'border-brown-warm bg-brown-deep/20'
            : 'border-brown-warm/30 bg-surface/60 hover:border-royal-vivid/40'
      }`}
    >
      <span className="text-4xl text-parchment/90 transition-transform duration-300 group-hover:scale-110">
        {children}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-royal-vivid/60 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
    </motion.button>
  );
}
