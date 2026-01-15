import { describe, it, expect } from 'vitest';
import { createInitialPetState } from '../src/model/PetState';

describe('smoke', () => {
  it('core compila y testea', () => {
    const state = createInitialPetState();
    expect(state.species).toBe('FLAN_BEBE');
    expect(state.alive).toBe(true);
    expect(state.stats.hunger).toBeGreaterThanOrEqual(0);
  });
});

