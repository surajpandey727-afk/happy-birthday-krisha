'use client';
import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { sound } from '@/lib/sounds';
import { haptics } from '@/lib/haptics';
import { fireEgg } from '@/lib/easterEggEngine';
import { pushToast } from '@/lib/eggBus';
import type { DifficultyBand } from '@/games/framework/progress';

export interface GameShellProps {
  gameId: string;
  title: string;
  subtitle?: string;
  current: number;
  total: number;
  doneMoves?: number;
  children: ReactNode;
  onUndo?: () => void;
  onRestart: () => void;
  onHint?: () => void;
  onSelectLevel: (n: number) => void;
  onLevelChangeBy: (delta: number) => void;
  showComplete?: boolean;
  onNext?: () => void;
  onCompleteTap?: () => void;
  completeLabel?: string;
  band?: DifficultyBand;
  undoDisabled?: boolean;
}

/** Shared game chrome: back, level picker, undo/restart/hint, completion. */
export function GameShell(props: GameShellProps) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showDeco, setShowDeco] = useState(false);
  const [linger, setLinger] = useState(false);

  const onLinger = () => {
    sound.tap();
    props.onCompleteTap?.();
    setPickerOpen(false);
  };

  const levelTotal = props.total === 999 || props.total > 200 ? 0 : props.total;

  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(120%_120%_at_50%_0%,var(--color-pink-wash),var(--color-cream))] pb-28 safe-bottom safe-top">
      <header className="sticky top-0 z-30 w-full">
        <div className="glass rounded-none border-x-0 border-t-0 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-3">
            <button
              aria-label="back to play table"
              className="tap-target rounded-full text-ink hover:bg-pink-cloud/50 transition-colors"
              onClick={() => router.push('/play')}
            >
              ←
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base leading-tight text-ink">{props.title}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-ink-soft">
                level {props.current}
                {props.total > 0 ? ` / ${levelTotal === 0 ? '∞' : levelTotal}` : ''}
                {props.doneMoves != null ? ` · ${props.doneMoves} ${props.doneMoves === 1 ? 'move' : 'moves'}` : ''}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                aria-label="choose level"
                className="tap-target rounded-full px-2 text-xs text-ink hover:bg-pink-cloud/50 transition-colors"
                onClick={() => { sound.tap(); setPickerOpen(true); }}
              >
                •••
              </button>
              <button
                aria-label="undo"
                disabled={props.undoDisabled}
                className="tap-target rounded-full text-lg text-ink enabled:hover:bg-pink-cloud/50 disabled:opacity-35 transition-colors"
                onClick={() => { haptics.tap(); props.onUndo?.(); }}
              >
                ↶
              </button>
              <button
                aria-label="restart level"
                className="tap-target rounded-full text-lg text-ink hover:bg-pink-cloud/50 transition-colors"
                onClick={() => { haptics.tap(); props.onRestart(); }}
              >
                ↻
              </button>
              {props.onHint && (
                <button
                  aria-label="hint"
                  className="tap-target rounded-full px-2 text-sm text-ink hover:bg-pink-cloud/50 transition-colors"
                  onClick={() => { sound.tap(); props.onHint?.(); }}
                >
                  ❓
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col items-center justify-center px-3 py-6">
        {props.children}

        <AnimatePresence>
          {props.showComplete && (
            <motion.div
              className="absolute inset-0 z-40 flex items-center justify-center bg-ultramarine-deep/55 px-6 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-sm rounded-3xl bg-warm-white p-8 text-center shadow-card paper"
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              >
                <div className="mb-3 font-hand text-5xl text-flamingo">✦</div>
                <h2 className="font-display text-3xl text-ink">solved.</h2>
                <p className="mt-1 font-hand text-2xl text-ink-soft">that one felt ours.</p>
                <div className="mt-5 flex flex-col gap-2">
                  {props.onNext && (
                    <button
                      onClick={() => { sound.tap(); props.onNext?.(); }}
                      className="rounded-2xl bg-ultramarine py-3 font-hand text-2xl text-warm-white shadow-soft hover:scale-[1.02] transition-transform"
                    >
                      next →
                    </button>
                  )}
                  <button
                    onClick={onLinger}
                    className="rounded-2xl bg-pink-cloud/60 py-2 font-hand text-xl text-ink"
                  >
                    linger here
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ultramarine-deep/50 px-6 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPickerOpen(false)}
          >
            <motion.div
              className="max-h-[70dvh] w-full max-w-sm overflow-y-auto rounded-3xl bg-warm-white p-5 shadow-card"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-hand text-3xl text-ink">choose a level</h3>
                <button aria-label="close" className="tap-target rounded-full text-ink" onClick={() => setPickerOpen(false)}>
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: Math.max(1, Math.min(levelTotal || 1, 200)) }, (_, i) => i + 1).map((n) => {
                  const isCurrent = n === props.current;
                  return (
                    <button
                      key={n}
                      aria-label={`level ${n}`}
                      disabled={n > props.current + (props.total === 0 ? 999 : 2)}
                      className={`tap-target aspect-square rounded-xl text-sm transition-colors ${
                        isCurrent
                          ? 'bg-ultramarine text-warm-white'
                          : n <= props.current
                            ? 'bg-pink-cloud/70 text-ink'
                            : 'bg-cream text-ink-soft'
                      }`}
                      onClick={() => { sound.tap(); props.onSelectLevel(n); setPickerOpen(false); }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
