import { PetState } from '../model/PetState';
import { GameEvent } from '../model/Events';
import { getSortedRules, EvolutionSpecies } from './evolutionRules';

/**
 * Evalúa si el pet debe evolucionar y retorna la nueva species, o undefined si no.
 * Determinista: solo depende del estado actual.
 */
export function evaluateEvolution(state: PetState): EvolutionSpecies | undefined {
  // Solo puede evolucionar si es adulto y aún no ha evolucionado a forma final
  if (state.species === 'FLAN_BEBE' || state.species === 'FLAN_TEEN') {
    return undefined; // No puede evolucionar antes de adulto
  }

  // Si ya es una forma final (no es FLAN_ADULT), no evoluciona más
  if (state.species !== 'FLAN_ADULT') {
    return undefined;
  }

  const rules = getSortedRules();

  for (const rule of rules) {
    if (checkConditions(state, rule.conditions)) {
      return rule.targetSpecies;
    }
  }

  return undefined; // No cumple ninguna condición
}

/**
 * Verifica si el estado cumple todas las condiciones de una regla
 */
function checkConditions(state: PetState, conditions: Record<string, number | undefined>): boolean {
  // minTicks
  if (conditions.minTicks !== undefined && state.totalTicks < conditions.minTicks) {
    return false;
  }

  // minHappiness
  if (conditions.minHappiness !== undefined && state.stats.happiness < conditions.minHappiness) {
    return false;
  }

  // maxHunger
  if (conditions.maxHunger !== undefined && state.stats.hunger > conditions.maxHunger) {
    return false;
  }

  // minHealth
  if (conditions.minHealth !== undefined && state.stats.health < conditions.minHealth) {
    return false;
  }

  // minEnergy
  if (conditions.minEnergy !== undefined && state.stats.energy < conditions.minEnergy) {
    return false;
  }

  // maxFeeds: contar acciones FEED en historia
  if (conditions.maxFeeds !== undefined) {
    const feedCount = countActionInHistory(state.history, 'FEED');
    if (feedCount > conditions.maxFeeds) {
      return false;
    }
  }

  // minPlayCount: contar acciones PLAY en historia
  if (conditions.minPlayCount !== undefined) {
    const playCount = countActionInHistory(state.history, 'PLAY');
    if (playCount < conditions.minPlayCount) {
      return false;
    }
  }

  // maxSleepInterruptions: contar acciones REST
  if (conditions.maxSleepInterruptions !== undefined) {
    const restCount = countActionInHistory(state.history, 'REST');
    if (restCount > conditions.maxSleepInterruptions) {
      return false;
    }
  }

  // minCleanliness: inversión de "Pet" count (cuidados afectuosos)
  if (conditions.minCleanliness !== undefined) {
    const petCount = countActionInHistory(state.history, 'PET');
    const totalActions = countTotalActions(state.history);
    // Limpieza baja si poco PET en proporción a total
    const cleanliness = totalActions > 0 ? (petCount / totalActions) * 100 : 0;
    if (cleanliness < conditions.minCleanliness) {
      return false;
    }
  }

  return true;
}

/**
 * Cuenta cuántas veces ocurrió una acción en el historial
 */
function countActionInHistory(history: GameEvent[], actionType: string): number {
  return history.filter((event) => {
    return event.data && (event.data as Record<string, unknown>).action === actionType;
  }).length;
}

/**
 * Cuenta acciones totales en el historial
 */
function countTotalActions(history: GameEvent[]): number {
  return history.filter((event) => event.data && (event.data as Record<string, unknown>).action).length;
}

/**
 * Aplica la evolución al estado si corresponde
 * Retorna el estado modificado o igual si no hay evolución
 */
export function applyEvolutionIfNeeded(state: PetState): PetState {
  const newSpecies = evaluateEvolution(state);

  if (newSpecies) {
    const evolved = structuredClone(state);
    evolved.species = newSpecies;
    evolved.history.push({
      type: 'EVOLVED',
      timestamp: state.totalTicks,
      data: { from: state.species, to: newSpecies },
    });
    return evolved;
  }

  return state;
}
