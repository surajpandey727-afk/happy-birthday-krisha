'use client';
import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Media } from '@/lib/types';
import { MediaFigure } from './MediaFigure';
import { fireEgg } from '@/lib/easterEggEngine';
import { sound } from '@/lib/sounds';
import { pushToast } from '@/lib/eggBus';

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

  const next = useCallback(() => {
    onIndexChange((activeRef.current + 1) % photos.length);
  }, [photos.length, onIndexChange]);
  const prev = useCallback(() => {
    onIndexChange((activeRef.current - 1 + photos.length) % photos.length);
  }, [photos.length, onIndexChange]);

  useEffect(() => {
    sound.tap();
    // tiny egg chance when opening a photo
    const egg = fireEgg('random');
    if (egg) pushToast(egg.message, egg.id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [next, prev, onClose]);

  if (!media) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ultramarine-deep/90 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative max-h-[86dvh] max-w-[92vw]"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15 paper">
            <MediaFigure media={media} className="max-h-[74dvh] max-w-[92vw] object-contain" eager />
          </div>
          <p className="mt-4 text-center font-hand text-2xl text-pink-cloud">
            {media.caption || 'us'}
          </p>
        </motion.div>

        {photos.length > 1 && (
          <>
            <button
              aria-label="previous photo"
              className="tap-target absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 rounded-full glass text-ink hover:scale-110 transition-transform"
              onClick={(e) => { e.stopPropagation(); prev(); }}
            >
              ‹
            </button>
            <button
              aria-label="next photo"
              className="tap-target absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 rounded-full glass text-ink hover:scale-110 transition-transform"
              onClick={(e) => { e.stopPropagation(); next(); }}
            >
              ›
            </button>
          </>
        )}

        <button
          aria-label="close"
          className="tap-target absolute top-4 right-4 rounded-full glass text-ink hover:rotate-90 transition-transform duration-300"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
}