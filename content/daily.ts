import type { Media } from "@/lib/types";
import { PHOTO_PREVIEW as PHOTOS } from "./photos";
import { NOTES, SMILE_NOTES, MISSING_ME_NOTES } from "./site";

/**
 * "today's little thing" pool — a deterministic daily pick.
 * Options can be a photo, a note, a smile-note, a missing-me note, or a tiny
 * hand-drawn doodle instruction. Selection is date-seeded.
 */
export type DailyContent =
  | { kind: "photo"; media: Media; caption: string }
  | { kind: "note"; text: string }
  | { kind: "smile"; text: string }
  | { kind: "missing"; text: string }
  | { kind: "doodle"; prompt: string };

export const DAILY_POOL: DailyContent[] = [
  { kind: "photo", media: PHOTOS[0], caption: "today's little thing — the beginning." },
  { kind: "photo", media: PHOTOS[4], caption: "today's little thing — us, holding on." },
  { kind: "note", text: NOTES[0].text },
  { kind: "note", text: NOTES[3].text },
  { kind: "smile", text: SMILE_NOTES[1] },
  { kind: "missing", text: MISSING_ME_NOTES[1] },
  { kind: "doodle", prompt: "draw a tiny heart for today." },
  { kind: "photo", media: PHOTOS[2], caption: "today's little thing — an evening." },
  { kind: "note", text: NOTES[4].text },
];

/** Pool used by "make me smile" (random, non-seeded is fine). */
export const SMILE_POOL = DAILY_POOL;