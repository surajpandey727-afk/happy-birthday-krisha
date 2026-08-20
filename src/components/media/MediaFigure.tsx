'use client';
import { useMemo, useState } from 'react';
import type { Media } from '@/lib/types';
import { isPlaceholder, placeholderMeta } from '@/lib/media';

/** Deterministic elegant gradient placeholder for un-supplied media. */
export function PlaceholderFigure({
  token,
  className = '',
  label,
  alt = '',
}: {
  token: string;
  className?: string;
  label?: string;
  alt?: string;
}) {
  const meta = useMemo(() => placeholderMeta(token), [token]);
  const text = (label ?? meta.label).toUpperCase();
  const fg = meta.tone === 'light' ? '#3027a0' : '#ffffff';
  return (
    <svg
      viewBox="0 0 400 300"
      role="img"
      aria-label={alt || text}
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <linearGradient id={`ph_${token}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={meta.from} />
          <stop offset="1" stopColor={meta.to} />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill={`url(#ph_${token})`} />
      <circle cx="80" cy="70" r="120" fill="#ffffff" opacity="0.14" />
      <circle cx="340" cy="250" r="100" fill="#ffffff" opacity="0.1" />
      <g opacity="0.9" fill={fg}>
        <text x="200" y="150" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fontStyle="italic">
          {text}
        </text>
        <text x="200" y="180" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" opacity="0.6" letterSpacing="4">
          OUR LITTLE WORLD
        </text>
      </g>
      <text x="196" y="278" textAnchor="middle" fontSize="14" fill={fg} opacity="0.5" fontFamily="Georgia, serif">
        i ❤ kripi
      </text>
    </svg>
  );
}

/** Renders a Media object — a real img or a placeholder, with fade-in.
 * variant="thumb" prefers media.thumb (falls back to src) — use it in any
 * grid/wall context so tiles load the ~30KB thumbnail, not the full image. */
export function MediaFigure({
  media,
  className = '',
  eager = false,
  label,
  variant = 'full',
}: {
  media: Media;
  className?: string;
  eager?: boolean;
  label?: string;
  variant?: 'full' | 'thumb';
}) {
  const [loaded, setLoaded] = useState(eager || !isPlaceholder(media.src));
  const [err, setErr] = useState(false);

  if (isPlaceholder(media.src)) {
    return (
      <PlaceholderFigure
        token={media.src}
        label={label ?? media.caption}
        alt={media.alt}
        className={className}
      />
    );
  }

  const resolvedSrc = variant === 'thumb' ? media.thumb ?? media.src : media.src;

  return (
    <img
      src={resolvedSrc}
      alt={media.alt || media.caption || ''}
      loading={eager ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => setErr(true)}
      className={`${className} transition-[opacity,filter] duration-700 ${
        loaded && !err ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
      }`}
    />
  );
}