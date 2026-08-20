'use client';
import { useEffect, useMemo, useState } from 'react';
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
      <div className="card-tactile overflow-hidden">
        <MediaFigure media={item.media} className="aspect-[4/3] w-full object-cover" eager />
        <p className="font-monigue py-3 text-center text-lg italic text-parchment">{item.caption}</p>
      </div>
    );
  }
  if (item.kind === 'doodle') {
    return (
      <p className="card-inset font-monigue px-5 py-6 text-center text-xl italic text-parchment">
        {item.prompt}
      </p>
    );
  }
  return (
    <p className="card-inset font-monigue px-5 py-6 text-center text-xl italic text-parchment">
      {item.text}
    </p>
  );
}

export default function LittleThingsPage() {
  // dateLabel() formats via toLocaleDateString(undefined, ...) — the
  // server's default locale and the browser's can genuinely differ (or
  // just disagree on ICU data), which mismatches the SSR'd string against
  // what the client renders. todaysLittleThing() is calendar-day-seeded so
  // it's stable in practice, but computing both post-mount (like the
  // equivalent fix on the home page) removes the hydration risk entirely
  // rather than relying on it staying lucky.
  const initial = useMemo(() => todaysLittleThing(), []);
  const [today, setToday] = useState<DailyContent>(initial);
  const [label, setLabel] = useState('');

  useEffect(() => {
    setToday(todaysLittleThing());
    setLabel(dateLabel());
  }, []);

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
      <p className="font-nebulica text-[10px] uppercase tracking-[0.35em] text-muted-dim">{label}</p>
      <div className="mt-3">
        <RenderDaily item={today} />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="card-tactile p-6">
          <h2 className="font-magnode text-2xl text-parchment">missing me?</h2>
          <p className="font-monigue mt-2 text-base italic text-muted">sit with it for a second.</p>
          <button
            onClick={missingMe}
            className="font-nebulica mt-4 rounded-full border border-royal-vivid/50 px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] text-royal-vivid transition-colors hover:bg-royal-vivid/10"
          >
            yes, a little
          </button>
          <AnimatePresence>
            {missing && (
              <motion.p
                className="font-monigue mt-4 rounded-2xl bg-void/40 px-4 py-3 text-base italic text-parchment"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {missing}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="card-tactile p-6">
          <h2 className="font-magnode text-2xl text-parchment">make me smile</h2>
          <p className="font-monigue mt-2 text-base italic text-muted">small medicine, no side effects.</p>
          <button
            onClick={makeMeSmile}
            className="font-nebulica mt-4 rounded-full border border-brown-warm/60 px-6 py-2.5 text-[11px] uppercase tracking-[0.25em] text-parchment-dim transition-colors hover:bg-brown-warm/15"
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
                    <p className="font-monigue mt-2 text-center text-base italic text-parchment">{smile.caption}</p>
                  </>
                ) : smile.kind === 'doodle' ? (
                  <p className="font-monigue rounded-2xl bg-void/40 px-4 py-3 text-center text-base italic text-parchment">
                    {smile.prompt}
                  </p>
                ) : (
                  <p className="font-monigue rounded-2xl bg-void/40 px-4 py-3 text-center text-base italic text-parchment">
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
        <p className="font-nebulica text-[10px] uppercase tracking-[0.3em] text-muted-dim">some favourites</p>
        <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar pb-2">
          {PHOTO_DB.slice(0, 6).map((ph, i) => (
            <button
              key={ph.src}
              onClick={() => {
                sound.tap();
                setPhotoIdx(i);
              }}
              className={`h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-brown-warm/40 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)] transition-transform hover:-translate-y-1 ${i % 2 ? 'rotate-2' : '-rotate-1'}`}
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
