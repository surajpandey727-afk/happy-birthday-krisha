import manifest from '../content/generated-photo-manifest.json' with { type: 'json' };
import { ARCHIVE_CAPTIONS } from '../content/photo-captions.ts';

const PREVIEW_CAPTIONS = {
  "photo-001": { caption: "a wall by the sea" },
  "photo-002": { caption: "cambridge, an afternoon" },
  "photo-003": { caption: "off again" },
  "photo-005": { caption: "leake street" },
  "photo-007": { caption: "the mural on the corner" },
  "photo-009": { caption: "caught mid-look" },
  "photo-010": { caption: "the mirror kiss" },
  "photo-013": { caption: "dame vera lynn way" },
  "photo-016": { caption: "the white cliffs" },
  "photo-021": { caption: "late, laughing" },
};

const sorted = [...manifest].sort((a, b) => {
  const ad = a.date ? Date.parse(a.date) : null;
  const bd = b.date ? Date.parse(b.date) : null;
  if (ad === null && bd === null) return 0;
  if (ad === null) return 1;
  if (bd === null) return -1;
  return bd - ad;
});

const mediaEntries = sorted.map((entry) => {
  const known = PREVIEW_CAPTIONS[entry.id] ?? ARCHIVE_CAPTIONS[entry.id];
  const title = known?.caption ?? 'unfiled';
  return { src: `media/photos/full/${entry.id}.webp`, kind: 'image', title };
});

// Keep the 4 real sample videos already staged in this folder, interleaved in.
const videoTitles = [
  'a clip i kept',
  'mid-sentence, as usual',
  'no context, still funny',
  'evidence, your honour',
];
const videos = ['v01', 'v02', 'v03', 'v04'].map((v, i) => ({
  src: `media/${v}.mp4`, kind: 'video', title: videoTitles[i],
}));

const merged = [];
let vi = 0;
mediaEntries.forEach((m, i) => {
  merged.push(m);
  if (i > 0 && i % 6 === 0 && vi < videos.length) merged.push(videos[vi++]);
});
while (vi < videos.length) merged.push(videos[vi++]);

function jsArray(items) {
  return '[\n' + items.map(m => `  { src: ${JSON.stringify(m.src)}, kind: ${JSON.stringify(m.kind)}, title: ${JSON.stringify(m.title)} }`).join(',\n') + '\n]';
}

const photosOnly = mediaEntries.map(m => ({ src: m.src, caption: m.title }));
function jsPhotosArray(items) {
  return '[\n' + items.map(m => `  { src: ${JSON.stringify(m.src)}, caption: ${JSON.stringify(m.caption)} }`).join(',\n') + '\n]';
}

console.log('// MEDIA_COUNT', merged.length, 'PHOTOS_COUNT', photosOnly.length);
process.stdout.write('###MEDIA###\n');
process.stdout.write(jsArray(merged));
process.stdout.write('\n###PHOTOS###\n');
process.stdout.write(jsPhotosArray(photosOnly));
