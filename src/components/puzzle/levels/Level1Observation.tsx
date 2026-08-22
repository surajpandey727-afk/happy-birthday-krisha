'use client';
import { useState } from 'react';
import { PuzzleObject } from '../PuzzleObject';
import { PuzzleClue } from '../PuzzleClue';
import { PuzzleHint } from '../PuzzleHint';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';

const OBJECTS = [
  { id: 'lamp', label: 'the desk lamp', significant: false, icon: 'M12 3v3M7 21h10M9 15h6l1.5 6h-9zM6 15a6 6 0 1112 0v0H6z' },
  { id: 'clock', label: 'the stopped clock', significant: true, icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3.5 2' },
  { id: 'bookshelf', label: 'the bookshelf', significant: false, icon: 'M4 4v16M8 4v16M12 4v16M16 4v16M20 4v16M4 4h16M4 20h16' },
  { id: 'mirror', label: 'the mirror', significant: true, icon: 'M12 3a7 7 0 100 14 7 7 0 000-14zM12 17v4M9 21h6' },
  { id: 'frame', label: 'the framed photo', significant: false, icon: 'M4 5h16v14H4zM8 9l3 3 2-2 4 4' },
  { id: 'window', label: 'the window', significant: false, icon: 'M4 4h16v16H4zM12 4v16M4 12h16' },
];

const SIGNIFICANT_IDS = OBJECTS.filter((o) => o.significant).map((o) => o.id);

export function Level1Observation({ onComplete }: { onComplete: () => void }) {
  const [found, setFound] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);

  const select = (id: string) => {
    if (found.includes(id)) return;
    if (SIGNIFICANT_IDS.includes(id)) {
      sound.select();
      setFound((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        if (next.length === SIGNIFICANT_IDS.length) {
          sound.success();
          window.setTimeout(onComplete, 1400);
        }
        return next;
      });
    } else {
      sound.tap();
      setWrong(id);
      pushToast('not this one . . .');
      window.setTimeout(() => setWrong(null), 500);
    }
  };

  const solved = found.length === SIGNIFICANT_IDS.length;

  return (
    <div>
      <p className="font-monigue max-w-md text-sm italic text-muted">
        The greatest clue is often the thing one sees every day and never truly sees. Look at everything. Most of
        it is just furniture.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {OBJECTS.map((o) => (
          <PuzzleObject
            key={o.id}
            label={o.label}
            significant={o.significant}
            state={found.includes(o.id) ? 'correct' : wrong === o.id ? 'incorrect' : 'idle'}
            onClick={() => select(o.id)}
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d={o.icon} />
            </svg>
          </PuzzleObject>
        ))}
      </div>

      {solved ? (
        <div className="mt-6">
          <PuzzleClue label="observed">
            Not everything that sits still is idle. And not everything you see is the whole picture.
          </PuzzleClue>
        </div>
      ) : (
        <PuzzleHint
          level={1}
          hints={[
            'Two objects in this room don’t belong to the moment: one has stopped, one only shows you what’s already there.',
            'The clock, and the mirror.',
          ]}
        />
      )}
    </div>
  );
}
