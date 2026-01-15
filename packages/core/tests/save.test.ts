import { describe, it, expect } from 'vitest';
import { serializeToJSON, deserializeFromJSON } from '../src/persistence/serialize';
import { createInitialPetState } from '../src/model/PetState';
import { tick } from '../src/engine/tick';
import { reduce } from '../src/engine/reducer';
import { createAction } from '../src/model/Actions';

describe('persistence', () => {
  it('roundtrip serialize/deserialize mantiene state', () => {
    const original = createInitialPetState();
    
    const json = serializeToJSON(original);
    const recovered = deserializeFromJSON(json);
    
    expect(recovered.species).toBe(original.species);
    expect(recovered.stats.hunger).toBe(original.stats.hunger);
    expect(recovered.stats.happiness).toBe(original.stats.happiness);
    expect(recovered.stats.energy).toBe(original.stats.energy);
    expect(recovered.stats.health).toBe(original.stats.health);
    expect(recovered.alive).toBe(original.alive);
  });

  it('serializa state después de ticks', () => {
    let state = createInitialPetState();
    state = tick(state, 100);
    
    const json = serializeToJSON(state);
    const recovered = deserializeFromJSON(json);
    
    expect(recovered.totalTicks).toBe(100);
    expect(recovered.stats.hunger).toBe(state.stats.hunger);
  });

  it('serializa state después de acciones', () => {
    let state = createInitialPetState();
    state = reduce(state, createAction('FEED', 1));
    state = reduce(state, createAction('PLAY', 2));
    
    const json = serializeToJSON(state);
    const recovered = deserializeFromJSON(json);
    
    expect(recovered.history.length).toBeGreaterThan(0);
    expect(recovered.alive).toBe(state.alive);
  });

  it('maneja JSON corrupto gracefully', () => {
    const result = deserializeFromJSON('{ invalid json }');
    
    expect(result.alive).toBe(true); // Retorna initial state
    expect(result.species).toBe('FLAN_BEBE');
  });

  it('clampea stats inválidas al deserializar', () => {
    const json = JSON.stringify({
      version: 1,
      createdAt: Date.now(),
      lastSaved: Date.now(),
      totalTicks: 0,
      state: {
        species: 'FLAN_BEBE',
        stats: {
          hunger: 150, // Inválido (>100)
          happiness: -50, // Inválido (<0)
          energy: 50,
          health: 75,
        },
        alive: true,
      },
      history: [],
      settings: {
        difficulty: 'normal',
        soundEnabled: true,
        animationsEnabled: true,
      },
    });
    
    const recovered = deserializeFromJSON(json);
    
    expect(recovered.stats.hunger).toBe(100); // Clampea a máximo
    expect(recovered.stats.happiness).toBe(0); // Clampea a mínimo
  });

  it('serializa settings correctamente', () => {
    const state = createInitialPetState();
    state.settings.difficulty = 'hard';
    state.settings.soundEnabled = false;
    
    const json = serializeToJSON(state);
    const recovered = deserializeFromJSON(json);
    
    expect(recovered.settings.difficulty).toBe('hard');
    expect(recovered.settings.soundEnabled).toBe(false);
  });

  it('JSON serializado es válido string', () => {
    const state = createInitialPetState();
    const json = serializeToJSON(state);
    
    expect(typeof json).toBe('string');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
