/** Deterministic "today's little thing" selection, seeded by the calendar date. */
import { DAILY_POOL, type DailyContent } from "@content/daily";
import { hashSeed, mulberry32 } from "@/lib/seededRandom";

export function dailySeed(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return hashSeed(`daily:${y}-${m}-${d}`);
}

export function todaysLittleThing(date: Date = new Date()): DailyContent {
  const rng = mulberry32(dailySeed(date));
  const idx = Math.floor(rng() * DAILY_POOL.length) % DAILY_POOL.length;
  return DAILY_POOL[idx];
}

export function dateLabel(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}