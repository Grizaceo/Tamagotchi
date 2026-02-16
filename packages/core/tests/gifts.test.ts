import { describe, it, expect } from 'vitest';
import { createInitialPetState } from '../src/model/PetState';
import { evaluateGiftUnlocks, getUnlockedGifts } from '../src/features/gifts';

describe('gifts', () => {
  it('no desbloquea regalos sin cumplir condiciones', () => {
    const state = createInitialPetState();
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toHaveLength(0);
  });

  it('desbloquea gift_first_meal al alimentar una vez', () => {
    const state = createInitialPetState();
    
    state.counts.feed = 1;
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_first_meal');
  });

  it('desbloquea gift_playtime_joy con 3+ PLAY acciones', () => {
    const state = createInitialPetState();
    
    state.counts.play = 3;
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_playtime_joy');
  });

  it('desbloquea gift_dreams con 5+ REST acciones', () => {
    const state = createInitialPetState();
    
    state.counts.rest = 5;
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_dreams');
  });

  it('desbloquea gift_health_potion con 2+ MEDICATE acciones', () => {
    const state = createInitialPetState();
    
    state.counts.medicate = 2;
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_health_potion');
  });

  it('desbloquea gift_affection con 10+ PET acciones', () => {
    const state = createInitialPetState();
    
    state.counts.pet = 10;
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_affection');
  });

  it('desbloquea gift_perfect_care cuando evoluciona a POMPOMPURIN', () => {
    const state = createInitialPetState();
    
    state.species = 'POMPOMPURIN';
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_perfect_care');
  });

  it('desbloquea gift_resilience con 1800+ ticks', () => {
    const state = createInitialPetState();

    state.totalTicks = 1800;
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_resilience');
  });

  it('desbloquea gift_milestone_100 con 6000+ ticks', () => {
    const state = createInitialPetState();

    state.totalTicks = 6000;
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_milestone_100');
  });

  it('desbloquea gift_mystery al alcanzar adulto con health > 70', () => {
    const state = createInitialPetState();

    state.species = 'FLAN_ADULT';
    state.stats.health = 71;
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_mystery');
  });

  it('no desbloquea regalos duplicados', () => {
    const state = createInitialPetState();
    state.unlockedGifts.push('gift_first_meal');

    // Cumple condición de nuevo
    state.counts.feed = 5;
    
    const result = evaluateGiftUnlocks(state);
    
    const count = result.unlockedGifts.filter((id) => id === 'gift_first_meal').length;
    expect(count).toBe(1);
  });

  it('getUnlockedGifts retorna objetos Gift correctos', () => {
    const state = createInitialPetState();
    state.unlockedGifts.push('gift_first_meal');
    
    const unlockedGifts = getUnlockedGifts(state);
    
    expect(unlockedGifts.length).toBeGreaterThan(0);
    expect(unlockedGifts[0]).toHaveProperty('id');
    expect(unlockedGifts[0]).toHaveProperty('name');
  });
});
