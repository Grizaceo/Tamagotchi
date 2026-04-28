import type { PetState } from './model/PetState';
import { applyEvolutionIfNeeded } from './evolution/evaluateEvolution';
import { evaluateGiftUnlocks } from './features/gifts';
import { evaluateAchievementUnlocks } from './features/achievements';
import { evaluateAlbumUnlocks } from './features/album';

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
export * from './features/album';

// Persistence exports
export * from './persistence/serialize';

/**
 * Post-processing del estado: aplica evoluciones, desbloqueos de regalos y logros
 * Se ejecuta tras cada tick y tras cada acción (reduce)
 * Orden garantizado: evolución → regalos → logros
 * Garantiza determinismo: mismo input siempre produce mismo output
 */
export function postProcessState(state: PetState): PetState {
  let processed = state;

  // 1. Aplicar evolución si se cumplen condiciones
  processed = applyEvolutionIfNeeded(processed);

  // 2. Evaluar y desbloquear regalos
  processed = evaluateGiftUnlocks(processed);

  // 3. Evaluar y desbloquear logros basado en estado final
  processed = evaluateAchievementUnlocks(processed);

  // 4. Evaluar y desbloquear entradas del álbum
  processed = evaluateAlbumUnlocks(processed);

  return processed;
}
