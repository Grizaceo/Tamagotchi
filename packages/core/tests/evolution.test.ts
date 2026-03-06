import { describe, it, expect } from 'vitest';
import { createInitialPetState, createInitialPetStateFor } from '../src/model/PetState';
import { evaluateEvolution, applyEvolutionIfNeeded } from '../src/evolution/evaluateEvolution';

describe('evolution', () => {
  it('starts as FLAN_BEBE', () => {
    const state = createInitialPetState();
    expect(state.species).toBe('FLAN_BEBE');
    expect(evaluateEvolution(state)).toBeUndefined();
  });

  it('starts as SEAL_EGG when choosing seal line', () => {
    const state = createInitialPetStateFor('seal');
    expect(state.species).toBe('SEAL_EGG');
    expect(evaluateEvolution(state)).toBeUndefined();
  });

  it('starts as FIU_EGG and SALCHICHA_EGG for their respective lines', () => {
    const fiu = createInitialPetStateFor('fiu');
    const dog = createInitialPetStateFor('salchicha');
    expect(fiu.species).toBe('FIU_EGG');
    expect(dog.species).toBe('SALCHICHA_EGG');
  });

  it('evolves from BEBE to TEEN after 60 ticks', () => {
    let state = createInitialPetState();

    state.totalTicks = 59;
    expect(evaluateEvolution(state)).toBeUndefined();

    state.totalTicks = 60;
    expect(evaluateEvolution(state)).toBe('FLAN_TEEN');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('FLAN_TEEN');
  });

  it('evolves from TEEN to ADULT after 300 ticks', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_TEEN';
    state.totalTicks = 299;
    expect(evaluateEvolution(state)).toBeUndefined();

    state.totalTicks = 300;
    expect(evaluateEvolution(state)).toBe('FLAN_ADULT');
  });

  it('evolves to POMPOMPURIN with perfect care', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    state.totalTicks = 1200;
    state.stats.happiness = 90;
    state.stats.health = 92;
    state.stats.hunger = 18;
    state.stats.energy = 70;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBe('POMPOMPURIN');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('POMPOMPURIN');
    expect(evolved.history.some((e) => e.type === 'EVOLVED')).toBe(true);
    expect(evolved.unlockedForms).toContain('POMPOMPURIN');
  });

  it('evolves to MUFFIN when overfed and underplayed', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    state.totalTicks = 900;
    state.stats.health = 55;
    state.stats.hunger = 60;
    state.stats.happiness = 55;
    state.stats.energy = 55;

    state.counts.feed = 35;
    state.counts.play = 2;
    state.counts.rest = 15;
    state.counts.totalActions = 52;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBe('MUFFIN');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('MUFFIN');
  });

  it('evolves to SCONE when affection is low', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    state.totalTicks = 900;
    state.stats.health = 50;
    state.stats.happiness = 15;
    state.stats.energy = 55;

    state.counts.pet = 2; // very few pets
    state.counts.feed = 12;
    state.counts.play = 3;
    state.counts.totalActions = 40; // pet ratio = 5%

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBe('SCONE');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('SCONE');
  });

  it('evolves to BAGEL by default when no other path matches', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    state.totalTicks = 900;
    state.stats.hunger = 45;
    state.stats.happiness = 45;
    state.stats.energy = 60;

    state.counts.feed = 10;
    state.counts.play = 10;
    state.counts.rest = 10;
    // Keep affection ratio above SCONE threshold (25%) to force BAGEL fallback.
    state.counts.pet = 12;
    state.counts.totalActions = 42;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBe('BAGEL');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('BAGEL');
  });

  it('keeps priority: perfect care wins over other paths', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    state.totalTicks = 1300;
    state.stats.happiness = 90;
    state.stats.health = 90;
    state.stats.hunger = 15;
    state.stats.energy = 70;

    // Also overfed, but still perfect care should win
    state.counts.feed = 40;
    state.counts.play = 2;
    state.counts.totalActions = 45;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBe('POMPOMPURIN');
  });

  it('does not evolve when thresholds are not met', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    state.totalTicks = 700;
    state.stats.happiness = 50;
    state.stats.health = 50;
    state.stats.hunger = 50;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBeUndefined();
  });

  it('seal line evolves egg -> baby -> teen, then to perfect with great care', () => {
    let state = createInitialPetStateFor('seal');
    state.totalTicks = 60;
    expect(evaluateEvolution(state)).toBe('SEAL_BABY');
    state = applyEvolutionIfNeeded(state);

    state.totalTicks = 300;
    expect(evaluateEvolution(state)).toBe('SEAL_TEEN');
    state = applyEvolutionIfNeeded(state);

    state.totalTicks = 900;
    state.stats.health = 90;
    state.stats.happiness = 90;
    state.stats.energy = 70;
    state.stats.hunger = 20;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBe('SEAL_PERFECT');
  });

  it('seal line falls to SEAL_FAIL on poor care and default to BROWN otherwise', () => {
    let state = createInitialPetStateFor('seal');
    state.species = 'SEAL_TEEN';
    state.totalTicks = 900;
    state.stats.health = 25;
    state.stats.happiness = 20;
    state.stats.hunger = 80;

    expect(evaluateEvolution(state)).toBe('SEAL_FAIL');

    state = createInitialPetStateFor('seal');
    state.species = 'SEAL_TEEN';
    state.totalTicks = 900;
    state.stats.health = 70;
    state.stats.happiness = 60;
    state.stats.hunger = 40;
    state.stats.energy = 60;

    expect(evaluateEvolution(state)).toBe('SEAL_BROWN');
  });

  it('fiu line follows seal-like evolution with perfect/normal/fail endings', () => {
    let state = createInitialPetStateFor('fiu');
    state.totalTicks = 60;
    expect(evaluateEvolution(state)).toBe('FIU_BABY');
    state = applyEvolutionIfNeeded(state);

    state.totalTicks = 300;
    expect(evaluateEvolution(state)).toBe('FIU_TEEN');
    state = applyEvolutionIfNeeded(state);

    state.totalTicks = 900;
    state.stats.health = 92;
    state.stats.happiness = 85;
    state.stats.energy = 65;
    state.stats.hunger = 25;
    expect(evaluateEvolution(state)).toBe('FIU_PERFECT');

    state = createInitialPetStateFor('fiu');
    state.species = 'FIU_TEEN';
    state.totalTicks = 900;
    state.stats.health = 25;
    state.stats.happiness = 20;
    state.stats.hunger = 80;
    expect(evaluateEvolution(state)).toBe('FIU_FAIL');

    state = createInitialPetStateFor('fiu');
    state.species = 'FIU_TEEN';
    state.totalTicks = 900;
    state.stats.health = 65;
    state.stats.happiness = 60;
    state.stats.hunger = 40;
    state.stats.energy = 60;
    expect(evaluateEvolution(state)).toBe('FIU_COMMON');
  });

  it('salchicha line follows seal-like evolution with perfect/normal/fail endings', () => {
    let state = createInitialPetStateFor('salchicha');
    state.totalTicks = 60;
    expect(evaluateEvolution(state)).toBe('SALCHICHA_BABY');
    state = applyEvolutionIfNeeded(state);

    state.totalTicks = 300;
    expect(evaluateEvolution(state)).toBe('SALCHICHA_TEEN');
    state = applyEvolutionIfNeeded(state);

    state.totalTicks = 900;
    state.stats.health = 90;
    state.stats.happiness = 85;
    state.stats.energy = 60;
    state.stats.hunger = 22;
    expect(evaluateEvolution(state)).toBe('SALCHICHA_PERFECT');

    state = createInitialPetStateFor('salchicha');
    state.species = 'SALCHICHA_TEEN';
    state.totalTicks = 900;
    state.stats.health = 20;
    state.stats.happiness = 25;
    state.stats.hunger = 85;
    expect(evaluateEvolution(state)).toBe('SALCHICHA_FAIL');

    state = createInitialPetStateFor('salchicha');
    state.species = 'SALCHICHA_TEEN';
    state.totalTicks = 900;
    state.stats.health = 70;
    state.stats.happiness = 60;
    state.stats.hunger = 45;
    state.stats.energy = 55;
    expect(evaluateEvolution(state)).toBe('SALCHICHA_BROWN');
  });
});
