import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import HomeWorld from './page';

/**
 * Regression test for a stale-closure bug found while auditing the app for
 * the same failure class that /secret's constellation counter already hit
 * once (see src/app/secret/page.test.tsx): onMoonTap originally read
 * `moonTaps` from the render-time closure (`const n = moonTaps + 1;
 * setMoonTaps(n)`). Rapid taps on the moon (very plausible — it's a small,
 * inviting, repeatedly-tappable icon) fired in the same React batch would
 * all compute off the same stale `moonTaps`, undercounting every tap in
 * that window, so the door-at-7-taps reveal could simply never fire. Fixed
 * with a functional update plus an effect watching `moonTaps`, mirroring
 * /secret's fix exactly. This test fires the taps synchronously, in one
 * batch, on purpose — that's exactly the condition that exposed the bug.
 */

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe('home moon-tap secret door', () => {
  it('reveals the door after 7 taps fired synchronously in the same batch', () => {
    render(<HomeWorld />);
    const moon = screen.getByRole('button', { name: /the moon/i });

    for (let i = 0; i < 7; i++) {
      fireEvent.click(moon);
    }

    expect(screen.getByRole('link', { name: /open the door/i })).toBeInTheDocument();
  });

  it('does not reveal the door after only 6 taps', () => {
    render(<HomeWorld />);
    const moon = screen.getByRole('button', { name: /the moon/i });

    for (let i = 0; i < 6; i++) {
      fireEvent.click(moon);
    }

    expect(screen.queryByRole('link', { name: /open the door/i })).not.toBeInTheDocument();
  });
});
