'use client';
import { useEffect } from 'react';

/** Registers the PWA service worker (production only, not under Capacitor). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined') return;
    // Capacitor ships its own native shell — a SW is unnecessary (and can
    // interfere) once the app is wrapped, so we skip it there.
    const isCapacitor = 'Capacitor' in window || navigator.userAgent.includes('Capacitor');
    if (isCapacitor) return;
    if (!('serviceWorker' in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* offline shell unavailable — app still works */
      });
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);
  return null;
}