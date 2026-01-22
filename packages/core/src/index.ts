import type { PetState } from './model/PetState';
import { applyEvolutionIfNeeded } from './evolution/evaluateEvolution';
import { checkGiftUnlocks } from './features/gifts';
import { checkAchievementUnlocks } from './features/achievements';

// Model exports
export * from './model/PetState';
export * from './model/Stats';
export * from './model/Actions';
export * from './model/Settings';
export * from './model/SaveData';
export * from './model/Events';

// Engine exports
export * from './engine/tick';
export * from './engine/reducer';

// Evolution exports
export * from './evolution/evolutionRules';
export * from './evolution/evaluateEvolution';

// Features exports
export * from './features/gifts';
export * from './features/achievements';

// Persistence exports
export * from './persistence/serialize';

/**
 * Post-processing del estado: aplica evoluciones, desbloqueos de regalos y logros
 * Se ejecuta tras cada tick y tras cada acción (reduce)
 * Orden garantizado: evolución → regalos → logros
 * Garantiza determinismo: mismo input siempre produce mismo output
 */
export function postProcessState(state: PetState): PetState {
  let current = state;
  let isMutable = false;

  // 1. Evolution
  // applyEvolutionIfNeeded returns a new object (clone) if evolution occurs, or the same object if not.
  const evolvedState = applyEvolutionIfNeeded(current);
  if (evolvedState !== current) {
    current = evolvedState;
    isMutable = true;
  }

  // 2. Gifts
  // Check against 'current' so we see any changes from evolution
  const newGifts = checkGiftUnlocks(current);
  if (newGifts.length > 0) {
    if (!isMutable) {
      current = structuredClone(current);
      isMutable = true;
    }
    current.unlockedGifts.push(...newGifts);
  }

  // 3. Achievements
  // Check against 'current' so we see any changes from evolution OR gifts
  const newAchievements = checkAchievementUnlocks(current);
  if (newAchievements.length > 0) {
    if (!isMutable) {
      current = structuredClone(current);
      isMutable = true;
    }
    current.unlockedAchievements.push(...newAchievements);
  }

  return current;
}
