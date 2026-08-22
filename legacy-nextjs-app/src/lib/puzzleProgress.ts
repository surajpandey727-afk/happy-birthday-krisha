/* Persisted state for "the case" — the 5-level deduction puzzle.
 * Deterministic and testable: pure functions over a plain state object,
 * persisted through the same PersistenceAdapter every other feature uses. */

import { createStore } from "@/lib/persistence";

export type PuzzleState = {
  currentLevel: number; // 1-indexed
  completedLevels: number[];
  discoveredHints: string[]; // `${level}:${hintIndex}` keys
  solved: boolean;
};

const INITIAL_STATE: PuzzleState = {
  currentLevel: 1,
  completedLevels: [],
  discoveredHints: [],
  solved: false,
};

const store = createStore<PuzzleState>("case-progress", INITIAL_STATE);

export function loadPuzzleState(): PuzzleState {
  return store.load();
}

export function subscribePuzzleState(cb: () => void) {
  return store.subscribe(cb);
}

/** Returns true only the first time `level` is completed — callers use this
 * (not React state, which can be stale if this fires twice before a
 * re-render) to gate one-time side effects like incrementing a counter. */
export function completeLevel(level: number, totalLevels: number): boolean {
  let isNew = false;
  store.update((s) => {
    isNew = !s.completedLevels.includes(level);
    const completedLevels = isNew ? [...s.completedLevels, level] : s.completedLevels;
    const solved = level >= totalLevels ? true : s.solved;
    const currentLevel = solved ? s.currentLevel : Math.max(s.currentLevel, Math.min(level + 1, totalLevels));
    return { ...s, completedLevels, solved, currentLevel };
  });
  return isNew;
}

export function recordHint(level: number, hintIndex: number) {
  const key = `${level}:${hintIndex}`;
  store.update((s) =>
    s.discoveredHints.includes(key) ? s : { ...s, discoveredHints: [...s.discoveredHints, key] }
  );
}

export function hasSeenHint(state: PuzzleState, level: number, hintIndex: number) {
  return state.discoveredHints.includes(`${level}:${hintIndex}`);
}

export function resetPuzzle() {
  store.save(INITIAL_STATE);
}
