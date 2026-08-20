'use client';
import { useState } from 'react';
import { PuzzleClue } from '../PuzzleClue';
import { PuzzleHint } from '../PuzzleHint';
import { MediaFigure } from '@/components/media/MediaFigure';
import { PHOTO_PREVIEW } from '@content/photos';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';

const OPTIONS = ['a playlist', 'a jacket', 'a case', 'a camera'];
const ANSWER = 'a case';

const airportPhoto = PHOTO_PREVIEW.find((p) => p.alt?.includes('luggage cart'));

export function Level3Memory({ onComplete }: { onComplete: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  const select = (option: string) => {
    setPicked(option);
    if (option === ANSWER) {
      sound.success();
      setSolved(true);
      window.setTimeout(onComplete, 1400);
    } else {
      sound.error();
      pushToast('close — think about what never actually goes inside.');
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {airportPhoto && (
          <div className="w-full max-w-[180px] shrink-0 overflow-hidden rounded-xl ring-1 ring-royal/40">
            <MediaFigure media={airportPhoto} variant="thumb" className="aspect-[3/4] w-full object-cover" />
          </div>
        )}
        <p className="font-monigue max-w-sm text-sm italic text-muted">
          Some things travel further than you do. Not the playlist — that changes. Not the jacket — that stays
          home half the time. One thing has crossed every border you have, and you stopped noticing it years ago.
          Which one?
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => select(option)}
            className={`font-magnode rounded-xl border px-3 py-4 text-sm capitalize transition-colors ${
              picked === option && option === ANSWER
                ? 'border-royal-vivid bg-royal-vivid/10 text-royal-vivid'
                : picked === option
                  ? 'border-brown-warm bg-brown-deep/20 text-muted'
                  : 'border-brown-warm/30 bg-surface/60 text-parchment hover:border-royal-vivid/40'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {solved && (
        <div className="mt-6">
          <PuzzleClue label="remembered">
            You've been looking for something new. This one has been with you before.
          </PuzzleClue>
        </div>
      )}

      {!solved && (
        <PuzzleHint
          level={3}
          hints={[
            'It doesn’t make sound, doesn’t need charging, and it’s never once been the thing you were excited to pack.',
            'It’s the thing everything else goes inside of.',
          ]}
        />
      )}
    </div>
  );
}
