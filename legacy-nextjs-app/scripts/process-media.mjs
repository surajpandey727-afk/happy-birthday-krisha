#!/usr/bin/env node
/**
 * One-time media processing: reads every photo out of "Media Gallery/" (the
 * raw, gitignored 1.5GB source dump) and writes optimized WebP derivatives
 * into public/media/photos/{thumb,full}, plus a generated manifest consumed
 * by content/photos.ts. Videos are out of scope for this pass — Drift Wall
 * and the archive are image-only; video hosting is a separate follow-up.
 *
 * Run: node scripts/process-media.mjs
 */
import { readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import exifr from 'exifr';

const ROOT = path.resolve(import.meta.dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'Media Gallery');
const THUMB_DIR = path.join(ROOT, 'public', 'media', 'photos', 'thumb');
const FULL_DIR = path.join(ROOT, 'public', 'media', 'photos', 'full');
const MANIFEST_PATH = path.join(ROOT, 'content', 'generated-photo-manifest.json');

const THUMB_WIDTH = 480;
const FULL_WIDTH = 1600;

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png']);

function slugFromFilename(filename, index) {
  return `photo-${String(index + 1).padStart(3, '0')}`;
}

// A capture date for every photo, tried in order of confidence:
//   1. real EXIF DateTimeOriginal/CreateDate — camera-original files only
//   2. a date encoded directly in the filename by the phone/export tool
//      (Android camera / WhatsApp naming conventions) — reliable when present
//   3. file mtime — but ONLY when it's more than MTIME_TRUST_AGE_DAYS old at
//      the moment this script runs. A file that landed on disk within the
//      last few days is being copied/exported right now, not preserving a
//      real capture time — this collection proved that concretely: 70 of
//      the 100 photos are a "shared image (N).jpg" chat export where every
//      file got a *distinct* mtime spread across a 21-minute copy window
//      today, so a same-timestamp cluster check (the first version of this
//      heuristic) found zero duplicates and let all 70 through as if their
//      copy time were a real date. Comparing against wall-clock age instead
//      catches that regardless of how the copy tool staggered the timestamps.
// A photo that clears none of these tiers gets no date. See the summary this
// script prints at the end for exactly how many landed in each tier.
const MTIME_TRUST_AGE_DAYS = 14;
const FILENAME_DATE_PATTERNS = [
  // Android camera default naming: IMG_20250602_170022165.jpg (local time)
  {
    re: /^IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/,
    parse: (m) => new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`),
  },
  // WhatsApp export naming: IMG-20250812-WA0007.jpg — date only, no time; the
  // WA sequence number breaks ties between photos shared the same day.
  {
    re: /^IMG-(\d{4})(\d{2})(\d{2})-WA(\d+)/,
    parse: (m) => new Date(`${m[1]}-${m[2]}-${m[3]}T${String(Number(m[4]) % 24).padStart(2, '0')}:00:00`),
  },
];

function dateFromFilename(filename) {
  for (const { re, parse } of FILENAME_DATE_PATTERNS) {
    const m = filename.match(re);
    if (m) {
      const d = parse(m);
      if (!Number.isNaN(d.getTime())) return d;
    }
  }
  return null;
}

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(`No source directory at ${SOURCE_DIR} — nothing to process.`);
    process.exit(1);
  }

  await mkdir(THUMB_DIR, { recursive: true });
  await mkdir(FULL_DIR, { recursive: true });

  const entries = (await readdir(SOURCE_DIR))
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
    .sort();

  console.log(`Found ${entries.length} images in "Media Gallery/". Processing...`);

  const mtimes = new Map();
  for (const filename of entries) {
    mtimes.set(filename, (await stat(path.join(SOURCE_DIR, filename))).mtime);
  }
  const now = Date.now();
  const mtimeTrustCutoff = now - MTIME_TRUST_AGE_DAYS * 24 * 60 * 60 * 1000;

  const manifest = [];
  const dateSourceCounts = { exif: 0, filename: 0, mtime: 0, none: 0 };

  for (let i = 0; i < entries.length; i++) {
    const filename = entries[i];
    const srcPath = path.join(SOURCE_DIR, filename);
    const id = slugFromFilename(filename, i);

    const image = sharp(srcPath, { failOn: 'none' }).rotate();
    const meta = await image.metadata();

    const thumbOut = path.join(THUMB_DIR, `${id}.webp`);
    const fullOut = path.join(FULL_DIR, `${id}.webp`);

    await image
      .clone()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 68 })
      .toFile(thumbOut);

    await image
      .clone()
      .resize({ width: FULL_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(fullOut);

    const w = meta.width ?? THUMB_WIDTH;
    const h = meta.height ?? THUMB_WIDTH;

    let date = null;
    let dateSource = 'none';
    try {
      const exif = await exifr.parse(srcPath, ['DateTimeOriginal', 'CreateDate']);
      const exifDate = exif?.DateTimeOriginal ?? exif?.CreateDate;
      if (exifDate instanceof Date && !Number.isNaN(exifDate.getTime())) {
        date = exifDate;
        dateSource = 'exif';
      }
    } catch {
      // no readable EXIF — fall through to the next tier
    }
    if (!date) {
      const fnDate = dateFromFilename(filename);
      if (fnDate) {
        date = fnDate;
        dateSource = 'filename';
      }
    }
    if (!date) {
      const m = mtimes.get(filename);
      if (m.getTime() < mtimeTrustCutoff) {
        date = m;
        dateSource = 'mtime';
      }
    }
    dateSourceCounts[dateSource]++;

    manifest.push({
      id,
      src: `/media/photos/full/${id}.webp`,
      thumb: `/media/photos/thumb/${id}.webp`,
      w,
      h,
      date: date ? date.toISOString() : null,
      sourceFilename: filename,
    });

    if ((i + 1) % 10 === 0 || i === entries.length - 1) {
      console.log(`  ${i + 1}/${entries.length} — ${filename} → ${id}.webp`);
    }
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote ${manifest.length} entries to ${path.relative(ROOT, MANIFEST_PATH)}`);
  console.log('Thumb + full WebP derivatives written to public/media/photos/.');
  console.log('\nDate sources:');
  console.log(`  ${dateSourceCounts.exif} from real EXIF (DateTimeOriginal/CreateDate)`);
  console.log(`  ${dateSourceCounts.filename} from a date encoded in the filename`);
  console.log(`  ${dateSourceCounts.mtime} from file mtime (no EXIF/filename date, and older than ${MTIME_TRUST_AGE_DAYS} days)`);
  console.log(`  ${dateSourceCounts.none} undated (no reliable signal survived) — content/photos.ts keeps these`);
  console.log('    in their original scan order, sorted after every dated photo.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
