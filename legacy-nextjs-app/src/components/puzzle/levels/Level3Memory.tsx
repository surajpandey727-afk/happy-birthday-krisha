'use client';
import { useState } from 'react';
import { PuzzleClue } from '../PuzzleClue';
import { PuzzleHint } from '../PuzzleHint';
import { MediaFigure } from '@/components/media/MediaFigure';
import { PHOTO_PREVIEW } from '@content/photos';
import { pushToast } from '@/lib/eggBus';
import { sound } from '@/lib/sounds';

const OBJECT_OPTIONS = ['a playlist', 'a jacket', 'a case', 'a camera'];
const OBJECT_ANSWER = 'a case';

const SNACK_OPTIONS = ['CHUNKY PIE', 'CHOCO PIE', 'CHERRY PIE', 'CHOMP PIE'];
const SNACK_ANSWER = 'CHOCO PIE';

const airportPhoto = PHOTO_PREVIEW.find((p) => p.alt?.includes('luggage cart'));

export function Level3Memory({ onComplete }: { onComplete: () => void }) {
  const [objectPicked, setObjectPicked] = useState<string | null>(null);
  const [objectSolved, setObjectSolved] = useState(false);
  const [snackPicked, setSnackPicked] = useState<string | null>(null);
  const [snackSolved, setSnackSolved] = useState(false);

  const selectObject = (option: string) => {
    setObjectPicked(option);
    if (option === OBJECT_ANSWER) {
      sound.success();
      setObjectSolved(true);
    } else {
      sound.error();
      pushToast('close. think about what never actually goes inside.');
    }
  };

  const selectSnack = (option: string) => {
    setSnackPicked(option);
    if (option === SNACK_ANSWER) {
      sound.success();
      setSnackSolved(true);
      window.setTimeout(onComplete, 1400);
    } else {
      sound.error();
      pushToast('sweet, round, and gone within a week.');
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
          I have crossed borders without moving an inch. I have carried fragments of one world into another. I am
          opened with purpose, then forgotten when the feast is done. What am I?
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {OBJECT_OPTIONS.map((option) => (
          <button
            key={option}
            onClick={() => selectObject(option)}
            disabled={objectSolved}
            className={`font-magnode rounded-xl border px-3 py-4 text-sm capitalize transition-colors ${
              objectPicked === option && option === OBJECT_ANSWER
                ? 'border-royal-vivid bg-royal-vivid/10 text-royal-vivid'
                : objectPicked === option
                  ? 'border-brown-warm bg-brown-deep/20 text-muted'
                  : 'border-brown-warm/30 bg-surface/60 text-parchment enabled:hover:border-royal-vivid/40 disabled:opacity-60'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {!objectSolved && (
        <PuzzleHint
          level={3}
          hints={[
            'It doesn’t make sound, doesn’t need charging, and it’s never once been the thing you were excited to pack.',
            'It’s the thing everything else goes inside of.',
          ]}
        />
      )}

      {objectSolved && (
        <>
          <div className="mt-6">
            <PuzzleClue label="remembered">
              You've been looking for something new. This one has been with you before.
            </PuzzleClue>
          </div>

          <div className="mt-6 border-t border-brown-warm/30 pt-6">
            <p className="font-monigue max-w-md text-sm italic text-muted">
              I once contained a little treasure. We found it only after forgetting it existed. It was sweet,
              round, and gone within a week. What did we find?
            </p>
            <p className="font-apestron mt-3 text-2xl tracking-[0.1em] text-parchment">
              CH<span className="text-muted-dim">__</span>O&nbsp;P<span className="text-muted-dim">__</span>
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {SNACK_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => selectSnack(option)}
                  className={`font-magnode rounded-xl border px-3 py-4 text-sm tracking-[0.05em] transition-colors ${
                    snackPicked === option && option === SNACK_ANSWER
                      ? 'border-royal-vivid bg-royal-vivid/10 text-royal-vivid'
                      : snackPicked === option
                        ? 'border-brown-warm bg-brown-deep/20 text-muted'
                        : 'border-brown-warm/30 bg-surface/60 text-parchment hover:border-royal-vivid/40'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {snackSolved && (
              <div className="mt-6">
                <PuzzleClue label="tasted">A little treasure, sweet and round, gone within a week, never forgotten.</PuzzleClue>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
