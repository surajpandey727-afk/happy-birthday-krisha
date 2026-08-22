'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createStore } from '@/lib/persistence';

const store = createStore<{ collapsed: boolean }>('sidebar', { collapsed: false });

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarStateContext = createContext<SidebarState>({ collapsed: false, toggle: () => {} });

/** Whether the desktop Line Sidebar is open or slid out, shared between
 * SiteSidebar (which animates) and ContentFrame (which reserves/releases
 * the gutter) so the two stay in lockstep. Persisted — a preference, not
 * page state, so it belongs in localStorage like the rest of the small
 * settings on this site. */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(store.load().collapsed);
    return store.subscribe(() => setCollapsed(store.load().collapsed));
  }, []);

  const toggle = () => store.update((s) => ({ collapsed: !s.collapsed }));

  return <SidebarStateContext.Provider value={{ collapsed, toggle }}>{children}</SidebarStateContext.Provider>;
}

export function useSidebarState() {
  return useContext(SidebarStateContext);
}
