/**
 * PersistenceAdapter — an abstraction over where save data lives.
 *
 * Default implementation is browser localStorage. Later a Supabase adapter
 * (or a Capacitor filesystem adapter) can be swapped in without changing the
 * games/user of the API. This is the piece that keeps the app Capacitor-ready
 * and offline-first.
 */

export interface PersistenceAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  keys(): string[];
}

const PREFIX = "olw:";

/** Safe JSON parse with graceful failure. */
function safeParse<T>(raw: string | null): T | null {
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

class LocalStorageAdapter implements PersistenceAdapter {
  private available = false;

  constructor() {
    try {
      const probe = "__olw_probe__";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      this.available = true;
    } catch {
      this.available = false;
    }
  }

  private fullKey(key: string) {
    return PREFIX + key;
  }

  get<T>(key: string): T | null {
    if (!this.available) return null;
    try {
      return safeParse<T>(window.localStorage.getItem(this.fullKey(key)));
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    if (!this.available) return;
    try {
      window.localStorage.setItem(this.fullKey(key), JSON.stringify(value));
    } catch {
      /* storage full / unavailable — ignore gracefully */
    }
  }

  remove(key: string): void {
    if (!this.available) return;
    try {
      window.localStorage.removeItem(this.fullKey(key));
    } catch {
      /* noop */
    }
  }

  keys(): string[] {
    if (!this.available) return [];
    const out: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
    }
    return out;
  }
}

/**
 * In-memory fallback so everything still works in environments where
 * localStorage is unavailable (private browsing, tests).
 */
class MemoryAdapter implements PersistenceAdapter {
  private store = new Map<string, string>();
  get<T>(key: string): T | null {
    const raw = this.store.get(PREFIX + key);
    return raw == null ? null : safeParse<T>(raw);
  }
  set<T>(key: string, value: T): void {
    this.store.set(PREFIX + key, JSON.stringify(value));
  }
  remove(key: string): void {
    this.store.delete(PREFIX + key);
  }
  keys(): string[] {
    return [...this.store.keys()].map((k) => k.slice(PREFIX.length));
  }
}

function createDefaultAdapter(): PersistenceAdapter {
  try {
    if (typeof window !== "undefined") {
      return new LocalStorageAdapter();
    }
  } catch {
    /* noop */
  }
  return new MemoryAdapter();
}

export const persistence: PersistenceAdapter = createDefaultAdapter();

/** Tiny reactive key — lets components subscribe to changes. */
const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

export function subscribe(key: string, fn: () => void): () => void {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => {
    listeners.get(key)?.delete(fn);
  };
}

/**
 * A typed store backed by the adapter with reactive subscription support.
 * Used by game progress, settings and discovered Easter eggs.
 */
export function createStore<T>(key: string, fallback: T) {
  return {
    load(): T {
      const v = persistence.get<T>(key);
      return v ?? fallback;
    },
    save(value: T) {
      persistence.set(key, value);
      notify(key);
    },
    update(fn: (prev: T) => T) {
      this.save(fn(this.load()));
    },
    subscribe(cb: () => void) {
      return subscribe(key, cb);
    },
  };
}

export { LocalStorageAdapter, MemoryAdapter };