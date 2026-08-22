'use client';
import { useEffect, useState, useCallback } from 'react';
import { onToast, renderHeartWords } from '@/lib/eggBus';
import { usePrefersReducedMotion } from '@/hooks/useMedia';

interface Toast {
  id: number;
  msg: string;
  closing?: boolean;
}

const TOAST_CLOSE_MS = 220;

let counter = 0;

/** Soft floating Easter-egg / little-message toast. Enter/exit are plain
 * @keyframes (not a framer-motion initial/animate pair) — toasts fire
 * constantly across the whole site, so this is one of the highest-traffic
 * places a stuck-at-opacity:0 mount would actually be seen. */
export function EggToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduced = usePrefersReducedMotion();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((x) => (x.id === id ? { ...x, closing: true } : x)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, TOAST_CLOSE_MS);
  }, []);

  useEffect(() => {
    const off = onToast((msg, id) => {
      const t = { id: counter++, msg };
      void id;
      setToasts((prev) => [...prev.slice(-2), t]);
      window.setTimeout(() => dismiss(t.id), 3200);
    });
    return off;
  }, [dismiss]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex flex-col items-center gap-3 px-6">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto font-monigue glass rounded-2xl px-5 py-3 text-lg italic text-parchment shadow-luxe ${
            reduced
              ? t.closing
                ? 'animate-[toastOutReduced_0.2s_ease_both]'
                : 'animate-[toastInReduced_0.4s_ease_both]'
              : t.closing
                ? 'animate-[toastOut_0.22s_ease-in_both]'
                : 'animate-[toastIn_0.45s_cubic-bezier(0.22,1,0.36,1)_both]'
          }`}
        >
          {renderHeartWords(t.msg)}
        </button>
      ))}
    </div>
  );
}