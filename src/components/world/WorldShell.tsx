'use client';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import ParticleText from '@/components/reactbits/ParticleText';

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
    <main className="min-h-dvh pb-32 safe-top safe-bottom bg-[radial-gradient(120%_140%_at_80%_-10%,var(--color-royal-deep)_0%,var(--color-base)_45%,var(--color-void)_100%)]">
      <div className="mx-auto max-w-4xl px-5 pt-12 sm:pt-16">
        <motion.p
          className="font-nebulica text-[10px] uppercase tracking-[0.5em] text-royal-vivid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {kicker}
        </motion.p>
        <motion.h1
          className="-ml-2 mt-1 h-16 sm:h-20"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <ParticleText
            text={title}
            color="#efe4d0"
            highlightColor="#28479e"
            fontFamily="var(--font-apestron)"
            fontWeight={700}
            fontSize="clamp(2.5rem, 8vw, 4rem)"
            particleSize={2}
            density={3}
            glow={false}
            idleDrift={0.4}
            className="!min-h-0"
          />
        </motion.h1>
        {blurb && (
          <motion.p
            className="mt-3 max-w-md font-monigue text-lg italic text-muted"
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