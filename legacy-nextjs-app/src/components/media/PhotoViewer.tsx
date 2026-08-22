'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Media } from '@/lib/types';
import { MediaFigure } from './MediaFigure';
import { fireEgg } from '@/lib/easterEggEngine';
import { sound } from '@/lib/sounds';
import { pushToast } from '@/lib/eggBus';

const CLOSE_MS = 220;

/** The lightbox. Driven by @keyframes CSS animations, not framer-motion and
 * not a JS-triggered transition — see the `lightboxScrimIn`/`lightboxFrameIn`
 * comment in globals.css. This is a core interaction (open a photo) that
 * must never silently fail to appear. */
export function PhotoViewer({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: Media[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}) {
  const media = photos[index];
  const activeRef = useRef(index);
  activeRef.current = index;
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const next = useCallback(() => {
    onIndexChange((activeRef.current + 1) % photos.length);
  }, [photos.length, onIndexChange]);
  const prev = useCallback(() => {
    onIndexChange((activeRef.current - 1 + photos.length) % photos.length);
  }, [photos.length, onIndexChange]);

  const requestClose = useCallback(() => {
    setClosing(true);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(onClose, CLOSE_MS);
  }, [onClose]);

  useEffect(() => {
    sound.tap();
    const egg = fireEgg('random');
    if (egg) pushToast(egg.message, egg.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, [next, prev, requestClose]);

  if (!media) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-void/90 backdrop-blur-md ${
        closing ? 'animate-[lightboxScrimOut_220ms_ease_both]' : 'animate-[lightboxScrimIn_220ms_ease_both]'
      }`}
      onClick={requestClose}
    >
      <div
        className={`relative max-h-[86dvh] max-w-[92vw] ${
          closing
            ? 'animate-[lightboxFrameOut_220ms_cubic-bezier(0.22,1,0.36,1)_both]'
            : 'animate-[lightboxFrameIn_280ms_cubic-bezier(0.22,1,0.36,1)_both]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl overflow-hidden shadow-luxe ring-1 ring-royal-vivid/25 paper">
          <MediaFigure media={media} className="max-h-[74dvh] max-w-[92vw] object-contain" eager />
        </div>
        <p className="font-monigue mt-4 text-center text-xl italic text-parchment-dim">
          {media.caption || 'us'}
        </p>
      </div>

      {photos.length > 1 && (
        <>
          <button
            aria-label="previous photo"
            className="tap-target absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 rounded-full glass text-parchment hover:scale-110 transition-transform"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            ‹
          </button>
          <button
            aria-label="next photo"
            className="tap-target absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 rounded-full glass text-parchment hover:scale-110 transition-transform"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            ›
          </button>
        </>
      )}

      <button
        aria-label="close"
        className="tap-target absolute top-4 right-4 rounded-full glass text-parchment hover:rotate-90 transition-transform duration-300"
        onClick={(e) => { e.stopPropagation(); requestClose(); }}
      >
        ✕
      </button>
    </div>
  );
}
