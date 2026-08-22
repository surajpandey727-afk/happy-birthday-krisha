'use client';
import type { CSSProperties, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebarState } from './SidebarContext';

/** Reserves room for the fixed desktop Line Sidebar everywhere except the
 * hero — and releases it smoothly when the sidebar is collapsed, so
 * full-bleed content (the Drift Wall) can grow to fill the freed space. The
 * actual width lives in a CSS var so the transition is a plain CSS
 * `transition-[padding-left]`, not JS-driven layout thrashing.
 *
 * Also owns the page-transition "buildup": a scan-line sweep plus a
 * materialize-in on `{children}`, both keyed on `pathname` so a fresh route
 * always replays them. Plain CSS animations, deliberately — see
 * `.route-enter`/`.route-sweep` in globals.css for why. */
export function ContentFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hero = pathname === '/';
  const { collapsed } = useSidebarState();

  return (
    <div
      className="transition-[padding-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:pl-[var(--sidebar-w)]"
      style={{ '--sidebar-w': hero || collapsed ? '0px' : '224px' } as CSSProperties}
    >
      {!hero && (
        <div
          key={`sweep-${pathname}`}
          aria-hidden
          className="route-sweep pointer-events-none fixed inset-x-0 top-0 z-[80] h-24"
          style={{
            background:
              'linear-gradient(180deg, transparent, color-mix(in srgb, var(--color-royal-vivid) 55%, transparent) 45%, color-mix(in srgb, var(--color-parchment) 30%, transparent) 50%, color-mix(in srgb, var(--color-royal-vivid) 55%, transparent) 55%, transparent)',
          }}
        />
      )}
      <div key={`page-${pathname}`} className={hero ? undefined : 'route-enter'}>
        {children}
      </div>
    </div>
  );
}
