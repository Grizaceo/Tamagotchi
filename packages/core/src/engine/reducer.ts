import type { PetState } from '../model/PetState';
import type { Action } from '../model/Actions';
import { clampStat } from '../model/Stats';
import { createEvent } from '../model/Events';
import { tick } from './tick';
import {
  ACTION_REWARDS,
  MEDICATE_HAPPINESS_BONUS_AFFECTION_THRESHOLD,
  MEDICATE_HAPPINESS_BONUS_AMOUNT,
  MINIGAME_COOLDOWN_TICKS,
  MINIGAME_REWARDS,
} from '../balance/constants';

/**
 * Aplica una acción al estado y retorna el nuevo estado
 * Las acciones modifican stats y generan eventos
 */
export function reduce(state: PetState, action: Action): PetState {
  if (!state.alive) {
    return state;
  }

  console.log(`[PomPom Reducer] Processing action: ${action.type}`, action.data || '');
  let newState = structuredClone(state);

  // Asegurar que counts existe (defensive programming para hot-loading o estados corruptos)
  if (!newState.counts) {
    newState.counts = {
      totalActions: 0,
      feed: 0,
      play: 0,
      rest: 0,
      medicate: 0,
      pet: 0,
    };
  }

  // Primero aplica un tick (el tiempo siempre avanza)
  // Usamos mutate=true porque ya clonamos el estado arriba
  newState = tick(newState, 1, true);

  if (!newState.alive) {
    return newState;
  }

  // Luego aplica el efecto de la acción
  switch (action.type) {
    case 'FEED':
      newState = applyActionReward(newState, action, ACTION_REWARDS.FEED);
      newState.counts.feed++;
      break;
    case 'PLAY':
      newState = applyActionReward(newState, action, ACTION_REWARDS.PLAY);
      newState.counts.play++;
      break;
    case 'REST':
      newState = applyActionReward(newState, action, ACTION_REWARDS.REST);
      newState.counts.rest++;
      break;
    case 'MEDICATE':
      newState = applyMedicate(newState, action);
      newState.counts.medicate++;
      break;
    case 'PET':
      newState = applyActionReward(newState, action, ACTION_REWARDS.PET);
      newState.counts.pet++;
      break;
    case 'PLAY_MINIGAME':
      newState = applyPlayMinigame(newState, action);
      break;
  }

  // Incrementar totalActions para FEED/PLAY/REST/MEDICATE/PET (no minigames)
  if (action.type !== 'PLAY_MINIGAME') {
    newState.counts.totalActions++;
  }

  // Optimización: Truncar el historial para evitar crecimiento infinito
  // Mantenemos los últimos 50 eventos para logs de UI
  if (newState.history.length > 50) {
    newState.history = newState.history.slice(-50);
  }

  return newState;
}

// ---------------------------------------------------------------------------
// Aplicador de recompensa genérico (usa ACTION_REWARDS)
// ---------------------------------------------------------------------------
function applyActionReward(state: PetState, action: Action, reward: typeof ACTION_REWARDS.FEED): PetState {
  const hungerBefore = state.stats.hunger;
  const happinessBefore = state.stats.happiness;
  const energyBefore = state.stats.energy;
  const healthBefore = state.stats.health;
  const affectionBefore = state.stats.affection;

  state.stats.hunger = clampStat(state.stats.hunger + reward.hungerDelta);
  state.stats.happiness = clampStat(state.stats.happiness + reward.happinessDelta);
  state.stats.energy = clampStat(state.stats.energy + reward.energyDelta);
  state.stats.health = clampStat(state.stats.health + reward.healthDelta);
  state.stats.affection = clampStat(state.stats.affection + reward.affectionDelta);

  state.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: action.type,
      hungerBefore,
      hungerAfter: state.stats.hunger,
      happinessBefore,
      happinessAfter: state.stats.happiness,
      energyBefore,
      energyAfter: state.stats.energy,
      healthBefore,
      healthAfter: state.stats.health,
      affectionBefore,
      affectionAfter: state.stats.affection,
    })
  );

  return state;
}

// ---------------------------------------------------------------------------
// Medicate con bonus condicional (no entra en ACTION_REWARDS porque tiene lógica extra)
// ---------------------------------------------------------------------------
function applyMedicate(state: PetState, action: Action): PetState {
  const healthBefore = state.stats.health;

  state.stats.health = clampStat(state.stats.health + ACTION_REWARDS.MEDICATE.healthDelta);

  // Bonus condicional
  if (state.stats.affection > MEDICATE_HAPPINESS_BONUS_AFFECTION_THRESHOLD) {
    state.stats.happiness = clampStat(state.stats.happiness + MEDICATE_HAPPINESS_BONUS_AMOUNT);
  }

  state.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'MEDICATE',
      healthBefore,
      healthAfter: state.stats.health,
    })
  );

  return state;
}

// ---------------------------------------------------------------------------
// Minigames con cooldown y recompensas escalonadas
// ---------------------------------------------------------------------------
function applyPlayMinigame(state: PetState, action: Action): PetState {
  const gameId = (action.data?.gameId as string) || 'unknown';
  const result = (action.data?.result as string) || 'win';
  const score = (action.data?.score as number) || 0;

  // Cooldown de 100 ticks
  const lastPlayedValue = state.minigames.lastPlayed[gameId as keyof typeof state.minigames.lastPlayed];
  const lastPlayed = lastPlayedValue || -1000;
  if (state.totalTicks - lastPlayed < MINIGAME_COOLDOWN_TICKS) {
    return state; // No recompensa si está en cooldown
  }

  // Recompensas escalonadas desde constants
  const reward = MINIGAME_REWARDS[result] ?? MINIGAME_REWARDS.loss;
  state.stats.happiness = clampStat(state.stats.happiness + reward.happinessDelta);
  state.stats.affection = clampStat(state.stats.affection + reward.affectionDelta);
  state.stats.energy = clampStat(state.stats.energy + reward.energyDelta);

  const eventType = result === 'perfect' ? 'MINIGAME_PERFECT' : result === 'win' ? 'MINIGAME_WIN' : 'MINIGAME_LOSS';
  state.history.push(createEvent(eventType, action.timestamp, { gameId, score }));

  // Registrar último juego
  state.minigames.lastPlayed[gameId as keyof typeof state.minigames.lastPlayed] = state.totalTicks;

  // Actualizar estadísticas por juego
  const gameKey = gameId as keyof typeof state.minigames.games;
  const gameStats = state.minigames.games[gameKey];
  if (gameStats) {
    gameStats.totalPlayed++;
    gameStats.lastPlayed = state.totalTicks;
    if (score > gameStats.bestScore) gameStats.bestScore = score;
    if (result === 'win' || result === 'perfect') gameStats.totalWins++;
    if (result === 'perfect') gameStats.totalPerfect++;
  } else {
    console.warn(`[PomPom Reducer] Unknown gameId: ${gameId}`);
  }

  // Nota: Minigames no cuentan para "totalActions" ni counters específicos de cuidado
  return state;
}
