/** =============================================================================
 * SIMULATION — Motor Monte Carlo para calibración de balance
 * ============================================================================= */

import type { PetState } from '../model/PetState';
import type { ActionType } from '../model/Actions';
import { createAction } from '../model/Actions';
import { tick } from '../engine/tick';
import { reduce } from '../engine/reducer';
import type { PlayerProfile } from './player-profiles';

export interface SimulationConfig {
  maxTicks: number; // Límite de ticks por run
  sampleInterval: number; // Cada cuántos ticks guardar snapshot de stats
  profile: PlayerProfile;
  difficulty: 'easy' | 'normal' | 'hard';
  initialState: PetState;
}

export interface SimulationResult {
  alive: boolean;
  totalTicks: number;
  totalActions: number;
  deathCause: 'HEALTH_ZERO' | 'MAX_TICKS' | 'ALIVE';
  finalStats: PetState['stats'];
  statSamples: Array<{
    tick: number;
    hunger: number;
    happiness: number;
    energy: number;
    health: number;
  }>;
  actionsByType: Record<ActionType, number>;
}

export interface AggregateMetrics {
  profile: string;
  difficulty: string;
  runs: number;
  maxTicks: number;
  // Survival
  survivalCount: number;
  survivalRate: number; // 0–1
  // Deaths
  deathCount: number;
  meanTicksToDeath: number;
  medianTicksToDeath: number;
  stdDevTicksToDeath: number;
  minTicksToDeath: number;
  maxTicksToDeath: number;
  // Actions
  meanActionsPerRun: number;
  meanActionsPerMinute: number; // assuming 1 tick = 1 sec
  actionDistribution: Record<ActionType, number>;
  // Stats al final de ejecuciones sobrevividas
  meanFinalHunger: number;
  meanFinalHappiness: number;
  meanFinalEnergy: number;
  meanFinalHealth: number;
}

// ---------------------------------------------------------------------------
// SIMULACIÓN INDIVIDUAL
// ---------------------------------------------------------------------------

export function simulateOne(config: SimulationConfig): SimulationResult {
  const { maxTicks, sampleInterval, profile, initialState } = config;
  let state = JSON.parse(JSON.stringify(initialState)) as PetState;
  state.settings.difficulty = config.difficulty;

  const statSamples: SimulationResult['statSamples'] = [];
  const actionsByType: Record<ActionType, number> = {
    FEED: 0,
    PLAY: 0,
    REST: 0,
    MEDICATE: 0,
    PET: 0,
    PLAY_MINIGAME: 0,
  };

  for (let t = 0; t < maxTicks; t++) {
    if (!state.alive) break;

    // Guardar muestra
    if (t % sampleInterval === 0) {
      statSamples.push({
        tick: t,
        hunger: state.stats.hunger,
        happiness: state.stats.happiness,
        energy: state.stats.energy,
        health: state.stats.health,
      });
    }

    // El jugador decide
    const actionType = profile.decideAction(state);
    if (actionType) {
      const action = createAction(actionType, state.totalTicks);
      state = reduce(state, action); // reduce = tick + acción (clona internamente)
      actionsByType[actionType]++;
    } else {
      // mutate=true: evita structuredClone por tick (state ya es local a esta run)
      state = tick(state, 1, true);
    }
  }

  const deathCause: SimulationResult['deathCause'] = !state.alive
    ? 'HEALTH_ZERO'
    : state.totalTicks >= maxTicks
      ? 'MAX_TICKS'
      : 'ALIVE';

  return {
    alive: state.alive,
    totalTicks: state.totalTicks,
    totalActions: Object.values(actionsByType).reduce((a, b) => a + b, 0),
    deathCause,
    finalStats: { ...state.stats },
    statSamples,
    actionsByType,
  };
}

// ---------------------------------------------------------------------------
// BATCH (MONTE CARLO)
// ---------------------------------------------------------------------------

export function runBatch(config: SimulationConfig, runs: number): SimulationResult[] {
  const results: SimulationResult[] = [];
  for (let i = 0; i < runs; i++) {
    results.push(simulateOne(config));
  }
  return results;
}

// ---------------------------------------------------------------------------
// AGREGACIÓN
// ---------------------------------------------------------------------------

export function aggregate(results: SimulationResult[], config: SimulationConfig): AggregateMetrics {
  const deaths = results.filter((r) => !r.alive);
  const survivors = results.filter((r) => r.alive);
  const runs = results.length;

  const ticksToDeath = deaths.map((r) => r.totalTicks);
  const meanTicks = mean(ticksToDeath);
  const stdDevTicks = stdDev(ticksToDeath, meanTicks);
  const totalActions = results.reduce((sum, r) => sum + r.totalActions, 0);

  // Distribución de acciones
  const actionDistribution: Record<ActionType, number> = {
    FEED: 0, PLAY: 0, REST: 0, MEDICATE: 0, PET: 0, PLAY_MINIGAME: 0,
  };
  for (const r of results) {
    for (const [k, v] of Object.entries(r.actionsByType)) {
      actionDistribution[k as ActionType] += v;
    }
  }

  // Stats finales de sobrevivientes
  const meanFinal = survivors.length > 0
    ? {
        hunger: mean(survivors.map((r) => r.finalStats.hunger)),
        happiness: mean(survivors.map((r) => r.finalStats.happiness)),
        energy: mean(survivors.map((r) => r.finalStats.energy)),
        health: mean(survivors.map((r) => r.finalStats.health)),
      }
    : { hunger: 0, happiness: 0, energy: 0, health: 0 };

  return {
    profile: config.profile.id,
    difficulty: config.difficulty,
    runs,
    maxTicks: config.maxTicks,
    survivalCount: survivors.length,
    survivalRate: survivors.length / runs,
    deathCount: deaths.length,
    meanTicksToDeath: meanTicks,
    medianTicksToDeath: median(ticksToDeath),
    stdDevTicksToDeath: stdDevTicks,
    minTicksToDeath: ticksToDeath.length ? Math.min(...ticksToDeath) : Infinity,
    maxTicksToDeath: ticksToDeath.length ? Math.max(...ticksToDeath) : Infinity,
    meanActionsPerRun: totalActions / runs,
    meanActionsPerMinute: totalActions / runs / (config.maxTicks / 60),
    actionDistribution,
    meanFinalHunger: meanFinal.hunger,
    meanFinalHappiness: meanFinal.happiness,
    meanFinalEnergy: meanFinal.energy,
    meanFinalHealth: meanFinal.health,
  };
}

function mean(arr: number[]): number {
  if (arr.length === 0) return NaN;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr: number[]): number {
  if (arr.length === 0) return NaN;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(arr: number[], knownMean?: number): number {
  if (arr.length < 2) return 0;
  const m = knownMean ?? mean(arr);
  const variance = arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}
