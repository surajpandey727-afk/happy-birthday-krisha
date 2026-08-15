'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV } from '@content/site';
import { sound } from '@/lib/sounds';
import { markBackHome } from '@/lib/easterEggEngine';

/** Floating world navigation. Hidden on the landing hero. */
export function Navigation() {
  const pathname = usePathname();
  const hidden = pathname === '/';
  const [mounted, setMounted] = useState(false);
  const lastHome = useRef<string>('');

  useEffect(() => setMounted(true), []);

  // returning to home can whisper "welcome back" (cooldown-gated by the engine)
  useEffect(() => {
    if (pathname === '/home' && lastHome.current !== '/home') {
      lastHome.current = '/home';
      markBackHome();
    } else if (pathname !== '/home') {
      lastHome.current = '';
    }
  }, [pathname]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.nav
          aria-label="world navigation"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 px-3 pointer-events-none"
        >
          <div className="glass pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto no-scrollbar rounded-full px-2 py-1.5 shadow-soft">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => sound.tap()}
                  className={`relative shrink-0 rounded-full px-3.5 py-2 text-sm tracking-wide transition-colors sm:px-4 ${
                    active ? 'text-ultramarine' : 'text-ink-soft hover:text-ultramarine'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-pink-cloud/60"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}