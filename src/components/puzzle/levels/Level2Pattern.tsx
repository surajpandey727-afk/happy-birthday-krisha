'use client';
import { useState } from 'react';
import { PuzzleClue } from '../PuzzleClue';
import { PuzzleHint } from '../PuzzleHint';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';

const LINES = [
  'Sometimes we search too far.',
  'Nothing hidden is truly invisible.',
  'A thing may sit before thy very eyes.',
  'Careless eyes see only what they expect.',
  'Keep thy attention upon the ordinary.',
  'Seek what once carried a taste of home.',
];

const OPTIONS = ['SNACKS', 'STACKS', 'SPARKS', 'SHACKS'];
const ANSWER = 'SNACKS';

export function Level2Pattern({ onComplete }: { onComplete: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const select = (word: string) => {
    setPicked(word);
    if (word === ANSWER) {
      sound.success();
      setSolved(true);
      window.setTimeout(onComplete, 1400);
    } else {
      sound.error();
      pushToast('read the beginnings, not the endings.');
    }
  };

  return (
    <div>
      <p className="font-monigue max-w-md text-sm italic text-muted">Read the beginnings, not the endings.</p>

      <div className="mt-6 flex flex-col gap-1.5">
        {LINES.map((line, i) => (
          <p key={i} className="font-magnode text-sm text-parchment sm:text-base">
            <span className="text-royal-vivid">{line.charAt(0)}</span>
            {line.slice(1)}
          </p>
        ))}
      </div>

      <p className="font-nebulica mt-6 text-[10px] uppercase tracking-[0.3em] text-muted-dim">what word have you uncovered?</p>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {OPTIONS.map((word) => (
          <button
            key={word}
            onClick={() => select(word)}
            className={`font-magnode rounded-xl border py-4 text-sm tracking-[0.15em] transition-colors ${
              picked === word && word === ANSWER
                ? 'border-royal-vivid bg-royal-vivid/10 text-royal-vivid'
                : picked === word
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
          <PuzzleClue label="uncovered">Something small, easy to forget, sweeter than the room let on.</PuzzleClue>
        </div>
      ) : (
        <PuzzleHint
          level={2}
          hints={[
            'You don’t need to read every word. Just the first letter of every line.',
            'S, N, A, C, K, S: six lines, six letters, one word.',
          ]}
        />
      )}
    </div>
  );
}
