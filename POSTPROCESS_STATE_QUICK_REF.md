# 🎮 PostProcessState - Quick Reference

## 🚀 TL;DR

```typescript
// ✅ Core: Nuevo export en packages/core/src/index.ts
export function postProcessState(state: PetState): PetState {
  return evaluateAchievementUnlocks(
    evaluateGiftUnlocks(
      applyEvolutionIfNeeded(state)
    )
  );
}

// ✅ Runtime: Llamar en GameLoop.ts (2 puntos)
// 1. Línea ~67 (tick loop):
petState = tick(petState, 1);
petState = postProcessState(petState);  // ← NUEVO

// 2. Línea ~47 (minijuego):
petState = reduce(petState, action);
petState = postProcessState(petState);  // ← NUEVO
```

---

## 📋 Archivos Modificados

| Archivo | Cambios | Impacto |
|---------|---------|---------|
| `packages/core/src/index.ts` | +1 función (32 líneas) | Core logic |
| `apps/web/src/game/GameLoop.ts` | 2 integraciones, 1 import | Runtime only |

---

## 🧪 Validación

```powershell
# Tests
pnpm test
# ✅ Expected: 62/62 PASSING

# Build
pnpm -C apps/web build
# ✅ Expected: built in ~1.2s, 0 errors

# Dev
pnpm dev
# ✅ Test: jugar, trigger evolución, ver en stats
```

---

## 🎯 Orden Garantizado

```
1. applyEvolutionIfNeeded()   → Si stats cumplen condición
2. evaluateGiftUnlocks()       → Basado en stats nuevos post-evolución
3. evaluateAchievementUnlocks() → Basado en estado final
```

---

## ⚡ Cuando Se Ejecuta

| Evento | postProcessState? |
|--------|------------------|
| Cada tick (1s) | ✅ |
| Feed, Play, Sleep, etc | ✅ (vía reduce) |
| Minijuego completado | ✅ |
| Carga de save | ⏸️ (se ejecuta en siguiente tick) |

---

## 🔧 Próximos Pasos

### Necesario (hoy)
- Nada, está completo ✅

### Recomendado (esta semana)
- [ ] UI notification de desbloqueos
- [ ] Animar evoluciones

### Opcional (future)
- [ ] SaveData v2 (ver PERSISTENCE_ANALYSIS.md)
- [ ] Galería de evoluciones

---

## 📚 Documentación Completa

- [POSTPROCESS_STATE_IMPLEMENTATION.md](POSTPROCESS_STATE_IMPLEMENTATION.md) - Implementación detallada
- [PERSISTENCE_ANALYSIS.md](PERSISTENCE_ANALYSIS.md) - Issue SaveData v1 + propuesta v2
- [POSTPROCESS_STATE_SUMMARY.md](POSTPROCESS_STATE_SUMMARY.md) - Resumen ejecutivo

---

## 🐛 Known Issues

**SaveData v1: EVOLVED events perdidos en restauración**
- Impacto: logros `ach_perfect_pet`, `ach_all_forms` no se desbloquean al cargar saves antiguos
- Mitigación: postProcessState() se ejecuta cada tick, resincroniza en sesión siguiente
- Solución: SaveData v2 con migración (documentada, no urgente)

---

## ✅ Checklist para Merge

- [x] Código implementado y probado
- [x] 62/62 tests pasando
- [x] Build limpio (0 errores)
- [x] No rompe SceneManager
- [x] Documentación completa
- [x] Commits limpios y documentados
- [x] Pushed a origin/master
- [ ] UI notifications (pendiente, no bloqueante)

**Status**: 🟢 Merge Ready
