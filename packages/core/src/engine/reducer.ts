import { PetState } from '../model/PetState';
import { Action, ActionType } from '../model/Actions';
import { clampStat } from '../model/Stats';
import { createEvent } from '../model/Events';
import { tick } from './tick';

/**
 * Aplica una acción al estado y retorna el nuevo estado
 * Las acciones modifican stats y generan eventos
 */
export function reduce(state: PetState, action: Action): PetState {
  if (!state.alive) {
    return state;
  }

  let newState = structuredClone(state);
  
  // Primero aplica un tick (el tiempo siempre avanza)
  newState = tick(newState, 1);

  if (!newState.alive) {
    return newState;
  }

  // Luego aplica el efecto de la acción
  switch (action.type) {
    case 'FEED':
      newState = applyFeed(newState, action);
      break;
    case 'PLAY':
      newState = applyPlay(newState, action);
      break;
    case 'REST':
      newState = applyRest(newState, action);
      break;
    case 'MEDICATE':
      newState = applyMedicate(newState, action);
      break;
    case 'PET':
      newState = applyPet(newState, action);
      break;
  }

  return newState;
}

function applyFeed(state: PetState, action: Action): PetState {
  const newState = structuredClone(state);
  
  // Reduce hambre pero aumenta un poco la felicidad
  newState.stats.hunger = clampStat(newState.stats.hunger - 20);
  newState.stats.happiness = clampStat(newState.stats.happiness + 5);
  
  newState.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'FEED',
      hungerBefore: state.stats.hunger,
      hungerAfter: newState.stats.hunger,
    })
  );

  return newState;
}

function applyPlay(state: PetState, action: Action): PetState {
  const newState = structuredClone(state);
  
  // Aumenta felicidad pero reduce energía y aumenta hambre
  newState.stats.happiness = clampStat(newState.stats.happiness + 20);
  newState.stats.energy = clampStat(newState.stats.energy - 15);
  newState.stats.hunger = clampStat(newState.stats.hunger + 10);
  
  newState.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'PLAY',
      happinessBefore: state.stats.happiness,
      happinessAfter: newState.stats.happiness,
    })
  );

  return newState;
}

function applyRest(state: PetState, action: Action): PetState {
  const newState = structuredClone(state);
  
  // Aumenta energía, reduce hambre un poco
  newState.stats.energy = clampStat(newState.stats.energy + 30);
  newState.stats.hunger = clampStat(newState.stats.hunger + 5);
  
  newState.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'REST',
      energyBefore: state.stats.energy,
      energyAfter: newState.stats.energy,
    })
  );

  return newState;
}

function applyMedicate(state: PetState, action: Action): PetState {
  const newState = structuredClone(state);
  
  // Aumenta salud
  newState.stats.health = clampStat(newState.stats.health + 25);
  
  newState.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'MEDICATE',
      healthBefore: state.stats.health,
      healthAfter: newState.stats.health,
    })
  );

  return newState;
}

function applyPet(state: PetState, action: Action): PetState {
  const newState = structuredClone(state);
  
  // Aumenta felicidad levemente
  newState.stats.happiness = clampStat(newState.stats.happiness + 5);
  
  newState.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'PET',
      happinessBefore: state.stats.happiness,
      happinessAfter: newState.stats.happiness,
    })
  );

  return newState;
}

/**
 * Aplica múltiples acciones en secuencia
 */
export function reduceMany(state: PetState, actions: Action[]): PetState {
  let result = state;
  for (const action of actions) {
    result = reduce(result, action);
    if (!result.alive) break;
  }
  return result;
}
