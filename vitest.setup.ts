import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

/**
 * jsdom implements the DOM but not these browser APIs, and this codebase
 * uses all three in components that need to be renderable in tests
 * (DoodleCanvas/useElementWidth use ResizeObserver, Scanner/SpecularButton
 * use IntersectionObserver, usePrefersReducedMotion/useIsTouch use
 * matchMedia). Without stubs, rendering those components throws
 * "X is not defined"/"X is not a function" — not a bug in the component,
 * just jsdom's real gap — so every test file would otherwise need its own
 * copy of these mocks or silently skip anything that touches them.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
class IntersectionObserverStub {
  root = null;
  rootMargin = '';
  thresholds: number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}
if (typeof globalThis.IntersectionObserver === 'undefined') {
  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}
if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
