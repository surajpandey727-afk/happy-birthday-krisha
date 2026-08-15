/**
 * LIQUID LOVE — pure game logic (framework-agnostic, unit-testable).
 *
 * Bottle model: an array of colour indices ordered bottom→top.
 * Capacity = max segments per bottle. A level is solved when every bottle is
 * empty or a full single colour.
 *
 * Generator: start from the solved arrangement, apply random LEGAL reverse
 * pours (each reversible ⇒ always solvable), then verify with a BFS solver so
 * no impossible level is ever produced.
 */

import { mulberry32, hashSeed, shuffle } from "@/lib/seededRandom";
import type { DifficultyBand } from "@/games/framework/progress";

export interface LiquidLevel {
  bottles: number[][];
  capacity: number;
  colors: number;
  empties: number;
}

export function bandParams(band: DifficultyBand, levelId: number) {
  switch (band) {
    case "tutorial":
      return { colors: 3, cap: 3, empties: 2, scramble: [6, 12] };
    case "beginner":
      return { colors: 4 + (levelId % 2), cap: 4, empties: 2, scramble: [14, 26] };
    case "intermediate":
      return { colors: 5 + (levelId % 2), cap: 4, empties: 2, scramble: [22, 40] };
    case "advanced":
      return { colors: 6 + (levelId % 2), cap: 4, empties: 2, scramble: [30, 52] };
    case "expert":
      return { colors: 7 + (levelId % 2), cap: 4, empties: 2, scramble: [38, 64] };
    case "infinite":
      return { colors: 5 + (levelId % 4), cap: 4, empties: 2, scramble: [24, 56] };
  }
}

export function bandForLevel(levelId: number): DifficultyBand {
  if (levelId <= 5) return "tutorial";
  if (levelId <= 20) return "beginner";
  if (levelId <= 50) return "intermediate";
  if (levelId <= 80) return "advanced";
  if (levelId <= 100) return "expert";
  return "infinite";
}

/** Parse the poured "[0,1]>[2]" style description used for tests/serialization. */
export function parseBottles(desc: string): number[][] {
  return desc
    .slice(1, -1)
    .split("],[")
    .map((s) =>
      s
        .replace(/[\[\]]/g, "")
        .split(",")
        .filter((x) => x.trim() !== "")
        .map((x) => Number(x))
    );
}

/** True if the whole board is complete. */
export function isComplete(bottles: number[][], cap: number): boolean {
  return bottles.every(
    (b) => b.length === 0 || (b.length === cap && new Set(b).size === 1)
  );
}



/** Desired solution-length band per difficulty (controls how hard a level feels). */
function solLenBand(band: DifficultyBand): [number, number] {
  switch (band) {
    case "tutorial":
      return [4, 12];
    case "beginner":
      return [7, 20];
    case "intermediate":
      return [10, 28];
    case "advanced":
      return [14, 36];
    case "expert":
      return [18, 44];
    case "infinite":
      return [10, 50];
  }
}

/**
 * Random mixed board + solver validation (generate → validate → solve →
 * score → accept). Random boards are genuinely mixed; the BFS solver proves
 * solvability and its length sets the difficulty, so no impossible level is
 * ever emitted.
 */
function scramble(seed: number, band: DifficultyBand, levelId: number): LiquidLevel | null {
  const { colors, cap, empties } = bandParams(band, levelId);
  const rng = mulberry32(seed);

  // exactly cap segments of each colour, randomly distributed into bottles
  const segments: number[] = [];
  for (let c = 0; c < colors; c++) for (let k = 0; k < cap; k++) segments.push(c);
  const shuffled = shuffle(rng, segments);

  const bottles: number[][] = [];
  for (let i = 0; i < colors; i++) bottles.push(shuffled.slice(i * cap, (i + 1) * cap));
  for (let e = 0; e < empties; e++) bottles.push([]);

  if (isComplete(bottles, cap)) return null;

  const [minLen, maxLen] = solLenBand(band);
  const sol = solveLiquid(bottles, cap);
  if (!sol) return null;
  if (sol.length < minLen || sol.length > maxLen) return null;

  return { bottles, capacity: cap, colors, empties };
}

/**
 * Deterministic level generator: same seed → same level, anywhere.
 * Levels 1–100 are seeded per id → a stable curated-feeling set;
 * levelId > 100 uses the id as its own seed (infinite).
 */
export function generateLevel(levelId: number): LiquidLevel {
  const band = bandForLevel(levelId);
  const base = hashSeed(`liquid:${levelId}:${band}`);
  for (let attempt = 0; attempt < 60; attempt++) {
    const lvl = scramble(base + attempt, band, levelId);
    if (lvl) return lvl;
  }
  // ultimate fallback: a small verified-solvable level (never pre-solved)
  return { bottles: [[1, 0], [1], [0], []], capacity: 2, colors: 2, empties: 1 };
}

export interface Move {
  from: number;
  to: number;
}

/** Legal pour of [from] -> [to]. Returns new bottles if legal, else null. */
export function tryPour(
  bottles: number[][],
  from: number,
  to: number,
  cap: number
): { next: number[][]; count: number } | null {
  const f = bottles[from];
  const t = bottles[to];
  if (f.length === 0) return null;
  const seg = f[f.length - 1];
  let k = 1;
  while (k < f.length && f[f.length - 1 - k] === seg) k++;
  if (t.length > 0 && t[t.length - 1] !== seg) return null;
  const space = cap - t.length;
  if (space < k) return null;
  const next = bottles.map((b) => b.slice());
  next[from] = next[from].slice(0, next[from].length - k);
  for (let i = 0; i < k; i++) next[to].push(seg);
  return { next, count: k };
}

/** Canonical key: ignores completed bottles, sorts the rest, counts empties. */
function stateKey(bottles: number[][], cap: number): string {
  const act: string[] = [];
  let empties = 0;
  for (const b of bottles) {
    const key = b.join(",");
    if (b.length === 0) empties++;
    else if (b.length === cap && new Set(b).size === 1) {
      /* done — omitted */
    } else act.push(key);
  }
  act.sort();
  return act.join("|") + "#" + empties;
}

/**
 * BFS solver. Returns the move sequence to solve, or null if unsolvable.
 * Never returns an impossible board — this is the validation step the
 * generator depends on.
 */
export function solveLiquid(initial: number[][], cap: number): Move[] | null {
  const startKey = stateKey(initial, cap);
  const visited = new Set<string>([startKey]);
  type Q = { bottles: number[][]; path: Move[] };
  const queue: Q[] = [{ bottles: initial, path: [] }];
  let qi = 0;
  const MAX_Q = 140000;
  while (qi < queue.length) {
    const cur = queue[qi++];
    if (isComplete(cur.bottles, cap)) return cur.path;
    for (let i = 0; i < cur.bottles.length; i++) {
      for (let j = 0; j < cur.bottles.length; j++) {
        if (i === j) continue;
        const p = tryPour(cur.bottles, i, j, cap);
        if (!p) continue;
        const k = stateKey(p.next, cap);
        if (visited.has(k)) continue;
        visited.add(k);
        queue.push({ bottles: p.next, path: [...cur.path, { from: i, to: j }] });
        if (queue.length > MAX_Q) return null; // state space too large — reject
      }
    }
  }
  return null;
}

