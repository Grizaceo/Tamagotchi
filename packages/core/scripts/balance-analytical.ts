/** Balance Analytical Diagnostic — Pure math, no simulation
 * Computes expected APM and survival directly from constants
 */
import { DEGRADATION_BASE, DIFFICULTY_MULTIPLIERS,
         HUNGER_HEALTH_DAMAGE_THRESHOLD, HUNGER_HEALTH_DAMAGE_FACTOR,
         HEALTH_REGEN_HUNGER_THRESHOLD, HEALTH_REGEN_PER_TICK } from '../src/balance/constants';

type Diff = 'easy' | 'normal' | 'hard';
const mult = (d: Diff) => DIFFICULTY_MULTIPLIERS[d];

// ─── NEW constants after fix ─────────────────────────────────────────────────
const NEW = {
  hungerRate: 0.10,
  dmgFactor: 0.015,
};

// ─── OLD constants (for comparison) ────────────────────────────────────────
const OLD = {
  hungerRate: 0.08,
  dmgFactor: 0.005,
};

// ─── Profiles ───────────────────────────────────────────────────────────────
const profiles = {
  caretaker:  { feed: 65, play: 40, rest: 25, medicate: 50, inaction: 0.15 },
  passive:    { feed: 72, play: 20, rest: 15, medicate: 40, inaction: 0.00 },
  forgotten:  { feed: 82, play: 10, rest: 8,  medicate: 30, inaction: 0.90 },
  perfect:    { feed: 60, play: 50, rest: 40, medicate: 70, inaction: 0.00 },
};

// ─── How long until death if NEVER fed (pure hunger, no intervention) ────────
// Simulates hunger + health damage with no food, no healing
function deathTimeIfNeverFed(rate: number, dmg: number, difficulty: Diff) {
  const m = mult(difficulty);
  const r = rate * m;
  const d = dmg * m;
  let hunger = 0, health = 100;
  let t = 0;
  while (t < 72 * 3600 && health > 0) { // cap at 72h
    hunger = Math.min(100, hunger + r);
    const healthDmg = hunger > HUNGER_HEALTH_DAMAGE_THRESHOLD
      ? (hunger - HUNGER_HEALTH_DAMAGE_THRESHOLD) * d
      : 0;
    health = Math.max(0, health - healthDmg);
    t++;
  }
  return { t, hunger, health };
}

// ─── Time between feeds for each profile ─────────────────────────────────────
function feedInterval(threshold: number, rate: number, difficulty: Diff) {
  const m = mult(difficulty);
  return threshold / (rate * m);
}

// ─── Approximate death chance for forgotten without feeding ─────────────────
// forgotten acts with (1-inactionChance) prob per tick, and only FEEDs when hunger>threshold
// We simulate the worst case: forgotten never feeds until threshold reached
function forgotDeathTime(rate: number, dmg: number, difficulty: Diff) {
  const p = profiles.forgotten;
  const m = mult(difficulty);
  // How long until hunger > p.feed?
  const timeToFeedTrigger = p.feed / (rate * m);
  // After that, with 10% action chance, expected wait for action = 10 ticks
  // But let's approximate: feed happens around timeToFeedTrigger + 10
  // How long until death after last feed?
  const death = deathTimeIfNeverFed(rate, dmg, difficulty);
  return { timeToFeedTrigger: Math.round(timeToFeedTrigger), deathTime: death.t };
}

// ─── APM estimation ──────────────────────────────────────────────────────────
// actions per 8h session
function apm8h(threshold: number, rate: number, difficulty: Diff, inaction: number) {
  const interval = feedInterval(threshold, rate, difficulty);
  const effectiveInterval = inaction > 0 ? interval / (1 - inaction) : interval;
  const feeds8h = (8 * 3600) / effectiveInterval;
  // Also play/rests that contribute to APM
  // Assume roughly equal mix of FEED, PLAY, REST
  return feeds8h * 3 / (8 * 60); // 3 actions per feed cycle
}

// ─── Main ────────────────────────────────────────────────────────────────────
console.log('\n=== BALANCE ANALYTICAL DIAGNOSTIC (NEW constants) ===\n');

console.log('--- Death if NEVER fed (all difficulties) ---');
for (const d of ['easy', 'normal', 'hard'] as Diff[]) {
  const r = deathTimeIfNeverFed(OLD.hungerRate, OLD.dmgFactor, d);
  const r2 = deathTimeIfNeverFed(NEW.hungerRate, NEW.dmgFactor, d);
  console.log(`  ${d}: OLD=${(r.t/60).toFixed(1)}min → NEW=${(r2.t/60).toFixed(1)}min (NEW is ${(r.t/r2.t).toFixed(1)}x faster)`);
}

console.log('\n--- Forgotten: time until feed trigger, then death ---');
for (const d of ['easy', 'normal', 'hard'] as Diff[]) {
  const r = forgotDeathTime(OLD.hungerRate, OLD.dmgFactor, d);
  const r2 = forgotDeathTime(NEW.hungerRate, NEW.dmgFactor, d);
  console.log(`  ${d}: feed_trigger=${r.timeToFeedTrigger}s → death~${r.deathTime}s (OLD) | feed_trigger=${r2.timeToFeedTrigger}s → death~${r2.deathTime}s (NEW)`);
}

console.log('\n--- Estimated APM (8h session) ---');
console.log('  Profile    | Threshold | OLD apm | NEW apm | Target');
for (const [name, p] of Object.entries(profiles)) {
  for (const d of ['normal'] as Diff[]) {
    const oldApm = apm8h(p.feed, OLD.hungerRate, d, p.inaction);
    const newApm = apm8h(p.feed, NEW.hungerRate, d, p.inaction);
    let target = '';
    if (name === 'perfect') target = '≤1.0';
    if (name === 'caretaker') target = '0.4–0.8';
    if (name === 'passive') target = '0.1–0.4';
    if (name === 'forgotten') target = '0–0.1';
    const ok = name === 'perfect' ? newApm <= 1.0
      : name === 'caretaker' ? newApm >= 0.4 && newApm <= 0.8
      : name === 'passive' ? newApm >= 0.1 && newApm <= 0.4
      : newApm <= 0.1;
    console.log(`  ${name.padEnd(10)} | ${d.padEnd(7)} | ${oldApm.toFixed(2)}    | ${newApm.toFixed(2)}    | ${target} ${ok ? '✓' : '✗'}`);
  }
}

console.log('\n--- NEW hunger_rate effect ---');
console.log(`  OLD: 0→80 in ${(80/OLD.hungerRate/60).toFixed(1)} min`);
console.log(`  NEW: 0→80 in ${(80/NEW.hungerRate/60).toFixed(1)} min (${(80/OLD.hungerRate)/(80/NEW.hungerRate).toFixed(2)}x faster)`);

console.log('\n--- NEW dmg_factor effect (hunger=100) ---');
console.log(`  OLD: (100-80)*${OLD.dmgFactor}=${(20*OLD.dmgFactor).toFixed(3)} dmg/tick → death in ${(100/(20*OLD.dmgFactor)/60).toFixed(1)} min`);
console.log(`  NEW: (100-80)*${NEW.dmgFactor}=${(20*NEW.dmgFactor).toFixed(3)} dmg/tick → death in ${(100/(20*NEW.dmgFactor)/60).toFixed(1)} min (${((20*OLD.dmgFactor)/(20*NEW.dmgFactor)).toFixed(1)}x faster)`);

console.log('\n--- Threshold changes effect ---');
console.log(`  caretaker feed: 75→65 = acts ${((75/NEW.hungerRate)/(65/NEW.hungerRate)).toFixed(1)}x sooner`);
console.log(`  passive feed:   85→72 = acts ${((85/OLD.hungerRate)/(72/NEW.hungerRate)).toFixed(1)}x sooner`);
console.log(`  forgotten feed: 92→82, inaction: 0.95→0.90`);
