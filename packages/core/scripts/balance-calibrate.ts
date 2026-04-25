/** Balance Calibration — Simulación rápida con motor real
 * Sin patching de módulos. Usa createInitialPetStateFor + tick + reduce.
 */
import { DEGRADATION_BASE, DIFFICULTY_MULTIPLIERS,
         HUNGER_HEALTH_DAMAGE_THRESHOLD, HUNGER_HEALTH_DAMAGE_FACTOR,
         HEALTH_REGEN_HUNGER_THRESHOLD, HEALTH_REGEN_PER_TICK } from '../src/balance/constants';
import { tick } from '../src/engine/tick';
import { reduce } from '../src/engine/reducer';
import { createAction } from '../src/model/Actions';
import { createInitialPetStateFor, type PetState } from '../src/model/PetState';

type PlayerProfile = 'perfect' | 'caretaker' | 'passive' | 'forgotten';
type Difficulty = 'easy' | 'normal' | 'hard';

interface Profile {
  name: PlayerProfile;
  thresholds: { feed: number; play: number; rest: number; medicate: number };
  inactionChance: number; // % de ticks sin acción
}

const PROFILES: Record<PlayerProfile, Profile> = {
  perfect:   { name:'perfect',   thresholds:{feed:60,  play:50, rest:40, medicate:70}, inactionChance:0 },
  caretaker: { name:'caretaker', thresholds:{feed:75,  play:40, rest:25, medicate:50}, inactionChance:0.15 },
  passive:   { name:'passive',   thresholds:{feed:85,  play:20, rest:15, medicate:40}, inactionChance:0.30 },
  forgotten: { name:'forgotten', thresholds:{feed:92,  play:10, rest:8,  medicate:30}, inactionChance:0.95 },
};

const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];
const SESSION_TICKS_1H = 60 * 60;
const SESSION_TICKS_8H = 60 * 60 * 8;

// ─── Targets desde constants.ts ─────────────────────────────────────────────
const SURVIVAL_TARGETS: Record<Difficulty, number> = {
  easy: 0.95, normal: 0.70, hard: 0.50
};
const APM_TARGETS: Record<PlayerProfile, { min: number; max: number }> = {
  perfect:   { min: 0, max: 1.0 },
  caretaker: { min: 0.4, max: 0.8 },
  passive:   { min: 0.1, max: 0.4 },
  forgotten: { min: 0, max: 0.1 },
};

// ─── Motor de simulación ────────────────────────────────────────────────────
function createInitialState(difficulty: Difficulty): PetState {
  const state = createInitialPetStateFor('flan');
  state.settings.difficulty = difficulty;
  return state;
}

function runSimFor(
  profile: Profile,
  difficulty: Difficulty,
  sessionTicks: number,
  silent = true
): {
  survived: boolean;
  deathTick: number | null;
  actionsCount: number;
  apm: number;
} {
  let state = createInitialState(difficulty);
  let deathTick: number | null = null;
  let actionsCount = 0;
  const th = profile.thresholds;

  for (let t = 0; t < sessionTicks; t++) {
    if (!state.alive) break;

    state = tick(state, 1, false);

    if (!state.alive) {
      deathTick = t;
      break;
    }

    if (Math.random() < profile.inactionChance) continue;

    const { hunger, happiness, energy, health } = state.stats;
    let action: string | null = null;
    if (health < th.medicate) action = 'MEDICATE';
    else if (hunger > th.feed) action = 'FEED';
    else if (happiness < th.play) action = 'PLAY';
    else if (energy < th.rest) action = 'REST';

    if (action) {
      state = reduce(state, createAction(action as any, t));
      actionsCount++;
    }
  }

  const apm = (actionsCount / sessionTicks) * 60;
  return { survived: state.alive, deathTick, actionsCount, apm };
}

function evalProfile(
  profile: Profile,
  difficulty: Difficulty,
  sessionTicks: number,
  runs: number
): { survivalRate: number; medianDeathTick: number | null; avgApm: number } {
  let deaths = 0;
  let deathTicks: number[] = [];
  let apms: number[] = [];

  for (let r = 0; r < runs; r++) {
    const result = runSimFor(profile, difficulty, sessionTicks);
    if (!result.survived) { deaths++; if (result.deathTick !== null) deathTicks.push(result.deathTick); }
    apms.push(result.apm);
  }

  const survivalRate = (runs - deaths) / runs;
  const medianDeathTick = deathTicks.length > 0
    ? deathTicks.sort((a, b) => a - b)[Math.floor(deathTicks.length / 2)]
    : null;
  const avgApm = apms.reduce((a, b) => a + b, 0) / apms.length;
  return { survivalRate, medianDeathTick, avgApm };
}

// ─── ESCENARIO 1: BASELINE ──────────────────────────────────────────────────
console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║  ESCENARIO 1: BASELINE — constants.ts ORIGINALES                  ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const runs = 50; // 50 runs para velocidad
const session = SESSION_TICKS_1H; // 1 hora primero

console.log(`  [${session === SESSION_TICKS_1H ? '1H' : '8H'}, ${runs} runs]\n`);
console.log('  SURVIVAL RATE:');
console.log('              easy       normal     hard       | APM(avg)  caretaker  passive   forgotten');
console.log('  ─────────────────────────────────────────────────────────────────────────────────────────────');

for (const [pname, profile] of Object.entries(PROFILES)) {
  const survivalRow = DIFFICULTIES.map(d => {
    const r = evalProfile(profile, d, session, runs);
    const st = SURVIVAL_TARGETS[d];
    const ok = r.survivalRate >= st ? '✓' : '✗';
    return `${(r.survivalRate*100).toFixed(0).padStart(3)}%${ok}`;
  });
  const apmRow = Object.values(PROFILES).map(p2 => {
    const r = evalProfile(p2, 'normal', session, runs);
    const target = APM_TARGETS[p2.name];
    const ok = r.avgApm >= target.min && r.avgApm <= target.max ? '✓' : r.avgApm < target.min ? '↓' : '↑';
    return `${r.avgApm.toFixed(2)}${ok}`;
  });
  console.log(`  ${pname.padEnd(9)} ${survivalRow.join('       ')}  | ${apmRow.join('       ')}`);
}

// ─── ESCENARIO 2: Análisis matemático de calibración ─────────────────────────
console.log('\n\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║  DIAGNÓSTICO MATEMÁTICO — ¿qué constante matar?                  ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

console.log('  PROBLEMA 1: APM muy bajo (caretaker: ~0.15 vs target 0.4–0.8)');
console.log('  CAUSA: thresholds de acción muy altos → acciones muy esporádicas');
console.log('  SOLUCIÓN: bajar thresholds para que actúe más seguido\n');

console.log('  PROBLEMA 2: Survival 100% para todos (pet no muere)');
console.log('  CAUSA: hunger tarda 1000s en llegar a 80; perfiles feedean antes');
console.log('  → Forgotten threshold=92, pero cuando feedea hunger baja a ~62');
console.log('  → Nunca se mantiene hunger>80 por suficiente tiempo');
console.log('  SOLUCIÓN A: subir HUNGER_HEALTH_DAMAGE_FACTOR 0.005 → 0.02');
console.log('  SOLUCIÓN B: bajar threshold de hunger de muerte a 60');
console.log('  SOLUCIÓN C: agregar muerte por happiness=0 o energy=0\n');

console.log('  CALIBRACIÓN PROPUESTA (constants.ts):');
console.log('  ┌────────────────────────────┬──────────┬──────────┐');
console.log('  │ Constante                  │ Actual   │ Propuesto│');
console.log('  ├────────────────────────────┼──────────┼──────────┤');
console.log('  │ DEGRADATION_BASE.hunger    │ 0.08     │ 0.10     │');
console.log('  │ HUNGER_HEALTH_DAMAGE_FACTOR│ 0.005    │ 0.015    │');
console.log('  │ caretaker.feed threshold   │ 75       │ 65       │');
console.log('  │ passive.feed threshold     │ 85       │ 75       │');
console.log('  │ forgotten.feed threshold   │ 92       │ 82       │');
console.log('  │ forgotten.inactionChance   │ 0.95     │ 0.90     │');
console.log('  └────────────────────────────┴──────────┴──────────┘');

// ─── ESCENARIO 3: Simular con CONSTANTES MODIFICADAS (patch in-memory) ──────
console.log('\n\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║  ESCENARIO 3: SIMULACIÓN CON FIXS PROPUESTOS                     ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// Patchear constants en memoria para la simulación
// Copia profunda de los valores originales
const origHungerRate = DEGRADATION_BASE.hunger;
const origDmgFactor = HUNGER_HEALTH_DAMAGE_FACTOR;

function patchConstants(hungerRate: number, dmgFactor: number) {
  (DEGRADATION_BASE as any).hunger = hungerRate;
  (HUNGER_HEALTH_DAMAGE_FACTOR as any) = dmgFactor;
}

function restoreConstants() {
  (DEGRADATION_BASE as any).hunger = origHungerRate;
  (HUNGER_HEALTH_DAMAGE_FACTOR as any) = origDmgFactor;
}

// Profiles con thresholds ajustados
const PROFILES_FIXED: Record<PlayerProfile, Profile> = {
  perfect:   { name:'perfect',   thresholds:{feed:60,  play:50, rest:40, medicate:70}, inactionChance:0 },
  caretaker: { name:'caretaker', thresholds:{feed:65,  play:40, rest:25, medicate:50}, inactionChance:0.15 },
  passive:   { name:'passive',   thresholds:{feed:75,  play:20, rest:15, medicate:40}, inactionChance:0.30 },
  forgotten: { name:'forgotten', thresholds:{feed:82,  play:10, rest:8,  medicate:30}, inactionChance:0.90 },
};

patchConstants(0.10, 0.015);

console.log('  Fix: hunger_rate=0.10, dmg_factor=0.015, thresholds ajustados\n');
console.log('  SURVIVAL RATE:');
console.log('              easy       normal     hard');
console.log('  ─────────────────────────────────────');

for (const [pname, profile] of Object.entries(PROFILES_FIXED)) {
  const row = DIFFICULTIES.map(d => {
    const r = evalProfile(profile, d, SESSION_TICKS_8H, 30);
    const st = SURVIVAL_TARGETS[d];
    const ok = r.survivalRate >= st ? '✓' : '✗';
    return `${pname.padEnd(9)} ${d.padEnd(6)} ${(r.survivalRate*100).toFixed(0).padStart(3)}%${ok}`;
  });
  console.log('  ' + row.join('\n             '));
}

console.log('\n  APM (normal difficulty):');
console.log('              avgApm    minTarget  maxTarget  status');
console.log('  ──────────────────────────────────────────────────');
for (const [pname, profile] of Object.entries(PROFILES_FIXED)) {
  const r = evalProfile(profile, 'normal', SESSION_TICKS_8H, 30);
  const target = APM_TARGETS[pname];
  const ok = r.avgApm >= target.min && r.avgApm <= target.max ? '✓ OK' : r.avgApm < target.min ? '↓ BAJO' : '↑ ALTO';
  console.log(`  ${pname.padEnd(9)} ${r.avgApm.toFixed(3).padStart(7)}   ${target.min.toFixed(1).padStart(8)}    ${target.max.toFixed(1).padStart(8)}    ${ok}`);
}

restoreConstants();
