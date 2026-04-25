# Plan de Calibración — Balance Tamagotchi

## Diagnóstico

**Problema 1: APM (acciones/min) demasiado bajo**
- Caretaker (normal): ~0.27 apm vs target 0.4–0.8 → **40% bajo**
- Causa: thresholds de acción demasiado permisivos → acciones muy esporádicas

**Problema 2: Survival 100% — el pet NUNCA muere**
- Solo `health<=0` por `hunger>80` mata
- Hunger tarda 1000s (16.7 min) en llegar a 80
- Perfiles feedean ANTES de que hunger llegue a 80:
  - Perfect: feed a hunger=60 → 750s
  - Caretaker: feed a hunger=75 → 938s
  - Forgotten threshold=92 (1150s), pero al feedear hunger baja a ~62 → nunca se mantiene >80
- Forgotten con 5% de chance de actuar por tick → casi nunca actúa → en teoría moriría, pero el sistema no detecta muerte por inanición

## Constants actuales

`packages/core/src/balance/constants.ts`:
- `DEGRADATION_BASE.hunger = 0.08`
- `HUNGER_HEALTH_DAMAGE_FACTOR = 0.005`
- `HUNGER_HEALTH_DAMAGE_THRESHOLD = 80`

`packages/core/src/balance/player-profiles.ts`:
- caretaker: feed=75, play=40, rest=25, medicate=50, inaction=0.15
- passive: feed=85, play=20, rest=15, medicate=40, inaction=0.30
- forgotten: feed=92, play=10, rest=8, medicate=30, inaction=0.95

## Cambios a aplicar

### constants.ts

```ts
// Antes
export const DEGRADATION_BASE: DegradationRates = {
  hunger: 0.08,
  happiness: 0.06,
  energy: 0.03,
};

// Después
export const DEGRADATION_BASE: DegradationRates = {
  hunger: 0.10,      // +25%: más hambre por tick
  happiness: 0.06,  // sin cambio
  energy: 0.03,      // sin cambio
};

// Antes
export const HUNGER_HEALTH_DAMAGE_FACTOR = 0.005;

// Después
export const HUNGER_HEALTH_DAMAGE_FACTOR = 0.015;  // 3x: muerte más rápida por hambre
```

### player-profiles.ts

```ts
// caretaker ANTES:
thresholds: { feed: 75, play: 40, rest: 25, medicate: 50 }
inactionChance: 0.15

// caretaker DESPUÉS:
thresholds: { feed: 65, play: 40, rest: 25, medicate: 50 }  // feed más sensible
inactionChance: 0.15  // sin cambio

// passive ANTES:
thresholds: { feed: 85, play: 20, rest: 15, medicate: 40 }
inactionChance: 0.30

// passive DESPUÉS:
thresholds: { feed: 72, play: 20, rest: 15, medicate: 40 }  // feed más sensible
inactionChance: 0.30  // sin cambio

// forgotten ANTES:
thresholds: { feed: 92, play: 10, rest: 8, medicate: 30 }
inactionChance: 0.95

// forgotten DESPUÉS:
thresholds: { feed: 82, play: 10, rest: 8, medicate: 30 }  // feed más sensible
inactionChance: 0.90  // +5% de chance de actuar
```

## Efecto esperado

| Perfil | APM actual | APM target | Status |
|--------|-----------|------------|--------|
| Perfect | ~0.27 | ≤1.0 | ✓ |
| Caretaker | ~0.27 | 0.4–0.8 | ↑ sube a ~0.45 |
| Passive | ~0.25 | 0.1–0.4 | ✓ |
| Forgotten | ~0.22 | 0–0.1 | OK |

| Perfil/Diff | Survival target | Expected |
|-------------|-----------------|---------|
| caretaker/easy | ≥0.95 | ~0.95 |
| caretaker/normal | ≥0.70 | ~0.75 |
| caretaker/hard | ≥0.50 | ~0.55 |
| forgotten/easy | ≥0.60 | ~0.65 |
| forgotten/normal | ≥0.30 | ~0.35 |

## Restaurar PetState.ts

Si el console.log de `PetState.ts:93` sigue comentado, restaurarlo:

```ts
// Antes (diagnóstico):
// [Silenciado por balance-diagnostic] console.log(`[PomPom Core] createInitialPetState called - Line=${petLine}`);

// Después (restaurar):
console.log(`[PomPom Core] createInitialPetState called - Line=${petLine}`);
```

## Verificación

Después de aplicar los cambios:

```bash
cd /home/gris/.hermes/workspace/repos/Tamagotchi/packages/core
npx vitest run tests/balance.monte-carlo.test.ts --test-timeout=600000
```

Si sigue timeout (>300s), usar el script de diagnóstico rápido:
```bash
npx tsx scripts/balance-calibrate.ts
```

## Scripts de diagnóstico existentes

- `scripts/balance-analysis.ts` — análisis puramente matemático (sin simulación)
- `scripts/balance-calibrate.ts` — simulación Monte Carlo con motor real (no funcional aún — tiene bugs)
- `scripts/balance-quick.ts` — versión ligera (50 runs, 1h sesión) — ANTES DE APLICAR LOS CAMBIOS
