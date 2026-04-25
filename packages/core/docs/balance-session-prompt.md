# PROMPT — Sesión de Implementación de Balance

## Ejecutar en la siguiente sesión de DAVI

---

Abre el plan en:
`/home/gris/.hermes/workspace/repos/Tamagotchi/packages/core/docs/balance-tuning-plan.md`

## Paso 1: Aplicar cambios a constants.ts

Archivo: `packages/core/src/balance/constants.ts`

Cambios (líneas aproximadas):

```diff
-  hunger: 0.08,
+  hunger: 0.10,

- export const HUNGER_HEALTH_DAMAGE_FACTOR = 0.005;
+ export const HUNGER_HEALTH_DAMAGE_FACTOR = 0.015;
```

## Paso 2: Aplicar cambios a player-profiles.ts

Archivo: `packages/core/src/balance/player-profiles.ts`

Cambios en caretaker:
```diff
- thresholds: { feed: 75, play: 40, rest: 25, medicate: 50 },
+ thresholds: { feed: 65, play: 40, rest: 25, medicate: 50 },
```

Cambios en passive:
```diff
- thresholds: { feed: 85, play: 20, rest: 15, medicate: 40 },
+ thresholds: { feed: 72, play: 20, rest: 15, medicate: 40 },
```

Cambios en forgotten:
```diff
- thresholds: { feed: 92, play: 10, rest: 8, medicate: 30 },
+ thresholds: { feed: 82, play: 10, rest: 8, medicate: 30 },
- inactionChance: 0.95,
+ inactionChance: 0.90,
```

## Paso 3: Restaurar PetState.ts:93

Archivo: `packages/core/src/model/PetState.ts` línea 93

Cambiar:
```diff
- // [Silenciado por balance-diagnostic] console.log(`[PomPom Core]...
+ console.log(`[PomPom Core]...
```

## Paso 4: Verificar

Correr diagnóstico rápido antes/después:
```bash
cd /home/gris/.hermes/workspace/repos/Tamagotchi/packages/core
npx tsx scripts/balance-quick.ts
```

Si los resultados muestran survival < 100% para forgotten, los cambios están funcionando.

## Si survival sigue = 100%

El problema puede ser más profundo. Posibles causas:
1. La acción FEED reduce hunger por 30, pero si el pet estaba en hunger=82, al feedear baja a 52 — el daño de health se reinicia cada vez
2. Forgotten con 90% inacción sigue casi sin actuar

Solución adicional más agresiva:
- Subir `HUNGER_HEALTH_DAMAGE_FACTOR` a 0.02
- Bajar threshold de forgotten a 75
- Bajar inacción de forgotten a 0.88

O considerar agregar muerte por `happiness <= 0` o `energy <= 0` en `tick.ts`.
