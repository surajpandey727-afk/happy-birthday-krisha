import { describe, it, expect } from 'vitest';
import { generateLevel, countCrossings } from './logic';

describe('untangle logic', () => {
  it('always produces a validated target with zero crossings', () => {
    for (let id = 1; id <= 40; id++) {
      const level = generateLevel(id);
      expect(level.nodes).toBe(level.target.length);
      expect(countCrossings(level.target, level.edges), `level ${id} target`).toBe(0);
    }
  });

  it('is deterministic for the same seed', () => {
    const a = generateLevel(12);
    const b = generateLevel(12);
    expect(a.edges).toEqual(b.edges);
    expect(a.target).toEqual(b.target);
  });

  it('scrambles the initial layout (puzzle is not already solved)', () => {
    let scrambled = 0;
    for (let id = 1; id <= 30; id++) {
      const level = generateLevel(id);
      if (countCrossings(level.initial, level.edges) > 0) scrambled++;
      // every node stays inside the playable area
      for (const p of level.initial) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
    }
    expect(scrambled).toBeGreaterThanOrEqual(8);
  });

  it('all families produce sane edge counts', () => {
    for (let id = 1; id <= 30; id++) {
      const level = generateLevel(id);
      expect(level.edges.length).toBeGreaterThanOrEqual(3);
    }
  });
});