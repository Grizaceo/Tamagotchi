import { describe, it, expect } from 'vitest';
import { createInitialPetState } from '../src/model/PetState';
import { evaluateGiftUnlocks, getUnlockedGifts, GIFT_CATALOG } from '../src/features/gifts';
import { calculateHistoryStats } from '../src/persistence/serialize';

describe('gifts', () => {
  it('no desbloquea regalos sin condiciones cumplidas', () => {
    const state = createInitialPetState();
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts.length).toBe(0);
  });

  it('desbloquea gift_first_meal al alimentar una vez', () => {
    let state = createInitialPetState();
    
    // Agregar una acción FEED en historial
    state.history.push({
      type: 'STAT_CHANGED',
      timestamp: 1,
      data: { action: 'FEED' },
    });
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_first_meal');
  });

  it('desbloquea gift_playtime_joy con 3+ PLAY acciones', () => {
    let state = createInitialPetState();
    
    // Agregar 3 acciones PLAY
    for (let i = 0; i < 3; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'PLAY' },
      });
    }
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_playtime_joy');
  });

  it('desbloquea gift_dreams con 5+ REST acciones', () => {
    let state = createInitialPetState();
    
    for (let i = 0; i < 5; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'REST' },
      });
    }
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_dreams');
  });

  it('desbloquea gift_health_potion con 2+ MEDICATE acciones', () => {
    let state = createInitialPetState();
    
    for (let i = 0; i < 2; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'MEDICATE' },
      });
    }
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_health_potion');
  });

  it('desbloquea gift_affection con 10+ PET acciones', () => {
    let state = createInitialPetState();
    
    for (let i = 0; i < 10; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'PET' },
      });
    }
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_affection');
  });

  it('desbloquea gift_perfect_care cuando evoluciona a POMPOMPURIN', () => {
    let state = createInitialPetState();
    
    // Simular evolución a POMPOMPURIN
    state.history.push({
      type: 'EVOLVED',
      timestamp: 100,
      data: { from: 'FLAN_ADULT', to: 'POMPOMPURIN' },
    });
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_perfect_care');
  });

  it('desbloquea gift_resilience con 1800+ ticks', () => {
    let state = createInitialPetState();
    state.totalTicks = 1800; // 30 minutos
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_resilience');
  });

  it('desbloquea gift_milestone_100 con 6000+ ticks', () => {
    let state = createInitialPetState();
    state.totalTicks = 6000; // 100 minutos
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_milestone_100');
  });

  it('desbloquea gift_mystery al alcanzar adulto con health > 70', () => {
    let state = createInitialPetState();
    state.species = 'FLAN_ADULT';
    state.stats.health = 80;
    
    const result = evaluateGiftUnlocks(state);
    
    expect(result.unlockedGifts).toContain('gift_mystery');
  });

  it('no desbloquea regalos duplicados', () => {
    let state = createInitialPetState();
    
    // Simular múltiples evaluaciones
    state = evaluateGiftUnlocks(state);
    state.history.push({
      type: 'STAT_CHANGED',
      timestamp: 1,
      data: { action: 'FEED' },
    });

    state.historyStats = calculateHistoryStats(state.history);

    state = evaluateGiftUnlocks(state);
    
    // gift_first_meal solo debe aparecer una vez
    const count = state.unlockedGifts.filter((id) => id === 'gift_first_meal').length;
    expect(count).toBe(1);
  });

  it('getUnlockedGifts retorna objetos Gift correctos', () => {
    let state = createInitialPetState();
    
    state.history.push({
      type: 'STAT_CHANGED',
      timestamp: 1,
      data: { action: 'FEED' },
    });
    
    state.historyStats = calculateHistoryStats(state.history);

    state = evaluateGiftUnlocks(state);
    const unlockedGifts = getUnlockedGifts(state);
    
    expect(unlockedGifts.length).toBeGreaterThan(0);
    expect(unlockedGifts[0]).toHaveProperty('id');
    expect(unlockedGifts[0]).toHaveProperty('name');
    expect(unlockedGifts[0]).toHaveProperty('description');
    expect(unlockedGifts[0]).toHaveProperty('emoji');
  });

  it('catálogo tiene 8-12 regalos', () => {
    expect(GIFT_CATALOG.length).toBeGreaterThanOrEqual(8);
    expect(GIFT_CATALOG.length).toBeLessThanOrEqual(12);
  });

  it('todos los regalos tienen ids únicos', () => {
    const ids = GIFT_CATALOG.map((g) => g.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(ids.length);
  });
});
