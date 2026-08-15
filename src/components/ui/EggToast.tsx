'use client';
import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onToast, renderHeartWords } from '@/lib/eggBus';
import { usePrefersReducedMotion } from '@/hooks/useMedia';

interface Toast {
  id: number;
  msg: string;
}

let counter = 0;

/** Soft floating Easter-egg / little-message toast. */
export function EggToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduced = usePrefersReducedMotion();

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  useEffect(() => {
    const off = onToast((msg, id) => {
      const t = { id: counter++ , msg };
      const autoId = id ?? t.id;
      void autoId;
      setToasts((prev) => [...prev.slice(-2), t]);
      const timeout = window.setTimeout(() => dismiss(t.id), 3200);
      // keep a ref? stored on window to avoid cleanup complexity
      (t as unknown as { to?: number }).to = timeout;
    });
    return off;
  }, [dismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex flex-col items-center gap-3 px-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => dismiss(t.id)}
            className="glass rounded-2xl px-5 py-3 font-hand text-2xl text-ink shadow-soft"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            {renderHeartWords(t.msg)}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}