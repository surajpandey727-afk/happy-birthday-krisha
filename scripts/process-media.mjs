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
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

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

  const manifest = [];

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

    manifest.push({
      id,
      src: `/media/photos/full/${id}.webp`,
      thumb: `/media/photos/thumb/${id}.webp`,
      w,
      h,
      date: meta.exif ? undefined : undefined, // EXIF date parsing intentionally skipped — see note below
      sourceFilename: filename,
    });

    if ((i + 1) % 10 === 0 || i === entries.length - 1) {
      console.log(`  ${i + 1}/${entries.length} — ${filename} → ${id}.webp`);
    }
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote ${manifest.length} entries to ${path.relative(ROOT, MANIFEST_PATH)}`);
  console.log('Thumb + full WebP derivatives written to public/media/photos/.');
  console.log('\nNote: EXIF date extraction was skipped (sharp exposes raw EXIF buffers, not');
  console.log('parsed dates) — content/photos.ts assigns dates/captions/alt text by hand from');
  console.log('this manifest, since that requires knowing what is actually in each photo.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
