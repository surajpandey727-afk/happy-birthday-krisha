/* Site-wide totals — drives unlocks and the home page's growth object.
 * Puzzle-specific progress (levels, hints, bands) lives with the puzzle
 * that owns it, not here. */

import { createStore } from "@/lib/persistence";

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
