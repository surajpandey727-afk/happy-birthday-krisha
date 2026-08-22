'use client';
import type { CSSProperties, ReactNode } from 'react';
import ParticleText from '@/components/reactbits/ParticleText';

/** Consistent editorial shell for the inner worlds.
 *
 * `headline` picks which of `kicker`/`title` gets the big dissipating-dots
 * ParticleText treatment — the other becomes the small tracked-out label
 * above it. Defaults to `title` (the terse page name — "us", "memories"),
 * but most pages read better with the more evocative `kicker` phrase
 * ("remember this?", "a wall of us") as the actual headline, so set it
 * explicitly per page. Fades are plain CSS @keyframes, not framer-motion —
 * see the lightbox comment in globals.css for why that matters here. */
export function WorldShell({
  kicker,
  title,
  blurb,
  headline = 'title',
  fullBleed,
  children,
}: {
  kicker: string;
  title: string;
  blurb?: string;
  headline?: 'title' | 'kicker';
  /** Renders full-width, outside the max-w-4xl content column — for
   * sections (the Drift Wall, the notebook) that should span edge-to-edge
   * and grow when the sidebar collapses, rather than sit inside the
   * editorial column. */
  fullBleed?: ReactNode;
  children?: ReactNode;
}) {
  const big = headline === 'kicker' ? kicker : title;
  const small = headline === 'kicker' ? title : kicker;

  return (
    <main
      className="min-h-dvh pb-32 safe-top safe-bottom"
      style={{
        background:
          'radial-gradient(120% 140% at 80% -10%, color-mix(in srgb, var(--color-royal-deep) 55%, transparent) 0%, color-mix(in srgb, var(--color-base) 55%, transparent) 45%, color-mix(in srgb, var(--color-void) 70%, transparent) 100%)',
      }}
    >
      <div className="mx-auto max-w-4xl px-5 pt-12 sm:pt-16">
        <p
          className="fade-in font-nebulica text-[10px] uppercase tracking-[0.5em] text-royal-vivid"
          style={{ '--fade-delay': '0s' } as CSSProperties}
        >
          {small}
        </p>
        <h1 className="fade-in-up -ml-2 mt-1 h-20 sm:h-28" style={{ '--fade-delay': '0.1s' } as CSSProperties}>
          <ParticleText
            text={big}
            color="#efe4d0"
            highlightColor="#28479e"
            fontFamily="var(--font-apestron)"
            fontWeight={700}
            fontSize="clamp(2.2rem, 9vw, 4.6rem)"
            particleSize={2}
            density={3.4}
            glow={false}
            idleDrift={0.4}
            className="!min-h-0"
          />
        </h1>
        {blurb && (
          <p
            className="fade-in mt-3 max-w-md font-monigue text-lg italic text-muted"
            style={{ '--fade-delay': '0.25s' } as CSSProperties}
          >
            {blurb}
          </p>
        )}
      </div>

      {fullBleed && <div className="mt-8 w-full">{fullBleed}</div>}

      {children && (
        <div className="mx-auto max-w-4xl px-5">
          <div className="mt-8">{children}</div>
        </div>
      )}
    </main>
  );
}
