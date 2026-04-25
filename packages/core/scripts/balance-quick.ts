/** Balance Quick Diagnostic — Motor real, 50 runs, 1h session
 * npx tsx scripts/balance-quick.ts
 */
import { createInitialPetStateFor } from '../src/model/PetState';
import type { PetState } from '../src/model/PetState';
import type { ActionType } from '../src/model/Actions';
import { createAction } from '../src/model/Actions';
import { tick } from '../src/engine/tick';
import { reduce } from '../src/engine/reducer';
import type { PlayerProfile } from '../src/balance/player-profiles';

// ─── Profiles (copia fiel de player-profiles.ts) ───────────────────────────
const PerfectPlayer: PlayerProfile = {
  id: 'perfect',
  decideAction(s: PetState) {
    const { hunger, happiness, energy, health, affection } = s.stats;
    if (hunger > 60) return 'FEED';
    if (happiness < 50) return 'PLAY';
    if (energy < 40) return 'REST';
    if (health < 70) return 'MEDICATE';
    if (affection < 80) return 'PET';
    return null;
  },
};

const CaretakerPlayer: PlayerProfile = {
  id: 'caretaker',
  decideAction(s: PetState) {
    const { hunger, happiness, energy, health, affection } = s.stats;
    const roll = Math.random();
    if (roll < 0.15) return null;
    if (hunger > 65) return 'FEED';
    if (hunger > 45 && roll < 0.4) return 'FEED';
    if (happiness < 40) return 'PLAY';
    if (energy < 25) return 'REST';
    if (health < 50) return 'MEDICATE';
    if (affection < 50 && roll < 0.6) return 'PET';
    return null;
  },
};

const PassivePlayer: PlayerProfile = {
  id: 'passive',
  decideAction(s: PetState) {
    const { hunger, happiness, energy, health, affection } = s.stats;
    const roll = Math.random();
    if (roll < 0.30) return null;
    if (hunger > 72) return 'FEED';
    if (hunger > 50 && roll < 0.35) return 'FEED';
    if (happiness < 30) return 'PLAY';
    if (energy < 20) return 'REST';
    if (health < 35) return 'MEDICATE';
    if (affection < 30) return 'PET';
    return null;
  },
};

const ForgottenPlayer: PlayerProfile = {
  id: 'forgotten',
  decideAction(s: PetState) {
    const { hunger, happiness, energy, health, affection } = s.stats;
    if (Math.random() > 0.02) return null;
    if (hunger > 82) return 'FEED';
    if (happiness < 10) return 'PLAY';
    if (energy < 8) return 'REST';
    if (health < 30) return 'MEDICATE';
    if (affection < 10) return 'PET';
    return null;
  },
};

const PLAYERS: Record<string, PlayerProfile> = {
  perfect: PerfectPlayer,
  caretaker: CaretakerPlayer,
  passive: PassivePlayer,
  forgotten: ForgottenPlayer,
};

// ─── Engine (motor real) ────────────────────────────────────────────────────
function simOne(profile: PlayerProfile, difficulty: string, maxTicks: number) {
  let state: PetState = JSON.parse(JSON.stringify(createInitialPetStateFor('flan'))) as PetState;
  state.settings.difficulty = difficulty;
  let actions = 0;
  for (let t = 0; t < maxTicks; t++) {
    if (!state.alive) break;
    const act = profile.decideAction(state);
    if (act) { state = reduce(state, createAction(act, state.totalTicks)); actions++; }
    else { state = tick(state, 1, false); }
  }
  return { alive: state.alive, totalTicks: state.totalTicks, actions };
}

function run(profileId: string, diff: string, maxTicks: number, runs = 50) {
  const p = PLAYERS[profileId];
  let surv = 0, totalTicks = 0, totalActions = 0;
  for (let r = 0; r < runs; r++) {
    const res = simOne(p, diff, maxTicks);
    if (res.alive) surv++;
    totalTicks += res.totalTicks;
    totalActions += res.actions;
  }
  const sr = surv / runs;
  const avgTick = totalTicks / runs;
  const avgAct = totalActions / runs;
  const apm = avgAct / (maxTicks / 60);
  return { sr, avgTick, apm, deaths: runs - surv };
}

function fmt(t: number) { const m = Math.floor(t / 60); return `${Math.floor(m / 60)}h${m % 60}m`; }

// ─── Tests: 1-hour session scout ───────────────────────────────────────────
const MAX_1H = 60 * 60;
const RUNS = 50;

console.log('\n=== SCAUTING 1h (50 runs) — survival rate por perfil/dificultad ===');
console.log('Targets: Perfect>=0.95 | Caretaker>=0.85 | Passive>=0.60 | Forgotten<=0.30\n');

for (const pid of ['perfect', 'caretaker', 'passive', 'forgotten']) {
  const row = [`${pid.padEnd(10)}`];
  for (const d of ['easy', 'normal', 'hard'] as const) {
    const r = run(pid, d, MAX_1H, RUNS);
    const icon = r.sr >= 0.95 ? '✓' : r.sr >= 0.85 ? '✓' : r.sr >= 0.60 ? '~' : r.sr <= 0.30 ? '✓' : '✗';
    row.push(` ${d.padEnd(7)}=${r.sr.toFixed(2)}(d=${r.deaths})`);
  }
  console.log(row.join(' |'));
}

// ─── 8-hour test: solo Caretaker (el target más crítico) ────────────────────
console.log('\n=== CARETAKER 8h (50 runs) — apm y median death ===');
const cNormal8h = run('caretaker', 'normal', 60 * 60 * 8, RUNS);
const cHard8h = run('caretaker', 'hard', 60 * 60 * 8, RUNS);
const cEasy8h = run('caretaker', 'easy', 60 * 60 * 8, RUNS);
const cNormal8h_deaths: number[] = [];
for (let r = 0; r < RUNS; r++) { const x = simOne(CaretakerPlayer, 'normal', 60*60*8); if (!x.alive) cNormal8h_deaths.push(x.totalTicks); }
const md = cNormal8h_deaths.length > 0
  ? [...cNormal8h_deaths].sort((a,b)=>a-b)[Math.floor(cNormal8h_deaths.length/2)]
  : Infinity;

console.log(`  easy:   sr=${cEasy8h.sr.toFixed(2)} | apm=${cEasy8h.apm.toFixed(2)} | target apm=[0.4-0.8] | ${cEasy8h.sr >= 0.85 ? '✓' : '✗'} sr>=0.85`);
console.log(`  normal: sr=${cNormal8h.sr.toFixed(2)} | apm=${cNormal8h.apm.toFixed(2)} | target apm=[0.4-0.8] | medianDeath=${fmt(md)} | ${cNormal8h.sr >= 0.85 ? '✓' : '✗'} sr>=0.85`);
console.log(`  hard:   sr=${cHard8h.sr.toFixed(2)} | apm=${cHard8h.apm.toFixed(2)} | target sr>=0.65 | ${cHard8h.sr >= 0.65 ? '✓' : '✗'} sr>=0.65`);

// ─── 8h actions/min for perfect ────────────────────────────────────────────
console.log('\n=== PERFECT 8h (50 runs) — apm targets ===');
const pfEasy = run('perfect', 'easy', 60*60*8, RUNS);
const pfHard = run('perfect', 'hard', 60*60*8, RUNS);
console.log(`  easy: apm=${pfEasy.apm.toFixed(2)} | target<=1.0 | ${pfEasy.apm <= 1.0 ? '✓' : '✗'}`);
console.log(`  hard: apm=${pfHard.apm.toFixed(2)} | target<=1.5 | ${pfHard.apm <= 1.5 ? '✓' : '✗'}`);

// ─── Difficulty separation ──────────────────────────────────────────────────
console.log('\n=== SEPARACIÓN DIFICULTAD ===');
console.log(`  Caretaker: easy sr=${cEasy8h.sr.toFixed(2)} vs hard sr=${cHard8h.sr.toFixed(2)} | hard<easy? ${cHard8h.sr < cEasy8h.sr ? '✓' : '✗'}`);
console.log(`  hard apm=${cHard8h.apm.toFixed(2)} > easy apm=${cEasy8h.apm.toFixed(2)}? ${cHard8h.apm > cEasy8h.apm ? '✓' : '✗'}`);
