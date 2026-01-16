import type { PetState } from '../model/PetState';
import { clampStat } from '../model/Stats';
import { createEvent } from '../model/Events';

/**
 * Aplica un tick al estado (degradación de stats)
 * Determinista: solo depende de ticks, no de Date.now()
 * @param state Estado actual
 * @param tickCount Número de ticks a aplicar (ej: 1 tick = 1 segundo)
 * @returns Nuevo estado después del tick
 */
export function tick(state: PetState, tickCount: number = 1): PetState {
  if (!state.alive || tickCount <= 0) {
    return state;
  }

  const newState = structuredClone(state);
  newState.totalTicks += tickCount;

  // Degradación de stats por tick (por segundo aproximadamente)
  // Hunger: aumenta (empeora) ~0.5 por segundo en dificultad normal
  // Happiness: disminuye ~0.3 por segundo si no se interactúa
  // Energy: disminuye ~0.1 por segundo de forma natural
  // Health: disminuye ~0.1 por segundo si el hambre es muy alta

  const hungerDegradation = getDegradationRate(state.settings.difficulty, 'hunger');
  const happinessDegradation = getDegradationRate(state.settings.difficulty, 'happiness');
  const energyDegradation = getDegradationRate(state.settings.difficulty, 'energy');

  newState.stats.hunger = clampStat(newState.stats.hunger + hungerDegradation * tickCount);
  newState.stats.happiness = clampStat(newState.stats.happiness - happinessDegradation * tickCount);
  newState.stats.energy = clampStat(newState.stats.energy - energyDegradation * tickCount);

  // Si el hambre es muy alto, la salud sufre
  if (newState.stats.hunger > 80) {
    const healthDamage = (newState.stats.hunger - 80) * 0.01 * tickCount;
    newState.stats.health = clampStat(newState.stats.health - healthDamage);
  }

  // El Tamagotchi muere si la salud llega a 0
  if (newState.stats.health <= 0) {
    newState.alive = false;
    newState.history.push(createEvent('DIED', newState.totalTicks));
  }

  return newState;
}

/**
 * Obtiene la tasa de degradación según la dificultad
 */
function getDegradationRate(difficulty: string, stat: 'hunger' | 'happiness' | 'energy'): number {
  const baseRates = {
    hunger: 0.5,
    happiness: 0.3,
    energy: 0.1,
  };

  const multipliers = {
    easy: 0.5,
    normal: 1.0,
    hard: 1.5,
  };

  const multiplier = multipliers[difficulty as keyof typeof multipliers] ?? 1.0;
  return baseRates[stat] * multiplier;
}

/**
 * Aplica múltiples ticks a un estado
 */
export function tickMultiple(state: PetState, iterations: number, ticksPerIteration: number = 1): PetState {
  let result = state;
  for (let i = 0; i < iterations; i++) {
    result = tick(result, ticksPerIteration);
    if (!result.alive) break;
  }
  return result;
}
