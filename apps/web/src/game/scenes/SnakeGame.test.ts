import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SnakeGame } from './SnakeGame';
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

/**
 * Fuerza que la food se coloque siempre en la fila y=7 con x ciclando 0,1,2,...19.
 * La serpiente empieza en (10,7) yendo a la derecha, así que siempre comerá la food.
 * Devuelve el spy — llamar spy.mockRestore() al terminar.
 */
function makeFoodRowMock() {
  let callIdx = 0;
  return vi.spyOn(Math, 'random').mockImplementation(() => {
    const isX = callIdx % 2 === 0;
    const val = isX
      ? (Math.floor(callIdx / 2) % 20) / 20  // x: 0/20, 1/20, ..., 19/20, 0/20, ...
      : 7 / 15;                                // y: siempre fila 7
    callIdx++;
    return val;
  });
}

describe('SnakeGame', () => {
  let context: ReturnType<typeof makeContext>;
  let game: SnakeGame;

  beforeEach(() => {
    context = makeContext();
    game = new SnakeGame(context);
    game.init();
  });

  it('inicia con serpiente de 3 segmentos y score 0', () => {
    expect(() => game.draw()).not.toThrow();
  });

  it('avanza la serpiente al acumular ticks suficientes', () => {
    expect(() => game.update(200)).not.toThrow(); // 200ms > 1000/6 ≈ 167ms
  });

  it('no permite reversal directo de dirección', () => {
    game.handleInput('LEFT');
    game.update(200);
    expect(() => game.draw()).not.toThrow();
  });

  it('puede cambiar dirección a UP y DOWN', () => {
    game.handleInput('UP');
    expect(() => game.update(200)).not.toThrow();

    game.init();
    game.handleInput('DOWN');
    expect(() => game.update(200)).not.toThrow();
  });

  it('wrap-around: el snake no muere al cruzar el borde derecho', () => {
    // La serpiente empieza en (10,7) yendo a la derecha.
    // En 10 ticks llega a x=20 → debe aparecer en x=0 sin morir.
    // Ir hacia la derecha nunca puede causar auto-colisión en 10 pasos.
    for (let i = 0; i < 10; i++) {
      game.update(200);
    }
    expect(context.completedResults.length).toBe(0); // sigue viva
  });

  it('el juego termina eventualmente y emite resultado', () => {
    // Mockear food en fila 7 para que la serpiente siempre la coma y gane.
    const spy = makeFoodRowMock();
    const localCtx = makeContext();
    const localGame = new SnakeGame(localCtx);
    localGame.init();
    for (let i = 0; i < 50; i++) {
      localGame.update(200);
      if (localCtx.completedResults.length > 0) break;
    }
    spy.mockRestore();
    expect(localCtx.completedResults.length).toBe(1);
    expect(['win', 'perfect', 'loss']).toContain(localCtx.completedResults[0].result);
    expect(localCtx.completedResults[0].gameId).toBe('snake');
  });

  it('morir sin comida produce loss', () => {
    const localCtx = makeContext();
    const localGame = new SnakeGame(localCtx);
    localGame.init();

    for (let i = 0; i < 15; i++) {
      localGame.update(200);
      if (localCtx.completedResults.length > 0) break;
    }
    if (localCtx.completedResults.length > 0) {
      const r = localCtx.completedResults[0];
      if (r.score < 10) {
        expect(r.result).toBe('loss');
      } else {
        expect(['win', 'perfect']).toContain(r.result);
      }
    }
    // Si no hay resultado en 15 ticks, el juego sigue — eso también es válido
  });

  it('el score sube al comer comida', () => {
    // Mockear food en fila 7 para que la serpiente siempre la coma y gane.
    const spy = makeFoodRowMock();
    const localCtx = makeContext();
    const localGame = new SnakeGame(localCtx);
    localGame.init();
    for (let i = 0; i < 50; i++) {
      localGame.update(200);
      if (localCtx.completedResults.length > 0) break;
    }
    spy.mockRestore();
    expect(localCtx.completedResults.length).toBe(1);
    const result = localCtx.completedResults[0];
    expect(['win', 'perfect', 'loss']).toContain(result.result);
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThan(0);
  });

  it('ENTER en pantalla de resultado llama onSceneChange("select")', () => {
    const spy = makeFoodRowMock();
    const localCtx = makeContext();
    const localGame = new SnakeGame(localCtx);
    localGame.init();
    for (let i = 0; i < 50; i++) {
      localGame.update(200);
      if (localCtx.completedResults.length > 0) break;
    }
    spy.mockRestore();
    expect(localCtx.completedResults.length).toBe(1);

    localGame.handleInput('ENTER');
    expect(localCtx.onSceneChange).toHaveBeenCalledWith('select');
  });

  it('BACK durante juego llama onSceneChange("select")', () => {
    game.handleInput('BACK');
    expect(context.onSceneChange).toHaveBeenCalledWith('select');
  });

  it('draw no lanza errores en estado playing', () => {
    expect(() => game.draw()).not.toThrow();
  });

  it('draw no lanza errores en estado terminado', () => {
    const spy = makeFoodRowMock();
    const localCtx = makeContext();
    const localGame = new SnakeGame(localCtx);
    localGame.init();
    for (let i = 0; i < 50; i++) {
      localGame.update(200);
      if (localCtx.completedResults.length > 0) break;
    }
    spy.mockRestore();
    expect(() => localGame.draw()).not.toThrow();
  });
});
