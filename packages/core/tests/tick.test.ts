import { describe, it, expect } from 'vitest';
import { tick, tickMultiple } from '../src/engine/tick';
import { createInitialPetState } from '../src/model/PetState';

describe('tick', () => {
  it('degrada stats correctamente en un tick', () => {
    const state = createInitialPetState();
    const newState = tick(state, 1);

    expect(newState.totalTicks).toBe(1);
    expect(newState.stats.hunger).toBeGreaterThan(state.stats.hunger); // Aumenta hambre
    expect(newState.stats.happiness).toBeLessThan(state.stats.happiness); // Disminuye felicidad
    expect(newState.alive).toBe(true);
  });

  it('mantiene stats entre 0 y 100', () => {
    let state = createInitialPetState();
    
    // Aplicar muchos ticks para que stats degraden
    for (let i = 0; i < 1000; i++) {
      state = tick(state, 1);
      
      expect(state.stats.hunger).toBeGreaterThanOrEqual(0);
      expect(state.stats.hunger).toBeLessThanOrEqual(100);
      expect(state.stats.happiness).toBeGreaterThanOrEqual(0);
      expect(state.stats.happiness).toBeLessThanOrEqual(100);
      expect(state.stats.energy).toBeGreaterThanOrEqual(0);
      expect(state.stats.energy).toBeLessThanOrEqual(100);
      expect(state.stats.health).toBeGreaterThanOrEqual(0);
      expect(state.stats.health).toBeLessThanOrEqual(100);
      
      if (!state.alive) break;
    }
  });

  it('mata al Tamagotchi si la salud llega a 0', () => {
    let state = createInitialPetState();
    state.stats.hunger = 100; // Máximo hambre para dañar salud rápidamente
    
    // Aplicar ticks hasta que muera
    let ticks = 0;
    while (state.alive && ticks < 10000) {
      state = tick(state, 1);
      ticks++;
    }
    
    expect(state.alive).toBe(false);
    expect(state.stats.health).toBe(0); // Debe estar clampado a 0
  });

  it('no degrada stats si el pet no está vivo', () => {
    let state = createInitialPetState();
    state.alive = false;
    
    const newState = tick(state, 10);
    expect(newState.alive).toBe(false);
    expect(newState.totalTicks).toBe(0); // No avanza ticks si está muerto
  });

  it('tickMultiple aplica múltiples ticks', () => {
    const state = createInitialPetState();
    const newState = tickMultiple(state, 100, 1); // 100 iteraciones de 1 tick cada una
    
    expect(newState.totalTicks).toBe(100);
    expect(newState.stats.hunger).toBeGreaterThan(state.stats.hunger);
  });

  it('respeta dificultad hard', () => {
    const easyState = createInitialPetState();
    easyState.settings.difficulty = 'easy';
    
    const hardState = createInitialPetState();
    hardState.settings.difficulty = 'hard';
    
    const easyResult = tick(easyState, 10);
    const hardResult = tick(hardState, 10);
    
    // En dificultad hard, la degradación es mayor
    expect(hardResult.stats.hunger).toBeGreaterThan(easyResult.stats.hunger);
    expect(hardResult.stats.happiness).toBeLessThan(easyResult.stats.happiness);
  });

  it('no degrada si tickCount es 0 o negativo', () => {
    const state = createInitialPetState();
    const prevHunger = state.stats.hunger;
    
    const newState0 = tick(state, 0);
    const newStateNeg = tick(state, -5);
    
    expect(newState0.stats.hunger).toBe(prevHunger);
    expect(newStateNeg.stats.hunger).toBe(prevHunger);
  });
});
