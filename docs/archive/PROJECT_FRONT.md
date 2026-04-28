---
project: Tamagotchi
status: preserve-and-polish
reviewed_at: 2026-03-19
reviewer: DAVI
priority: medium
repo_path: /home/gris/.openclaw/workspace/repos/Tamagotchi
vault_note: /mnt/c/Users/usuario/.openclaw/workspace/Vault/Proyectos/Tamagotchi.md
---

# Ficha de proyecto

## Qué es
Monorepo de un Tamagotchi web con separación limpia entre:
- `packages/core` para lógica determinista
- `apps/web` para UI/render/input

Además incorpora evolución, persistencia, regalos y minijuegos (Chicha, Tetris, Memory/Pudding) con varias notas de integración y pulido.

## Juicio rápido
**Proyecto real y relativamente avanzado.**

No está en fase semilla: ya tiene una base de producto/juego bastante reconocible y una arquitectura sensata.

## Señales fuertes
- separación core/UI bien pensada
- core determinista y testeable
- web app con loop, scenes, renderer y runtime config
- minijuegos integrados
- historial de fixes/polish reales
- documentación abundante, incluso demasiada en la raíz

## Qué parece haber pasado
No parece proyecto abandonado por falta de forma, sino uno que sí avanzó bastante y fue acumulando:
- features
- fixes
- documentación operativa
- material de integración

El principal problema visible no es ausencia de trabajo, sino **desorden documental y exceso de archivos de cierre/resumen en la raíz**.

## Qué rescatar
### Alto valor
- arquitectura monorepo
- `packages/core`
- renderer/scenes del frontend
- persistencia
- minijuegos ya integrados
- decisiones de determinismo y separación de responsabilidades

### A limpiar
- mover/condensar documentación histórica ya archivada
- dejar más claro el estado actual en un README más representativo
- distinguir mejor entre docs vigentes y reportes de auditoría antiguos

## Lectura DAVI
Este repo no pide rescate conceptual, sino **orden y pulido**.
Tiene bastante más aplicabilidad inmediata que varios repos anteriores porque ya huele a producto jugable.

## Recomendación DAVI
Etiqueta sugerida: **preserve-and-polish**.

Si se retoma, empezaría por:
1. fijar README canónico más fiel al estado actual
2. compactar documentación histórica
3. validar loop de juego + minijuegos + persistencia
4. decidir si el siguiente paso es polish UX, contenido, arte o deploy

## Veredicto final
- madurez relativa: **media-alta**
- reutilización: **alta**
- necesidad principal: **orden/pulido más que replanteamiento**

## Decisión actual
**Conservar y pulir**.

## Contexto relacionado
- Docs de minijuegos: `docs/MINIGAMES_INTEGRATION.md`, `docs/MINIGAMES_USER_GUIDE.md`
- Evolución: `docs/evolution.md`
- Regalos: `docs/gifts.md`
- ⚠️ La app ya está desplegada en el celular de Lin vía GitHub Actions
