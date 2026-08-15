/**
 * UNTANGLE — pure logic (framework-agnostic, testable).
 *
 * Model: nodes with positions in [0..1] space and undirected edges.
 * Solved ⇔ no two edges strictly intersect.
 *
 * Generator: builds graphs from guaranteed-planar families (wheels, grid
 * graphs, fans) with known crossing-free coordinates, then scrambles node
 * positions. Since the stored target layout is crossing-free and reachable by
 * dragging, every level is solvable by construction and then re-validated.
 */

import { mulberry32, hashSeed, int, chance } from "@/lib/seededRandom";
import type { DifficultyBand } from "@/games/framework/progress";

export interface P {
  x: number;
  y: number;
}

export interface UntangleLevel {
  target: P[];
  edges: [number, number][];
  initial: P[];
  nodes: number;
}

export function bandForLevel(levelId: number): DifficultyBand {
  if (levelId <= 5) return "tutorial";
  if (levelId <= 20) return "beginner";
  if (levelId <= 50) return "intermediate";
  if (levelId <= 80) return "advanced";
  if (levelId <= 100) return "expert";
  return "infinite";
}

function strictIntersect(a: P, b: P, c: P, d: P): boolean {
  const o = (p: P, q: P, r: P) =>
    (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const o1 = o(a, b, c);
  const o2 = o(a, b, d);
  const o3 = o(c, d, a);
  const o4 = o(c, d, b);
  const s1 = o1 > 0 !== o2 > 0;
  const s2 = o3 > 0 !== o4 > 0;
  const onSeg = (p: P, q: P, r: P) =>
    o(p, q, r) === 0 &&
    Math.min(p.x, q.x) <= r.x && r.x <= Math.max(p.x, q.x) &&
    Math.min(p.y, q.y) <= r.y && r.y <= Math.max(p.y, q.y);
  if (o1 === 0 && onSeg(a, b, c)) return false;
  if (o2 === 0 && onSeg(a, b, d)) return false;
  if (o3 === 0 && onSeg(c, d, a)) return false;
  if (o4 === 0 && onSeg(c, d, b)) return false;
  return s1 && s2;
}

/** Count strict crossings in the current drawing. 0 ⇒ solved. */
export function countCrossings(points: P[], edges: [number, number][]): number {
  let n = 0;
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const e1 = edges[i];
      const e2 = edges[j];
      if (e1[0] === e2[0] || e1[0] === e2[1] || e1[1] === e2[0] || e1[1] === e2[1]) continue;
      if (strictIntersect(points[e1[0]], points[e1[1]], points[e2[0]], points[e2[1]])) n++;
    }
  }
  return n;
}



/* ---------- planar graph families with known coordinates ---------- */

const clamp01 = (v: number) => Math.max(0.06, Math.min(0.94, v));

/** Wheel: centre + ring, spokes + ring cycle. Classic untangle shape. */
function wheel(outer: number): { target: P[]; edges: [number, number][] } {
  const pts: P[] = [{ x: 0.5, y: 0.5 }];
  for (let i = 0; i < outer; i++) {
    const a = (i / outer) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: 0.5 + Math.cos(a) * 0.38, y: 0.5 + Math.sin(a) * 0.38 });
  }
  const edges: [number, number][] = [];
  for (let i = 1; i <= outer; i++) edges.push([0, i]);
  for (let i = 1; i <= outer; i++) edges.push([i, (i % outer) + 1]);
  return { target: pts, edges };
}

/** Grid graph with one-directional diagonals (guaranteed crossing-free). */
function gridGraph(
  rng: () => number,
  w: number,
  h: number
): { target: P[]; edges: [number, number][] } {
  const pts: P[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      pts.push({ x: 0.12 + (x / (w - 1)) * 0.76, y: 0.12 + (y / (h - 1)) * 0.76 });
  const id = (x: number, y: number) => y * w + x;
  const edges: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x + 1 < w) edges.push([id(x, y), id(x + 1, y)]);
      if (y + 1 < h) edges.push([id(x, y), id(x, y + 1)]);
      // \ diagonals only — never cross each other or the grid edges
      if (x + 1 < w && y + 1 < h && chance(rng, 0.5)) edges.push([id(x, y), id(x + 1, y + 1)]);
    }
  }
  return { target: pts, edges };
}

/** Fan: hub node + spokes + a path along the ring. */
function fan(n: number): { target: P[]; edges: [number, number][] } {
  const pts: P[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: 0.5 + Math.cos(a) * 0.4, y: 0.5 + Math.sin(a) * 0.4 });
  }
  pts.push({ x: 0.5, y: 0.5 });
  const edges: [number, number][] = [];
  const hub = n;
  for (let i = 0; i < n; i++) edges.push([i, hub]);
  for (let i = 0; i < n - 1; i++) edges.push([i, i + 1]);
  return { target: pts, edges };
}

function scramblePositions(rng: () => number, target: P[], jitter: number): P[] {
  return target.map((p) => ({
    x: clamp01(p.x + (rng() * 2 - 1) * jitter),
    y: clamp01(p.y + (rng() * 2 - 1) * jitter),
  }));
}

export function generateLevel(levelId: number): UntangleLevel {
  const band = bandForLevel(levelId);
  const seed = hashSeed(`untangle:${levelId}`);
  const rng = mulberry32(seed);
  let family: { target: P[]; edges: [number, number][] };
  let jitter = 0.3;

  if (band === "tutorial" || band === "beginner") {
    const outer = int(rng, 4, 5);
    family = chance(rng, 0.5) ? wheel(outer) : fan(outer + 1);
    jitter = 0.32;
  } else if (band === "intermediate") {
    family = chance(rng, 0.6) ? wheel(int(rng, 6, 7)) : gridGraph(rng, int(rng, 3, 4), 3);
    jitter = 0.38;
  } else if (band === "advanced") {
    family = chance(rng, 0.5) ? gridGraph(rng, 4, 3) : wheel(int(rng, 7, 8));
    jitter = 0.44;
  } else {
    // expert / infinite: dense wheels & grids
    family = chance(rng, 0.5)
      ? wheel(int(rng, 8, 9))
      : gridGraph(rng, int(rng, 4, 5), int(rng, 3, 4));
    jitter = 0.48;
  }

  const target = family.target;

  // validation: the target layout must be crossing-free
  if (countCrossings(target, family.edges) !== 0) {
    const fb = wheel(5);
    return {
      target: fb.target,
      edges: fb.edges,
      initial: scramblePositions(rng, fb.target, 0.3),
      nodes: fb.target.length,
    };
  }

  const initial = scramblePositions(rng, target, jitter);
  return { target, edges: family.edges, initial, nodes: target.length };
}
