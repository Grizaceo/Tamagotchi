# Plan De Implementacion: Chicha (Dachshund)

## Objetivo
Agregar un minijuego `Chicha` (rediseño de Snake con Dachshund) integrado al sistema actual de escenas, cooldown y recompensas.

## Alcance MVP
- Grilla fija en canvas interno (ejemplo 20x15 celdas).
- Serpiente con movimiento en 4 direcciones.
- Comida aleatoria.
- Colision con muro o consigo misma = `loss`.
- Puntaje por comida.
- `win` por puntaje objetivo simple (ejemplo 10).
- `perfect` si gana sin colisiones cercanas o con umbral alto (definir regla simple y clara).

## Integracion Tecnica
1. `Scene`
- Crear `apps/web/src/game/scenes/SnakeGame.ts` siguiendo estructura de `PuddingGame` y `MemoryGame`.
- Estados internos:
  - `playing | won | lost`
  - `snake: Array<{x,y}>`
  - `dir`, `nextDir`
  - `food`
  - `score`
  - `tickAccumulator`

2. Registro en SceneManager
- En `GameLoop.ts`, registrar `snake-game`.
- En `MINIGAMES` (archivo de escenas), agregar entrada:
  - `id: 'snake'`
  - `scene: 'snake-game'`
  - Label UI.

3. Input
- Reusar `LEFT/RIGHT/UP/DOWN`.
- Regla anti-180 inmediato (no permitir invertir direccion en el mismo tick).
- `ENTER` para iniciar/reiniciar y confirmar salida de resultado.

4. Resultado e integracion de recompensas
- Emitir `onGameComplete({ gameId: 'snake', result, score })`.
- Extender tipos en core (`MinigameId`) para incluir `'snake'`.
- Agregar cooldown y stats de minijuego para `snake` en estado persistente.

5. Render
- Fondo simple.
- Dibujar grilla opcional tenue.
- Dibujar cuerpo/cabeza y comida con bloques pixel-art.
- HUD: `Score`, instrucciones breves.

## Reglas Sugeridas MVP
- Velocidad base: 6 ticks/seg.
- `win`: score >= 10.
- `perfect`: score >= 15 sin perder vidas (si no hay vidas, simplemente score >= 15).

## Persistencia y compatibilidad
- Migrar `minigames.lastPlayed` y `minigames.games` para incluir `snake` con defaults.
- Mantener compatibilidad con saves anteriores rellenando campos faltantes.

## Tests Minimos
1. Scene
- Movimiento y crecimiento correcto.
- No permite reversal directo.
- Colision produce `loss`.
- Puntaje sube al comer.

2. Integracion
- `PLAY_MINIGAME` con `gameId: snake` aplica recompensa/cooldown.
- Serialize/deserialize conserva estado de `snake`.

## Riesgos
- Balance de recompensa (evitar farm facil).
- Input en movil (latencia de direccion).
- Escalado visual en 320x240.

## Entregables
1. `SnakeGame.ts` funcional.
2. Integracion menu minijuegos.
3. Tipos/core actualizados para `snake`.
4. Tests de escena e integracion.
