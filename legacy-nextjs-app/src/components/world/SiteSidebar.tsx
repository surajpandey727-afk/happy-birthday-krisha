'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { NAV } from '@content/site';
import { sound } from '@/lib/sounds';
import { markBackHome } from '@/lib/easterEggEngine';
import LineSidebar from '@/components/reactbits/LineSidebar';
import { usePrefersReducedMotion } from '@/hooks/useMedia';
import { useSidebarState } from './SidebarContext';
import { loadSecretDoorState, subscribeSecretDoorState } from '@/lib/secretDoor';

const ALL_ITEMS = NAV.map((n) => ({ label: n.label, href: n.href }));

/**
 * Primary site navigation. Desktop: a fixed Line Sidebar (ReactBits,
 * src/components/reactbits/LineSidebar.tsx) on the left edge, collapsible —
 * slides fully off-screen so full-bleed content (the Drift Wall) can claim
 * the space; a slim edge tab stays put to bring it back. Mobile (<768px, no
 * hover): a corner trigger opening a full-screen drawer.
 *
 * Both the collapse and the drawer are driven by plain CSS transitions, not
 * framer-motion — deliberately. framer-motion's own scheduler ties into the
 * page's requestAnimationFrame/visibility state in ways that proved
 * unreliable to verify from this environment, and this is the one animation
 * on the whole site that must never silently fail to play: if it does,
 * navigation itself looks broken. A CSS transition toggled by a class has
 * no scheduler to fail — the browser owns it outright.
 */
export function SiteSidebar() {
  const pathname = usePathname();
  const hidden = pathname === '/';
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastHome = useRef('');
  const reduced = usePrefersReducedMotion();
  const { collapsed, toggle } = useSidebarState();
  const [doorFound, setDoorFound] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setDoorFound(loadSecretDoorState().found);
    return subscribeSecretDoorState(() => setDoorFound(loadSecretDoorState().found));
  }, []);

  useEffect(() => {
    if (pathname === '/home' && lastHome.current !== '/home') {
      lastHome.current = '/home';
      markBackHome();
    } else if (pathname !== '/home') {
      lastHome.current = '';
    }
  }, [pathname]);

  useEffect(() => setDrawerOpen(false), [pathname]);

  if (!mounted || hidden) return null;

  // "the case" only appears once the secret door has been found — until
  // then it stays a genuine secret, not a locked-but-visible tease.
  const items = doorFound ? ALL_ITEMS : ALL_ITEMS.filter((i) => i.href !== '/case');
  const activeHref = items.find((i) => pathname === i.href || pathname.startsWith(i.href + '/'))?.href ?? null;

  const railStyle: CSSProperties = {
    transform: collapsed ? 'translateX(-100%)' : 'translateX(0)',
    opacity: collapsed ? 0 : 1,
    transitionProperty: 'transform, opacity',
    transitionDuration: reduced ? '0ms' : '550ms',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  };

  const arrowStyle: CSSProperties = {
    display: 'inline-block',
    transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
    transitionProperty: 'transform',
    transitionDuration: reduced ? '0ms' : '400ms',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
  };

  const drawerStyle: CSSProperties = {
    opacity: drawerOpen ? 1 : 0,
    visibility: drawerOpen ? 'visible' : 'hidden',
    transitionProperty: 'opacity',
    transitionDuration: reduced ? '0ms' : '350ms',
    transitionTimingFunction: 'ease',
  };

  return (
    <>
      {/* desktop: fixed line sidebar, slides fully off-screen when collapsed */}
      <div
        className="fixed inset-y-0 left-0 z-40 hidden w-56 items-center pl-8 md:flex"
        style={railStyle}
        aria-hidden={collapsed}
      >
        <LineSidebar
          items={items}
          activeHref={activeHref}
          accentColor="var(--color-royal-vivid)"
          textColor="var(--color-muted)"
          markerColor="var(--color-brown-warm)"
          fontSize={1}
          proximityRadius={90}
          maxShift={reduced ? 0 : 14}
          scaleTick={!reduced}
          itemGap={22}
          onItemClick={() => sound.tap()}
        />
      </div>

      {/* desktop: edge tab — collapses/restores the sidebar */}
      <button
        onClick={() => {
          sound.tap();
          toggle();
        }}
        aria-label={collapsed ? 'open navigation' : 'close navigation'}
        aria-expanded={!collapsed}
        className="tap-target fixed inset-y-0 left-0 z-40 hidden w-4 items-center justify-center text-muted-dim opacity-40 transition-all duration-300 hover:w-6 hover:opacity-100 hover:text-royal-vivid md:flex"
      >
        <span className="text-xs" style={arrowStyle}>
          ›
        </span>
      </button>

      {/* mobile: corner trigger + full-screen drawer */}
      <button
        aria-label={drawerOpen ? 'close navigation' : 'open navigation'}
        aria-expanded={drawerOpen}
        onClick={() => {
          sound.tap();
          setDrawerOpen((o) => !o);
        }}
        className="tap-target fixed right-4 top-[max(env(safe-area-inset-top),1rem)] z-50 flex flex-col items-end gap-1.5 rounded-full bg-surface/80 px-3 py-2.5 shadow-luxe backdrop-blur md:hidden"
      >
        <span className={`block h-[1.5px] bg-parchment transition-all duration-300 ${drawerOpen ? 'w-5 translate-y-[3.5px] rotate-45' : 'w-5'}`} />
        <span className={`block h-[1.5px] bg-parchment transition-all duration-300 ${drawerOpen ? 'w-5 -translate-y-[3.5px] -rotate-45' : 'w-3.5'}`} />
      </button>

      <div
        className="fixed inset-0 z-40 bg-[radial-gradient(120%_120%_at_100%_0%,var(--color-royal-deep),var(--color-void)_65%)] md:hidden"
        style={drawerStyle}
        aria-hidden={!drawerOpen}
      >
        <nav
          aria-label="world navigation"
          className="flex h-full flex-col justify-center gap-1 px-8 safe-top safe-bottom"
        >
          <p className="font-nebulica mb-6 text-[10px] uppercase tracking-[0.5em] text-royal-vivid">navigate</p>
          {items.map((item, i) => {
            const active = activeHref === item.href;
            const itemStyle: CSSProperties = {
              opacity: drawerOpen ? 1 : 0,
              transform: drawerOpen ? 'translateX(0)' : 'translateX(-12px)',
              transitionProperty: 'opacity, transform',
              transitionDuration: reduced ? '0ms' : '400ms',
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
              transitionDelay: drawerOpen && !reduced ? `${0.05 * i}s` : '0ms',
            };
            return (
              <div key={item.href} style={itemStyle}>
                <Link
                  href={item.href}
                  onClick={() => sound.tap()}
                  tabIndex={drawerOpen ? 0 : -1}
                  className={`font-apestron block py-2.5 text-3xl tracking-tight transition-colors ${
                    active ? 'text-royal-vivid' : 'text-parchment hover:text-royal-vivid'
                  }`}
                >
                  {item.label}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}
