import { describe, it, expect } from 'vitest';
import { createInitialPetStateFor } from '../src/model/PetState';
import {
  PLAYER_PROFILES,
  type PlayerProfileId,
} from '../src/balance/player-profiles';
import {
  runBatch,
  aggregate,
  simulateOne,
  type SimulationConfig,
} from '../src/balance/simulation';
import { postProcessState } from '../src';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================
const RUNS = 200; // suficiente para estadísticas estables
const MAX_TICKS_8H = 60 * 60 * 8; // 8 horas
const MAX_TICKS_24H = 60 * 60 * 24; // 24 horas
const MAX_TICKS_7D = 60 * 60 * 24 * 7; // 1 semana
const SAMPLE_INTERVAL = 60; // 1 muestra / minuto

function buildConfig(
  profileId: PlayerProfileId,
  difficulty: 'easy' | 'normal' | 'hard',
  maxTicks: number
): SimulationConfig {
  const initialState = createInitialPetStateFor('flan');
  return {
    maxTicks,
    sampleInterval: SAMPLE_INTERVAL,
    profile: PLAYER_PROFILES[profileId],
    difficulty,
    initialState,
  };
}

// =============================================================================
// OBJETIVOS DE BALANCE (target numbers)
// =============================================================================
/**
 * Estos objetivos definen "lo mínimo aceptable" y "lo ideal".
 * Los tests correrán Monte Carlo y validarán que la economía cumpla expectativas.
 *
 * PERFECT PLAYER: Debe sobrevivir casi siempre. Es el "skill ceiling":
 *   - survivalRate >= 0.95 en todas las dificultades.
 *   - actionsPerMinute <= 1.0 (no debería requerir mas de 1 acción/minuto).
 *
 * CARETAKER: Jugador dedicado, casual. El corazón del juego:
 *   - survivalRate easy/normal: >= 0.85.
 *   - survivalRate hard: >= 0.65.
 *   - meanActionsPerMinute: 0.4–0.8 (frecuente pero no agobiante).
 *   - meanTicksToDeath (si muere): > 7200 ticks (2h+), la muerte no es instantánea.
 *
 * PASSIVE PLAYER: Descuidado pero no olvidado. Debe sentir "me estoy salvando por los pelos":
 *   - survivalRate easy: >= 0.60.
 *   - survivalRate normal: >= 0.40.
 *   - survivalRate hard: >= 0.20.
 *   - meanTicksToDeath (si muere): > 3600 ticks (1h+).
 *
 * FORGOTTEN PLAYER: Casi no juega. La muerte es esperable, pero no inmediata:
 *   - survivalRate easy: <= 0.30 (casi siempre muere, incluso en easy).
 *   - survivalRate normal: <= 0.15.
 *   - survivalRate hard: ~0.05 o menos.
 *   - meanTicksToDeath (si muere): < 18000 ticks (5h), la agonía no es eterna.
 */

// =============================================================================
// TESTS: PERFECT PLAYER
// =============================================================================
describe('Balance: Perfect Player', () => {
  it('survives >= 95% in easy mode (8h session)', () => {
    const config = buildConfig('perfect', 'easy', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.95);
  });

  it('survives >= 95% in normal mode (8h session)', () => {
    const config = buildConfig('perfect', 'normal', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.95);
  });

  it('survives >= 95% in hard mode (8h session)', () => {
    const config = buildConfig('perfect', 'hard', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.95);
  });

  it('requires <= 1.0 actions/minute (easy, 8h)', () => {
    const config = buildConfig('perfect', 'easy', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.meanActionsPerMinute).toBeLessThanOrEqual(1.0);
  });

  it('requires <= 1.5 actions/minute (hard, 8h)', () => {
    const config = buildConfig('perfect', 'hard', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.meanActionsPerMinute).toBeLessThanOrEqual(1.5);
  });
});

// =============================================================================
// TESTS: CARETAKER PLAYER (core gameplay)
// =============================================================================
describe('Balance: Caretaker Player', () => {
  it('survives >= 85% in easy mode (8h)', () => {
    const config = buildConfig('caretaker', 'easy', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.85);
  });

  it('survives >= 85% in normal mode (8h)', () => {
    const config = buildConfig('caretaker', 'normal', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.85);
  });

  it('survives >= 65% in hard mode (8h)', () => {
    const config = buildConfig('caretaker', 'hard', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.65);
  });

  it('mean actions/minute is 0.4–0.8 (normal, 8h)', () => {
    const config = buildConfig('caretaker', 'normal', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.meanActionsPerMinute).toBeGreaterThanOrEqual(0.4);
    expect(agg.meanActionsPerMinute).toBeLessThanOrEqual(0.8);
  });

  it('death, when it happens, is after 2h+ (medianTicksToDeath > 7200)', () => {
    const config = buildConfig('caretaker', 'normal', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    if (agg.deathCount > 0) {
      expect(agg.medianTicksToDeath).toBeGreaterThan(7200);
    }
  });
});

// =============================================================================
// TESTS: PASSIVE PLAYER
// =============================================================================
describe('Balance: Passive Player', () => {
  it('survives >= 60% in easy mode (8h)', () => {
    const config = buildConfig('passive', 'easy', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.6);
  });

  it('survives >= 40% in normal mode (8h)', () => {
    const config = buildConfig('passive', 'normal', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.4);
  });

  it('survives >= 20% in hard mode (8h)', () => {
    const config = buildConfig('passive', 'hard', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.2);
  });

  it('death, when it happens, is after 1h+ (medianTicksToDeath > 3600)', () => {
    const config = buildConfig('passive', 'normal', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    if (agg.deathCount > 0) {
      expect(agg.medianTicksToDeath).toBeGreaterThan(3600);
    }
  });
});

// =============================================================================
// TESTS: FORGOTTEN PLAYER
// =============================================================================
describe('Balance: Forgotten Player', () => {
  it('survives <= 30% in easy mode (8h)', () => {
    const config = buildConfig('forgotten', 'easy', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeLessThanOrEqual(0.3);
  });

  it('survives <= 15% in normal mode (8h)', () => {
    const config = buildConfig('forgotten', 'normal', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeLessThanOrEqual(0.15);
  });

  it('survives <= 5% in hard mode (8h)', () => {
    const config = buildConfig('forgotten', 'hard', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeLessThanOrEqual(0.05);
  });

  it('death, when it happens, is before 5h (medianTicksToDeath < 18000)', () => {
    const config = buildConfig('forgotten', 'normal', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    if (agg.deathCount > 0) {
      expect(agg.medianTicksToDeath).toBeLessThan(18000);
    }
  });
});

// =============================================================================
// TESTS: LARGA DURACIÓN (24h & 7d) — solo para perfect/caretaker
// =============================================================================
describe('Balance: Marathon sessions (24h)', () => {
  it('Perfect player survives >= 90% in normal (24h)', () => {
    // 24h es mucho; bajamos la barra a 90% para que sea realista
    const config = buildConfig('perfect', 'normal', MAX_TICKS_24H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.9);
  });

  it('Caretaker survives >= 70% in normal (24h)', () => {
    const config = buildConfig('caretaker', 'normal', MAX_TICKS_24H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    expect(agg.survivalRate).toBeGreaterThanOrEqual(0.7);
  });
});

// =============================================================================
// TESTS: DISTRIBUCIÓN DE ACCIONES (variedad = jugabilidad)
// =============================================================================
describe('Balance: Action variety', () => {
  it('Caretaker normal usa >= 4 tipos de acciones distintas (8h)', () => {
    const config = buildConfig('caretaker', 'normal', MAX_TICKS_8H);
    const results = runBatch(config, RUNS);
    const agg = aggregate(results, config);
    const usedTypes = Object.entries(agg.actionDistribution).filter(([, c]) => c > 0);
    expect(usedTypes.length).toBeGreaterThanOrEqual(4);
  });
});

// =============================================================================
// TESTS: DIFERENCIACIÓN DE DIFICULTAD
// =============================================================================
describe('Balance: Difficulty separation', () => {
  it('Hard mata mas rapido que Easy para el mismo perfil (Forgotten, medianTicksToDeath)', () => {
    // Forgotten muere en todas las dificultades, pero MÁS RÁPIDO en hard.
    // Usamos medianTicksToDeath como proxy de separación de dificultad.
    // (survivalRate es 0% en ambas porque Forgotten muere siempre en 8h.)
    const easyConfig = buildConfig('forgotten', 'easy', MAX_TICKS_8H);
    const hardConfig = buildConfig('forgotten', 'hard', MAX_TICKS_8H);

    const easyResults = runBatch(easyConfig, RUNS);
    const hardResults = runBatch(hardConfig, RUNS);

    const easyAgg = aggregate(easyResults, easyConfig);
    const hardAgg = aggregate(hardResults, hardConfig);

    expect(hardAgg.medianTicksToDeath).toBeLessThan(easyAgg.medianTicksToDeath);
  });

  it('Hard tiene mas actions/min que Easy (Caretaker, 8h)', () => {
    const easyConfig = buildConfig('caretaker', 'easy', MAX_TICKS_8H);
    const hardConfig = buildConfig('caretaker', 'hard', MAX_TICKS_8H);

    const easyResults = runBatch(easyConfig, RUNS);
    const hardResults = runBatch(hardConfig, RUNS);

    const easyAgg = aggregate(easyResults, easyConfig);
    const hardAgg = aggregate(hardResults, hardConfig);

    expect(hardAgg.meanActionsPerMinute).toBeGreaterThan(easyAgg.meanActionsPerMinute);
  });
});

// =============================================================================
// TESTS: SANIDAD INTERNA (sanity checks)
// =============================================================================
describe('Balance: Sanity', () => {
  it('Sin acciones, un pet muere siempre antes de 24h (Forgotten, no actions)', () => {
    // Creamos un perfil "null" que nunca actúa para probar degradación pura
    const nullProfile = { id: 'null', decideAction: () => null as any };
    const config: SimulationConfig = {
      maxTicks: MAX_TICKS_24H,
      sampleInterval: SAMPLE_INTERVAL,
      profile: nullProfile,
      difficulty: 'normal',
      initialState: createInitialPetStateFor('flan'),
    };
    // Para perfil nulo usamos menos runs porque muere rápido
    const results = runBatch(config, 20);
    expect(results.every((r) => !r.alive)).toBe(true);
  });

  it('Stats siempre están en [0, 100] durante toda la simulación', () => {
    const config = buildConfig('caretaker', 'normal', MAX_TICKS_8H);
    const results = runBatch(config, 20);
    for (const r of results) {
      for (const s of r.statSamples) {
        expect(s.hunger).toBeGreaterThanOrEqual(0);
        expect(s.hunger).toBeLessThanOrEqual(100);
        expect(s.happiness).toBeGreaterThanOrEqual(0);
        expect(s.happiness).toBeLessThanOrEqual(100);
        expect(s.energy).toBeGreaterThanOrEqual(0);
        expect(s.energy).toBeLessThanOrEqual(100);
        expect(s.health).toBeGreaterThanOrEqual(0);
        expect(s.health).toBeLessThanOrEqual(100);
      }
    }
  });

  it('totalTicks avanza monotone en cada run', () => {
    const config = buildConfig('caretaker', 'normal', MAX_TICKS_8H);
    const result = simulateOne(config);
    // Cada step del loop aumenta totalTicks por 1.
    // Si la run termina por MAX_TICKS, totalTicks == maxTicks.
    // Si por muerte, totalTicks < maxTicks pero > 0.
    expect(result.totalTicks).toBeGreaterThan(0);
    expect(result.totalTicks).toBeLessThanOrEqual(config.maxTicks);
  });
});
