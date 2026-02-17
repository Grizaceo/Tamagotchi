# Análisis de Persistencia - SaveData v1 vs v2

## 🔴 Problema Crítico Detectado

### Pérdida de Tipos de Eventos en el History

**Ubicación**: `packages/core/src/persistence/serialize.ts`

**Síntoma**:
El achievement `ach_perfect_pet` y `ach_all_forms` dependen de eventos `EVOLVED` en el history:
```typescript
// achievements.ts
checkFn: (state) =>
  state.species === 'POMPOMPURIN' ||
  state.history.some((e) => e.type === 'EVOLVED' && (e.data as any)?.to === 'POMPOMPURIN'),
```

**El Bug**:
- **Serialización** (serialize.ts:25-31): Solo guarda `tick` y `statChanges` del evento
  ```typescript
  history: state.history.map((event) => ({
    tick: event.timestamp,
    statChanges: event.data as Record<string, number> | undefined,
  })),
  ```

- **Deserialización** (serialize.ts:56-61): Todos los eventos se convierten a tipo `STAT_CHANGED`
  ```typescript
  history: data.history.map((h) => ({
    type: 'STAT_CHANGED',  // ⚠️ SIEMPRE STAT_CHANGED, nunca EVOLVED
    timestamp: h.tick,
    data: h.statChanges,
  })),
  ```

**Impacto**:
1. Cuando se carga un juego guardado, se pierden los eventos EVOLVED
2. Los logros `ach_perfect_pet` y `ach_all_forms` nunca se desbloquearán en saves restaurados
3. El flujo postProcessState() es determinista pero **inefectivo** en saves restaurados

---

## 🔧 Solución: SaveData v2

### Estructura Propuesta

**Cambio mínimo** (backward-compatible):

```typescript
// SaveData.ts
export const SAVE_DATA_VERSION = 2;

export interface HistoryEntry {
  tick: number;
  type: 'STAT_CHANGED' | 'EVOLVED';  // ✅ Guardar el tipo
  statChanges?: Record<string, number>;
  evolutionData?: { from: string; to: string };
}

export interface SaveData {
  version: 2;
  // ... resto igual ...
  history: HistoryEntry[];  // ✅ Nuevo formato con tipos
}
```

### Migración en deserialize()

```typescript
function migrateFromOlderVersion(data: SaveData): PetState {
  if (data.version === 1) {
    // v1: history no tiene tipos, todos eran STAT_CHANGED
    // No hay forma de recuperar los EVOLVED que se perdieron
    console.warn('SaveData v1 detected: EVOLVED events lost, running postProcessState() on load');

    const state = deserialize(data as unknown as SaveDataV1);
    // ✅ Ejecutar postProcessState() para re-evaluar evoluciones/logros
    return postProcessState(state);
  }
  return createInitialPetState();
}
```

---

## ✅ Estado Actual (Runtime)

**Con los cambios implementados**:
- ✅ postProcessState() se ejecuta en cada tick (GameLoop.ts:67)
- ✅ postProcessState() se ejecuta después de cada acción (GameLoop.ts:47)
- ✅ Nuevos saves (v2) guardarán tipos de evento correctamente
- ⚠️ Saves v1 existentes perderán eventos EVOLVED (pero pueden mitigarse con postProcessState)

---

## 📋 Recomendación: Implementación Faseada

### Fase 1: YA IMPLEMENTADO ✅
- postProcessState() en core/index.ts
- Integración en GameLoop.ts (tick + reduce)
- Tests pasando (62/62)

### Fase 2: SaveData v2 (PROPUESTO, no implementado)
- Actualizar SaveData.ts interface
- Modificar serialize() para guardar tipos
- Modificar deserialize() y migrateFromOlderVersion()
- Actualizar tests de persistencia

### Fase 3: Migración Automática (OPCIONAL)
- Detectar v1 en localStorage
- Auto-migrar a v2 con postProcessState() call
- Notificar usuario

---

## 🎯 Impacto en Tamagotchi 2000+

**Contexto**: Juego retro con novedades modernas

**Lo que funciona bien**:
- Regalos: ✅ Deterministas, no dependen de history
- Logros en tiempo real: ✅ postProcessState() activa después de acciones
- Minijuegos: ✅ Rewards aplicados inmediatamente

**Lo que necesita atención**:
- Saves recuperados con evoluciones previas: ⚠️ Marcar como "legacy" y re-evolucionar en próxima sesión
- UX: Mostrar notificación "Tu mascota creció mientras estabas fuera" si se detecta evolución en load

---

## 📝 UI Pending Notes

```
TODO: Show "Your pet evolved while you were away!" notification
  - In: apps/web/src/game/scenes/MainScene.ts (onUpdate)
  - Check: if (petState.history has recent EVOLVED)
  - Display: Toast or scene overlay

TODO: SaveData v2 migration UI
  - In: apps/web/src/game/GameLoop.ts (loadState)
  - Show: "Migrating your save..." spinner
  - Call: deserializeFromJSON (which runs postProcessState internally)

TODO: Achievement/Gift unlock animations
  - In: apps/web/src/game/SceneManager.ts
  - Trigger: onStateChange callback with unlockedAchievements delta
  - Display: Popup animation for new unlocks
```

---

## Conclusión

**PostProcessState** ya está en lugar correcto. **SaveData v2** es necesario para garantizar persistencia de EVOLVED, pero no bloquea el juego actual. La UI necesita notificaciones visuales para estos cambios de estado.
