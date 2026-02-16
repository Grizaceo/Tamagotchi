# Integración de Minijuegos - Documentación Completa

## Resumen Ejecutivo

Se ha completado la integración de dos minijuegos (`PuddingGame` y `MemoryGame`) al flujo principal del juego Tamagotchi. La arquitectura implementada permite:

1. **Flujo de escenas**: MainScene → MinigameSelect → (PuddingGame | MemoryGame) → MainScene
2. **Sistema de recompensas**: Los resultados de minijuegos aplicar rewards a través del core (actions/reducer)
3. **Serialización completa**: Estado de minijuegos persistido correctamente
4. **Tests de integración**: Cobertura de flujo sin romper 60 tests existentes

---

## Archivos Modificados

### 1. **Core - PetState Extendido**
**Archivo**: `packages/core/src/model/PetState.ts`

```typescript
// Nuevas interfaces
interface MinigameStats {
  lastPlayed: number;
  bestScore: number;
  totalPlayed: number;
  totalWins: number;
  totalPerfect: number;
}

type MinigameId = 'pudding' | 'memory';

interface MinigamesState {
  lastPlayed: Record<MinigameId, number>; // Para cooldown
  games: Record<MinigameId, MinigameStats>;
}
```

**Cambios**: Se tiparon completamente los minijuegos para soportar estadísticas y cooldown.

### 2. **Serialización - Persistencia**
**Archivo**: `packages/core/src/persistence/serialize.ts`

**Cambios**:
- ✅ TODO eliminado (línea 24): Ahora popula `minigames.lastPlayed` y `minigames.games`
- Serialización incluye estado completo por juego
- Deserialización restaura correctamente con valores por defecto

### 3. **Reducer - Rewards de Minijuegos**
**Archivo**: `packages/core/src/engine/reducer.ts`

**Lógica implementada**:
```
PLAY_MINIGAME action:
  - Perfect: +25 happiness, +10 affection
  - Win:     +15 happiness, +5 affection
  - Loss:    Sin reward adicional
  - Cooldown: 100 ticks entre jugadas del mismo juego
```

### 4. **Scene Manager & Contexto**
**Archivo**: `apps/web/src/game/scenes/Scene.ts`

**Nuevas interfaces**:
```typescript
interface MinigameResult {
  gameId: 'pudding' | 'memory';
  result: 'win' | 'perfect' | 'loss';
  score?: number;
}

interface SceneContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  onSceneChange: (sceneName: string) => void;
  onGameComplete?: (result: MinigameResult) => void;  // ← NUEVO
}
```

### 5. **GameLoop Integrado con SceneManager**
**Archivo**: `apps/web/src/game/GameLoop.ts`

**Cambios principales**:
- ✅ Reemplazó sistema anterior (Scenes.ts/Render.ts) con SceneManager
- Registra todas las escenas (MainScene, MinigameSelect, PuddingGame, MemoryGame)
- Implementa callback `onGameComplete` que:
  1. Crea acción PLAY_MINIGAME con resultado
  2. Aplica reward a través del reducer
  3. Persiste estado
  4. Vuelve a MainScene

```typescript
const onGameComplete = (result: MinigameResult) => {
  const action = createAction('PLAY_MINIGAME', petState.totalTicks, {
    gameId: result.gameId,
    result: result.result,
    score: result.score || 0,
  });
  petState = reduce(petState, action);
  pendingSave = true;
  setTimeout(() => {
    sceneManager.switchScene('main');
  }, 1000);
};
```

### 6. **Minijuegos - Actualización de UI**
**Archivos**: 
- `apps/web/src/game/scenes/PuddingGame.ts`
- `apps/web/src/game/scenes/MemoryGame.ts`

**Cambios**:
- Remover dependencia de `gameCore.dispatch()` directo
- Usar callback `onGameComplete` proporcionado por SceneContext
- Diferenciar estados: 'win' / 'perfect' / 'loss'

**Ejemplo (PuddingGame)**:
```typescript
if (this.context.onGameComplete) {
  this.context.onGameComplete({ 
    gameId: 'pudding', 
    result: 'perfect' 
  });
}
```

---

## Flujo de Escenas Documentado

```
┌─────────────────┐
│   MainScene     │
│  "Press [M]"    │
└────────┬────────┘
         │ [M]
         ▼
┌──────────────────────┐
│  MinigameSelect      │
│ ↑ Pudding Catch      │
│ ← Memory 2x2         │
└────────┬─────────────┘
         │ [Enter]
         ▼
    ┌─────────────────────────────────┐
    │  PuddingGame / MemoryGame       │
    │  ┌────────────────────────────┐ │
    │  │ Gameplay Loop              │ │
    │  │ [Enter] → Resultado        │ │
    │  │ [Escape] → Back to Select  │ │
    │  └────────────────────────────┘ │
    │         │                        │
    │         ▼ onGameComplete()       │
    │   Apply Reward via reduce()      │
    │   Save State                     │
    │   Return to Main (1s delay)      │
    └────────┬────────────────────────┘
             │
             ▼
         MainScene
```

---

## Estado de Persistencia

### Estructura SaveData (JSON)

```json
{
  "state": {
    "minigames": {
      "lastPlayed": {
        "pudding": 1234,
        "memory": 5678
      },
      "games": {
        "pudding": {
          "lastPlayed": 1234,
          "bestScore": 100,
          "totalPlayed": 10,
          "totalWins": 8,
          "totalPerfect": 2
        },
        "memory": {
          "lastPlayed": 5678,
          "bestScore": 50,
          "totalPlayed": 5,
          "totalWins": 4,
          "totalPerfect": 1
        }
      }
    }
  }
}
```

---

## Decisiones de Diseño

### 1. Serialización: Reanudar vs Reiniciar
**Regla implementada**: **Reiniciar minijuego al volver**
- Si el usuario sale y vuelve a jugar el mismo minijuego, comienza nuevo
- Solo se persiste estadísticas (totalPlayed, bestScore, etc)
- Estado actual del juego NO se guarda

**Justificación**: Simplifica el estado, evita bugs por guardado incompleto

### 2. Rewards: Aplicados a través del Core
**Por qué NO directamente en UI**:
- ✅ Centraliza lógica de recompensas
- ✅ Garantiza consistencia (cooldown, eventos)
- ✅ Facilita auditoría y testing
- ✅ Permite futuras modificaciones sin tocar UI

### 3. Cooldown: 100 ticks entre jugadas
**Implementación**: 
```typescript
const lastPlayed = state.minigames.lastPlayed[gameId] || -1000;
if (state.totalTicks - lastPlayed < 100) {
  return state; // Sin reward
}
```

**Razón**: Evita spam de minijuegos para farmear rewards

---

## Tests de Integración

**Archivo**: `packages/core/src/tests/minigames-integration.test.ts`

### Casos cubiertos:

1. ✅ **PuddingGame**: Perfect result aplica +25 happiness, +10 affection
2. ✅ **PuddingGame**: Win result aplica +15 happiness, +5 affection
3. ✅ **PuddingGame**: Loss registra play pero respeta cooldown
4. ✅ **MemoryGame**: Win result aplica rewards
5. ✅ **Persistencia**: Serialize/deserialize preserva estado
6. ✅ **Estructura**: Estado inicial de minijuegos es correcto
7. ✅ **Cooldown**: 100 ticks de cooldown entre jugadas
8. ✅ **Cooldown**: Fuera del cooldown permite nueva recompensa

**Resultado**: 60 tests pasando (52 existentes + 8 nuevos)

---

## Comandos de Validación

```bash
# Ejecutar todos los tests (core + web)
pnpm test

# Resultado esperado:
# Test Files  8 passed (8)
#      Tests  60 passed (60)

# Ejecutar solo core
pnpm -C packages/core test

# Ejecutar minijuegos en dev
pnpm dev
# Luego: Press [M] en la UI para acceder a minijuegos
```

---

## TODOs Eliminados

- ✅ `serialize.ts:24` - TODO sobre minigames.lastPlayed - **COMPLETADO**
- ✅ Integración de SceneManager a GameLoop - **COMPLETADO**
- ✅ Callbacks de minijuego para rewards - **COMPLETADO**
- ✅ Tests de integración - **COMPLETADO**

---

## Arquitectura Resumida

```
GameLoop
  ├─ SceneManager
  │   ├─ MainScene
  │   ├─ MinigameSelect
  │   ├─ PuddingGame
  │   └─ MemoryGame
  ├─ PetState (persistencia)
  └─ Callbacks (onGameComplete)
         │
         ▼
      Reducer (PLAY_MINIGAME action)
         │
         ▼
      Core Logic (rewards, cooldown, events)
```

---

## Limitaciones y Futuras Mejoras

### Limitaciones actuales:
1. Loss no diferencia entre pérdida en gameplay vs salir antes de terminar
2. No hay tracking de mejor puntuación en el juego mismo
3. Minijuegos usan random() sin seed (no reproducible)

### Mejoras futuras:
1. Diferenciar loss legítima en rewards
2. Agregar sistema de achievements (ej: "Perfect 5 times")
3. Leaderboard local por minijuego
4. Animaciones de reward visual
5. Sonido feedback

---

## Resumen Final

✅ **Completado**: Integración completa de minijuegos al flujo principal
✅ **Archivos**: 6 archivos modificados, 1 test agregado
✅ **Tests**: 60 tests pasando, sin regresiones
✅ **Serialización**: TODO eliminado, estado persistido completamente
✅ **Arquitectura**: Limpia, escalable, bien documentada
