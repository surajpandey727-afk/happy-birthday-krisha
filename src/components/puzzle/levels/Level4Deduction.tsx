'use client';
import { useState } from 'react';
import { PuzzleClue } from '../PuzzleClue';
import { PuzzleHint } from '../PuzzleHint';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';

const OPTIONS = [
  { id: 'desk', label: 'the desk drawer' },
  { id: 'wardrobe', label: 'the wardrobe' },
  { id: 'tv', label: 'beside the television' },
  { id: 'bed', label: 'under the bed' },
];
const ANSWER = 'tv';

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
      <p className="font-monigue max-w-md text-sm italic text-muted">
        Observation taught you to look twice. Pattern taught you that things hide inside repetition. Memory
        pointed at something that has crossed every border with you — quietly, without ever being the point.
        Where in the room would it sit, still, without anyone noticing it was there at all?
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            onClick={() => select(o.id)}
            className={`font-magnode rounded-xl border px-4 py-5 text-left text-sm transition-colors ${
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
          <PuzzleClue label="deduced">
            It has crossed countries. You've seen it without seeing it — the kind of object you stop noticing
            because it never actually left.
          </PuzzleClue>
        </div>
      )}

      {!solved && (
        <PuzzleHint
          level={4}
          hints={[
            'It wouldn’t be hidden away — it would sit in plain sight, near something you look at every day.',
            'Think about what’s parked, unopened, next to the screen you watch most.',
          ]}
        />
      )}
    </div>
  );
}
