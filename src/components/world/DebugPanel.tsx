'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { resetTotals } from '@/lib/progress';
import { resetEggs, loadEggState } from '@/lib/easterEggEngine';
import { sound } from '@/lib/sounds';

/**
 * Hidden developer/content mode. Opens with Ctrl+Shift+D.
 * Entirely disabled in production builds (NODE_ENV gate).
 */
export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open || process.env.NODE_ENV !== 'development') return;
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const tick = (now: number) => {
      frames++;
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  if (process.env.NODE_ENV !== 'development') return null;

  const resetAll = () => {
    resetTotals();
    resetEggs();
    sound.pop();
  };

  const eggState = loadEggState();

  return (
    <>
      {open && (
        <div className="fixed left-4 top-4 z-[200] w-72 rounded-2xl bg-ink p-4 text-warm-white shadow-card">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-hand text-2xl">dev room</p>
            <button aria-label="close" className="tap-target text-sm" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <p className="mb-2 text-xs text-pink-cloud">{fps != null ? `${fps} fps` : 'measuring…'}</p>

          <div className="flex flex-col gap-1.5 text-sm">
            <Link href="/secret" className="rounded-lg bg-white/10 px-3 py-2 hover:bg-white/20">jump → secret room</Link>
            <button className="rounded-lg bg-white/10 px-3 py-2 text-left hover:bg-white/20" onClick={resetAll}>
              reset all progress + eggs
            </button>
          </div>

          <p className="mt-3 text-xs text-white/60">
            eggs discovered: {Object.keys(eggState.discovered).length}
          </p>
        </div>
      )}
    </>
  );
}