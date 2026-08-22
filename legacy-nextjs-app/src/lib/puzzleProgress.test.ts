import { describe, it, expect, beforeEach } from 'vitest';
import { completeLevel, loadPuzzleState, resetPuzzle, recordHint, hasSeenHint } from './puzzleProgress';

describe('puzzle progress', () => {
  beforeEach(() => {
    resetPuzzle();
  });

  it('starts on level 1, nothing completed', () => {
    const s = loadPuzzleState();
    expect(s.currentLevel).toBe(1);
    expect(s.completedLevels).toEqual([]);
    expect(s.solved).toBe(false);
  });

  it('advances currentLevel and records completion', () => {
    completeLevel(1, 5);
    const s = loadPuzzleState();
    expect(s.completedLevels).toEqual([1]);
    expect(s.currentLevel).toBe(2);
    expect(s.solved).toBe(false);
  });

  it('marks solved only once the final level completes', () => {
    completeLevel(1, 5);
    completeLevel(2, 5);
    completeLevel(3, 5);
    completeLevel(4, 5);
    expect(loadPuzzleState().solved).toBe(false);
    completeLevel(5, 5);
    const s = loadPuzzleState();
    expect(s.solved).toBe(true);
    expect(s.completedLevels).toEqual([1, 2, 3, 4, 5]);
  });

  it('completeLevel returns true only the first time a level completes', () => {
    // Regression test: addPuzzleSolved() (a non-idempotent counter) is only
    // called by consumers when this returns true — calling completeLevel
    // twice for the same level, back-to-back, must not double-count.
    expect(completeLevel(1, 5)).toBe(true);
    expect(completeLevel(1, 5)).toBe(false);
    expect(completeLevel(1, 5)).toBe(false);
    expect(loadPuzzleState().completedLevels).toEqual([1]);
  });

  it('does not regress currentLevel when an earlier level is re-completed', () => {
    completeLevel(1, 5);
    completeLevel(2, 5);
    expect(loadPuzzleState().currentLevel).toBe(3);
    completeLevel(1, 5); // already done — re-firing must not move currentLevel backward
    expect(loadPuzzleState().currentLevel).toBe(3);
  });

  it('tracks discovered hints per level+index independently', () => {
    recordHint(2, 0);
    const s = loadPuzzleState();
    expect(hasSeenHint(s, 2, 0)).toBe(true);
    expect(hasSeenHint(s, 2, 1)).toBe(false);
    expect(hasSeenHint(s, 1, 0)).toBe(false);
  });

  it('resetPuzzle returns to the initial state', () => {
    completeLevel(1, 5);
    recordHint(1, 0);
    resetPuzzle();
    const s = loadPuzzleState();
    expect(s.currentLevel).toBe(1);
    expect(s.completedLevels).toEqual([]);
    expect(s.discoveredHints).toEqual([]);
    expect(s.solved).toBe(false);
  });
});
