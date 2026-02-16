import { describe, it, expect } from 'vitest';
import { createInitialPetState } from '../src/model/PetState';
import { evaluateEvolution, applyEvolutionIfNeeded } from '../src/evolution/evaluateEvolution';

describe('evolution', () => {
  it('inicia como FLAN_BEBE', () => {
    const state = createInitialPetState();
    expect(state.species).toBe('FLAN_BEBE');
    expect(evaluateEvolution(state)).toBeUndefined();
  });

  it('evoluciona de BEBE a TEEN tras 60 ticks', () => {
    let state = createInitialPetState();

    // < 60 ticks
    state.totalTicks = 59;
    expect(evaluateEvolution(state)).toBeUndefined();

    // >= 60 ticks
    state.totalTicks = 60;
    expect(evaluateEvolution(state)).toBe('FLAN_TEEN');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('FLAN_TEEN');
  });

  it('evoluciona de TEEN a ADULT tras 300 ticks', () => {
    let state = createInitialPetState();
    // Simular que ya es TEEN
    state.species = 'FLAN_TEEN';
    state.totalTicks = 60;

    // < 300 ticks
    state.totalTicks = 299;
    expect(evaluateEvolution(state)).toBeUndefined();

    // >= 300 ticks
    state.totalTicks = 300;
    expect(evaluateEvolution(state)).toBe('FLAN_ADULT');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('FLAN_ADULT');
  });

  it('puede evolucionar a POMPOMPURIN (perfect care)', () => {
    let state = createInitialPetState();
    // Simular que llegó a ADULT naturalmente
    state.species = 'FLAN_ADULT';

    // Condiciones: minTicks 3600, happiness 85+, health 85+, hunger 30-, energy 50+
    state.totalTicks = 3600;
    state.stats.happiness = 90;
    state.stats.health = 90;
    state.stats.hunger = 20;
    state.stats.energy = 70;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBe('POMPOMPURIN');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('POMPOMPURIN');
    // EVOLVED event still pushed to history
    expect(evolved.history.some((e) => e.type === 'EVOLVED')).toBe(true);
    // And unlockedForms updated
    expect(evolved.unlockedForms).toContain('POMPOMPURIN');
  });

  it('puede evolucionar a MUFFIN (snack addict + low discipline)', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    // Condiciones: minTicks 2400, minFeeds 200, minPlayCount 5, health 50+
    state.totalTicks = 2400;
    state.stats.health = 60;
    state.stats.hunger = 50;
    state.stats.happiness = 50;
    state.stats.energy = 70;

    // Agregar muchos FEED (200+) y MÍNIMO de PLAY (5)
    state.counts.feed = 200;
    state.counts.play = 5;
    // Muchos REST para NO cumplir BAGEL (maxSleepInterruptions)
    state.counts.rest = 200;
    state.counts.totalActions = 405;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBe('MUFFIN');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('MUFFIN');
  });

  it('puede evolucionar a BAGEL (irregular sleep)', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    // Condiciones: minTicks 1800, maxSleepInterruptions 100, health 40+, happiness 30+
    state.totalTicks = 1800;
    state.stats.health = 50;
    state.stats.happiness = 40;

    // Agregar pocos REST (sleep interruptions = REST count)
    state.counts.rest = 50;
    state.counts.totalActions = 50;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBe('BAGEL');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('BAGEL');
  });

  it('puede evolucionar a SCONE (clean but distant)', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    // Condiciones: minTicks 2400, minCleanliness 70 (PET/total 70%), health -, hunger 50-
    state.totalTicks = 2400;
    state.stats.hunger = 40;
    state.stats.happiness = 20; // Bajo afecto

    // Agregar muchas acciones, pero mayoría PET (70%+ de acciones)
    state.counts.pet = 70;
    state.counts.feed = 30;
    state.counts.totalActions = 100;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBe('SCONE');

    const evolved = applyEvolutionIfNeeded(state);
    expect(evolved.species).toBe('SCONE');
  });

  it('prioriza POMPOMPURIN sobre otros si cumple condiciones', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    // Cumple perfectamente para POMPOMPURIN
    state.totalTicks = 3600;
    state.stats.happiness = 90;
    state.stats.health = 90;
    state.stats.hunger = 20;
    state.stats.energy = 70;

    // Pero también agrega muchos FEED
    state.counts.feed = 150;
    state.counts.totalActions = 150;

    const newSpecies = evaluateEvolution(state);
    // Debe ser POMPOMPURIN porque tiene prioridad 1 (menor que MUFFIN)
    expect(newSpecies).toBe('POMPOMPURIN');
  });

  it('no evoluciona si no cumple condiciones mínimas', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';

    // Estado mediocre, no cumple ninguna condición
    state.totalTicks = 1000;
    state.stats.happiness = 50;
    state.stats.health = 50;
    state.stats.hunger = 50;

    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBeUndefined();
  });
});
