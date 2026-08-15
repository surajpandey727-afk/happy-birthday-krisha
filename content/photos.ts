import type { Media } from "@/lib/types";

/**
 * The photo library. Every photo lives here; components never hardcode paths.
 * Replace each placeholder token with "/media/photos/01.jpg" (etc.) and the
 * world automatically grows — no component changes.
 */
export const PHOTOS: Media[] = [
  { src: "YOUR_PHOTO_01", caption: "the beginning", alt: "you and me", mood: "golden" },
  { src: "YOUR_PHOTO_02", caption: "your laugh", alt: "you laughing" },
  { src: "YOUR_PHOTO_03", caption: "that evening", alt: "us on an evening walk" },
  { src: "YOUR_PHOTO_04", caption: "daylight", alt: "sun through the window" },
  { src: "YOUR_PHOTO_05", caption: "our hands", alt: "hands together" },
  { src: "YOUR_PHOTO_06", caption: "golden hour", alt: "all golden", mood: "golden" },
] as const;

/** Photos reused as the memory wall / daily pick pool. */
export const PHOTO_DB = PHOTOS as Media[];