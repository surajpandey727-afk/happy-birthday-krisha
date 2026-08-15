/**
 * ARROW // CHAIN — pure logic (framework-agnostic, testable).
 *
 * Model: a small grid of tiles. Arrows fire a beam in their facing direction;
 * when the beam enters another arrow tile it turns to that arrow's direction
 * (a chain). Targets marked 'T' must all be crossed by at least one beam.
 * The player taps arrows to fire them; fewest fires wins.
 *
 * Generator: built by construction — a "serpentine" cascade of turn arrows
 * guarantees the intended fire reaches every target, so every level is
 * solvable. Validation re-simulates each intended starter to confirm.
 */

import { mulberry32, hashSeed, int, chance } from "@/lib/seededRandom";
import type { DifficultyBand } from "@/games/framework/progress";

export type Tile = "." | "#" | "T" | "^" | "v" | "<" | ">";

export interface ArrowLevel {
  w: number;
  h: number;
  tiles: Tile[]; // row-major
  starters: number[];
}

export const DIRS: Record<"^" | "v" | "<" | ">", [number, number]> = {
  "^": [0, -1],
  v: [0, 1],
  "<": [-1, 0],
  ">": [1, 0],
};

export function isArrow(t: Tile): t is "^" | "v" | "<" | ">" {
  return t === "^" || t === "v" || t === "<" || t === ">";
}

export function bandForLevel(levelId: number): DifficultyBand {
  if (levelId <= 5) return "tutorial";
  if (levelId <= 20) return "beginner";
  if (levelId <= 50) return "intermediate";
  if (levelId <= 80) return "advanced";
  if (levelId <= 100) return "expert";
  return "infinite";
}

export interface SimResult {
  targetsHit: number[];
  chain: number;
  steps: number[];
}

/** Deterministic beam simulation. */
export function simulate(level: ArrowLevel, start: number): SimResult {
  const { w, h, tiles } = level;
  let d: [number, number] = DIRS[tiles[start] as "^" | "v" | "<" | ">"];
  let x = start % w;
  let y = Math.floor(start / w);
  const targetsHit: number[] = [];
  const used = new Set<number>([start]);
  const steps: number[] = [];
  let chain = 0;
  const maxSteps = w * h * 3;
  let guard = 0;

  while (guard++ < maxSteps) {
    x += d[0];
    y += d[1];
    if (x < 0 || x >= w || y < 0 || y >= h) break;
    const idx = y * w + x;
    const t = tiles[idx];
    if (t === "#") break;
    steps.push(idx);
    if (t === "T" && !targetsHit.includes(idx)) targetsHit.push(idx);
    if (isArrow(t)) {
      if (!used.has(idx)) {
        used.add(idx);
        chain++;
        d = DIRS[t];
      }
    }
  }
  return { targetsHit, chain, steps };
}

export function targetCells(level: ArrowLevel): number[] {
  const out: number[] = [];
  level.tiles.forEach((t, i) => {
    if (t === "T") out.push(i);
  });
  return out;
}

/** True if firing the given starters hits every target. */
export function validateLevel(level: ArrowLevel, toFire: number[]): boolean {
  const targets = new Set(targetCells(level));
  for (const s of toFire) {
    for (const t of simulate(level, s).targetsHit) targets.delete(t);
  }
  return targets.size === 0;
}



/* ---------- generation (construction-based, always solvable) ---------- */

function buildCascade(
  tiles: Tile[],
  w: number,
  rng: () => number,
  y0: number,
  y1: number,
  targetCount: number
): number {
  const h = y1 - y0 + 1;
  for (let r = 0; r < h; r++) {
    const gy = y0 + r;
    if (r % 2 === 0) {
      tiles[gy * w + 0] = ">";
      tiles[gy * w + (w - 1)] = "v";
    } else {
      tiles[gy * w + (w - 1)] = "<";
      tiles[gy * w + 0] = "v";
    }
  }
  const starter = y0 * w + 0;
  const middle: number[] = [];
  for (let r = 0; r < h; r++) {
    for (let x = 1; x <= w - 2; x++) middle.push((y0 + r) * w + x);
  }
  const pool = [...middle].sort(() => rng() - 0.5);
  const chosen = pool.slice(0, Math.min(targetCount, pool.length));
  chosen.forEach((idx) => (tiles[idx] = "T"));
  return starter;
}

export function generateLevel(levelId: number): ArrowLevel {
  const band = bandForLevel(levelId);
  const seed = hashSeed(`arrow:${levelId}`);
  const rng = mulberry32(seed);

  let w: number, h: number, targets: number, cascades: number, decoys: number;
  switch (band) {
    case "tutorial":
      w = 4; h = 3; targets = 2; cascades = 1; decoys = 0; break;
    case "beginner":
      w = 5; h = 4; targets = 3; cascades = 1; decoys = 1; break;
    case "intermediate":
      w = 6; h = 5; targets = 4; cascades = 1; decoys = 2; break;
    case "advanced":
      w = 7; h = 6; targets = 5; cascades = 2; decoys = 2; break;
    case "expert":
      w = 8; h = 6; targets = 6; cascades = 2; decoys = 3; break;
    default:
      w = 8; h = 7; targets = 6; cascades = 2; decoys = 3; break;
  }

  const tiles: Tile[] = new Array(w * h).fill(".");
  const starters: number[] = [];

  if (cascades === 1) {
    const bandTop = Math.max(0, Math.floor((h - 3) / 2));
    const y0 = bandTop;
    const y1 = Math.min(h - 1, bandTop + 2);
    starters.push(buildCascade(tiles, w, rng, y0, y1, targets));
  } else {
    const strip = Math.min(2, Math.floor((h - 1) / 2));
    const y0a = 0;
    const y1a = strip - 1;
    const y0b = strip + 1;
    const y1b = Math.min(h - 1, strip + strip);
    for (let x = 0; x < w; x++) tiles[strip * w + x] = "#"; // wall divider
    starters.push(buildCascade(tiles, w, rng, y0a, y1a, Math.ceil(targets / 2)));
    starters.push(buildCascade(tiles, w, rng, y0b, y1b, Math.floor(targets / 2)));
  }

  // decoys: arrows pointing immediately at a wall / off the board
  for (let d = 0; d < decoys; d++) {
    const empties: number[] = [];
    tiles.forEach((t, i) => {
      if (t === "." && !starters.includes(i)) empties.push(i);
    });
    if (!empties.length) break;
    const spot = empties[int(rng, 0, empties.length - 1)];
    const sx = spot % w;
    const sy = Math.floor(spot / w);
    if (sx <= 1 || sy === 0 || sy === h - 1 || sx === 0 || sx === w - 1) {
      tiles[spot] = sx <= 1 ? "<" : ">";
    } else {
      tiles[spot] = ["^", "v", "<", ">"][int(rng, 0, 3)] as Tile;
    }
  }

  const level: ArrowLevel = { w, h, tiles, starters };
  if (!validateLevel(level, starters)) {
    const flat: Tile[] = [">", "T", ".", ".", ".", ".", ".", ".", ".", ".", ".", "."];
    return { w: 4, h: 3, tiles: flat, starters: [0] };
  }
  return level;
}
