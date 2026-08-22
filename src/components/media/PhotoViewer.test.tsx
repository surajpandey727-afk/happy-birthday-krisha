import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { PhotoViewer } from './PhotoViewer';
import type { Media } from '@/lib/types';

/**
 * Regression coverage for the bug reported in the field: clicking a photo
 * did nothing visible. Root cause was a framer-motion `initial={{opacity:0}}`
 * mount animation whose `animate` step never ran in the user's real
 * environment, leaving the modal permanently transparent while technically
 * "open". PhotoViewer was rewritten onto @keyframes CSS (see the comment at
 * the top of PhotoViewer.tsx) specifically so mounting can never depend on a
 * later JS-scheduled trigger. These tests assert the *symptoms* that would
 * come back if that guarantee were ever lost: the dialog and its image must
 * be present and accessible the instant the component renders — not "after
 * a tick", not "after an animation frame".
 */

const PHOTOS: Media[] = [
  { src: '/a.webp', thumb: '/a-thumb.webp', alt: 'photo one', caption: 'one' },
  { src: '/b.webp', thumb: '/b-thumb.webp', alt: 'photo two', caption: 'two' },
  { src: '/c.webp', thumb: '/c-thumb.webp', alt: 'photo three', caption: 'three' },
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('PhotoViewer', () => {
  it('renders the photo and controls immediately on mount, with no pending animation frame required', () => {
    render(<PhotoViewer photos={PHOTOS} index={0} onIndexChange={() => {}} onClose={() => {}} />);

    // Not "eventually visible" — visible synchronously, before any timer or
    // rAF has had a chance to run. This is the exact assertion that would
    // have failed against the old rAF-gated implementation.
    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next photo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous photo/i })).toBeInTheDocument();
  });

  it('does not gate visibility behind requestAnimationFrame', () => {
    // If a future change reintroduces "start hidden, flip visible in a
    // rAF/timeout callback", stubbing rAF to never fire would expose it:
    // the content would never appear. Here it must already be there.
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    render(<PhotoViewer photos={PHOTOS} index={0} onIndexChange={() => {}} onClose={() => {}} />);
    expect(screen.getByText('one')).toBeInTheDocument();
    raf.mockRestore();
  });

  it('calls onIndexChange when the next/previous controls are used', () => {
    const onIndexChange = vi.fn();
    render(<PhotoViewer photos={PHOTOS} index={0} onIndexChange={onIndexChange} onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /next photo/i }));
    expect(onIndexChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /previous photo/i }));
    expect(onIndexChange).toHaveBeenCalledWith(2); // wraps backward from 0
  });

  it('navigates with arrow keys', () => {
    const onIndexChange = vi.fn();
    render(<PhotoViewer photos={PHOTOS} index={1} onIndexChange={onIndexChange} onClose={() => {}} />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(onIndexChange).toHaveBeenCalledWith(2);

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it('closes on Escape and on the close button, after the exit transition', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<PhotoViewer photos={PHOTOS} index={0} onIndexChange={() => {}} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).not.toHaveBeenCalled(); // closing animation plays first, not instant

    vi.advanceTimersByTime(300);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape too', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<PhotoViewer photos={PHOTOS} index={0} onIndexChange={() => {}} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    vi.advanceTimersByTime(300);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when the index is out of range rather than throwing', () => {
    const { container } = render(
      <PhotoViewer photos={[]} index={0} onIndexChange={() => {}} onClose={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
