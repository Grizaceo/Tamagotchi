# Esbozo Tecnico: Tetris

## Objetivo
Agregar `Tetris` como minijuego avanzado, reutilizando la misma infraestructura de escenas/minigames.

## Alcance Recomendado (Fase 1)
- Matriz 10x20.
- Tetrominos basicos.
- Movimiento lateral, rotacion, soft drop.
- Deteccion de lineas completas y limpieza.
- Fin de partida por overflow.
- Puntaje por lineas.

## Alcance Posterior (Fase 2)
- Hard drop.
- Preview de siguiente pieza.
- Hold.
- Nivel/velocidad progresiva.
- Reglas de rotacion mas completas (SRS-lite o SRS completo).

## Integracion
1. Nueva escena
- `apps/web/src/game/scenes/TetrisGame.ts`.

2. Menu y manager
- Registrar `tetris-game` en `GameLoop.ts`.
- Agregar opcion en `MINIGAMES`.

3. Core minigames
- Extender tipos (`MinigameId`) para `tetris`.
- Cooldown/estadisticas persistentes para `tetris`.

4. Resultado
- `loss` si game over rapido.
- `win` si supera score base o lineas objetivo.
- `perfect` con umbral mas alto (ejemplo: 8+ lineas o score alto).

## Arquitectura Interna Propuesta
- `board: number[][]` (0 vacio, >0 tipo de bloque).
- `activePiece: {shape, x, y, rot}`.
- `nextPiece`.
- `gravityTimer`.
- `lockDelay` simple en MVP.
- `score`, `lines`.

## Complejidad
- Mayor que snake por:
  - Rotaciones y colisiones por pieza.
  - Limpieza de lineas y gravedad.
  - Balance de velocidad/score.

## Tests Clave
1. Colision y limites.
2. Rotacion valida/invalida.
3. Limpieza de 1..4 lineas.
4. Game over.
5. Integracion con cooldown/recompensas y persistencia.

## Riesgos
- UX de controles en teclado/movil.
- Bugs de rotacion en bordes.
- Desbalance de recompensas si score escala muy rapido.

## Secuencia Recomendada
1. Implementar Snake primero (pipeline ya probado).
2. Tetris Fase 1 (MVP robusto).
3. Tetris Fase 2 (mejoras competitivas).
