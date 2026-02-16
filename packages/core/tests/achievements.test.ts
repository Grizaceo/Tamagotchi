import { describe, it, expect } from 'vitest';
import { createInitialPetState } from '../src/model/PetState';
import { evaluateAchievementUnlocks, getUnlockedAchievements } from '../src/features/achievements';

describe('achievements', () => {
  it('no desbloquea logros sin cumplir condiciones', () => {
    const state = createInitialPetState();
    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toHaveLength(0);
  });

  it('desbloquea ach_caretaker con 50+ acciones', () => {
    const state = createInitialPetState();
    
    // Simular 50 acciones
    state.counts.totalActions = 50;
    
    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_caretaker');
  });

  it('desbloquea ach_perfect_pet al alcanzar POMPOMPURIN', () => {
    const state = createInitialPetState();
    
    state.species = 'POMPOMPURIN';
    
    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_perfect_pet');
  });

  it('desbloquea ach_foodie con 30+ FEED', () => {
    const state = createInitialPetState();
    
    state.counts.feed = 30;
    
    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_foodie');
  });

  it('desbloquea ach_playmate con 25+ PLAY', () => {
    const state = createInitialPetState();
    
    state.counts.play = 25;
    
    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_playmate');
  });

  it('desbloquea ach_healer con 10+ MEDICATE', () => {
    const state = createInitialPetState();
    
    state.counts.medicate = 10;
    
    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_healer');
  });

  it('desbloquea ach_marathon con 7200+ ticks', () => {
    const state = createInitialPetState();

    state.totalTicks = 7200;
    
    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_marathon');
  });

  it('desbloquea ach_all_forms con todas 4 evoluciones', () => {
    const state = createInitialPetState();
    
    // Simular historial de evoluciones
    state.unlockedForms.push('POMPOMPURIN', 'MUFFIN', 'BAGEL', 'SCONE');
    
    const result = evaluateAchievementUnlocks(state);
    
    expect(result.unlockedAchievements).toContain('ach_all_forms');
  });

  it('no desbloquea logros duplicados', () => {
    const state = createInitialPetState();
    state.unlockedAchievements.push('ach_caretaker');
    
    // Cumple condición de nuevo
    state.counts.totalActions = 100;
    
    const result = evaluateAchievementUnlocks(state);
    
    const count = result.unlockedAchievements.filter((id) => id === 'ach_caretaker').length;
    expect(count).toBe(1);
  });

  it('getUnlockedAchievements retorna objetos Achievement', () => {
    const state = createInitialPetState();
    state.unlockedAchievements.push('ach_caretaker');
    
    const unlocked = getUnlockedAchievements(state);
    
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].id).toBe('ach_caretaker');
    expect(unlocked[0].name).toBe('Cuidador Responsable');
  });
});
