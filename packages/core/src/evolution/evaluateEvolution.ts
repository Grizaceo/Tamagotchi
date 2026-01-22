import type { PetState } from '../model/PetState';
import type { GameEvent } from '../model/Events';
import { getSortedRules, type EvolutionSpecies } from './evolutionRules';

/**
 * Evalúa si el pet debe evolucionar y retorna la nueva species, o undefined si no.
 * Determinista: solo depende del estado actual.
 */
export function evaluateEvolution(state: PetState): EvolutionSpecies | undefined {
  // Evolución temprana por edad (ticks)
  if (state.species === 'FLAN_BEBE') {
    // 1 minuto (60 ticks) para pasar a TEEN
    if (state.totalTicks >= 60) {
      return 'FLAN_TEEN';
    }
    return undefined;
  }

  if (state.species === 'FLAN_TEEN') {
    // 5 minutos (300 ticks) para pasar a ADULT
    if (state.totalTicks >= 300) {
      return 'FLAN_ADULT';
    }
    return undefined;
  }

  // Si ya es una forma final (no es FLAN_ADULT), no evoluciona más
  if (state.species !== 'FLAN_ADULT') {
    return undefined;
  }

  const rules = getSortedRules();
  // Analizamos la historia una sola vez para todas las reglas
  const historyStats = analyzeHistory(state.history);

  for (const rule of rules) {
    if (checkConditions(state, rule.conditions, historyStats)) {
      return rule.targetSpecies;
    }
  }

  return undefined; // No cumple ninguna condición
}

interface HistoryStats {
  actionCounts: Record<string, number>;
  totalActions: number;
}

function analyzeHistory(history: GameEvent[]): HistoryStats {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const event of history) {
    const data = event.data as Record<string, unknown> | undefined;
    if (data && typeof data.action === 'string') {
      const action = data.action;
      counts[action] = (counts[action] || 0) + 1;
      total++;
    }
  }

  return { actionCounts: counts, totalActions: total };
}

/**
 * Verifica si el estado cumple todas las condiciones de una regla
 */
function checkConditions(
  state: PetState,
  conditions: Record<string, number | undefined>,
  historyStats: HistoryStats
): boolean {
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
    const feedCount = historyStats.actionCounts['FEED'] || 0;
    if (feedCount > conditions.maxFeeds) {
      return false;
    }
  }

  // minPlayCount: contar acciones PLAY en historia
  if (conditions.minPlayCount !== undefined) {
    const playCount = historyStats.actionCounts['PLAY'] || 0;
    if (playCount < conditions.minPlayCount) {
      return false;
    }
  }

  // maxSleepInterruptions: contar acciones REST
  if (conditions.maxSleepInterruptions !== undefined) {
    const restCount = historyStats.actionCounts['REST'] || 0;
    if (restCount > conditions.maxSleepInterruptions) {
      return false;
    }
  }

  // minCleanliness: inversión de "Pet" count (cuidados afectuosos)
  if (conditions.minCleanliness !== undefined) {
    const petCount = historyStats.actionCounts['PET'] || 0;
    const totalActions = historyStats.totalActions;
    // Limpieza baja si poco PET en proporción a total
    const cleanliness = totalActions > 0 ? (petCount / totalActions) * 100 : 0;
    if (cleanliness < conditions.minCleanliness) {
      return false;
    }
  }

  return true;
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
