import { describe, it, expect } from 'vitest';
import { createInitialPetState } from '../src/model/PetState';
import { reduce } from '../src/engine/reducer';
import { createAction } from '../src/model/Actions';
import { tick } from '../src/engine/tick';
import { evaluateEvolution, applyEvolutionIfNeeded } from '../src/evolution/evaluateEvolution';

describe('evolution', () => {
  it('no evoluciona antes de adulto', () => {
    const state = createInitialPetState();
    expect(state.species).toBe('FLAN_BEBE');
    
    const result = evaluateEvolution(state);
    expect(result).toBeUndefined();
  });

  it('puede evolucionar a POMPOMPURIN (perfect care)', () => {
    let state = createInitialPetState();
    // Simular evolución a adulto
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
    expect(evolved.history.some((e) => e.type === 'EVOLVED')).toBe(true);
  });

  it('puede evolucionar a MUFFIN (snack addict + low discipline)', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';
    
    // Condiciones: minTicks 2400, maxFeeds 200, minPlayCount 5, health 50+
    state.totalTicks = 2400;
    state.stats.health = 60;
    state.stats.hunger = 50;
    state.stats.happiness = 50;
    state.stats.energy = 70;
    
    // Agregar muchos FEED y MÍNIMO de PLAY (5)
    for (let i = 0; i < 150; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'FEED' },
      });
    }
    // Mínimo 5 PLAY para cumplir condición
    for (let i = 0; i < 5; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: 150 + i,
        data: { action: 'PLAY' },
      });
    }
    // Muchos REST para NO cumplir BAGEL (maxSleepInterruptions)
    for (let i = 0; i < 200; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: 155 + i,
        data: { action: 'REST' },
      });
    }
    
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
    for (let i = 0; i < 50; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'REST' },
      });
    }
    
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
    for (let i = 0; i < 70; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'PET' },
      });
    }
    for (let i = 0; i < 30; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: 70 + i,
        data: { action: 'FEED' },
      });
    }
    
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
    for (let i = 0; i < 150; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'FEED' },
      });
    }
    
    const newSpecies = evaluateEvolution(state);
    // Debe ser POMPOMPURIN porque tiene prioridad 1 (menor que MUFFIN)
    expect(newSpecies).toBe('POMPOMPURIN');
  });

  it('no evoluciona si no cumple condiciones mínimas', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';
    
    // Estado mediocre, no cumple ninguna condición
    state.totalTicks = 100; // Muy poco
    state.stats.happiness = 50;
    state.stats.health = 50;
    state.stats.hunger = 50;
    
    const newSpecies = evaluateEvolution(state);
    expect(newSpecies).toBeUndefined();
  });
});
