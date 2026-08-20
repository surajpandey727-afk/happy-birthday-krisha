'use client';

/** Case-file progress rail — five numbered marks, filled as levels complete. */
export function PuzzleProgress({
  totalLevels,
  currentLevel,
  completed,
}: {
  totalLevels: number;
  currentLevel: number;
  completed: number[];
}) {
  return (
    <div className="flex items-center gap-2" role="list" aria-label="case progress">
      {Array.from({ length: totalLevels }, (_, i) => i + 1).map((n) => {
        const done = completed.includes(n);
        const active = n === currentLevel;
        return (
          <div key={n} className="flex flex-1 items-center gap-2" role="listitem">
            <span
              aria-current={active ? 'step' : undefined}
              aria-label={`level ${n}${done ? ', complete' : active ? ', current' : ''}`}
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-nebulica text-[9px] transition-colors ${
                done
                  ? 'bg-royal-vivid text-void'
                  : active
                    ? 'border border-royal-vivid text-royal-vivid'
                    : 'border border-muted-dim/50 text-muted-dim'
              }`}
            >
              {done ? '✓' : n}
            </span>
            {n < totalLevels && (
              <span className={`h-px flex-1 ${done ? 'bg-royal-vivid' : 'bg-muted-dim/30'}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
