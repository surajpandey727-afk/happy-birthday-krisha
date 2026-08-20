'use client';
import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WorldShell } from '@/components/world/WorldShell';
import { todaysLittleThing, dateLabel } from '@/lib/daily';
import { PHOTO_DB } from '@content/photos';
import { SMILE_POOL, type DailyContent } from '@content/daily';
import { SITE, MISSING_ME_NOTES } from '@content/site';
import { MediaFigure } from '@/components/media/MediaFigure';
import { PhotoViewer } from '@/components/media/PhotoViewer';
import { sound } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';
import { pushToast } from '@/lib/eggBus';
import { mulberry32, hashSeed } from '@/lib/seededRandom';

function RenderDaily({ item }: { item: DailyContent }) {
  if (item.kind === 'photo') {
    return (
      <div className="overflow-hidden rounded-2xl shadow-soft">
        <MediaFigure media={item.media} className="aspect-[4/3] w-full object-cover" eager />
        <p className="bg-warm-white py-3 text-center font-hand text-xl text-ink">{item.caption}</p>
      </div>
    );
  }
  if (item.kind === 'doodle') {
    return (
      <p className="rounded-2xl bg-pink-wash/70 px-5 py-6 text-center font-hand text-2xl text-ink">
        {item.prompt}
      </p>
    );
  }
  return (
    <p className="rounded-2xl bg-pink-wash/70 px-5 py-6 text-center font-hand text-2xl text-ink">
      {item.text}
    </p>
  );
}

export default function LittleThingsPage() {
  const today = useMemo(() => todaysLittleThing(), []);
  const label = useMemo(() => dateLabel(), []);
  const [missing, setMissing] = useState<string | null>(null);
  const [smile, setSmile] = useState<DailyContent | null>(null);
  const [photoIdx, setPhotoIdx] = useState<number | null>(null);

  const missingMe = () => {
    sound.select();
    haptics.tap();
    const rng = mulberry32(hashSeed(`missing:${Date.now()}`));
    const idx = Math.floor(rng() * MISSING_ME_NOTES.length);
    setMissing(MISSING_ME_NOTES[idx]);
    window.setTimeout(() => pushToast(SITE.missingMeAnswer), 2400);
  };

  const makeMeSmile = () => {
    sound.success();
    haptics.success();
    const rng = mulberry32(hashSeed(`smile:${Date.now()}`));
    const idx = Math.floor(rng() * SMILE_POOL.length);
    setSmile(SMILE_POOL[idx]);
  };

  return (
    <WorldShell kicker="today's little thing" title="little things" blurb="there's no hurry. everything here waits for you.">
      <p className="text-[11px] uppercase tracking-[0.35em] text-ink-soft">{label}</p>
      <div className="mt-3">
        <RenderDaily item={today} />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl bg-ultramarine p-6 text-warm-white shadow-card">
          <h2 className="font-display text-3xl">missing me?</h2>
          <p className="mt-2 font-hand text-xl text-pink-cloud">sit with it for a second.</p>
          <button
            onClick={missingMe}
            className="mt-4 rounded-2xl bg-warm-white px-6 py-3 font-hand text-2xl text-ultramarine shadow-soft hover:scale-[1.03] transition-transform"
          >
            yes, a little
          </button>
          <AnimatePresence>
            {missing && (
              <motion.p
                className="mt-4 rounded-2xl bg-white/10 px-4 py-3 font-hand text-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {missing}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="rounded-3xl bg-flamingo/90 p-6 text-warm-white shadow-card">
          <h2 className="font-display text-3xl">make me smile</h2>
          <p className="mt-2 font-hand text-xl text-pink-wash">small medicine, no side effects.</p>
          <button
            onClick={makeMeSmile}
            className="mt-4 rounded-2xl bg-warm-white px-6 py-3 font-hand text-2xl text-flamingo shadow-soft hover:scale-[1.03] transition-transform"
          >
            go on then
          </button>
          <AnimatePresence>
            {smile && (
              <motion.div
                className="mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {smile.kind === 'photo' ? (
                  <>
                    <div className="overflow-hidden rounded-2xl">
                      <MediaFigure media={smile.media} className="aspect-video w-full object-cover" />
                    </div>
                    <p className="mt-2 text-center font-hand text-xl">{smile.caption}</p>
                  </>
                ) : smile.kind === 'doodle' ? (
                  <p className="rounded-2xl bg-white/15 px-4 py-3 text-center font-hand text-xl">
                    {smile.prompt}
                  </p>
                ) : (
                  <p className="rounded-2xl bg-white/15 px-4 py-3 text-center font-hand text-xl">
                    {smile.text}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* a scrap of photos for the soft days */}
      <div className="mt-10">
        <p className="font-hand text-2xl text-ink-soft">some favourites</p>
        <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {PHOTO_DB.slice(0, 6).map((ph, i) => (
            <button
              key={ph.src}
              onClick={() => {
                sound.tap();
                setPhotoIdx(i);
              }}
              className={`h-32 w-32 shrink-0 overflow-hidden rounded-xl shadow-soft ring-1 ring-pink-cloud/40 ${i % 2 ? 'rotate-2' : '-rotate-1'}`}
            >
              <MediaFigure media={ph} variant="thumb" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {photoIdx != null && (
        <PhotoViewer
          photos={PHOTO_DB}
          index={photoIdx}
          onIndexChange={setPhotoIdx}
          onClose={() => setPhotoIdx(null)}
        />
      )}
    </WorldShell>
  );
}

