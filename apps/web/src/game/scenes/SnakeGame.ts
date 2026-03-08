import { Scene } from './Scene';
import type { InputCommand } from '../Input';
import { PALETTE } from '../palette';

const COLS = 20;
const ROWS = 15;
const WIN_SCORE = 10;
const PERFECT_SCORE = 15;
const TICK_INTERVAL = 1000 / 6; // 6 ticks/seg

type Dir = { x: number; y: number };
type Cell = { x: number; y: number };

const UP: Dir    = { x: 0,  y: -1 };
const DOWN: Dir  = { x: 0,  y:  1 };
const LEFT: Dir  = { x: -1, y:  0 };
const RIGHT: Dir = { x: 1,  y:  0 };

function isOpposite(a: Dir, b: Dir): boolean {
  return a.x === -b.x && a.y === -b.y;
}

function randomFood(snake: Cell[]): Cell {
  let cell: Cell;
  do {
    cell = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (snake.some(s => s.x === cell.x && s.y === cell.y));
  return cell;
}

export class SnakeGame extends Scene {
  private gameState: 'playing' | 'won' | 'lost' = 'playing';
  private snake: Cell[] = [];
  private dir: Dir = RIGHT;
  private nextDir: Dir = RIGHT;
  private food: Cell = { x: 0, y: 0 };
  private score = 0;
  private tickAccumulator = 0;

  init() {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    this.snake = [
      { x: startX,     y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.dir = RIGHT;
    this.nextDir = RIGHT;
    this.food = randomFood(this.snake);
    this.score = 0;
    this.tickAccumulator = 0;
    this.gameState = 'playing';
  }

  update(delta: number) {
    if (this.gameState !== 'playing') return;

    this.tickAccumulator += delta;
    if (this.tickAccumulator < TICK_INTERVAL) return;
    this.tickAccumulator -= TICK_INTERVAL;

    // Aplicar dirección si no es reversal
    if (!isOpposite(this.nextDir, this.dir)) {
      this.dir = this.nextDir;
    }

    const head = this.snake[0];
    const newHead: Cell = {
      x: head.x + this.dir.x,
      y: head.y + this.dir.y,
    };

    // Wrap-around toroidal (Pac-Man style)
    newHead.x = ((newHead.x % COLS) + COLS) % COLS;
    newHead.y = ((newHead.y % ROWS) + ROWS) % ROWS;

    // Colisión consigo misma
    if (this.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      this.endGame(this.score >= WIN_SCORE ? 'won' : 'lost');
      return;
    }

    const ateFood = newHead.x === this.food.x && newHead.y === this.food.y;
    this.snake.unshift(newHead);
    if (ateFood) {
      this.score++;
      if (this.score >= PERFECT_SCORE && !this.context.extra?.arcade) {
        this.endGame('won');
        return;
      }
      this.food = randomFood(this.snake);
    } else {
      this.snake.pop();
    }
  }

  private endGame(outcome: 'won' | 'lost') {
    this.gameState = outcome;
    let result: 'perfect' | 'win' | 'loss';
    if (outcome === 'lost') {
      result = 'loss';
    } else if (this.score >= PERFECT_SCORE) {
      result = 'perfect';
    } else {
      result = 'win';
    }

    if (this.context.onGameComplete) {
      this.context.onGameComplete({ gameId: 'snake', result, score: this.score });
    }
  }

  draw() {
    const { ctx, canvas } = this.context;
    const w = canvas.width;
    const h = canvas.height;

    // Fondo
    ctx.fillStyle = PALETTE.screen;
    ctx.fillRect(0, 0, w, h);

    // HUD superior
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '14px "Cascadia Mono", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SNAKE', w / 2, 18);
    ctx.textAlign = 'left';
    ctx.font = '11px "Cascadia Mono", "Courier New", monospace';
    ctx.fillText(`Score: ${this.score}`, 8, 18);
    ctx.textAlign = 'right';
    ctx.fillText(`Win:${WIN_SCORE} Perf:${PERFECT_SCORE}`, w - 8, 18);

    // Área de juego
    const hudH = 24;
    const gridW = w;
    const gridH = h - hudH;
    const cellW = Math.floor(gridW / COLS);
    const cellH = Math.floor(gridH / ROWS);
    const offsetX = Math.floor((gridW - cellW * COLS) / 2);
    const offsetY = hudH;

    // Grilla tenue
    ctx.strokeStyle = PALETTE.screenGrid;
    ctx.lineWidth = 0.5;
    for (let col = 0; col <= COLS; col++) {
      ctx.beginPath();
      ctx.moveTo(offsetX + col * cellW, offsetY);
      ctx.lineTo(offsetX + col * cellW, offsetY + cellH * ROWS);
      ctx.stroke();
    }
    for (let row = 0; row <= ROWS; row++) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + row * cellH);
      ctx.lineTo(offsetX + cellW * COLS, offsetY + row * cellH);
      ctx.stroke();
    }

    // Serpiente
    this.snake.forEach((seg, i) => {
      ctx.fillStyle = i === 0 ? PALETTE.snakeHead : PALETTE.snakeBody;
      ctx.fillRect(
        offsetX + seg.x * cellW + 1,
        offsetY + seg.y * cellH + 1,
        cellW - 2,
        cellH - 2,
      );
    });

    // Comida
    ctx.fillStyle = PALETTE.food;
    ctx.fillRect(
      offsetX + this.food.x * cellW + 2,
      offsetY + this.food.y * cellH + 2,
      cellW - 4,
      cellH - 4,
    );

    // Pantalla de resultado
    if (this.gameState !== 'playing') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, w, h);

      const won = this.gameState === 'won';
      ctx.fillStyle = won ? PALETTE.win : PALETTE.lose;
      ctx.font = '20px "Cascadia Mono", "Courier New", monospace';
      ctx.textAlign = 'center';

      let msg: string;
      if (won && this.score >= PERFECT_SCORE) msg = 'PERFECT!';
      else if (won) msg = 'YOU WIN!';
      else msg = 'GAME OVER';

      ctx.fillText(msg, w / 2, h / 2 - 10);
      ctx.fillStyle = PALETTE.screen;
      ctx.font = '12px "Cascadia Mono", "Courier New", monospace';
      ctx.fillText(`Score: ${this.score}`, w / 2, h / 2 + 12);
      ctx.font = '10px "Cascadia Mono", "Courier New", monospace';
      ctx.fillText('Press Enter to continue', w / 2, h / 2 + 32);
    } else {
      ctx.fillStyle = PALETTE.inkMuted;
      ctx.font = '9px "Cascadia Mono", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Arrows=Dir  Enter=Exit', w / 2, h - 4);
    }
  }

  handleInput(command: InputCommand) {
    if (this.gameState !== 'playing') {
      if (command === 'ENTER') {
        this.context.onSceneChange('select');
      }
      return;
    }

    switch (command) {
      case 'UP':    this.nextDir = UP;    break;
      case 'DOWN':  this.nextDir = DOWN;  break;
      case 'LEFT':  this.nextDir = LEFT;  break;
      case 'RIGHT': this.nextDir = RIGHT; break;
      case 'BACK':
        this.context.onSceneChange('select');
        break;
    }
  }
}
