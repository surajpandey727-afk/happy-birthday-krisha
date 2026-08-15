'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { HERO_MEDIA } from '@content/videos';
import { SITE } from '@content/site';
import { isPlaceholder, placeholderMeta } from '@/lib/media';
import { useIsFirstVisit } from '@/hooks/useVisit';
import { usePrefersReducedMotion } from '@/hooks/useMedia';
import { sound, unlockAudio } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';

/** The opening film. Video-first; placeholder gracefully if no file yet. */
export default function HeroPage() {
  const router = useRouter();
  const first = useIsFirstVisit();
  const reduced = usePrefersReducedMotion();
  const [showComeIn, setShowComeIn] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [slowMo, setSlowMo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const meta = placeholderMeta(HERO_MEDIA.video);
  const isRealVideo = !isPlaceholder(HERO_MEDIA.video);

  useEffect(() => {
    unlockAudio();
    const t1 = window.setTimeout(() => setShowComeIn(true), first ? 3400 : 1900);

    // the slow-motion beat: time stops for a second, then flows again
    let t2 = 0;
    if (!reduced && isRealVideo) {
      t2 = window.setTimeout(() => {
        setSlowMo(true);
        const v = videoRef.current;
        if (v) v.playbackRate = 0.32;
        window.setTimeout(() => {
          setSlowMo(false);
          if (videoRef.current) videoRef.current.playbackRate = 1;
        }, 1600);
      }, 1500);
    }
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [first, reduced, isRealVideo]);

  const enter = () => {
    if (exiting) return;
    sound.success();
    haptics.success();
    setExiting(true);
    window.setTimeout(() => router.push('/home'), 950);
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ultramarine-deep">
      {/* ---- the film ---- */}
      <motion.div
        className="absolute inset-0"
        animate={
          exiting
            ? { scale: 0.8, y: 70, borderRadius: 40, filter: 'blur(2px)' }
            : { scale: 1, y: 0, borderRadius: 0, filter: 'blur(0px)' }
        }
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'center bottom' }}
      >
        {isRealVideo ? (
          <video
            ref={videoRef}
            src={HERO_MEDIA.video}
            poster={!isPlaceholder(HERO_MEDIA.poster) ? HERO_MEDIA.poster : undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
            style={{ filter: slowMo ? 'saturate(0.85) contrast(1.02)' : 'none' }}
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
          >
            <motion.div
              className="h-full w-full"
              style={{
                background:
                  'radial-gradient(70% 90% at 30% 20%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(80% 100% at 80% 100%, rgba(255,255,255,0.18), transparent 55%)',
              }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}

        {/* colour wash + vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(29,22,102,0.25),rgba(29,22,102,0.05)_40%,rgba(29,22,102,0.55))]" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(120% 100% at 50% 40%, transparent 55%, rgba(16,11,54,0.55))' }}
        />

        {/* blurred light shapes */}
        <motion.div
          className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'rgba(246,196,214,0.35)' }}
          animate={{ x: [0, 40, 0], y: [0, -24, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -right-16 bottom-1/4 h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'rgba(86,80,194,0.4)' }}
          animate={{ x: [0, -36, 0], y: [0, 26, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* ---- editorial typography ---- */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.p
          className="text-[11px] uppercase tracking-[0.55em] text-warm-white/70"
          initial={{ opacity: 0, letterSpacing: '0.2em' }}
          animate={{ opacity: 1, letterSpacing: '0.55em' }}
          transition={{ duration: 1.6, delay: 0.6, ease: 'easeOut' }}
        >
          {SITE.name}
        </motion.p>

        <h1 className="mt-4 font-display text-[13vw] leading-[0.95] text-warm-white sm:text-[7rem]">
          <motion.span
            className="block italic"
            initial={{ opacity: 0, y: 46, filter: 'blur(14px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          >
            YOU + ME
          </motion.span>
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, delay: 1.35, ease: [0.22, 1, 0.36, 1] }}
          >
            STILL US<span className="text-flamingo">.</span>
          </motion.span>
        </h1>

        <motion.p
          className="mt-5 max-w-xs font-hand text-2xl text-pink-cloud sm:max-w-md sm:text-3xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.1 }}
        >
          a little place that belongs only to us.
        </motion.p>
      </div>

      {/* ---- come in ---- */}
      <motion.div
        className="absolute inset-x-0 bottom-0 flex justify-center pb-[max(env(safe-area-inset-bottom),2.25rem)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: showComeIn ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        <button
          onClick={enter}
          className="group pointer-events-auto flex items-center gap-3 rounded-full glass px-8 py-4 font-hand text-3xl text-ink shadow-soft hover:scale-105 active:scale-95 transition-transform"
          aria-label="come in"
        >
          {first ? 'come in.' : 'come back in.'}
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">
            →
          </span>
        </button>
      </motion.div>

      {slowMo && (
        <motion.p
          className="absolute top-6 left-0 right-0 text-center font-hand text-2xl text-pink-cloud/80"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          . . .
        </motion.p>
      )}
    </main>
  );
}

