import type { PetState } from '../model/PetState';
import type { Action } from '../model/Actions';
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
    case 'PLAY_MINIGAME':
      newState = applyPlayMinigame(newState, action);
      break;
  }

  // Optimización: Truncar el historial para evitar crecimiento infinito
  // Mantenemos los últimos 50 eventos para logs de UI
  if (newState.history.length > 50) {
    newState.history = newState.history.slice(-50);
  }

  return newState;
}

function applyFeed(state: PetState, action: Action): PetState {
  const hungerBefore = state.stats.hunger;

  // Reduce hambre significativamente y mejora felicidad
  state.stats.hunger = clampStat(state.stats.hunger - 30);
  state.stats.happiness = clampStat(state.stats.happiness + 10);

  state.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'FEED',
      hungerBefore,
      hungerAfter: state.stats.hunger,
    })
  );

  // Actualizar contadores
  state.counts.feed++;
  state.counts.totalActions++;

  return state;
}

function applyPlay(state: PetState, action: Action): PetState {
  const happinessBefore = state.stats.happiness;

  // Aumenta felicidad, reduce energía algo y da un poco de hambre
  state.stats.happiness = clampStat(state.stats.happiness + 25);
  state.stats.energy = clampStat(state.stats.energy - 10);
  state.stats.hunger = clampStat(state.stats.hunger + 5);

  state.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'PLAY',
      happinessBefore,
      happinessAfter: state.stats.happiness,
    })
  );

  // Actualizar contadores
  state.counts.play++;
  state.counts.totalActions++;

  return state;
}

function applyRest(state: PetState, action: Action): PetState {
  const energyBefore = state.stats.energy;

  // Aumenta energía bastante, leve hambre
  state.stats.energy = clampStat(state.stats.energy + 40);
  state.stats.hunger = clampStat(state.stats.hunger + 3);

  state.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'REST',
      energyBefore,
      energyAfter: state.stats.energy,
    })
  );

  // Actualizar contadores
  state.counts.rest++;
  state.counts.totalActions++;

  return state;
}

function applyMedicate(state: PetState, action: Action): PetState {
  const healthBefore = state.stats.health;

  // Aumenta salud significativamente
  state.stats.health = clampStat(state.stats.health + 40);

  // Si hay mucho afecto, curar también pone feliz
  if (state.stats.affection > 70) {
    state.stats.happiness = clampStat(state.stats.happiness + 20);
  }

  state.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'MEDICATE',
      healthBefore,
      healthAfter: state.stats.health,
    })
  );

  // Actualizar contadores
  state.counts.medicate++;
  state.counts.totalActions++;

  return state;
}

function applyPet(state: PetState, action: Action): PetState {
  const happinessBefore = state.stats.happiness;

  // Aumenta felicidad y afecto
  state.stats.happiness = clampStat(state.stats.happiness + 10);
  state.stats.affection = clampStat(state.stats.affection + 5);

  state.history.push(
    createEvent('STAT_CHANGED', action.timestamp, {
      action: 'PET',
      happinessBefore,
      happinessAfter: state.stats.happiness,
    })
  );

  // Actualizar contadores
  state.counts.pet++;
  state.counts.totalActions++;

  return state;
}

function applyPlayMinigame(state: PetState, action: Action): PetState {
  const gameId = (action.data?.gameId as string) || 'unknown';
  const result = (action.data?.result as string) || 'win';
  const score = (action.data?.score as number) || 0;

  // Cooldown de 100 ticks - typeguard
  const lastPlayedValue = state.minigames.lastPlayed[gameId as keyof typeof state.minigames.lastPlayed];
  const lastPlayed = lastPlayedValue || -1000;
  if (state.totalTicks - lastPlayed < 100) {
    return state; // No recompensa si está en cooldown
  }

  // Recompensas
  if (result === 'perfect') {
    state.stats.happiness = clampStat(state.stats.happiness + 25);
    state.stats.affection = clampStat(state.stats.affection + 10);
    state.history.push(createEvent('MINIGAME_PERFECT', action.timestamp, { gameId, score }));
  } else if (result === 'win') {
    state.stats.happiness = clampStat(state.stats.happiness + 15);
    state.stats.affection = clampStat(state.stats.affection + 5);
    state.history.push(createEvent('MINIGAME_WIN', action.timestamp, { gameId, score }));
  } else {
    // Loss - no rewards
    state.history.push(createEvent('MINIGAME_LOSS', action.timestamp, { gameId, score }));
  }

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
  }

  // Nota: Minigames no cuentan para "totalActions" ni counters específicos de cuidado (feed, rest, etc)
  // según la lógica anterior, así que no incrementamos state.counts aquí.

  return state;
}
