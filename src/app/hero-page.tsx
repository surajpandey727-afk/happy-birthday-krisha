'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { HERO_MEDIA } from '@content/videos';
import { SITE } from '@content/site';
import { isPlaceholder } from '@/lib/media';
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
    <main className="relative h-dvh w-full overflow-hidden bg-void">
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
            style={{ background: `linear-gradient(160deg, var(--color-royal-deep), var(--color-void) 60%, var(--color-surface-alt))` }}
          >
            <motion.div
              className="h-full w-full"
              style={{
                background:
                  'radial-gradient(70% 90% at 30% 20%, color-mix(in srgb, var(--color-royal-vivid) 22%, transparent), transparent 60%), radial-gradient(80% 100% at 80% 100%, color-mix(in srgb, var(--color-brown-warm) 18%, transparent), transparent 55%)',
              }}
              animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}

        {/* colour wash + vignette */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,13,0.35),rgba(8,9,13,0.05)_40%,rgba(8,9,13,0.6))]" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(120% 100% at 50% 40%, transparent 55%, rgba(8,9,13,0.65))' }}
        />

        {/* blurred light shapes */}
        <motion.div
          className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'color-mix(in srgb, var(--color-royal-vivid) 32%, transparent)' }}
          animate={{ x: [0, 40, 0], y: [0, -24, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute -right-16 bottom-1/4 h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'color-mix(in srgb, var(--color-brown-warm) 30%, transparent)' }}
          animate={{ x: [0, -36, 0], y: [0, 26, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* ---- editorial typography ---- */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.p
          className="font-nebulica text-[10px] uppercase tracking-[0.55em] text-parchment/70"
          initial={{ opacity: 0, letterSpacing: '0.2em' }}
          animate={{ opacity: 1, letterSpacing: '0.55em' }}
          transition={{ duration: 1.6, delay: 0.6, ease: 'easeOut' }}
        >
          {SITE.name}
        </motion.p>

        <h1 className="font-apestron mt-4 text-[12vw] leading-[0.92] tracking-tight text-parchment sm:text-[6.5rem]">
          <motion.span
            className="block"
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
            STILL US<span className="text-royal-vivid">.</span>
          </motion.span>
        </h1>

        <motion.p
          className="font-monigue mt-5 max-w-xs text-xl italic text-muted sm:max-w-md sm:text-2xl"
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
          className="group font-monigue pointer-events-auto flex items-center gap-3 rounded-full glass px-8 py-4 text-2xl italic text-parchment shadow-luxe transition-transform hover:scale-105 active:scale-95"
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
          className="font-monigue absolute left-0 right-0 top-6 text-center text-xl italic text-muted/80"
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
