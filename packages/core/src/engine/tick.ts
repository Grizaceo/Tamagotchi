import type { PetState } from '../model/PetState';
import { clampStat } from '../model/Stats';
import { createEvent } from '../model/Events';
import {
  CLAMP_MAX,
  DEGRADATION_BASE,
  DIFFICULTY_MULTIPLIERS,
  HUNGER_HEALTH_DAMAGE_THRESHOLD,
  HUNGER_HEALTH_DAMAGE_FACTOR,
  HEALTH_REGEN_HUNGER_THRESHOLD,
  HEALTH_REGEN_PER_TICK,
} from '../balance/constants';

/**
 * Aplica un tick al estado (degradación de stats)
 * Determinista: solo depende de ticks, no de Date.now()
 * @param state Estado actual
 * @param tickCount Número de ticks a aplicar (ej: 1 tick = 1 segundo)
 * @param mutate Si es true, modifica el estado in-place. Si es false, retorna una copia.
 * @returns Nuevo estado después del tick
 */
export function tick(state: PetState, tickCount: number = 1, mutate: boolean = false): PetState {
  if (!state.alive || tickCount <= 0) {
    return state;
  }

  const newState = mutate ? state : structuredClone(state);
  newState.totalTicks += tickCount;

  // Degradación de stats por tick (1 tick ≈ 1 segundo)
  // Rates are per-second, scaled by difficulty.
  // At normal speed the pet needs attention every ~15-20 minutes.

  const hungerDegradation = getDegradationRate(state.settings.difficulty, 'hunger');
  const happinessDegradation = getDegradationRate(state.settings.difficulty, 'happiness');
  const energyDegradation = getDegradationRate(state.settings.difficulty, 'energy');

  newState.stats.hunger = clampStat(newState.stats.hunger + hungerDegradation * tickCount);
  newState.stats.happiness = clampStat(newState.stats.happiness - happinessDegradation * tickCount);
  newState.stats.energy = clampStat(newState.stats.energy - energyDegradation * tickCount);

  // Si el hambre es muy alto, la salud sufre
  if (newState.stats.hunger > HUNGER_HEALTH_DAMAGE_THRESHOLD) {
    const healthDamage = (newState.stats.hunger - HUNGER_HEALTH_DAMAGE_THRESHOLD) * HUNGER_HEALTH_DAMAGE_FACTOR * tickCount;
    newState.stats.health = clampStat(newState.stats.health - healthDamage);
  }

  // Recuperación natural de salud si está bien alimentado
  if (newState.stats.hunger < HEALTH_REGEN_HUNGER_THRESHOLD && newState.stats.health < CLAMP_MAX) {
    newState.stats.health = clampStat(newState.stats.health + HEALTH_REGEN_PER_TICK * tickCount);
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
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty as keyof typeof DIFFICULTY_MULTIPLIERS] ?? 1.0;
  return DEGRADATION_BASE[stat] * multiplier;
}

/**
 * Aplica múltiples ticks a un estado
 */
export function tickMultiple(state: PetState, iterations: number, ticksPerIteration: number = 1): PetState {
  let result = structuredClone(state);
  for (let i = 0; i < iterations; i++) {
    // Usamos mutate=true porque ya clonamos el estado al inicio
    result = tick(result, ticksPerIteration, true);
    if (!result.alive) break;
  }
  return result;
}
