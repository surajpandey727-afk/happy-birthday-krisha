'use client';
import { useMemo, useState } from 'react';
import { PuzzleClue } from '../PuzzleClue';
import { PuzzleHint } from '../PuzzleHint';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';

const WORD = 'STILL';
const ANOMALY = 'ST1LL';
const GRID_SIZE = 9;
const ANOMALY_INDEX = 5;

export function Level2Pattern({ onComplete }: { onComplete: () => void }) {
  const [solved, setSolved] = useState(false);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);

  const cells = useMemo(
    () => Array.from({ length: GRID_SIZE }, (_, i) => (i === ANOMALY_INDEX ? ANOMALY : WORD)),
    []
  );

  const select = (i: number) => {
    if (solved) return;
    if (i === ANOMALY_INDEX) {
      sound.success();
      setSolved(true);
      window.setTimeout(onComplete, 1400);
    } else {
      sound.error();
      setWrongIndex(i);
      pushToast('read it again.');
      window.setTimeout(() => setWrongIndex(null), 500);
    }
  };

  return (
    <div>
      <p className="font-monigue max-w-md text-sm italic text-muted">
        Nine words. Eight of them are the same word. Find the one that isn't.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
        {cells.map((word, i) => (
          <button
            key={i}
            onClick={() => select(i)}
            aria-label={`word ${i + 1}`}
            className={`font-magnode rounded-xl border py-6 text-lg tracking-[0.15em] transition-colors sm:text-xl ${
              solved && i === ANOMALY_INDEX
                ? 'border-royal-vivid bg-royal-vivid/10 text-royal-vivid'
                : wrongIndex === i
                  ? 'border-brown-warm bg-brown-deep/20 text-muted'
                  : 'border-brown-warm/30 bg-surface/60 text-parchment hover:border-royal-vivid/40'
            }`}
          >
            {word}
          </button>
        ))}
      </div>

      {solved ? (
        <div className="mt-6">
          <PuzzleClue label="noticed">Some things get carried without a sound.</PuzzleClue>
        </div>
      ) : (
        <PuzzleHint
          level={2}
          hints={[
            'You’re reading it as a word. Read it as a shape instead.',
            'One letter isn’t a letter at all — count from the top-left, third row, second column.',
          ]}
        />
      )}
    </div>
  );
}
