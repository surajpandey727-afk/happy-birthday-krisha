import { NextResponse } from 'next/server';
import { mkdir, writeFile, readFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import exifr from 'exifr';

/**
 * Adds one photo to the archive: resizes it into the same thumb/full WebP
 * pair scripts/process-media.mjs produces for the rest of the library,
 * archives the original into "Media Gallery/" alongside the rest of the
 * raw source dump, and appends the new entry to
 * content/generated-photo-manifest.json.
 *
 * This writes directly to the project's filesystem, which only works
 * because this site currently runs as a real Node process (`next dev` /
 * `next start`) with a writable disk — exactly how it's being run today.
 * If this ever moves to static export or serverless hosting, on-disk
 * writes from a request handler either don't run at all or don't persist
 * between requests, and this route would need to be rebuilt against real
 * storage (S3/R2/a database) instead. Flagging that here rather than
 * discovering it silently after a deploy.
 *
 * In dev mode, editing generated-photo-manifest.json triggers Next's own
 * file watcher, so a newly uploaded photo shows up via Fast Refresh without
 * restarting the server. In a production `next start`, it does not — the
 * manifest is bundled at build time, so a rebuild is needed for uploads to
 * actually appear there.
 */

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'Media Gallery');
const THUMB_DIR = path.join(ROOT, 'public', 'media', 'photos', 'thumb');
const FULL_DIR = path.join(ROOT, 'public', 'media', 'photos', 'full');
const MANIFEST_PATH = path.join(ROOT, 'content', 'generated-photo-manifest.json');

const THUMB_WIDTH = 480;
const FULL_WIDTH = 1600;
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB — generous for a real phone photo, not open-ended

type ManifestEntry = {
  id: string;
  src: string;
  thumb: string;
  w: number;
  h: number;
  date: string | null;
  sourceFilename: string;
  caption?: string;
  alt?: string;
};

function nextId(manifest: ManifestEntry[]): { id: string; n: number } {
  let max = 0;
  for (const entry of manifest) {
    const m = /^photo-(\d+)$/.exec(entry.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  const n = max + 1;
  return { id: `photo-${String(n).padStart(3, '0')}`, n };
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'expected multipart form data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no file provided' }, { status: 400 });
  }
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    return NextResponse.json({ error: 'only jpeg, png, or webp images are accepted' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'file is too large (25MB max)' }, { status: 400 });
  }

  const caption = typeof form.get('caption') === 'string' ? (form.get('caption') as string).trim() : '';
  const alt = typeof form.get('alt') === 'string' ? (form.get('alt') as string).trim() : '';

  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(THUMB_DIR, { recursive: true });
  await mkdir(FULL_DIR, { recursive: true });
  await mkdir(SOURCE_DIR, { recursive: true });

  let manifest: ManifestEntry[] = [];
  if (existsSync(MANIFEST_PATH)) {
    try {
      manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    } catch {
      return NextResponse.json({ error: 'could not read the existing photo manifest' }, { status: 500 });
    }
  }

  const { id } = nextId(manifest);

  let date: string | null = null;
  try {
    const exif = await exifr.parse(buffer, ['DateTimeOriginal', 'CreateDate']);
    const exifDate = exif?.DateTimeOriginal ?? exif?.CreateDate;
    if (exifDate instanceof Date && !Number.isNaN(exifDate.getTime())) {
      date = exifDate.toISOString();
    }
  } catch {
    // no readable EXIF — fall through
  }
  if (!date) {
    // A fresh upload happening right now has no better signal than "now" —
    // unlike scripts/process-media.mjs's back-catalogue import, there's no
    // risk of mistaking a bulk-copy timestamp for a capture date here.
    date = new Date().toISOString();
  }

  const image = sharp(buffer, { failOn: 'none' }).rotate();
  const meta = await image.metadata();

  const thumbOut = path.join(THUMB_DIR, `${id}.webp`);
  const fullOut = path.join(FULL_DIR, `${id}.webp`);

  await image.clone().resize({ width: THUMB_WIDTH, withoutEnlargement: true }).webp({ quality: 68 }).toFile(thumbOut);
  await image.clone().resize({ width: FULL_WIDTH, withoutEnlargement: true }).webp({ quality: 82 }).toFile(fullOut);

  // Archive the original alongside the rest of the raw source dump, so a
  // future full reprocess (scripts/process-media.mjs) sees it too.
  const ext = path.extname(file.name) || '.jpg';
  const archivedName = `${id}${ext}`;
  const archivedPath = path.join(SOURCE_DIR, archivedName);
  await writeFile(archivedPath, buffer);

  const entry: ManifestEntry = {
    id,
    src: `/media/photos/full/${id}.webp`,
    thumb: `/media/photos/thumb/${id}.webp`,
    w: meta.width ?? THUMB_WIDTH,
    h: meta.height ?? THUMB_WIDTH,
    date,
    sourceFilename: archivedName,
  };
  if (caption) entry.caption = caption;
  if (alt) entry.alt = alt;

  manifest.push(entry);
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  return NextResponse.json({ ok: true, photo: entry });
}

// sharp is a native binary module — it only runs on the Node.js runtime,
// not the Edge runtime Next.js would otherwise be free to pick for a route
// this small.
export const runtime = 'nodejs';
