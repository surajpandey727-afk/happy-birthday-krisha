'use client';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
    window.setTimeout(() => router.push('/us'), 950);
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
        <p className="hero-kicker-in font-nebulica text-[10px] uppercase tracking-[0.55em] text-parchment/70">
          {SITE.name}
        </p>

        <h1 className="font-apestron mt-4 text-[12vw] leading-[0.92] tracking-tight text-parchment sm:text-[6.5rem]">
          <span className="hero-title-in block" style={{ '--fade-delay': '0.2s' } as CSSProperties}>
            STILL YOU<span className="text-royal-vivid">.</span>
          </span>
          <span className="hero-title-in block" style={{ '--fade-delay': '0.45s' } as CSSProperties}>
            STILL US<span className="text-royal-vivid">.</span>
          </span>
        </h1>

        <p
          className="fade-in font-monigue mt-5 max-w-xs text-xl italic text-muted sm:max-w-md sm:text-2xl"
          style={{ '--fade-delay': '1.3s' } as CSSProperties}
        >
          a little place that belongs only to us.
        </p>
      </div>

      {/* ---- come in — the only way into the whole site, so this can't
          risk depending on framer-motion's animate step actually running.
          showComeIn flips well after mount (a real setTimeout, not a
          rAF-scheduled trigger), and a plain CSS opacity transition off
          that state change is reliable the same way the sidebar's collapse
          toggle is. */}
      <div
        className="absolute inset-x-0 bottom-0 flex justify-center pb-[max(env(safe-area-inset-bottom),2.25rem)]"
        style={{ opacity: showComeIn ? 1 : 0, transitionProperty: 'opacity', transitionDuration: '800ms' } as CSSProperties}
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
      </div>

      {slowMo && (
        <p className="pop-in font-monigue absolute left-0 right-0 top-6 text-center text-xl italic text-muted/80">
          . . .
        </p>
      )}
    </main>
  );
}
