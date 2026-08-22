'use client';
import { useEffect, useState } from 'react';
import { WorldShell } from '@/components/world/WorldShell';
import { PuzzleShell } from '@/components/puzzle/PuzzleShell';
import { Level1Observation } from '@/components/puzzle/levels/Level1Observation';
import { Level2Pattern } from '@/components/puzzle/levels/Level2Pattern';
import { Level3Memory } from '@/components/puzzle/levels/Level3Memory';
import { Level4Deduction } from '@/components/puzzle/levels/Level4Deduction';
import { Level5Reveal } from '@/components/puzzle/levels/Level5Reveal';
import {
  loadPuzzleState,
  subscribePuzzleState,
  completeLevel,
  resetPuzzle,
  type PuzzleState,
} from '@/lib/puzzleProgress';
import { addPuzzleSolved } from '@/lib/progress';
import { loadSecretDoorState, subscribeSecretDoorState } from '@/lib/secretDoor';
import Link from 'next/link';

const TOTAL_LEVELS = 5;

const LEVEL_META = [
  { kicker: 'level one · observation', title: 'the room' },
  { kicker: 'level two · pattern', title: 'the anomaly' },
  { kicker: 'level three · memory', title: 'what travels' },
  { kicker: 'level four · deduction', title: 'connect the evidence' },
  { kicker: 'level five · reveal', title: 'the case is closed' },
];

export default function CasePage() {
  const [state, setState] = useState<PuzzleState | null>(null);
  const [doorFound, setDoorFound] = useState<boolean | null>(null);

  useEffect(() => {
    setState(loadPuzzleState());
    return subscribePuzzleState(() => setState(loadPuzzleState()));
  }, []);

  useEffect(() => {
    setDoorFound(loadSecretDoorState().found);
    return subscribeSecretDoorState(() => setDoorFound(loadSecretDoorState().found));
  }, []);

  if (!state || doorFound === null) return null;

  if (!doorFound) {
    return (
      <WorldShell kicker="a small investigation" title="the case" blurb="nothing here is quite what it seems.">
        <div className="rounded-3xl border border-dashed border-brown-warm/40 px-6 py-14 text-center">
          <p className="font-monigue text-lg italic text-muted">There's a door somewhere in this world I haven't shown you.</p>
          <p className="font-monigue mt-3 text-sm italic text-muted-dim">
            Find it first. This case doesn't open for anyone who hasn't.
          </p>
          <Link
            href="/home"
            className="font-nebulica mt-8 inline-block text-[10px] uppercase tracking-[0.3em] text-royal-vivid underline decoration-dotted underline-offset-4"
          >
            back to our room
          </Link>
        </div>
      </WorldShell>
    );
  }

  const level = Math.min(state.currentLevel, TOTAL_LEVELS);
  const meta = LEVEL_META[level - 1];

  const handleComplete = (n: number) => {
    // addPuzzleSolved() isn't idempotent (it always increments). Gate it on
    // completeLevel()'s own return value, not React state — state can be
    // stale if onComplete fires twice before a re-render lands.
    const isNew = completeLevel(n, TOTAL_LEVELS);
    if (isNew) addPuzzleSolved();
  };

  return (
    <WorldShell
      kicker="a curious mind is a dangerous thing"
      title="the case"
      blurb="four clues. one secret. nothing here is quite what it seems. proceed, detective."
    >
      {/* PuzzleShell itself remounts (and CSS-fades in) on every level
          change via its own key={levelIndex} — a second AnimatePresence
          wrapper here was redundant, and it wrapped the actual puzzle
          mechanics for every level, which is the single riskiest thing on
          this page to leave dependent on framer-motion ever completing its
          animate step. */}
      <PuzzleShell levelIndex={level} totalLevels={TOTAL_LEVELS} completed={state.completedLevels} kicker={meta.kicker} title={meta.title}>
        {level === 1 && <Level1Observation onComplete={() => handleComplete(1)} />}
        {level === 2 && <Level2Pattern onComplete={() => handleComplete(2)} />}
        {level === 3 && <Level3Memory onComplete={() => handleComplete(3)} />}
        {level === 4 && <Level4Deduction onComplete={() => handleComplete(4)} />}
        {level === 5 && <Level5Reveal onComplete={() => handleComplete(5)} alreadySolved={state.solved} />}
      </PuzzleShell>

      {state.solved && (
        <div className="mt-6 text-center">
          <button
            onClick={resetPuzzle}
            className="font-nebulica text-[10px] uppercase tracking-[0.3em] text-muted-dim underline decoration-dotted underline-offset-4 transition-colors hover:text-royal-vivid"
          >
            investigate again
          </button>
        </div>
      )}
    </WorldShell>
  );
}
