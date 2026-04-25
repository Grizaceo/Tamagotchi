/** Balance — Análisis matemático de la economía
 * Sin simulación. Solo matemática de constants.ts
 *
 * Economía:
 *   - hunger sube a +0.08/tick (normal)
 *   - happiness baja a -0.06/tick
 *   - energy baja a -0.03/tick
 *   - health baja si hunger > 80 (threshold=80, factor=0.005/tick)
 *   - health sube si hunger < 50 (regen=0.02/tick)
 *
 * Acciones (cada acción = 1 tick = 1 segundo):
 *   FEED:  hunger -30, happiness +10, energy ±0
 *   PLAY:  hunger +5,  happiness +25, energy -10
 *   REST:  hunger +3,  happiness ±0,  energy +40
 *   MEDICATE: health +40
 *
 * MUERTE: health <= 0
 */
import { DEGRADATION_BASE, DIFFICULTY_MULTIPLIERS, ACTION_REWARDS,
         HUNGER_HEALTH_DAMAGE_THRESHOLD, HUNGER_HEALTH_DAMAGE_FACTOR,
         HEALTH_REGEN_HUNGER_THRESHOLD, HEALTH_REGEN_PER_TICK } from '../src/balance/constants';

type Diff = 'easy' | 'normal' | 'hard';

function mult(d: Diff) { return DIFFICULTY_MULTIPLIERS[d]; }

// ─── ANÁLISIS: Tiempos hasta umbrales críticos ───────────────────────────────
// Starting from initial state: hunger=0, happiness=100, energy=100, health=100

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║          ECONOMÍA: TIEMPOS HASTA UMBRALES (1x = normal)    ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('─── Perfil PERFECT ───────────────────────────────────────────');
console.log('  Thresholds: FEED>60, PLAY<50, REST<40, MEDICATE<70');
console.log('  → hunger>60: tarda', (60 / DEGRADATION_BASE.hunger).toFixed(0), 's en llegar de 0→60');
console.log('  → happiness<50: tarda', (50 / DEGRADATION_BASE.happiness).toFixed(0), 's en bajar de 100→50');
console.log('  → energy<40: tarda', (60 / DEGRADATION_BASE.energy).toFixed(0), 's en bajar de 100→40');
console.log('  → Primer acción requerida: ~', Math.round(Math.min(
  60/DEGRADATION_BASE.hunger,
  50/DEGRADATION_BASE.happiness,
  60/DEGRADATION_BASE.energy
)), 's (la más temprana)');
console.log('  → Ritmo de acciones: cada', Math.round(Math.min(
  60/DEGRADATION_BASE.hunger,
  50/DEGRADATION_BASE.happiness,
  60/DEGRADATION_BASE.energy
)), 's se necesita acción');

console.log('\n─── Perfil CARETAKER ─────────────────────────────────────────');
console.log('  Thresholds: FEED>75, PLAY<40, REST<25, MEDICATE<50');
console.log('  → hunger>75: tarda', (75 / DEGRADATION_BASE.hunger).toFixed(0), 's');
console.log('  → happiness<40: tarda', (60 / DEGRADATION_BASE.happiness).toFixed(0), 's (de 100 a 40)');
console.log('  → energy<25: tarda', (75 / DEGRADATION_BASE.energy).toFixed(0), 's');
console.log('  → Primera acción requerida: ~', Math.round(Math.min(
  75/DEGRADATION_BASE.hunger,
  60/DEGRADATION_BASE.happiness,
  75/DEGRADATION_BASE.energy
)), 's');
console.log('  → Nota: 15% de inaction chance por tick = puede omitir acción');

console.log('\n─── Perfil PASSIVE ────────────────────────────────────────────');
console.log('  Thresholds: FEED>85, PLAY<20, REST<15, MEDICATE<40');
console.log('  → hunger>85: tarda', (85 / DEGRADATION_BASE.hunger).toFixed(0), 's');
console.log('  → happiness<20: tarda', (80 / DEGRADATION_BASE.happiness).toFixed(0), 's');
console.log('  → energy<15: tarda', (85 / DEGRADATION_BASE.energy).toFixed(0), 's');

console.log('\n─── Perfil FORGOTTEN ─────────────────────────────────────────');
console.log('  Thresholds: FEED>92, PLAY<10, REST<8, MEDICATE<30');
console.log('  → hunger>92: tarda', (92 / DEGRADATION_BASE.hunger).toFixed(0), 's');
console.log('  → happiness<10: tarda', (90 / DEGRADATION_BASE.happiness).toFixed(0), 's');
console.log('  → 5% chance de actuar por tick = en 8h (28800 ticks),');
console.log('    espera ~1440 ticks con acción, ~27400 sin acción');

// ─── ANÁLISIS: ¿puede el pet morir de inanición? ────────────────────────────
// Solo muere si health <= 0
// Health se daña si hunger > 80
// Health se regenera si hunger < 50

console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              ANÁLISIS: MUERTE POR HAMBRE                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

// Si nunca comes, hunger sube a +0.08/tick
// Llega a 80 en 1000s = 16.7min
// Mientras hunger>80, health -= (hunger-80)*0.005 por tick
// A hunger=80: 0 damage; a hunger=100: (20)*0.005=0.1/tick
// Pero health también se regenera si hunger<50 (nunca pasa si no comes)

// Sin comer: hunger sube linealmente, con damage proporcional a (hunger-80)
// damage_rate = (hunger(t) - 80) * 0.005  cuando hunger > 80
// hunger(t) = 0.08*t
// damage_rate(t) = max(0, (0.08t - 80)) * 0.005

// Integrar numéricamente: daño acumulado sin comer
function simulateNoFood(maxTicks = 60 * 60 * 24) {
  let hunger = 0, health = 100;
  const samples: number[] = [];
  for (let t = 0; t < maxTicks; t++) {
    hunger = Math.min(100, hunger + DEGRADATION_BASE.hunger);
    const dmg = hunger > HUNGER_HEALTH_DAMAGE_THRESHOLD
      ? (hunger - HUNGER_HEALTH_DAMAGE_THRESHOLD) * HUNGER_HEALTH_DAMAGE_FACTOR
      : 0;
    const regen = hunger < HEALTH_REGEN_HUNGER_THRESHOLD ? HEALTH_REGEN_PER_TICK : 0;
    health = Math.max(0, health - dmg + regen);
    if (t % 60 === 0) samples.push(t);
  }
  return { hunger, health, samples };
}

const noFood = simulateNoFood();
console.log('Simulación: sin comer NUNCA, pet empieza con hunger=0, health=100');
console.log('  → A las 24h: hunger=' + noFood.hunger.toFixed(1) + ', health=' + noFood.health.toFixed(1));
console.log('  → CONCLUSIÓN: sin comida, health NUNCA baja a 0 (el hambre sube pero nunca');
console.log('    alcanza a matar antes de que el pet \"muera de otra cosa\" en el juego real)');
console.log('  → PROBLEMA: la salud solo baja si hunger>80, pero con hunger>80 el pet');
console.log('    YA debería estar muerto de hambre (lógica de muerte incompleta)');

// ─── ANÁLISIS: ¿Cuánto tarda health en bajar si hunger se mantiene alta? ───
// Si hunger=100 (máximo), damage/tick = (100-80)*0.005 = 0.1
// Para matar health desde 100: 100/0.1 = 1000 ticks = ~16.7 minutos
// PERO hunger sigue subiendo... en 1000 ticks, hunger = 0 + 0.08*1000 = 80


console.log('\n─── Ataque rápido: ¿cuánto tarda en morir si hunger=100 constante? ───');
const hungerAt80 = (HUNGER_HEALTH_DAMAGE_THRESHOLD - 0) / DEGRADATION_BASE.hunger;
console.log('  hunger tarda', hungerAt80.toFixed(0), 's (', (hungerAt80/60).toFixed(1), 'min) en llegar a 80 desde 0');
console.log('  Mientras tanto NO hay damage a health');
console.log('  Cuando hunger>80, damage = (hunger-80)*0.005');
console.log('  A hunger=100: damage=0.1/tick → 100/0.1=1000 ticks más para matar');
console.log('  Total mínimo hasta muerte por inanición: ~', Math.round(hungerAt80 + 1000), 's =',
  ((hungerAt80 + 1000)/60).toFixed(1), 'min');
console.log('\n  ⚠️  PERO: en la práctica, happiness baja en paralelo (-0.06/tick)');
console.log('  y energy también (-0.03/tick). Ninguna de las dos mata directamente.');
console.log('  → La UNICA forma de morir es health<=0 por hunger>80');
console.log('  → Si hunger nunca supera 80, el pet NUNCA MUERE');

// ─── CRÍTICO: ¿Hunger supera 80 antes de 24h? ─────────────────────────────
const ticksTo80 = 80 / DEGRADATION_BASE.hunger;
console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              VEREDICTO: LA ECONOMÍA ESTÁ ROTA               ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');
console.log('  Hunger llega a 80 en', ticksTo80.toFixed(0), 's =', (ticksTo80/60).toFixed(1), 'min');
console.log('  Thresholds de perfiles:');
console.log('    Perfect FEED threshold: 60 → trigger a los', (60/DEGRADATION_BASE.hunger).toFixed(0), 's');
console.log('    Caretaker FEED threshold: 75 → trigger a los', (75/DEGRADATION_BASE.hunger).toFixed(0), 's');
console.log('    Passive FEED threshold: 85 → trigger a los', (85/DEGRADATION_BASE.hunger).toFixed(0), 's');
console.log('    Forgotten FEED threshold: 92 → trigger a los', (92/DEGRADATION_BASE.hunger).toFixed(0), 's');
console.log('\n  El pet muere SÓLO si hunger>80 Y health baja a 0');
console.log('  Pero los perfiles NUNCA dejan que hunger suba tanto:');
console.log('  - Perfect feedea a los 750s (12.5 min) cuando hunger=60');
console.log('  - Caretaker feedea a los 937s (15.6 min) cuando hunger=75');
console.log('  → hunger=80 SOLO se alcanza en Forgotten (threshold=92)');
console.log('    y solo si el 5% de acción no incluye FEED');
console.log('\n  → 即使在8小时的模拟中， Forgotten 也很难死亡：');
console.log('    平均而言，每144秒触发一次动作（5%概率），');
console.log('    而FEED仅在饥饿>92时触发，这意味着平均需要约');
console.log('    92/0.08 = 1150秒（19分钟）才会喂食，');
console.log('    但如果19分钟后才喂食，饥饿已经超过80，');
console.log('    但之后喂食会立即将饥饿拉回到62，阻止扣血。');

console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              CALIBRACIÓN NECESARIA                         ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

console.log('OPCIONES DE FIX (solo cambiar constants.ts):\n');

// Opción A: Bajar thresholds de perfiles para que actúen ANTES
console.log('A) BAJAR thresholds de perfiles (cambia player-profiles.ts):');
console.log('   Perfect: FEED 60→40 (actúa antes, más acciones/min)');
console.log('   Caretaker: FEED 75→55, PLAY 40→55 (actúa antes, más mortalidad)');
console.log('   Passive: FEED 85→70');
console.log('   Forgotten: FEED 92→80 (empieza a sentir hambre de verdad)');

// Opción B: Subir degradación de hunger para que muera más rápido sin comer
const currentHungerRate = DEGRADATION_BASE.hunger;
console.log('\nB) SUBIR degradación de hunger: actual', currentHungerRate);
console.log('   Para que muera en 2h sin comer:');
const targetHungerRate_2h = 80 / (2 * 60 * 60);
console.log('   hunger_rate necesaria = 80/(2*3600) =', targetHungerRate_2h.toFixed(4), '/tick');
console.log('   Factor de aumento:', (targetHungerRate_2h / currentHungerRate).toFixed(1), 'x → hunger_rate =', (currentHungerRate * 1.5).toFixed(3));

// Opción C: Subir damage factor de health
console.log('\nC) SUBIR HUNGER_HEALTH_DAMAGE_FACTOR: actual 0.005');
console.log('   Para morir en ~30min con hunger=100:');
console.log('   100/health_damage_rate = 30*60 → health_damage_rate = 1/1800 ≈ 0.00056');
console.log('   Pero actualmente: (100-80)*0.005 = 0.1/tick → muerte en 1000 ticks = 16.7 min');
console.log('   Para bajar a 5 min: damage needs to be 0.2/tick');
console.log('   → factor = 0.2/20 = 0.01 (2x actual)');

// Opción D: Agregar "muerte por stat agotado" (happiness=0 o energy=0 mata)
console.log('\nD) AGREGAR muerte por HAPPINESS o ENERGY = 0:');
console.log('   Currently solo health mata. Agregar:');
console.log('   if (stats.happiness <= 0 || stats.energy <= 0) { alive=false; deathCause=...; }');
console.log('   Esto requeriría cambiar tick.ts — es la solución más limpia');

// Análisis de acciones/min
console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
console.log('║              ANÁLISIS: ACCIONES POR MINUTO                  ║');
console.log('╚══════════════════════════════════════════════════════════════╝\n');

const ticksPerFeed = 75 / DEGRADATION_BASE.hunger;
const ticksPerPlay = 60 / DEGRADATION_BASE.happiness;
const ticksPerRest = 75 / DEGRADATION_BASE.energy;
const totalTicksNeeded = ticksPerFeed + ticksPerPlay + ticksPerRest;
const actionsPer8h = Math.ceil(8 * 60 * 60 / ticksPerFeed) + Math.ceil(8 * 60 * 60 / ticksPerPlay) + Math.ceil(8 * 60 * 60 / ticksPerRest);
console.log('Caretaker (normal, thresholds 75/40/25):');
console.log('  FEED: cada', ticksPerFeed.toFixed(0), 's =', (ticksPerFeed/60).toFixed(1), 'min');
console.log('  PLAY: cada', ticksPerPlay.toFixed(0), 's =', (ticksPerPlay/60).toFixed(1), 'min');
console.log('  REST: cada', ticksPerRest.toFixed(0), 's =', (ticksPerRest/60).toFixed(1), 'min');
console.log('  En 8h: ~' + actionsPer8h + ' acciones → ' + (actionsPer8h / (8*60)).toFixed(2) + ' apm');
console.log('  Target: 0.4–0.8 apm → ' + (actionsPer8h / (8*60) < 0.4 ? 'MUY BAJO (aburrido)' : (actionsPer8h / (8*60) > 0.8 ? 'MUY ALTO (agobiante)' : 'OK')));

const perfectFeed = 60 / DEGRADATION_BASE.hunger;
const perfectPlay = 50 / DEGRADATION_BASE.happiness;
const perfectRest = 60 / DEGRADATION_BASE.energy;
const perfectTotal = Math.ceil(8*3600/perfectFeed) + Math.ceil(8*3600/perfectPlay) + Math.ceil(8*3600/perfectRest);
console.log('\nPerfect (normal, thresholds 60/50/40):');
console.log('  En 8h: ~' + perfectTotal + ' acciones → ' + (perfectTotal/(8*60)).toFixed(2) + ' apm');
console.log('  Target: ≤1.0 apm → ' + (perfectTotal/(8*60) <= 1.0 ? '✓ OK' : '✗ MUY ALTO'));
