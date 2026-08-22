import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { EggToast } from './EggToast';
import { pushToast } from '@/lib/eggBus';

/**
 * EggToast fires on nearly every interaction across the site (every Easter
 * egg, every "curious, are we?" nudge). It used to mount with framer-motion's
 * `initial={{opacity:0}} / animate={{opacity:1}}` — the same failure class
 * already fixed elsewhere (see PhotoViewer.test.tsx): if the animate step
 * never runs, a toast is technically in the DOM but permanently invisible.
 * Rewritten onto @keyframes CSS with a `closing` flag driving a two-phase
 * removal instead of AnimatePresence. These tests pin the reliability
 * properties that fix depends on.
 */

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('EggToast', () => {
  it('renders a pushed toast synchronously, with no pending animation frame required', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    render(<EggToast />);

    act(() => {
      pushToast('curious, are we? . . .');
    });

    expect(screen.getByText('curious, are we? . . .')).toBeInTheDocument();
    raf.mockRestore();
  });

  it('auto-dismisses a toast after its timeout, removing it from the DOM', () => {
    vi.useFakeTimers();
    render(<EggToast />);

    act(() => {
      pushToast('a door appeared.');
    });
    expect(screen.getByText('a door appeared.')).toBeInTheDocument();

    // auto-dismiss timer (3200ms) + the closing-animation delay (220ms)
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    expect(screen.queryByText('a door appeared.')).toBeInTheDocument(); // still mid closing-animation
    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(screen.queryByText('a door appeared.')).not.toBeInTheDocument();
  });

  it('dismisses on click, after the exit animation plays', () => {
    vi.useFakeTimers();
    render(<EggToast />);

    act(() => {
      pushToast('tucked into the page.');
    });
    const toast = screen.getByText('tucked into the page.');

    fireEvent.click(toast);
    expect(screen.queryByText('tucked into the page.')).toBeInTheDocument(); // not instant

    act(() => {
      vi.advanceTimersByTime(220);
    });
    expect(screen.queryByText('tucked into the page.')).not.toBeInTheDocument();
  });

  it('keeps only the 3 most recent toasts', () => {
    render(<EggToast />);

    act(() => {
      pushToast('one');
      pushToast('two');
      pushToast('three');
      pushToast('four');
    });

    expect(screen.queryByText('one')).not.toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
    expect(screen.getByText('three')).toBeInTheDocument();
    expect(screen.getByText('four')).toBeInTheDocument();
  });
});
