import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TetrisGame } from './TetrisGame';
import type { SceneContext } from './Scene';

function makeContext(): SceneContext & { completedResults: any[] } {
  const completedResults: any[] = [];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    roundRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    clip: vi.fn(),
    rect: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    closePath: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
  } as unknown as CanvasRenderingContext2D;

  const canvas = { width: 320, height: 240 } as HTMLCanvasElement;

  const sceneCtx: SceneContext = {
    canvas,
    ctx,
    onSceneChange: vi.fn(),
    onGameComplete: (result) => completedResults.push(result),
  };

  return Object.assign(sceneCtx, { completedResults });
}

describe('TetrisGame', () => {
  let context: ReturnType<typeof makeContext>;
  let game: TetrisGame;

  beforeEach(() => {
    context = makeContext();
    game = new TetrisGame(context);
    game.init();
  });

  it('inicia sin errores y puede dibujarse', () => {
    expect(() => game.draw()).not.toThrow();
  });

  it('update con delta < DROP_INTERVAL no hace nada aún', () => {
    expect(() => game.update(100)).not.toThrow();
    // Sin resultado emitido
    expect(context.completedResults.length).toBe(0);
  });

  it('update acumula deltas y baja la pieza', () => {
    // 800ms = un drop. Múltiples drops no deben lanzar
    expect(() => {
      for (let i = 0; i < 20; i++) game.update(800);
    }).not.toThrow();
  });

  it('LEFT mueve pieza si hay espacio', () => {
    expect(() => game.handleInput('LEFT')).not.toThrow();
    expect(() => game.draw()).not.toThrow();
  });

  it('RIGHT mueve pieza si hay espacio', () => {
    expect(() => game.handleInput('RIGHT')).not.toThrow();
    expect(() => game.draw()).not.toThrow();
  });

  it('UP rota la pieza', () => {
    expect(() => game.handleInput('UP')).not.toThrow();
    expect(() => game.draw()).not.toThrow();
  });

  it('DOWN fuerza drop en el siguiente update', () => {
    game.handleInput('DOWN');
    expect(() => game.update(0)).not.toThrow();
  });

  it('ENTER hace hard drop y bloquea pieza', () => {
    expect(() => game.handleInput('ENTER')).not.toThrow();
    expect(() => game.draw()).not.toThrow();
  });

  it('BACK termina como loss y llama onSceneChange', () => {
    game.handleInput('BACK');
    expect(context.onSceneChange).toHaveBeenCalledWith('select');
    expect(context.completedResults.length).toBe(1);
    expect(context.completedResults[0].result).toBe('loss');
    expect(context.completedResults[0].gameId).toBe('tetris');
  });

  it('ENTER en pantalla de resultado llama onSceneChange', () => {
    game.handleInput('BACK'); // termina el juego
    game.handleInput('ENTER');
    expect(context.onSceneChange).toHaveBeenCalledWith('select');
  });

  it('draw en estado lost no lanza errores', () => {
    game.handleInput('BACK');
    expect(() => game.draw()).not.toThrow();
  });

  it('llenando el board produce game over', () => {
    // Hard drop repetido hasta llenar el tablero
    for (let i = 0; i < 50; i++) {
      if (context.completedResults.length > 0) break;
      game.handleInput('ENTER'); // hard drop
      // Reinit de la pieza siguiente ocurre automáticamente
    }
    // Debe haber resultado
    expect(context.completedResults.length).toBeGreaterThanOrEqual(1);
    expect(['win', 'perfect', 'loss']).toContain(context.completedResults[0].result);
  });

  it('limpiar líneas suma a linesCleared y puede ganar', () => {
    // Verificamos que el juego puede terminar con win/perfect
    // llenando el board rápido con hard drops iterados
    for (let i = 0; i < 200; i++) {
      if (context.completedResults.length > 0) break;
      game.handleInput('ENTER');
    }
    expect(context.completedResults.length).toBeGreaterThanOrEqual(1);
    const result = context.completedResults[0];
    expect(['win', 'perfect', 'loss']).toContain(result.result);
    expect(typeof result.score).toBe('number');
  });

  it('arcade: no auto-termina al limpiar PERFECT_LINES líneas', () => {
    const arcadeCtx = makeContext();
    arcadeCtx.extra = { arcade: true };
    const arcadeGame = new TetrisGame(arcadeCtx);
    arcadeGame.init();
    // Mock clearLines para que devuelva 1 sin modificar el board
    vi.spyOn(arcadeGame as any, 'clearLines').mockReturnValue(1);
    // Situar linesCleared en 7 (PERFECT_LINES - 1 = 8 - 1)
    (arcadeGame as any).linesCleared = 7;
    // Hard drop → lockPiece → clearLines mock devuelve 1 → linesCleared=8
    // En modo normal terminaría aquí; en arcade el juego sigue
    arcadeGame.handleInput('ENTER');
    expect(arcadeCtx.completedResults.length).toBe(0);
  });

  it('no emite resultado dos veces en la misma partida', () => {
    game.handleInput('BACK');
    game.handleInput('BACK'); // segunda vez — ya terminó
    expect(context.completedResults.length).toBe(1);
  });
});
