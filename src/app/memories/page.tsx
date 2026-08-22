'use client';
import { useRef, useState, type CSSProperties } from 'react';
import { WorldShell } from '@/components/world/WorldShell';
import { MEMORY_DB } from '@content/memories';
import { MediaFigure } from '@/components/media/MediaFigure';
import { PhotoViewer } from '@/components/media/PhotoViewer';
import { sound } from '@/lib/sounds';
import type { Media } from '@/lib/types';

const MODAL_CLOSE_MS = 200;

export default function MemoriesPage() {
  const open = MEMORY_DB.filter((m) => !m.hidden);
  const hidden = MEMORY_DB.filter((m) => m.hidden);
  const [active, setActive] = useState<(typeof MEMORY_DB)[number] | null>(null);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [photoIdx, setPhotoIdx] = useState<number | null>(null);

  const closeActive = () => {
    setClosing(true);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setActive(null);
      setClosing(false);
    }, MODAL_CLOSE_MS);
  };

  const mediaOf = (m: (typeof MEMORY_DB)[number]): Media[] => [
    ...(m.photos ?? []),
    ...(m.videos ?? []).map((v) => ({ ...v, kind: 'video' as const })),
  ];

  return (
    <WorldShell kicker="remember this?" title="memories" blurb="all the little maps of us." headline="kicker">
      <div className="flex flex-col gap-4">
        {open.map((m, i) => {
          const media = mediaOf(m);
          return (
            <button
              key={m.id}
              onClick={() => {
                sound.tap();
                setActive(m);
              }}
              className="fade-in-up card-tactile card-tactile-lift group flex w-full items-stretch gap-4 p-4 text-left"
              style={{ '--fade-delay': `${(i % 4) * 0.06}s` } as CSSProperties}
            >
              {media[0] && (
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-brown-warm/30 sm:h-28 sm:w-28">
                  <MediaFigure media={media[0]} variant="thumb" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-nebulica text-[10px] uppercase tracking-[0.3em] text-royal-vivid">
                  {m.mood ?? 'us'} {m.date ? `· ${m.date}` : ''}
                </p>
                <h2 className="mt-0.5 font-magnode text-2xl text-parchment">{m.title}</h2>
                {m.location && <p className="font-monigue text-base italic text-muted">{m.location}</p>}
                <p className="mt-1 line-clamp-2 text-sm text-muted-dim">{m.description}</p>
              </div>
              <span className="self-center text-xl text-muted-dim transition-transform duration-300 group-hover:translate-x-1 group-hover:text-royal-vivid">
                →
              </span>
            </button>
          );
        })}
      </div>

      {/* hidden memories — discovered, not advertised */}
      <div className="mt-10 text-center">
        <button
          onClick={() => {
            sound.select();
            setShowHidden((s) => !s);
          }}
          className="font-monigue text-base italic text-muted underline decoration-dotted underline-offset-4 hover:text-royal-vivid"
        >
          {showHidden ? 'close the whisper' : 'there might be a whisper in the wall . . .'}
        </button>
        {showHidden &&
          hidden.map((m, i) => (
            <button
              key={m.id}
              onClick={() => {
                sound.tap();
                setActive(m);
              }}
              className="fade-in card-inset font-monigue mt-3 block w-full px-4 py-4 text-left text-lg italic text-parchment transition-colors hover:border-royal-vivid/40"
              style={{ '--fade-delay': `${i * 0.06}s` } as CSSProperties}
            >
              {m.title ?? 'an unnamed moment'}
            </button>
          ))}
      </div>

      {/* memory detail — plain CSS @keyframes (see globals.css), not
          framer-motion; a modal is a core interaction and must never
          silently fail to appear. */}
      {active && (
        <div
          className={`fixed inset-0 z-[90] flex items-center justify-center bg-void/80 p-4 backdrop-blur-sm ${
            closing ? 'animate-[lightboxScrimOut_200ms_ease_both]' : 'animate-[lightboxScrimIn_200ms_ease_both]'
          }`}
          onClick={closeActive}
        >
          <div
            className={`card-tactile max-h-[86dvh] w-full max-w-lg overflow-y-auto p-6 ${
              closing
                ? 'animate-[modalCardOut_200ms_cubic-bezier(0.22,1,0.36,1)_both]'
                : 'animate-[modalCardIn_320ms_cubic-bezier(0.22,1,0.36,1)_both]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
              <p className="font-nebulica text-[10px] uppercase tracking-[0.3em] text-royal-vivid">
                {active.mood ?? 'us'} {active.date ? `· ${active.date}` : ''}
              </p>
              <h2 className="mt-1 font-magnode text-3xl text-parchment">{active.title}</h2>
              {active.location && (
                <p className="font-monigue text-lg italic text-muted">{active.location}</p>
              )}
              <p className="mt-3 text-muted">{active.description}</p>
              {active.note && (
                <p className="font-monigue mt-4 rounded-2xl bg-void/40 px-4 py-3 text-lg italic text-parchment">
                  {active.note}
                </p>
              )}
              {mediaOf(active).length > 0 && (
                <div className="mt-5 flex gap-3 overflow-x-auto no-scrollbar">
                  {mediaOf(active).map((m, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        sound.tap();
                        setPhotoIdx(i);
                      }}
                      className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-brown-warm/30"
                    >
                      <MediaFigure media={m} variant="thumb" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={closeActive}
                className="font-nebulica mt-6 w-full rounded-2xl border border-royal-vivid/40 py-3 text-[11px] uppercase tracking-[0.25em] text-royal-vivid transition-colors hover:bg-royal-vivid/10"
              >
                close
              </button>
          </div>
        </div>
      )}

      {active && photoIdx != null && (
        <PhotoViewer
          photos={mediaOf(active)}
          index={photoIdx}
          onIndexChange={setPhotoIdx}
          onClose={() => setPhotoIdx(null)}
        />
      )}
    </WorldShell>
  );
}
