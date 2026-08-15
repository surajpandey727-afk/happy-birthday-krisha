/* Generates the PWA + Open Graph raster assets from public/icons/icon.svg.
 * Run: node scripts/generate-icons.mjs   (sharp is a dev dependency) */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(path.join(root, 'public', 'icons', 'icon.svg'));

const jobs = [
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },
  { file: 'public/icons/apple-touch-icon.png', size: 180 },
];

for (const j of jobs) {
  await sharp(svg)
    .resize(j.size, j.size)
    .png()
    .toFile(path.join(root, j.file));
  console.log('wrote', j.file);
}

// Open Graph / favicon (1.91:1)
await sharp(svg)
  .resize(1200, 630, { fit: 'cover' })
  .png()
  .toFile(path.join(root, 'public', 'og.png'));
console.log('wrote public/og.png');

// simple favicon
await sharp(svg).resize(64, 64).png().toFile(path.join(root, 'public', 'favicon.png'));
console.log('wrote public/favicon.png');
