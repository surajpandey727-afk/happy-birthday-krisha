/* Persisted state for the secret door at /secret. Finding it — and lighting
 * the whole constellation — is what unlocks "the case" elsewhere in the
 * site. Same PersistenceAdapter every other feature uses. */

import { createStore } from "@/lib/persistence";

export type SecretDoorState = {
  found: boolean;
};

const INITIAL_STATE: SecretDoorState = { found: false };

const store = createStore<SecretDoorState>("secret-door", INITIAL_STATE);

export function loadSecretDoorState(): SecretDoorState {
  return store.load();
}

export function subscribeSecretDoorState(cb: () => void) {
  return store.subscribe(cb);
}

export function markSecretDoorFound() {
  if (store.load().found) return;
  store.save({ found: true });
}
