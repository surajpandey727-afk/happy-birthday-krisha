'use client';
import { useMemo, useState, type CSSProperties } from 'react';
import { WorldShell } from '@/components/world/WorldShell';
import { PHOTO_DB } from '@content/photos';
import { PhotoViewer } from '@/components/media/PhotoViewer';
import { PhotoUploader } from '@/components/media/PhotoUploader';
import DriftWall, { type DriftWallItem } from '@/components/reactbits/DriftWall';
import { sound } from '@/lib/sounds';
import { useElementWidth, useBreakpoint, usePrefersReducedMotion } from '@/hooks/useMedia';

const PREVIEW_COUNT = 30;

/** A wall of us — one continuous drifting archive, not a preview section
 * sitting above a differently-styled "full archive" grid. "see all" doesn't
 * swap to another component; it expands this same wall — more height, the
 * complete photo pool instead of the 30-photo preview — a folder unfolding
 * to show what's already inside it, not a new folder appearing. */
export default function UsPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const breakpoint = useBreakpoint();
  const reduced = usePrefersReducedMotion();
  const [wallRef, wallWidth] = useElementWidth<HTMLDivElement>();

  const pool = expanded ? PHOTO_DB : PHOTO_DB.slice(0, PREVIEW_COUNT);

  const wallItems: DriftWallItem[] = useMemo(
    () =>
      pool.map((ph) => ({
        image: ph.thumb ?? ph.src,
        alt: ph.alt,
        title: ph.caption,
      })),
    [pool]
  );

  // Real container width (tracked live via ResizeObserver — reacts to
  // window resizing AND the sidebar sliding in/out) drives column count, so
  // the wall actually grows to fill the freed space instead of staying a
  // fixed composition centered in a wider, mostly-empty box.
  const gap = breakpoint === 'mobile' ? 10 : breakpoint === 'tablet' ? 14 : 18;
  const targetTile = breakpoint === 'mobile' ? 110 : breakpoint === 'tablet' ? 150 : 190;
  const columns = wallWidth > 0 ? Math.min(9, Math.max(3, Math.round(wallWidth / (targetTile + gap)))) : 5;
  const tileWidth = wallWidth > 0 ? Math.round(wallWidth / columns - gap) : targetTile;
  const tileHeight = Math.round(tileWidth * 1.25);
  const compactHeight = breakpoint === 'mobile' ? 620 : breakpoint === 'tablet' ? 760 : 900;
  const expandedHeight = breakpoint === 'mobile' ? 1600 : breakpoint === 'tablet' ? 2000 : 2400;
  const wallHeight = expanded ? expandedHeight : compactHeight;

  const openWallPhoto = (item: DriftWallItem) => {
    const idx = PHOTO_DB.findIndex((p) => p.src === item.image || p.thumb === item.image);
    sound.tap();
    setOpenIdx(idx >= 0 ? idx : 0);
  };

  const wallStyle: CSSProperties = {
    height: wallHeight,
    transitionProperty: 'height',
    transitionDuration: reduced ? '0ms' : '700ms',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  };

  return (
    <WorldShell
      kicker="a wall of us"
      title="us"
      blurb="every version of us I didn't want to lose."
      headline="kicker"
      fullBleed={
        <section aria-label="a wall of us" className="px-5 sm:px-8">
          <div ref={wallRef} style={wallStyle} className="overflow-hidden rounded-3xl ring-1 ring-royal/40">
            {wallWidth > 0 && (
              <DriftWall
                items={wallItems}
                onSelect={openWallPhoto}
                overlayColor="#08090d"
                dim={0.5}
                fade={0.55}
                speed={reduced ? 0 : 34}
                grayscale={false}
                columns={columns}
                tileWidth={tileWidth}
                tileHeight={tileHeight}
                gap={gap}
              />
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="font-monigue text-sm italic text-muted">nothing here is in order. wander.</p>
            <div className="flex shrink-0 gap-2">
              <PhotoUploader onUploaded={() => window.location.reload()} />
              <button
                onClick={() => {
                  sound.tap();
                  setExpanded((v) => !v);
                }}
                className="font-nebulica rounded-full border border-royal-vivid/50 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-royal-vivid transition-colors hover:bg-royal-vivid/10"
              >
                {expanded ? 'close the wall' : 'see all'}
              </button>
            </div>
          </div>
        </section>
      }
    >
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
