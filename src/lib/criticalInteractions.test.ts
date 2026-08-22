import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Regression guard for the actual bug that shipped: several core, must-
 * always-work interactions (opening a photo, collapsing the sidebar, a
 * page rendering at all) used framer-motion's `initial={{opacity:0}} /
 * animate={{opacity:1}}` pattern. In the real environment this was tested
 * in, that animate step sometimes never ran, leaving critical content
 * permanently invisible while technically mounted — clicks did nothing
 * visible. Every file below was deliberately rewritten onto plain CSS
 * (@keyframes or transitions triggered by a className/style change, not by
 * a JS-scheduled flip) specifically so this class of bug can't recur. This
 * test does not re-verify the animation itself (jsdom doesn't run real
 * animations) — it verifies the *fix stays in place*: none of these files
 * should import framer-motion again. If one legitimately needs to (e.g. a
 * new, genuinely decorative flourish that doesn't gate content visibility),
 * update this list deliberately rather than letting the import creep back
 * into a file that gates a required interaction.
 */
const MUST_NOT_USE_FRAMER_MOTION = [
  'src/components/media/PhotoViewer.tsx',
  'src/components/world/SiteSidebar.tsx',
  'src/components/world/ContentFrame.tsx',
  'src/components/world/WorldShell.tsx',
  'src/app/memories/page.tsx',
  'src/app/secret/page.tsx',
  'src/app/case/page.tsx',
  'src/app/little-things/page.tsx',
  'src/components/puzzle/PuzzleShell.tsx',
  'src/components/puzzle/PuzzleHint.tsx',
  'src/components/puzzle/PuzzleClue.tsx',
  'src/components/puzzle/levels/Level5Reveal.tsx',
  'src/components/spotify/FloatingSpotifyPlayer.tsx',
  'src/components/ui/EggToast.tsx',
  'src/components/notebook/NotebookShell.tsx',
];

const ROOT = process.cwd();

describe('critical interactions do not depend on framer-motion', () => {
  for (const file of MUST_NOT_USE_FRAMER_MOTION) {
    it(`${file} has no framer-motion import`, () => {
      const src = readFileSync(path.join(ROOT, file), 'utf8');
      expect(src).not.toMatch(/from ['"]framer-motion['"]/);
    });
  }
});

/**
 * Broader sweep: anywhere in the app that mounts a full-screen modal/lightbox
 * (`fixed inset-0` with a high z-index — the pattern every dialog on this
 * site uses) must not rely on a `requestAnimationFrame`-scheduled state flip
 * to become visible. That specific pattern is what broke PhotoViewer: it
 * mounts fine, but the visible-flip callback can silently never run on a
 * backgrounded/inactive tab, so "the modal opened" and "the modal is
 * permanently invisible" become indistinguishable from the outside. A
 * @keyframes animation applied directly in the initial className doesn't
 * have this failure mode — there's no later trigger to fail to fire.
 */
describe('full-screen overlays do not gate their first paint behind requestAnimationFrame', () => {
  const componentsDir = path.join(ROOT, 'src', 'components');
  const appDir = path.join(ROOT, 'src', 'app');

  function walk(dir: string, out: string[] = []): string[] {
    const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full, out);
      else if (/\.tsx$/.test(entry)) out.push(full);
    }
    return out;
  }

  const files = [...walk(componentsDir), ...walk(appDir)];
  const overlayFiles = files.filter((f) => {
    const src = readFileSync(f, 'utf8');
    return /fixed inset-0[^"'`]*z-\[?(9\d|100)\]?/.test(src);
  });

  it('found at least one full-screen overlay to check (sanity check the scan itself works)', () => {
    expect(overlayFiles.length).toBeGreaterThan(0);
  });

  for (const file of overlayFiles) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    it(`${rel} does not use requestAnimationFrame to trigger its own visibility`, () => {
      const src = readFileSync(file, 'utf8');
      // A rAF call is fine for other purposes (animation loops, resize
      // measurement); what's specifically unsafe is using it to schedule
      // the *first* flip of a visibility-controlling piece of state. We
      // can't perfectly distinguish intent statically, so this asserts the
      // narrower, exact shape of the bug that shipped: a rAF callback whose
      // body calls a setState setter directly.
      const dangerous = /requestAnimationFrame\(\s*\(\)\s*=>\s*set\w+\(/;
      expect(src).not.toMatch(dangerous);
    });
  }

  /**
   * `whileInView` found a second, independently-discovered instance of the
   * exact same failure class: content that only becomes visible once an
   * IntersectionObserver fires framer-motion's animate step. In the
   * environment this was caught in, that step also never ran — a list of
   * memory cards, and the secret-door's own hidden-memory reveals, sat at
   * opacity:0 forever despite being fully present in the DOM. `whileInView`
   * is banned outright across the app, not just in the files above: there's
   * no legitimate use of it on this site that's worth the risk of a real
   * visitor never seeing content that's actually there.
   */
  it('no file in the app uses whileInView', () => {
    const offenders = files.filter((f) => /whileInView/.test(readFileSync(f, 'utf8')));
    const rel = offenders.map((f) => path.relative(ROOT, f).replace(/\\/g, '/'));
    expect(rel).toEqual([]);
  });
});
