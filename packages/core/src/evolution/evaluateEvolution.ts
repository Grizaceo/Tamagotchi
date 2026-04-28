import type { PetState } from '../model/PetState';
import { getSortedRules, type EvolutionSpecies } from './evolutionRules';

/**
 * Evaluates evolution based on pet line.
 */
export function evaluateEvolution(state: PetState): EvolutionSpecies | undefined {
  switch (state.petLine) {
    case 'seal':
      return evaluateSealLike(state, {
        egg: 'SEAL_EGG',
        baby: 'SEAL_BABY',
        teen: 'SEAL_TEEN',
        perfect: 'SEAL_PERFECT',
        normal: 'SEAL_BROWN',
        fail: 'SEAL_FAIL',
      });
    case 'fiu':
      return evaluateSealLike(state, {
        egg: 'FIU_EGG',
        baby: 'FIU_BABY',
        teen: 'FIU_TEEN',
        perfect: 'FIU_PERFECT',
        normal: 'FIU_COMMON',
        fail: 'FIU_FAIL',
      });
    case 'salchicha':
      return evaluateSealLike(state, {
        egg: 'SALCHICHA_EGG',
        baby: 'SALCHICHA_BABY',
        teen: 'SALCHICHA_TEEN',
        perfect: 'SALCHICHA_PERFECT',
        normal: 'SALCHICHA_BROWN',
        fail: 'SALCHICHA_FAIL',
      });
    case 'flan':
    default:
      return evaluateFlan(state);
  }
}

type SealLikeSpecies = {
  egg: EvolutionSpecies;
  baby: EvolutionSpecies;
  teen: EvolutionSpecies;
  perfect: EvolutionSpecies;
  normal: EvolutionSpecies;
  fail: EvolutionSpecies;
};

function evaluateSealLike(state: PetState, sp: SealLikeSpecies): EvolutionSpecies | undefined {
  // Egg -> Baby
  if (state.species === sp.egg && state.totalTicks >= 60) {
    return sp.baby;
  }
  // Baby -> Teen
  if (state.species === sp.baby && state.totalTicks >= 300) {
    return sp.teen;
  }
  // Teen -> Adult variants
  if (state.species !== sp.teen) return undefined;
  if (state.totalTicks < 900) return undefined;

  // Perfect care path
  const perfect =
    state.stats.health >= 85 &&
    state.stats.happiness >= 80 &&
    state.stats.energy >= 50 &&
    state.stats.hunger <= 30;
  if (perfect) return sp.perfect;

  // Fail / morza path (poor care)
  const fail =
    state.stats.health < 40 ||
    state.stats.happiness < 30 ||
    state.stats.hunger > 75;
  if (fail) return sp.fail;

  // Gift-based reward evolutions (Priority over normal/fail if already teen)
  if (state.unlockedGifts.includes('gift_memory_master')) return sp.perfect;
  if (state.unlockedGifts.includes('gift_pudding_pro')) return sp.normal;
  if (state.unlockedGifts.includes('gift_snake_king')) return sp.perfect; // Reuse perfect for now

  return sp.normal;
}

function evaluateFlan(state: PetState): EvolutionSpecies | undefined {
  // Early linear stages
  if (state.species === 'FLAN_BEBE' && state.totalTicks >= 60) {
    return 'FLAN_TEEN';
  }
  if (state.species === 'FLAN_TEEN' && state.totalTicks >= 300) {
    return 'FLAN_ADULT';
  }

  if (state.species !== 'FLAN_ADULT') {
    // Reward evolutions can happen even if not adult flan yet, if at least teen
    if (state.species === 'FLAN_TEEN') {
       if (state.unlockedGifts.includes('gift_pudding_pro')) return 'BAGEL';
       if (state.unlockedGifts.includes('gift_memory_master')) return 'MUFFIN';
       if (state.unlockedGifts.includes('gift_snake_king')) return 'SCONE';
    }
    return undefined;
  }

  for (const rule of getSortedRules('flan')) {
    if (checkConditions(state, rule.conditions)) {
      return rule.targetSpecies;
    }
  }
  return undefined;
}

type ConditionMap = Record<string, number | undefined>;

function checkConditions(state: PetState, conditions: ConditionMap): boolean {
  if (conditions.minTicks !== undefined && state.totalTicks < conditions.minTicks) return false;
  if (conditions.minHappiness !== undefined && state.stats.happiness < conditions.minHappiness) return false;
  if (conditions.maxHunger !== undefined && state.stats.hunger > conditions.maxHunger) return false;
  if (conditions.minHealth !== undefined && state.stats.health < conditions.minHealth) return false;
  if (conditions.minEnergy !== undefined && state.stats.energy < conditions.minEnergy) return false;
  if (conditions.maxEnergy !== undefined && state.stats.energy > conditions.maxEnergy) return false;

  const counts = state.counts || {
    feed: 0,
    play: 0,
    rest: 0,
    medicate: 0,
    pet: 0,
    totalActions: 0,
  };

  if (conditions.maxFeeds !== undefined && counts.feed > conditions.maxFeeds) return false;
  if (conditions.minFeeds !== undefined && counts.feed < conditions.minFeeds) return false;
  if (conditions.minPlayCount !== undefined && counts.play < conditions.minPlayCount) return false;
  if (conditions.maxPlayCount !== undefined && counts.play > conditions.maxPlayCount) return false;
  if (conditions.maxSleepInterruptions !== undefined && counts.rest > conditions.maxSleepInterruptions) return false;
  if (conditions.maxAffectionRatio !== undefined) {
    const total = counts.totalActions;
    const ratio = total > 0 ? (counts.pet / total) * 100 : 0;
    if (ratio > conditions.maxAffectionRatio) return false;
  }

  return true;
}

/**
 * Applies evolution if needed.
 */
export function applyEvolutionIfNeeded(state: PetState): PetState {
  const newSpecies = evaluateEvolution(state);
  if (!newSpecies) return state;

  const evolved = structuredClone(state);
  evolved.species = newSpecies;
  evolved.history.push({
    type: 'EVOLVED',
    timestamp: state.totalTicks,
    data: { from: state.species, to: newSpecies },
  });

  if (!evolved.unlockedForms) evolved.unlockedForms = [];
  if (!evolved.unlockedForms.includes(newSpecies)) {
    evolved.unlockedForms.push(newSpecies);
  }

  return evolved;
}
