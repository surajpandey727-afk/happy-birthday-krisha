'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { WorldShell } from '@/components/world/WorldShell';
import { PHOTO_DB } from '@content/photos';
import { MediaFigure } from '@/components/media/MediaFigure';
import { PhotoViewer } from '@/components/media/PhotoViewer';
import { sound } from '@/lib/sounds';
import { NOTES } from '@content/site';

/** A wall of us — scattered polaroids + immersive viewer. */
export default function UsPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const polaroids = useMemo(
    () =>
      PHOTO_DB.map((ph, i) => ({
        ph,
        rotate: [1.5, -2, 2.5, -1, 2, -2.5][i % 6],
        x: i % 3,
      })),
    []
  );

  return (
    <WorldShell kicker="a wall of us" title="us" blurb="look what we did.">
      <div className="columns-2 gap-4 sm:columns-3 [column-fill:balance]">
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
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (i % 3) * 0.08 }}
          >
            <div className="overflow-hidden rounded-sm">
              <MediaFigure media={ph} className="aspect-[4/5] w-full object-cover" />
            </div>
            <p className="mt-1.5 px-1 font-hand text-lg text-ink">{ph.caption}</p>
          </motion.button>
        ))}
      </div>

      <p className="mt-6 text-center font-hand text-xl text-ink-soft">
        {NOTES[3].text} · tap one to hold it
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