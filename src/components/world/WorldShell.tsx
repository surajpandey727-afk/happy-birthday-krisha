'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** Consistent editorial shell for the inner worlds. */
export function WorldShell({
  kicker,
  title,
  blurb,
  children,
}: {
  kicker: string;
  title: string;
  blurb?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-dvh pb-32 safe-top safe-bottom bg-[radial-gradient(120%_140%_at_80%_-10%,var(--color-pink-wash),var(--color-warm-white)_55%,var(--color-cream))]">
      <div className="mx-auto max-w-4xl px-5 pt-12 sm:pt-16">
        <motion.p
          className="text-[11px] uppercase tracking-[0.45em] text-ultramarine-soft"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {kicker}
        </motion.p>
        <motion.h1
          className="mt-1 font-display text-5xl text-ink sm:text-6xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          {title}
        </motion.h1>
        {blurb && (
          <motion.p
            className="mt-2 max-w-md font-hand text-2xl text-ink-soft"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
          >
            {blurb}
          </motion.p>
        )}
        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}