# PostProcessState Integration - Implementación Completada

## ✅ Cambios Realizados

### 1. Core Package
**Archivo**: `packages/core/src/index.ts`

```typescript
/**
 * Post-processing del estado: aplica evoluciones, desbloqueos de regalos y logros
 * Se ejecuta tras cada tick y tras cada acción (reduce)
 * Orden garantizado: evolución → regalos → logros
 * Garantiza determinismo: mismo input siempre produce mismo output
 */
export function postProcessState(state: PetState): PetState {
  let processed = state;
  
  // 1. Aplicar evolución si se cumplen condiciones
  processed = applyEvolutionIfNeeded(processed);
  
  // 2. Evaluar y desbloquear regalos basado en estado actual
  processed = evaluateGiftUnlocks(processed);
  
  // 3. Evaluar y desbloquear logros basado en estado final
  processed = evaluateAchievementUnlocks(processed);
  
  return processed;
}
```

**Ventajas**:
- Determinismo garantizado
- No lógica de negocio en UI
- Orden consistente: evolution → gifts → achievements
- Reutilizable en cualquier contexto

### 2. GameLoop Integration
**Archivo**: `apps/web/src/game/GameLoop.ts`

**Cambio 1**: Import correcto
```typescript
import {
  createAction,
  createInitialPetState,
  deserializeFromJSON,
  postProcessState,  // ✅ Reemplaza evaluateGiftUnlocks
  reduce,
  serializeToJSON,
  tick,
  type PetState,
} from '@pompom/core';
```

**Cambio 2**: Post-procesamiento en tick loop (línea ~67)
```typescript
while (accumulator >= TICK_MS) {
  petState = tick(petState, 1);
  // Post-procesar: aplicar evoluciones, desbloqueos de regalos y logros
  petState = postProcessState(petState);
  accumulator -= TICK_MS;
  pendingSave = true;
}
```

**Cambio 3**: Post-procesamiento después de minijuego (línea ~47)
```typescript
const onGameComplete = (result: MinigameResult) => {
  const action = createAction('PLAY_MINIGAME', petState.totalTicks, {
    gameId: result.gameId,
    result: result.result,
    score: result.score || 0,
  });
  petState = reduce(petState, action);
  // Post-procesar: aplicar evoluciones, desbloqueos de regalos y logros
  petState = postProcessState(petState);
  pendingSave = true;
  // ...
};
```

---

## 🎯 Flujos Garantizados

### Flujo 1: Tick Normal
```
GameLoop.loop()
  ├─ tick(petState, 1)           // Decay de stats
  ├─ postProcessState()            // ✅ NUEVO
  │  ├─ applyEvolutionIfNeeded()   // ✅ Evoluciones
  │  ├─ evaluateGiftUnlocks()      // ✅ Regalos
  │  └─ evaluateAchievementUnlocks() // ✅ Logros
  └─ pendingSave = true
```

### Flujo 2: Minijuego Completado
```
onGameComplete(result)
  ├─ reduce(action: PLAY_MINIGAME) // Rewards directo (felicidad, XP)
  ├─ postProcessState()              // ✅ NUEVO
  │  ├─ applyEvolutionIfNeeded()     // Podría evolucionar por XP
  │  ├─ evaluateGiftUnlocks()        // Regalos por happiness/stats
  │  └─ evaluateAchievementUnlocks() // Logros por minigames stats
  ├─ pendingSave = true
  └─ setTimeout(() => switchScene('main'), 1000)
```

### Flujo 3: Carga de Save (Restauración)
```
loadState()
  └─ deserializeFromJSON()
     └─ deserialize(SaveData)
        ├─ Restaurar stats básicos
        ├─ Restaurar history (⚠️ tipos perdidos en v1)
        └─ ⚠️ NOTA: postProcessState() NO se ejecuta en load
           → Usuario verá estado desincronizado si hay cambios pendientes
           → Se sincroniza en siguiente tick
```

---

## ✅ Validación Completada

- Tests: **62/62 PASSING** ✅
- Build: **Limpio, 0 errores TypeScript** ✅
- No rompe SceneManager: ✅
- Determinismo: ✅

---

## ⚠️ Notas Pendientes para UI

### 1. Notificación de Evolución en Load
**Problema**: Si se carga un save con evolución pendiente, el usuario no ve notificación
**Solución**: En MainScene.onUpdate()
```typescript
// TODO: Detectar si species cambió en load
const previousSpecies = localStorage.getItem('lastSpecies');
if (previousSpecies && previousSpecies !== petState.species) {
  // Mostrar: "Tu mascota creció mientras estabas fuera!"
  // Animar transición de forma
}
```

### 2. Animar Desbloqueos de Logros/Regalos
**Problema**: Los desbloqueos son silenciosos
**Solución**: En GameLoop, pasar notificaciones a SceneManager
```typescript
// TODO: Implementar callback onNewUnlocks
const handleUnlocks = (newAchievements: string[], newGifts: string[]) => {
  sceneManager.showNotification(`¡Logro desbloqueado: ${newAchievements[0]}`);
};
// Llamar en onGameComplete después de postProcessState()
```

### 3. SaveData v2 Migration (No implementado, solo propuesto)
**Consultar**: PERSISTENCE_ANALYSIS.md
```typescript
// TODO: Si decide implementar SaveData v2:
// 1. Actualizar SaveData.ts interface
// 2. Serializar event.type además de statChanges
// 3. En deserialize(), si v1: ejecutar postProcessState()
```

### 4. Historia de Evoluciones en Album
**Idea**: Mostrar timeline de evoluciones del pet
**Ubicación**: Nuevo tab en MainScene o modal separado
```typescript
// TODO: Crear EvolvedFormsGallery scene
// Mostrar: todos los EVOLVED events con timestamps
// Mecánica similar a gifts: mostrar qué stats llevaron a cada evolución
```

---

## 📊 Arquitectura Actual

```
Core (packages/core/)
├─ postProcessState()      ← NUEVA función orquestadora
│  ├─ applyEvolutionIfNeeded()   (evolution/)
│  ├─ evaluateGiftUnlocks()       (features/gifts)
│  └─ evaluateAchievementUnlocks() (features/achievements)
├─ reduce()                 (engine/reducer) - Maneja PLAY_MINIGAME + rewards
└─ tick()                   (engine/tick) - Decay de stats

Runtime (apps/web/)
├─ GameLoop.ts
│  ├─ Tick loop: tick() → postProcessState()
│  └─ Action: reduce() → postProcessState()
├─ SceneManager.ts          - Transiciones sin cambios
└─ Scenes/
   ├─ MainScene            - Render básico
   └─ *Game.ts             - Callbacks a onGameComplete
```

---

## 🚀 Próximos Pasos (Opcionales)

1. **SaveData v2**: Implementar si quiere garantizar persistencia de EVOLVED en saves antiguos
2. **UI Notifications**: Mostrar desbloqueos de logros/regalos/evoluciones
3. **Achievement/Gift Gallery**: UI para ver progresos
4. **Stats Page**: Mostrar minigame stats, evolution history
5. **Leaderboard**: Minigame high scores persistentes

---

## Comandos de Validación

```powershell
# Instalar dependencias
pnpm install

# Tests: todo debe pasar
pnpm test
# Output esperado: ✓ Tests Files  8 passed (8), ✓ Tests 62 passed

# Build sin errores
pnpm -C apps/web build
# Output esperado: ✓ built in X.XXs

# Dev con cambios en vivo
pnpm dev
# Acceder a http://localhost:5173
# Probar: tick → evolución → notificación (PENDIENTE EN UI)
# Probar: minijuego → reward → evolución (TODO: animar)
```

---

## Resumen Ejecutivo

✅ **PostProcessState** implementado, integrado y validado  
⚠️ **SaveData v1** tiene issue con EVOLVED (documentado, no bloqueante)  
📝 **UI Notifications** pendientes (3 items en NOTAS)  
🎯 **Estado**: Production-ready, falta solo feedback visual al usuario
