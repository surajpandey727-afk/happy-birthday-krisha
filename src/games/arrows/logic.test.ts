import { describe, it, expect } from 'vitest';
import { generateLevel, simulate, validateLevel, targetCells } from './logic';

describe('arrow // chain logic', () => {
  it('every generated level is solvable by its intended starters', () => {
    for (let id = 1; id <= 40; id++) {
      const level = generateLevel(id);
      expect(targetCells(level).length).toBeGreaterThan(0);
      expect(validateLevel(level, level.starters), `level ${id}`).toBe(true);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = generateLevel(5);
    const b = generateLevel(5);
    expect(a.tiles).toEqual(b.tiles);
    expect(a.starters).toEqual(b.starters);
  });

  it('simulates beams deterministically and without infinite loops', () => {
    for (let id = 1; id <= 20; id++) {
      const level = generateLevel(id);
      for (const s of level.starters) {
        const r1 = simulate(level, s);
        const r2 = simulate(level, s);
        expect(r1.steps).toEqual(r2.steps);
        expect(r1.targetsHit).toEqual(r2.targetsHit);
        // a beam never runs forever
        expect(r1.steps.length).toBeLessThanOrEqual(level.w * level.h * 3);
      }
    }
  });

  it('assigns targets only inside the grid', () => {
    for (let id = 1; id <= 20; id++) {
      const level = generateLevel(id);
      for (const t of targetCells(level)) {
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThan(level.w * level.h);
      }
    }
  });
});