/* Game framework core — shared skill systems (progress, achievements, level
 * management). Each game keeps its own engine, but reuses these. Kept tiny. */

import { createStore } from "@/lib/persistence";
import type { PersistenceAdapter } from "@/lib/persistence";

export interface GameProgress {
  unlocked: number;
  completed: number[];
  bestMoves: Record<number, number>;
  lastLevel: number;
  hintsUsed: Record<number, number>;
}

export interface LevelConfig {
  id: number;
  seed: number;
  band: DifficultyBand;
  data: unknown;
  metadata?: Record<string, unknown>;
}

export type DifficultyBand =
  | "tutorial"
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert"
  | "infinite";

export const BANDS: DifficultyBand[] = [
  "tutorial",
  "beginner",
  "intermediate",
  "advanced",
  "expert",
];

export const BAND_LABEL: Record<DifficultyBand, string> = {
  tutorial: "tutorial",
  beginner: "beginner",
  intermediate: "intermediate",
  advanced: "advanced",
  expert: "expert",
  infinite: "infinite",
};

export const UNLOCK_WINDOW = 3; // 100 solves is ~33 levels of slack

/** Create a progress store for one game. */
export function makeProgressStore(gameId: string) {
  const fallback: GameProgress = {
    unlocked: 1,
    completed: [],
    bestMoves: {},
    lastLevel: 1,
    hintsUsed: {},
  };
  const store = createStore<GameProgress>(`game:${gameId}`, fallback);

  const state = () => {
    const p = store.load();
    return {
      ...p,
      unlocked: Math.max(1, p.unlocked),
    };
  };

  return {
    load: state,
    subscribe: (cb: () => void) => store.subscribe(cb),
    reset: () => store.save(fallback),
    recordWin(levelId: number, moves: number, targetMoves?: number) {
      store.update((p) => {
        const wasDone = p.completed.includes(levelId);
        const completed = wasDone ? p.completed : [...p.completed, levelId];
        return {
          unlocked: Math.max(p.unlocked, Math.min(levelId + 1, levelId + UNLOCK_WINDOW)),
          completed,
          bestMoves: {
            ...p.bestMoves,
            [levelId]: Math.min(p.bestMoves[levelId] ?? moves, moves),
          },
          lastLevel: levelId,
          hintsUsed: p.hintsUsed,
        };
      });
    },
    recordHint(levelId: number) {
      store.update((p) => ({
        ...p,
        hintsUsed: { ...p.hintsUsed, [levelId]: (p.hintsUsed[levelId] ?? 0) + 1 },
      }));
    },
    saveLevel(levelId: number) {
      store.update((p) => ({ ...p, lastLevel: levelId, unlocked: Math.max(p.unlocked, levelId) }));
    },
  };
}

/** Global totals — drives unlocks (letters, secret room, room growth). */
const totalsStore = createStore<{ puzzles: number; doodles: number }>(
  "totals",
  { puzzles: 0, doodles: 0 }
);

export function totalPuzzles() {
  return totalsStore.load().puzzles;
}
export function addPuzzleSolved() {
  totalsStore.update((t) => ({ ...t, puzzles: t.puzzles + 1 }));
}
export function addDoodleSaved() {
  totalsStore.update((t) => ({ ...t, doodles: t.doodles + 1 }));
}
export function subscribeTotals(cb: () => void) {
  return totalsStore.subscribe(cb);
}
export function resetTotals() {
  totalsStore.save({ puzzles: 0, doodles: 0 });
}

/** PerformanceMonitor — a tiny rAF based FPS counter for debug mode. */
export class PerformanceMonitor {
  private frames = 0;
  private last = 0;
  private raf = 0;
  public onSample: (fps: number) => void = () => {};
  start() {
    this.last = performance.now();
    const tick = (now: number) => {
      this.frames++;
      if (now - this.last >= 1000) {
        const fps = Math.round((this.frames * 1000) / (now - this.last));
        this.onSample(fps);
        this.frames = 0;
        this.last = now;
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  stop() {
    cancelAnimationFrame(this.raf);
  }
}

export type { PersistenceAdapter };