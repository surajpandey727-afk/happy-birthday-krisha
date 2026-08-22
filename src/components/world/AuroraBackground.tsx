'use client';
import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/useMedia';
import Scanner from '@/components/reactbits/Scanner';

/** A shooting star in flight — spawned at a random height off the left or
 * right edge, travels roughly horizontally with a slight diagonal drift. */
interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
  color: string;
}

const STAR_COLORS = ['#efe4d0', '#c9d6ff', '#ffe3c2'];

/** The site-wide living backdrop: slow-drifting aurora ribbons in the
 * design system's ultramarine/bronze palette (pure CSS, driven by the
 * auroraDrift keyframes in globals.css — and automatically stilled by that
 * file's prefers-reduced-motion rule, no JS gating needed here) plus a
 * canvas layer of shooting stars — 2-5 per batch, a batch every 5-8s, each
 * entering from a random height on the left or right edge. Mounted once in
 * the root layout so it persists across route changes instead of
 * restarting on every page. */
export function AuroraBackground() {
  const reduced = usePrefersReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars: Star[] = [];
    let raf = 0;
    const pendingTimers = new Set<number>();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const runAfter = (delay: number, fn: () => void) => {
      const id = window.setTimeout(() => {
        pendingTimers.delete(id);
        fn();
      }, delay);
      pendingTimers.add(id);
    };

    // enters from a random point along the FULL height of either edge, not
    // a fixed origin — a random side, random y, then a mostly-horizontal
    // path with a shallow diagonal so it reads as a real shooting star.
    function spawnStar() {
      const fromLeft = Math.random() < 0.5;
      const speed = 7 + Math.random() * 6;
      const drift = (Math.random() - 0.5) * 0.7;
      stars.push({
        x: fromLeft ? -60 : width + 60,
        y: Math.random() * height,
        vx: fromLeft ? speed : -speed,
        vy: speed * drift,
        life: 0,
        maxLife: 70 + Math.random() * 40,
        length: 90 + Math.random() * 70,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
    }

    // a batch of 2-5 stars, lightly staggered so they don't launch in
    // perfect lockstep, then the next batch 5-8s later.
    function spawnBatch() {
      const count = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < count; i++) {
        runAfter(i * (150 + Math.random() * 300), spawnStar);
      }
    }

    function scheduleNextBatch() {
      runAfter(5000 + Math.random() * 3000, () => {
        spawnBatch();
        scheduleNextBatch();
      });
    }

    runAfter(900 + Math.random() * 600, () => {
      spawnBatch();
      scheduleNextBatch();
    });

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      stars = stars.filter((s) => {
        s.life++;
        s.x += s.vx;
        s.y += s.vy;
        const fadeIn = Math.min(1, s.life / 8);
        const fadeOut = Math.max(0, 1 - Math.max(0, s.life - (s.maxLife - 20)) / 20);
        const alpha = Math.min(fadeIn, fadeOut);
        const offscreen = s.x < -120 || s.x > width + 120 || s.y < -120 || s.y > height + 120;
        if (s.life > s.maxLife || offscreen) return false;

        const mag = Math.hypot(s.vx, s.vy) || 1;
        const tailX = s.x - (s.vx / mag) * s.length;
        const tailY = s.y - (s.vy / mag) * s.length;

        ctx.save();
        ctx.globalAlpha = alpha;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, s.color);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();

        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
      pendingTimers.forEach((id) => window.clearTimeout(id));
      pendingTimers.clear();
    };
  }, [reduced]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base" aria-hidden>
      <div
        className="absolute -top-1/4 left-[-20%] h-[70vh] w-[140%] blur-[90px]"
        style={{
          background:
            'radial-gradient(60% 100% at 30% 30%, color-mix(in srgb, var(--color-royal-vivid) 55%, transparent), transparent 70%), radial-gradient(50% 90% at 70% 60%, color-mix(in srgb, var(--color-royal-bright) 45%, transparent), transparent 70%)',
          mixBlendMode: 'screen',
          animation: 'auroraDriftA 26s ease-in-out infinite',
        }}
      />
      <div
        className="absolute top-[15%] right-[-25%] h-[65vh] w-[130%] blur-[100px]"
        style={{
          background:
            'radial-gradient(55% 90% at 60% 40%, color-mix(in srgb, var(--color-brown-warm) 40%, transparent), transparent 70%), radial-gradient(45% 80% at 30% 70%, color-mix(in srgb, var(--color-royal) 50%, transparent), transparent 70%)',
          mixBlendMode: 'screen',
          animation: 'auroraDriftB 32s ease-in-out infinite',
        }}
      />
      <div
        className="absolute bottom-[-20%] left-[-15%] h-[60vh] w-[130%] blur-[95px]"
        style={{
          background:
            'radial-gradient(55% 90% at 40% 50%, color-mix(in srgb, var(--color-royal-vivid) 35%, transparent), transparent 70%), radial-gradient(40% 80% at 75% 40%, color-mix(in srgb, var(--color-brown-warm) 30%, transparent), transparent 70%)',
          mixBlendMode: 'screen',
          animation: 'auroraDriftC 38s ease-in-out infinite',
        }}
      />
      {/* a faint interference sweep over the aurora — kept very subtle and
          paused whenever off-screen or the tab is hidden (see Scanner.tsx),
          and skipped for reduced-motion so it never fights the site's
          heaviness/performance budget for an effect this understated. */}
      {!reduced && (
        <div className="absolute inset-0">
          <Scanner
            color1="#28479e"
            color2="#6a4632"
            color3="#efe4d0"
            speed={0.18}
            sweepSpeed={0.07}
            sweepWidth={2.6}
            sweepFalloff={9}
            scale={2}
            frequency={1.1}
            ripple={0.1}
            bandDensity={6}
            lineSharpness={7}
            glow={0.06}
            scanDirection="diagonal"
            colorSpread={0.4}
            brightness={0.5}
            contrast={1.3}
            softness={1.8}
            vignette={0.6}
            scanline={false}
            grain={false}
            opacity={0.16}
            mouseInteraction={false}
          />
        </div>
      )}

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
