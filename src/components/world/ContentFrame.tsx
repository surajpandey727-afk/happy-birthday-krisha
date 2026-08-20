'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Reserves room for the fixed desktop Line Sidebar everywhere except the hero. */
export function ContentFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hero = pathname === '/';
  return <div className={hero ? '' : 'md:pl-56'}>{children}</div>;
}
