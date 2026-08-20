'use client';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldShell } from '@/components/world/WorldShell';
import { PHOTO_DB, PHOTO_PREVIEW } from '@content/photos';
import { MediaFigure } from '@/components/media/MediaFigure';
import { PhotoViewer } from '@/components/media/PhotoViewer';
import DriftWall, { type DriftWallItem } from '@/components/reactbits/DriftWall';
import { sound } from '@/lib/sounds';
import { NOTES } from '@content/site';
import { useBreakpoint, usePrefersReducedMotion } from '@/hooks/useMedia';

/** A wall of us — the Drift Wall preview, expanding into the full archive. */
export default function UsPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const breakpoint = useBreakpoint();
  const reduced = usePrefersReducedMotion();

  const wallItems: DriftWallItem[] = useMemo(
    () =>
      PHOTO_PREVIEW.map((ph) => ({
        image: ph.thumb ?? ph.src,
        alt: ph.alt,
        title: ph.caption,
      })),
    []
  );

  const wallProps =
    breakpoint === 'mobile'
      ? { columns: 3, tileWidth: 112, tileHeight: 148, gap: 10 }
      : breakpoint === 'tablet'
        ? { columns: 4, tileWidth: 160, tileHeight: 200, gap: 14 }
        : { columns: 5, tileWidth: 200, tileHeight: 250, gap: 18 };

  const wallHeight = breakpoint === 'mobile' ? 560 : breakpoint === 'tablet' ? 660 : 820;

  const polaroids = useMemo(
    () =>
      PHOTO_DB.map((ph, i) => ({
        ph,
        rotate: [1.5, -2, 2.5, -1, 2, -2.5][i % 6],
      })),
    []
  );

  const openWallPhoto = (item: DriftWallItem) => {
    const idx = PHOTO_DB.findIndex((p) => p.src === item.image || p.thumb === item.image);
    sound.tap();
    setOpenIdx(idx >= 0 ? idx : 0);
  };

  return (
    <WorldShell kicker="a wall of us" title="us" blurb="a little archive, always drifting.">
      <section aria-label="drift wall — a preview of the archive">
        <div
          style={{ height: wallHeight }}
          className="overflow-hidden rounded-3xl ring-1 ring-royal/40"
        >
          <DriftWall
            items={wallItems}
            onSelect={openWallPhoto}
            overlayColor="#08090d"
            dim={0.5}
            fade={0.55}
            speed={reduced ? 0 : 34}
            grayscale={false}
            {...wallProps}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="font-monigue text-sm italic text-muted">move through the archive.</p>
          <button
            onClick={() => {
              sound.tap();
              setShowAll((v) => !v);
            }}
            className="font-nebulica shrink-0 rounded-full border border-royal-vivid/50 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-royal-vivid transition-colors hover:bg-royal-vivid/10"
          >
            {showAll ? 'close archive' : 'see all'}
          </button>
        </div>
      </section>

      <AnimatePresence>
        {showAll && (
          <motion.section
            aria-label="the full archive"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-10 columns-2 gap-4 sm:columns-3 [column-fill:balance]">
              {polaroids.map(({ ph, rotate }, i) => (
                <motion.button
                  key={ph.src}
                  onClick={() => {
                    sound.tap();
                    setOpenIdx(i);
                  }}
                  className="mb-4 block w-full break-inside-avoid rounded-md bg-warm-white p-2 pb-3 text-left shadow-soft transition-transform hover:-translate-y-1.5 hover:shadow-card"
                  style={{ rotate: `${rotate}deg` }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (i % 6) * 0.05 }}
                >
                  <div className="overflow-hidden rounded-sm">
                    <MediaFigure media={ph} variant="thumb" className="aspect-[4/5] w-full object-cover" />
                  </div>
                  {ph.caption && <p className="mt-1.5 px-1 font-hand text-lg text-ink">{ph.caption}</p>}
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <p className="mt-6 text-center font-hand text-xl text-ink-soft">
        {NOTES[3].text}
      </p>

      {openIdx != null && (
        <PhotoViewer
          photos={PHOTO_DB}
          index={openIdx}
          onIndexChange={setOpenIdx}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </WorldShell>
  );
}
