import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { SidebarProvider, useSidebarState } from './SidebarContext';

/**
 * The sidebar-collapse state itself (as opposed to its CSS-driven visual
 * animation, which jsdom can't evaluate) is plain React state + a
 * localStorage-backed store. This was never actually the broken part of the
 * reported bug — but it's cheap to pin down here so a future regression in
 * *this* layer (state not reaching the toggle button, or not surviving a
 * "remount" the way navigating between pages does) gets caught immediately
 * rather than being mistaken for the animation bug all over again.
 */
function Harness() {
  const { collapsed, toggle } = useSidebarState();
  return (
    <button onClick={toggle} aria-label={collapsed ? 'open navigation' : 'close navigation'}>
      {collapsed ? 'collapsed' : 'expanded'}
    </button>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('SidebarContext', () => {
  it('defaults to expanded', () => {
    render(
      <SidebarProvider>
        <Harness />
      </SidebarProvider>
    );
    expect(screen.getByRole('button')).toHaveTextContent('expanded');
  });

  it('toggle() flips the consumed state synchronously on click', () => {
    render(
      <SidebarProvider>
        <Harness />
      </SidebarProvider>
    );
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(btn).toHaveTextContent('collapsed');
    fireEvent.click(btn);
    expect(btn).toHaveTextContent('expanded');
  });

  it('persists across a remount (simulating navigation between pages)', () => {
    const { unmount } = render(
      <SidebarProvider>
        <Harness />
      </SidebarProvider>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('collapsed');
    unmount();

    render(
      <SidebarProvider>
        <Harness />
      </SidebarProvider>
    );
    expect(screen.getByRole('button')).toHaveTextContent('collapsed');
  });
});
