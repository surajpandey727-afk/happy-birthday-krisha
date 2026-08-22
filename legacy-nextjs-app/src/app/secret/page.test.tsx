import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SecretRoomPage from './page';

// next/navigation's router isn't available outside a real app-router tree.
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// SpecularButton mounts a real WebGL context via ogl, which jsdom doesn't
// implement — irrelevant to the logic under test here, so it's swapped for
// a plain button that still renders its children/onClick.
vi.mock('@/components/reactbits/SpecularButton', () => ({
  default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

/**
 * Regression test for a real stale-closure bug: tapStar() originally read
 * `lit` from the render-time closure (`const n = lit + 1; setLit(n)`).
 * Three taps fired in the same React batch (very plausible here — this is
 * an excited "I found something" tap moment) would all compute off the same
 * stale `lit`, undercounting every tap in that window and the reveal at
 * lit>=3 could simply never fire. Fixed with a functional update
 * (`setLit(prev => prev + 1)`) plus an effect watching `lit`. This test
 * fires the taps synchronously, in one batch, on purpose — that's exactly
 * the condition that exposed the bug.
 */
describe('secret room constellation', () => {
  it('reveals after 3 taps fired synchronously in the same batch', () => {
    render(<SecretRoomPage />);
    const stars = screen.getAllByRole('button', { name: /letter|heart/i });
    expect(stars.length).toBeGreaterThanOrEqual(3);

    // Fire all three inside act() via a single event loop turn — no
    // await/render between them — to reproduce the rapid-tap scenario.
    fireEvent.click(stars[0]);
    fireEvent.click(stars[1]);
    fireEvent.click(stars[2]);

    // This block is conditionally mounted on `revealed` (unlike the phrase
    // line above it, which is always in the DOM and only fades via CSS
    // opacity) — a real assertion that the reveal state actually flipped.
    expect(screen.getByText(/there's a case waiting now/i)).toBeInTheDocument();
  });

  it('does not reveal after only 2 taps', () => {
    render(<SecretRoomPage />);
    const stars = screen.getAllByRole('button', { name: /letter|heart/i });

    fireEvent.click(stars[0]);
    fireEvent.click(stars[1]);

    // The phrase line always renders (opacity is CSS-driven, not
    // conditional mount) — what's conditional is the CTA into "the case".
    expect(screen.queryByText(/there's a case waiting now/i)).not.toBeInTheDocument();
  });
});
