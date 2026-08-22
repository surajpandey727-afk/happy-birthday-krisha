import { describe, it, expect, beforeEach } from 'vitest';
import { loadSecretDoorState, markSecretDoorFound } from './secretDoor';

describe('secretDoor', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts not found', () => {
    expect(loadSecretDoorState().found).toBe(false);
  });

  it('marks found and it sticks', () => {
    markSecretDoorFound();
    expect(loadSecretDoorState().found).toBe(true);
  });

  it('is idempotent — calling it again does not throw or reset anything', () => {
    markSecretDoorFound();
    markSecretDoorFound();
    markSecretDoorFound();
    expect(loadSecretDoorState().found).toBe(true);
  });
});
