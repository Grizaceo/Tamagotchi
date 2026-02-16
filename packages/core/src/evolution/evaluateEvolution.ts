import type { PetState } from '../model/PetState';
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
      console.log(`[PomPom Debug] Evolving FLAN_BEBE -> FLAN_TEEN (ticks=${state.totalTicks})`);
      return 'FLAN_TEEN';
    }
    return undefined;
  }

  if (state.species === 'FLAN_TEEN') {
    // 5 minutos (300 ticks) para pasar a ADULT
    if (state.totalTicks >= 300) {
      console.log(`[PomPom Debug] Evolving FLAN_TEEN -> FLAN_ADULT (ticks=${state.totalTicks})`);
      return 'FLAN_ADULT';
    }
    return undefined;
  }

  // Si ya es una forma final (no es FLAN_ADULT), no evoluciona más
  if (state.species !== 'FLAN_ADULT') {
    return undefined;
  }

  const rules = getSortedRules();
  // Analizamos los contadores agregados en PetState (O(1))

  for (const rule of rules) {
    if (checkConditions(state, rule.conditions)) {
      console.log(`[PomPom Debug] Evolving FLAN_ADULT -> ${rule.targetSpecies} (Rule=${rule.name})`);
      return rule.targetSpecies;
    }
  }

  return undefined; // No cumple ninguna condición
}

/**
 * Verifica si el estado cumple todas las condiciones de una regla
 */
function checkConditions(
  state: PetState,
  conditions: Record<string, number | undefined>
): boolean {
  // Validaciones básicas de stats actuales
  if (conditions.minTicks !== undefined && state.totalTicks < conditions.minTicks) {
    return false;
  }
  if (conditions.minHappiness !== undefined && state.stats.happiness < conditions.minHappiness) {
    return false;
  }
  if (conditions.maxHunger !== undefined && state.stats.hunger > conditions.maxHunger) {
    return false;
  }
  if (conditions.minHealth !== undefined && state.stats.health < conditions.minHealth) {
    return false;
  }
  if (conditions.minEnergy !== undefined && state.stats.energy < conditions.minEnergy) {
    return false;
  }

  // Validaciones basadas en histórico acumulado (usando state.counts)
  // Defensive check for counts (in case of old state or partial load)
  const counts = state.counts || {
    feed: 0,
    play: 0,
    rest: 0,
    medicate: 0,
    pet: 0,
    totalActions: 0
  };

  // maxFeeds
  if (conditions.maxFeeds !== undefined) {
    if (counts.feed > conditions.maxFeeds) {
      return false;
    }
  }

  // minFeeds
  if (conditions.minFeeds !== undefined) {
    if (counts.feed < conditions.minFeeds) {
      return false;
    }
  }

  // minPlayCount
  if (conditions.minPlayCount !== undefined) {
    if (counts.play < conditions.minPlayCount) {
      return false;
    }
  }

  // maxSleepInterruptions (basado en contador REST)
  if (conditions.maxSleepInterruptions !== undefined) {
    if (counts.rest > conditions.maxSleepInterruptions) {
      return false;
    }
  }

  // minCleanliness: inversión de "Pet" count (cuidados afectuosos) / total
  if (conditions.minCleanliness !== undefined) {
    const petCount = counts.pet;
    const totalActions = counts.totalActions;
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

    // Registrar forma desbloqueada para persistencia (ya que el historial se trunca)
    if (!evolved.unlockedForms) {
        evolved.unlockedForms = [];
    }
    if (!evolved.unlockedForms.includes(newSpecies)) {
      evolved.unlockedForms.push(newSpecies);
    }

    return evolved;
  }

  return state;
}
