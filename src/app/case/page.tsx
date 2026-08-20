'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

const TOTAL_LEVELS = 5;

const LEVEL_META = [
  { kicker: 'level one · observation', title: 'the room' },
  { kicker: 'level two · pattern', title: 'the anomaly' },
  { kicker: 'level three · memory', title: 'what travels' },
  { kicker: 'level four · deduction', title: 'the location' },
  { kicker: 'level five · reveal', title: 'the case is closed' },
];

export default function CasePage() {
  const [state, setState] = useState<PuzzleState | null>(null);

  useEffect(() => {
    setState(loadPuzzleState());
    return subscribePuzzleState(() => setState(loadPuzzleState()));
  }, []);

  if (!state) return null;

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
      kicker="a small investigation"
      title="the case"
      blurb="something is hidden nearby. deduce where."
    >
      <PuzzleShell levelIndex={level} totalLevels={TOTAL_LEVELS} completed={state.completedLevels} kicker={meta.kicker} title={meta.title}>
        <AnimatePresence mode="wait">
          <motion.div key={level} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {level === 1 && <Level1Observation onComplete={() => handleComplete(1)} />}
            {level === 2 && <Level2Pattern onComplete={() => handleComplete(2)} />}
            {level === 3 && <Level3Memory onComplete={() => handleComplete(3)} />}
            {level === 4 && <Level4Deduction onComplete={() => handleComplete(4)} />}
            {level === 5 && <Level5Reveal onComplete={() => handleComplete(5)} alreadySolved={state.solved} />}
          </motion.div>
        </AnimatePresence>
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
