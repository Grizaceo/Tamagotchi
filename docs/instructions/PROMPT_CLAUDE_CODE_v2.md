# 🎮 PROMPT CLAUDE CODE: Tamagotchi Pom Pom Purin - Correcciones para Alpha

## CONTEXTO

Proyecto Tamagotchi basado en Pom Pom Purin de Sanrio. Monorepo pnpm con:
- `apps/web/` - Frontend Canvas + Vite
- `packages/core/` - Lógica de juego

**Estado:** Estructura completa, sprites cargados, pero hay 3 bugs críticos que impiden el alpha test correcto.

---

## 🔴 CORRECCIÓN 1: Deserialización pierde tipos de eventos

**Archivo:** `packages/core/src/persistence/serialize.ts`

**Problema:** Al deserializar, todos los eventos se convierten a 'STAT_CHANGED', perdiendo tipos como 'EVOLVED', 'MINIGAME_WIN', etc.

**Cambios requeridos:**

### En `serialize()` (líneas 30-33):
```typescript
// ANTES:
history: state.history.map((event) => ({
  tick: event.timestamp,
  statChanges: event.data as Record<string, number> | undefined,
})),

// DESPUÉS:
history: state.history.map((event) => ({
  type: event.type,
  tick: event.timestamp,
  data: event.data,
})),
```

### En `deserialize()` (líneas 78-82):
```typescript
// ANTES:
history: data.history.map((h) => ({
  type: 'STAT_CHANGED',
  timestamp: h.tick,
  data: h.statChanges,
})),

// DESPUÉS:
history: data.history.map((h) => ({
  type: (h as any).type || 'STAT_CHANGED',
  timestamp: h.tick,
  data: (h as any).data || h.statChanges,
})),
```

### En `SaveData.ts`, actualizar la interfaz history:
```typescript
// ANTES:
history: Array<{
  tick: number;
  statChanges?: Record<string, number>;
}>;

// DESPUÉS:
history: Array<{
  type?: string;
  tick: number;
  data?: Record<string, unknown>;
  statChanges?: Record<string, number>; // Legacy compatibility
}>;
```

---

## 🔴 CORRECCIÓN 2: minigames.games no se actualiza

**Archivo:** `packages/core/src/engine/reducer.ts`

**Problema:** Solo se actualiza `lastPlayed` pero no las estadísticas del juego (`totalPlayed`, `totalWins`, `bestScore`, etc.)

**Cambio en `applyPlayMinigame()` (después de línea 165):**

```typescript
function applyPlayMinigame(state: PetState, action: Action): PetState {
  const gameId = (action.data?.gameId as string) || 'unknown';
  const result = (action.data?.result as string) || 'win';
  const score = (action.data?.score as number) || 0;

  // Cooldown check...
  const lastPlayedValue = state.minigames.lastPlayed[gameId as keyof typeof state.minigames.lastPlayed];
  const lastPlayed = lastPlayedValue || -1000;
  if (state.totalTicks - lastPlayed < 100) {
    return state;
  }

  const newState = structuredClone(state);

  // Actualizar estadísticas del juego específico
  const validGameId = gameId as 'pudding' | 'memory';
  if (newState.minigames.games[validGameId]) {
    const gameStats = newState.minigames.games[validGameId];
    gameStats.totalPlayed++;
    gameStats.lastPlayed = state.totalTicks;
    
    if (result === 'perfect') {
      gameStats.totalPerfect++;
      gameStats.totalWins++;
      newState.stats.happiness = clampStat(newState.stats.happiness + 25);
      newState.stats.affection = clampStat(newState.stats.affection + 10);
      newState.history.push(createEvent('MINIGAME_PERFECT', action.timestamp, { gameId, score }));
    } else if (result === 'win') {
      gameStats.totalWins++;
      newState.stats.happiness = clampStat(newState.stats.happiness + 15);
      newState.stats.affection = clampStat(newState.stats.affection + 5);
      newState.history.push(createEvent('MINIGAME_WIN', action.timestamp, { gameId, score }));
    } else {
      // Loss - pequeña recompensa por participar
      newState.stats.happiness = clampStat(newState.stats.happiness + 5);
      newState.history.push(createEvent('STAT_CHANGED', action.timestamp, { gameId, result: 'loss' }));
    }
    
    if (score > gameStats.bestScore) {
      gameStats.bestScore = score;
    }
  }

  // Registrar último juego para cooldown
  newState.minigames.lastPlayed[validGameId] = state.totalTicks;

  return newState;
}
```

---

## 🔴 CORRECCIÓN 3: Verificar transparencia de sprites

**Problema:** Los archivos .png son en realidad JPEG (sin canal alpha).

**Verificación:**
```bash
cd apps/web/public/assets
file *.png
# Si dice "JPEG image data", necesitan conversión
```

**Si requiere conversión (en sistema con ImageMagick):**
```bash
# Convertir JPEG a PNG con fondo transparente
for f in *_spritesheet_*.png; do
  # El color de fondo típico es gris claro (#f0f0f0) o blanco
  convert "$f" -fuzz 10% -transparent white "${f%.png}_transparent.png"
done
```

**Alternativa en código (si no se puede cambiar assets):**
En `SpriteRenderer.ts`, el fondo ya debería ser manejado por el canvas clearing.

---

## ✅ VERIFICACIÓN POST-CORRECCIONES

### 1. Tests
```bash
cd packages/core
pnpm test
```

Todos los tests existentes deben pasar. Los tests de minigames ahora también verificarán que `games[gameId].totalPlayed` se incrementa.

### 2. Dev Server
```bash
cd apps/web
pnpm dev
```

Verificar manualmente:
- [ ] Sprite de Pom Pom visible y animado
- [ ] Iconos del menú visibles
- [ ] LEFT/RIGHT navega el menú
- [ ] ENTER abre submenús
- [ ] Acciones (Feed, Play, etc.) modifican stats
- [ ] Minijuegos funcionan y dan recompensas
- [ ] Persistencia mantiene estado al recargar

### 3. Evolución
- Esperar 60 segundos (o modificar `totalTicks` temporalmente) → FLAN_TEEN
- Esperar 5 minutos → FLAN_ADULT
- Con stats altos → POMPOMPURIN

---

## 📝 NOTAS IMPORTANTES

1. **No modificar tests existentes** a menos que fallen por los cambios de lógica
2. **Commits pequeños**: Un commit por corrección
3. **El tipo `any` en deserialize es temporal** - idealmente se debería actualizar el esquema de SaveData y versionar

---

## ORDEN DE EJECUCIÓN

1. ✏️ Corregir serialize.ts (preservar tipos de eventos)
2. ✏️ Actualizar SaveData.ts (extender interfaz history)
3. ✏️ Corregir reducer.ts (actualizar minigames.games)
4. 🧪 Ejecutar tests
5. 🖥️ Probar en navegador
6. 📸 Verificar transparencia de sprites (si hay problemas visuales)
