import { describe, it, expect } from 'vitest';
import { createInitialPetState } from '../src/model/PetState';
import { evaluateAchievementUnlocks, getUnlockedAchievements, ACHIEVEMENT_CATALOG } from '../src/features/achievements';
import { calculateHistoryStats } from '../src/persistence/serialize';

describe('achievements', () => {
  it('no desbloquea logros sin cumplir condiciones', () => {
    const state = createInitialPetState();
    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements.length).toBe(0);
  });

  it('desbloquea ach_caretaker con 50+ acciones', () => {
    let state = createInitialPetState();
    
    // Agregar 50 acciones
    for (let i = 0; i < 50; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'FEED' },
      });
    }
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_caretaker');
  });

  it('desbloquea ach_perfect_pet al alcanzar POMPOMPURIN', () => {
    let state = createInitialPetState();
    
    // Simular evolución a POMPOMPURIN
    state.history.push({
      type: 'EVOLVED',
      timestamp: 100,
      data: { from: 'FLAN_ADULT', to: 'POMPOMPURIN' },
    });
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_perfect_pet');
  });

  it('desbloquea ach_foodie con 30+ FEED', () => {
    let state = createInitialPetState();
    
    for (let i = 0; i < 30; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'FEED' },
      });
    }
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_foodie');
  });

  it('desbloquea ach_playmate con 25+ PLAY', () => {
    let state = createInitialPetState();
    
    for (let i = 0; i < 25; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'PLAY' },
      });
    }
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_playmate');
  });

  it('desbloquea ach_healer con 10+ MEDICATE', () => {
    let state = createInitialPetState();
    
    for (let i = 0; i < 10; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'MEDICATE' },
      });
    }
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_healer');
  });

  it('desbloquea ach_marathon con 7200+ ticks', () => {
    let state = createInitialPetState();
    state.totalTicks = 7200; // 2 horas
    
    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_marathon');
  });

  it('desbloquea ach_all_forms con todas 4 evoluciones', () => {
    let state = createInitialPetState();
    
    // Simular las 4 evoluciones en historial
    state.history.push({
      type: 'EVOLVED',
      timestamp: 100,
      data: { from: 'FLAN_ADULT', to: 'POMPOMPURIN' },
    });
    state.history.push({
      type: 'EVOLVED',
      timestamp: 200,
      data: { from: 'FLAN_ADULT', to: 'MUFFIN' },
    });
    state.history.push({
      type: 'EVOLVED',
      timestamp: 300,
      data: { from: 'FLAN_ADULT', to: 'BAGEL' },
    });
    state.history.push({
      type: 'EVOLVED',
      timestamp: 400,
      data: { from: 'FLAN_ADULT', to: 'SCONE' },
    });
    
    state.historyStats = calculateHistoryStats(state.history);

    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_all_forms');
  });

  it('no desbloquea logros duplicados', () => {
    let state = createInitialPetState();
    
    for (let i = 0; i < 50; i++) {
      state.history.push({
        type: 'STAT_CHANGED',
        timestamp: i,
        data: { action: 'FEED' },
      });
    }
    
    state.historyStats = calculateHistoryStats(state.history);

    // Evaluar múltiples veces
    state = evaluateAchievementUnlocks(state);
    state = evaluateAchievementUnlocks(state);
    
    const count = state.unlockedAchievements.filter((id) => id === 'ach_caretaker').length;
    expect(count).toBe(1);
  });

  it('getUnlockedAchievements retorna objetos Achievement', () => {
    let state = createInitialPetState();
    state.totalTicks = 7200;
    
    state = evaluateAchievementUnlocks(state);
    const unlockedAchs = getUnlockedAchievements(state);
    
    expect(unlockedAchs.length).toBeGreaterThan(0);
    expect(unlockedAchs[0]).toHaveProperty('id');
    expect(unlockedAchs[0]).toHaveProperty('name');
    expect(unlockedAchs[0]).toHaveProperty('description');
    expect(unlockedAchs[0]).toHaveProperty('icon');
  });

  it('catálogo tiene 7 logros', () => {
    expect(ACHIEVEMENT_CATALOG.length).toBe(7);
  });

  it('todos los logros tienen ids únicos', () => {
    const ids = ACHIEVEMENT_CATALOG.map((a) => a.id);
    const uniqueIds = new Set(ids);
    
    expect(uniqueIds.size).toBe(ids.length);
  });
});
