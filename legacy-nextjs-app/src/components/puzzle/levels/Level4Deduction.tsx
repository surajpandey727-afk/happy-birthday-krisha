'use client';
import { useState } from 'react';
import { PuzzleClue } from '../PuzzleClue';
import { PuzzleHint } from '../PuzzleHint';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';

const OPTIONS = [
  { id: 'suitcase', label: 'a suitcase' },
  { id: 'diary', label: 'a diary' },
  { id: 'keychain', label: 'a keychain' },
  { id: 'candle', label: 'a candle' },
];
const ANSWER = 'suitcase';

export function Level4Deduction({ onComplete }: { onComplete: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const select = (id: string) => {
    setPicked(id);
    if (id === ANSWER) {
      sound.success();
      setSolved(true);
      window.setTimeout(onComplete, 1400);
    } else {
      sound.error();
      pushToast('a reasonable guess. not this one.');
    }
  };

  return (
    <div>
      <p className="font-monigue max-w-md text-sm italic text-muted">Now connect the evidence.</p>

      <div className="mt-4 flex flex-col gap-1.5 font-nebulica text-[10px] uppercase tracking-[0.3em] text-muted-dim">
        <p>SNACKS.</p>
        <p>CHOCO PIE.</p>
        <p>A JOURNEY FROM INDIA.</p>
        <p>Something that carried them all.</p>
      </div>

      <p className="font-monigue mt-5 max-w-md text-sm italic text-muted">What object connects every clue?</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => select(o.id)}
            className={`font-magnode rounded-xl border px-4 py-5 text-left text-sm capitalize transition-colors ${
              picked === o.id && o.id === ANSWER
                ? 'border-royal-vivid bg-royal-vivid/10 text-royal-vivid'
                : picked === o.id
                  ? 'border-brown-warm bg-brown-deep/20 text-muted'
                  : 'border-brown-warm/30 bg-surface/60 text-parchment hover:border-royal-vivid/40'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {solved && (
        <div className="mt-6">
          <PuzzleClue label="deduced">The traveller that brought the feast home. Case closed.</PuzzleClue>
        </div>
      )}

      {!solved && (
        <PuzzleHint
          level={4}
          hints={[
            'Do not search the kitchen. Do not search the cupboard.',
            'Think of the traveller that brought the feast home.',
          ]}
        />
      )}
    </div>
  );
}
