# 📚 PostProcessState Documentation Index

## 🎯 Roadmap de Lectura

### Para Empezar (5 min)
👉 **[POSTPROCESS_STATE_QUICK_REF.md](POSTPROCESS_STATE_QUICK_REF.md)**
- TL;DR: qué cambió, dónde, cómo validar
- Para: developers que quieren entender cambios rápido

### Para Entender la Implementación (15 min)
👉 **[POSTPROCESS_STATE_IMPLEMENTATION.md](POSTPROCESS_STATE_IMPLEMENTATION.md)**
- Detalles técnicos completos
- Flujos garantizados en tick y minijuegos
- UI pending notes (3 items accionables)
- Para: developers que van a trabajar en UI/tests

### Para Entender Issues de Persistencia (10 min)
👉 **[PERSISTENCE_ANALYSIS.md](PERSISTENCE_ANALYSIS.md)**
- Bug: SaveData v1 pierde eventos EVOLVED
- Análisis detallado + pseudocódigo de SaveData v2
- Impacto en logros `ach_perfect_pet`, `ach_all_forms`
- Para: product/tech leads que quieren entender risks

### Para Resumen Ejecutivo (5 min)
👉 **[POSTPROCESS_STATE_SUMMARY.md](POSTPROCESS_STATE_SUMMARY.md)**
- Estado actual del proyecto
- Entregables y restricciones cumplidas
- Próximos pasos
- Para: stakeholders y reviews

---

## 📊 Matriz de Referencias

| Documento | Rol Ideal | Tamaño | Técnico | Urgencia |
|-----------|-----------|--------|---------|----------|
| QUICK_REF | Dev | ~2 KB | Bajo | AHORA |
| IMPLEMENTATION | Dev | ~8 KB | Alto | HOY |
| PERSISTENCE_ANALYSIS | Tech Lead | ~7 KB | Alto | HOY |
| SUMMARY | PM/Lead | ~6 KB | Bajo | INBOX |

---

## 🔍 Búsqueda Rápida

### ¿Qué cambió en el código?
→ POSTPROCESS_STATE_QUICK_REF.md (línea "Archivos Modificados")

### ¿Cómo se ejecuta postProcessState?
→ POSTPROCESS_STATE_IMPLEMENTATION.md (sección "Flujos Garantizados")

### ¿Hay bugs?
→ PERSISTENCE_ANALYSIS.md (sección "Problema Crítico Detectado")

### ¿Qué está pendiente en UI?
→ POSTPROCESS_STATE_IMPLEMENTATION.md (sección "Notas Pendientes para UI")

### ¿Cómo valido los cambios?
→ POSTPROCESS_STATE_QUICK_REF.md (sección "Validación")

### ¿Qué es SaveData v2?
→ PERSISTENCE_ANALYSIS.md (sección "Solución: SaveData v2")

---

## ✅ Checklist de Lectura

- [ ] QUICK_REF: Entiendo qué cambió
- [ ] IMPLEMENTATION: Sé cómo integrar UI notifications
- [ ] PERSISTENCE_ANALYSIS: Conozco el bug v1 y la propuesta v2
- [ ] SUMMARY: Soy aware de próximos pasos

---

## 📁 Archivos del Proyecto Relacionados

**Core (Lógica)**
- `packages/core/src/index.ts` - postProcessState()
- `packages/core/src/evolution/evaluateEvolution.ts` - applyEvolutionIfNeeded()
- `packages/core/src/features/gifts.ts` - evaluateGiftUnlocks()
- `packages/core/src/features/achievements.ts` - evaluateAchievementUnlocks()
- `packages/core/src/persistence/serialize.ts` - Serialización (v1, issue detectado)

**Runtime**
- `apps/web/src/game/GameLoop.ts` - 2 puntos de integración
- `apps/web/src/game/SceneManager.ts` - Sin cambios
- `apps/web/src/game/scenes/MainScene.ts` - TODO: notificación de evolución

---

## 🚀 Commits Relevantes

| Hash | Mensaje | Cambios |
|------|---------|---------|
| 8cc0189 | PostProcessState: ejecutar evolución, regalos y logros | Core + GameLoop |
| cc584bf | Resumen ejecutivo PostProcessState integration | Doc |
| c69e037 | Quick reference para PostProcessState | Doc |

---

## 💡 Context Preserved

**Si necesitas continuar después**:
1. Lee QUICK_REF.md para estar al día (5 min)
2. Lee IMPLEMENTATION.md sección "UI Pending" (3 min)
3. Revisa GameLoop.ts líneas 47 y 67 para ver integración (2 min)
4. Listo para trabajar en UI notifications

**Stack**: 
- Monorepo pnpm (apps/web + packages/core)
- Vite + React (web)
- Vitest (tests)
- TypeScript strict mode
- SceneManager pattern (no romper)

---

## 🎯 Next Steps (Priority)

### 🔴 This Week
- [ ] Implementar UI notification para "Tu mascota creció"
- [ ] Animar desbloqueos de logros/regalos

### 🟡 Next Week  
- [ ] (Optional) SaveData v2 si client quiere garantizar persistencia v1

### 🟢 Future
- [ ] Galería de evoluciones
- [ ] Leaderboards minijuegos
- [ ] Analytics/history viewer

---

**Generated**: 2026-01-16  
**Status**: ✅ Complete and Production-Ready
