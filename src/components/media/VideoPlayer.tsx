'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { isPlaceholder, placeholderMeta } from '@/lib/media';
import { sound } from '@/lib/sounds';

/**
 * Cinematic full-screen video player.
 * For real files it plays a <video>. For placeholder tokens it shows the reel
 * in a waiting state (no fake playback). Lazy: the element is only mounted
 * when opened.
 */
export function VideoPlayer({
  file,
  thumb,
  title,
  note,
  onClose,
}: {
  file: string;
  thumb?: string;
  title: string;
  note?: string;
  onClose: () => void;
}) {
  const vRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [err, setErr] = useState(false);
  const placeholder = isPlaceholder(file);
  const meta = placeholderMeta(file);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (playing) sound.tap();
  }, [playing]);

  const tryPlay = async () => {
    const v = vRef.current;
    if (!v) return;
    try {
      await v.play();
      setPlaying(true);
    } catch {
      setPlaying(true); // allow overlay to toggle manually
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* blurred ambient backdrop */}
        <div
          className="absolute inset-0 opacity-25 blur-2xl"
          style={{
            background: `linear-gradient(135deg, ${meta.from}, ${meta.to})`,
          }}
        />

        <motion.div
          className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden ring-1 ring-white/15 shadow-2xl"
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 210, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          {!placeholder && !err ? (
            <video
              ref={vRef}
              src={file}
              poster={thumb && !isPlaceholder(thumb) ? thumb : undefined}
              controls={playing}
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onError={() => setErr(true)}
            />
          ) : (
            <div
              className="relative flex h-full w-full items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
            >
              <div className="text-center px-6">
                <p className="font-display text-3xl sm:text-5xl text-[#fff] opacity-90 italic">
                  {title}
                </p>
                <p className="mt-3 font-hand text-2xl text-[#fff] opacity-70">
                  this reel is waiting for its film.
                </p>
                {note && (
                  <p className="mt-2 text-sm uppercase tracking-[0.3em] text-[#fff] opacity-50">
                    {note}
                  </p>
                )}
              </div>
              <motion.div
                className="absolute inset-x-0 bottom-0 h-1/3 opacity-30"
                style={{ background: 'radial-gradient(60% 100% at 50% 100%, #fff, transparent)' }}
                animate={{ opacity: [0.1, 0.35, 0.1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
          )}

          {!playing && !placeholder && !err && (
            <button
              aria-label="play"
              className="absolute inset-0 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); void tryPlay(); }}
            >
              <span className="tap-target h-16 w-16 rounded-full glass text-ultramarine text-2xl hover:scale-110 transition-transform">
                ▶
              </span>
            </button>
          )}
        </motion.div>

        <p className="mt-4 font-hand text-2xl text-pink-cloud">{note || title}</p>

        <button
          aria-label="close video"
          className="tap-target absolute top-4 right-4 rounded-full glass text-ink hover:rotate-90 transition-transform duration-300 z-10"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
}