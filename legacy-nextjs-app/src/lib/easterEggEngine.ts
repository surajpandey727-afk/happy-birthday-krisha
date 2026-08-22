/** Easter Egg Engine — probabilistic, cooldown-aware, locally tracked. */
import { createStore } from "@/lib/persistence";
import { mulberry32, chance } from "@/lib/seededRandom";
import { EGG_DB, type EasterEggDef } from "@content/easterEggs";

interface EggState {
  /** id -> last-shown timestamp (ms) */
  discovered: Record<string, number>;
  lastBackHome: number;
}

const fallback: EggState = { discovered: {}, lastBackHome: 0 };

const store = createStore<EggState>("eggs", fallback);

export type EggTriggerKind = EasterEggDef["trigger"]["type"];

export interface EggFireResult {
  id: string;
  message: string;
}

let counter = Date.now() % 100000;

/** Attempt to fire an egg of the given trigger kind. Returns null if none fire. */
export function fireEgg(kind: EggTriggerKind): EggFireResult | null {
  const state = store.load();
  const rng = mulberry32((counter += 1));
  const now = Date.now();

  const eligible = EGG_DB.filter((egg) => {
    if (egg.trigger.type !== kind) return false;
    return chance(rng, egg.trigger.probability ?? 1);
  });

  const usable = eligible.filter((egg) => {
    if (!egg.cooldown) return true;
    if (egg.id === "egg-back") return now - state.lastBackHome > egg.cooldown;
    const last = state.discovered[egg.id];
    if (last == null) return true;
    return now - last > egg.cooldown;
  });

  if (!usable.length) return null;

  const egg = usable[Math.floor(rng() * usable.length)];
  const next = { ...state, discovered: { ...state.discovered } };
  next.discovered[egg.id] = now;
  if (egg.id === "egg-back") next.lastBackHome = now;
  store.save(next);

  return { id: egg.id, message: egg.message };
}

export function discoveredCount(): number {
  return Object.keys(store.load().discovered).length;
}

export function markBackHome() {
  const s = store.load();
  store.save({ ...s, lastBackHome: Date.now() });
}

export function resetEggs() {
  store.save(fallback);
}

export function loadEggState() {
  return store.load();
}
