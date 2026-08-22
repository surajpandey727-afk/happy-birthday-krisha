'use client';
import { useEffect, useRef, useState } from 'react';
import { sound } from '@/lib/sounds';

const LINES = [
  "You've been looking for something new.",
  "It's been with you before.",
  'It has crossed countries with you and asked for nothing.',
  "You've seen it without seeing it, every single day.",
  'One last observation, detective.',
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
      {/* Two independent conditionals, not one ternary: the reveal must
       * render the instant `revealed` flips true, never held hostage by an
       * outgoing line's exit animation. And neither half uses
       * framer-motion — this is the entire point of the puzzle, so its
       * visibility can't be allowed to depend on an animate step that has,
       * in practice, sometimes just not run. Plain @keyframes (keyed per
       * lineIndex so the fade-in genuinely replays each line) instead. */}
      {!revealed && (
        <p
          key={lineIndex}
          className="fade-in-up font-monigue max-w-md text-xl italic text-parchment"
        >
          {LINES[Math.min(lineIndex, LINES.length - 1)]}
        </p>
      )}

      {revealed && (
        <div className="clue-in">
          <p className="font-nebulica text-[10px] uppercase tracking-[0.5em] text-royal-vivid">the case is closed</p>
          <p className="font-apestron mt-4 text-3xl leading-tight text-parchment sm:text-4xl">
            Look beside the television.
          </p>
          <p className="font-monigue mt-4 max-w-sm text-sm italic text-muted">
            It's been waiting there this whole time, patient as I am impatient for you to find it. Go on then.
          </p>
        </div>
      )}
    </div>
  );
}
