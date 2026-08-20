import type { Media } from "@/lib/types";
import manifest from "./generated-photo-manifest.json";

/**
 * The photo library — real photos, processed from the raw source dump into
 * optimized WebP (see scripts/process-media.mjs). Every item has a `thumb`
 * (480px, for grids/walls) and a full-res `src` (1600px, for the lightbox).
 *
 * PREVIEW_CAPTIONS below hand-writes captions for a curated subset — the set
 * used on the Drift Wall preview and the home strip, where copy is load-
 * bearing. They're grounded only in what's actually visible in each photo
 * (coastal towns, London street art, Dover, an airport departure, a couple
 * of candids) — nothing invented about the relationship itself, since
 * getting that wrong would land worse than saying nothing. The remaining
 * ~90 photos in the full archive get honest, unembellished captions; a
 * proper caption for every one of them is real work best done with her
 * input, which belongs in the dedicated copywriting pass, not guessed here.
 */
const PREVIEW_CAPTIONS: Record<string, { caption: string; alt: string; mood?: string }> = {
  "photo-001": { caption: "a wall by the sea", alt: "sitting on a harbour wall, ruins across the water", mood: "golden" },
  "photo-002": { caption: "cambridge, an afternoon", alt: "a street in cambridge, spires overhead" },
  "photo-003": { caption: "off again", alt: "pushing a luggage cart through an airport", mood: "golden" },
  "photo-005": { caption: "leake street", alt: "under the graffiti tunnel, coffee in hand" },
  "photo-007": { caption: "the mural on the corner", alt: "standing beneath a painted angel" },
  "photo-009": { caption: "caught mid-look", alt: "candid, under a market gazebo" },
  "photo-010": { caption: "the mirror kiss", alt: "a kiss caught in a bathroom mirror", mood: "soft" },
  "photo-013": { caption: "dame vera lynn way", alt: "a signpost on the cliff path at dover" },
  "photo-016": { caption: "the white cliffs", alt: "sitting at the edge of dover's white cliffs", mood: "soft" },
  "photo-021": { caption: "late, laughing", alt: "a night selfie, both of you smiling", mood: "golden" },
};

type ManifestEntry = {
  id: string;
  src: string;
  thumb: string;
  w: number;
  h: number;
  sourceFilename: string;
};

const ALL_PHOTOS: Media[] = (manifest as ManifestEntry[]).map((entry) => {
  const known = PREVIEW_CAPTIONS[entry.id];
  return {
    src: entry.src,
    thumb: entry.thumb,
    w: entry.w,
    h: entry.h,
    kind: "image",
    caption: known?.caption,
    alt: known?.alt ?? "a real moment from our little world",
    mood: known?.mood,
  };
});

/** The hand-captioned subset — used for the Drift Wall hero preview and the home strip. */
export const PHOTO_PREVIEW: Media[] = ALL_PHOTOS.filter((p) =>
  Object.prototype.hasOwnProperty.call(PREVIEW_CAPTIONS, p.src.match(/photo-\d+/)?.[0] ?? "")
);

/** Every processed photo — the full archive ("See All"). */
export const PHOTO_DB: Media[] = ALL_PHOTOS;
