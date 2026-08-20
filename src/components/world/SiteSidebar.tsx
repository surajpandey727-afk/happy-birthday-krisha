'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NAV } from '@content/site';
import { sound } from '@/lib/sounds';
import { markBackHome } from '@/lib/easterEggEngine';
import LineSidebar from '@/components/reactbits/LineSidebar';

const ITEMS = NAV.map((n) => ({ label: n.label, href: n.href }));

/**
 * Primary site navigation. Desktop: a fixed Line Sidebar (ReactBits,
 * src/components/reactbits/LineSidebar.tsx) on the left edge. Mobile
 * (<768px, no hover): a small corner trigger opening a full-screen drawer —
 * the proximity-hover interaction the sidebar is built on doesn't translate
 * to touch, so mobile gets its own straightforward tap targets instead of a
 * cramped copy of the desktop widget.
 */
export function SiteSidebar() {
  const pathname = usePathname();
  const hidden = pathname === '/';
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const lastHome = useRef('');

  useEffect(() => setMounted(true), []);

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

  const activeHref = ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + '/'))?.href ?? null;

  return (
    <>
      {/* desktop: fixed line sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden w-56 items-center pl-8 md:flex">
        <LineSidebar
          items={ITEMS}
          activeHref={activeHref}
          accentColor="var(--color-royal-vivid)"
          textColor="var(--color-muted)"
          markerColor="var(--color-brown-warm)"
          fontSize={1}
          proximityRadius={90}
          maxShift={14}
          itemGap={22}
          onItemClick={() => sound.tap()}
        />
      </div>

      {/* mobile: corner trigger + full-screen drawer */}
      <button
        aria-label={drawerOpen ? 'close navigation' : 'open navigation'}
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen((o) => !o)}
        className="tap-target fixed right-4 top-[max(env(safe-area-inset-top),1rem)] z-50 flex flex-col items-end gap-1.5 rounded-full bg-surface/80 px-3 py-2.5 shadow-luxe backdrop-blur md:hidden"
      >
        <span className={`block h-[1.5px] bg-parchment transition-all duration-300 ${drawerOpen ? 'w-5 translate-y-[3.5px] rotate-45' : 'w-5'}`} />
        <span className={`block h-[1.5px] bg-parchment transition-all duration-300 ${drawerOpen ? 'w-5 -translate-y-[3.5px] -rotate-45' : 'w-3.5'}`} />
      </button>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-[radial-gradient(120%_120%_at_100%_0%,var(--color-royal-deep),var(--color-void)_65%)] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <nav
              aria-label="world navigation"
              className="flex h-full flex-col justify-center gap-1 px-8 safe-top safe-bottom"
            >
              <p className="font-nebulica mb-6 text-[10px] uppercase tracking-[0.5em] text-royal-vivid">navigate</p>
              {ITEMS.map((item, i) => {
                const active = activeHref === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => sound.tap()}
                      className={`font-apestron block py-2.5 text-3xl tracking-tight transition-colors ${
                        active ? 'text-royal-vivid' : 'text-parchment hover:text-royal-vivid'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
