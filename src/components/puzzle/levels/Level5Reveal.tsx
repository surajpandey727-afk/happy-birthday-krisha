'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sound } from '@/lib/sounds';

const LINES = [
  "You've been looking for something new.",
  "It's been with you before.",
  'It has crossed countries.',
  "You've seen it without seeing it.",
  'One last observation.',
];

export function Level5Reveal({ onComplete, alreadySolved = false }: { onComplete: () => void; alreadySolved?: boolean }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [revealed, setRevealed] = useState(alreadySolved);

  // onComplete is a fresh closure every render of the parent — depending on
  // it directly would clear + reschedule this chain's pending timer on any
  // unrelated parent re-render. Route it through a ref so the effect only
  // ever re-runs because lineIndex actually changed.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    if (alreadySolved) return;
    if (lineIndex >= LINES.length) {
      const t = window.setTimeout(() => {
        sound.success();
        setRevealed(true);
        onCompleteRef.current();
      }, 900);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setLineIndex((i) => i + 1), 1900);
    return () => window.clearTimeout(t);
  }, [lineIndex, alreadySolved]);

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
      {/* Two independent conditionals, not one AnimatePresence ternary: the
       * reveal must render the instant `revealed` flips true, never held
       * hostage by whether the outgoing line's exit animation actually
       * finishes (framer-motion's exit tracking runs on rAF, which stalls
       * indefinitely in a backgrounded tab — mode="wait" would leave the
       * reveal stuck behind a transition that never gets to complete). */}
      {!revealed && (
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="font-monigue max-w-md text-xl italic text-parchment"
          >
            {LINES[Math.min(lineIndex, LINES.length - 1)]}
          </motion.p>
        </AnimatePresence>
      )}

      {revealed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-nebulica text-[10px] uppercase tracking-[0.5em] text-royal-vivid">the case is closed</p>
          <p className="font-apestron mt-4 text-3xl leading-tight text-parchment sm:text-4xl">
            Look beside the television.
          </p>
          <p className="font-monigue mt-4 max-w-sm text-sm italic text-muted">
            The case has been waiting there the whole time. Go and open it.
          </p>
        </motion.div>
      )}
    </div>
  );
}
