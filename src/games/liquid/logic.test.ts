import { describe, it, expect } from 'vitest';
import {
  generateLevel,
  solveLiquid,
  tryPour,
  isComplete,
  parseBottles,
  bandForLevel,
} from './logic';

describe('liquid love logic', () => {
  it('never generates an impossible level (solver always finds a path)', () => {
    for (let id = 1; id <= 40; id++) {
      const level = generateLevel(id);
      const sol = solveLiquid(level.bottles, level.capacity);
      expect(sol, `level ${id} must be solvable`).not.toBeNull();
      // applying the solver moves must reach a complete state
      let bottles = level.bottles.map((b) => b.slice());
      for (const move of sol!) {
        const p = tryPour(bottles, move.from, move.to, level.capacity);
        expect(p, `move must stay legal`).not.toBeNull();
        bottles = p!.next;
      }
      expect(isComplete(bottles, level.capacity)).toBe(true);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = generateLevel(7);
    const b = generateLevel(7);
    expect(a.bottles).toEqual(b.bottles);
    expect(a.capacity).toBe(b.capacity);
  });

  it('rejects initial solved boards', () => {
    for (let id = 1; id <= 20; id++) {
      expect(isComplete(generateLevel(id).bottles, generateLevel(id).capacity)).toBe(false);
    }
  });

  it('enforces pour rules', () => {
    // only the top colour may move, only onto empty or matching colour
    const bottles = [[0, 1], [0], [1, 1, 0], []];
    expect(tryPour(bottles, 0, 3, 4)).toEqual({
      next: [[0], [0], [1, 1, 0], [1]],
      count: 1,
    });
    // wrong colour destination
    expect(tryPour(bottles, 0, 2, 4)).toBeNull();
    // over capacity
    expect(tryPour(bottles, 2, 0, 4)).toBeNull();
  });

  it('parses poured bottle descriptions', () => {
    expect(parseBottles('[[0,1],[2],[]]')).toEqual([[0, 1], [2], []]);
  });

  it('maps level ids to difficulty bands', () => {
    expect(bandForLevel(1)).toBe('tutorial');
    expect(bandForLevel(10)).toBe('beginner');
    expect(bandForLevel(30)).toBe('intermediate');
    expect(bandForLevel(60)).toBe('advanced');
    expect(bandForLevel(90)).toBe('expert');
    expect(bandForLevel(250)).toBe('infinite');
  });
});