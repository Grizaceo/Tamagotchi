import { Scene } from './Scene';
import type { InputCommand } from '../Input';
import { PALETTE } from '../palette';

const COLS = 10;
const ROWS = 18;
const CELL = 11;
const BOARD_X = 10;
const BOARD_Y = 22;
const DROP_INTERVAL = 800; // ms
const WIN_LINES = 3;
const PERFECT_LINES = 8;

type Cells = [number, number][];

function rotateCW(cells: Cells, boxSize: number): Cells {
  return cells.map(([c, r]) => [boxSize - 1 - r, c] as [number, number]);
}

function makeRotations(base: Cells, boxSize: number): Cells[] {
  const rots: Cells[] = [base];
  for (let i = 1; i < 4; i++) {
    rots.push(rotateCW(rots[i - 1], boxSize));
  }
  return rots;
}

interface PieceDef {
  color: number;
  boxSize: number;
  cells: Cells[];
}

const PIECES: PieceDef[] = [
  // I - boxSize 4
  { color: 1, boxSize: 4, cells: makeRotations([[0,1],[1,1],[2,1],[3,1]], 4) },
  // O - boxSize 2
  { color: 2, boxSize: 2, cells: makeRotations([[0,0],[1,0],[0,1],[1,1]], 2) },
  // T - boxSize 3
  { color: 3, boxSize: 3, cells: makeRotations([[1,0],[0,1],[1,1],[2,1]], 3) },
  // S - boxSize 3
  { color: 4, boxSize: 3, cells: makeRotations([[1,0],[2,0],[0,1],[1,1]], 3) },
  // Z - boxSize 3
  { color: 5, boxSize: 3, cells: makeRotations([[0,0],[1,0],[1,1],[2,1]], 3) },
  // J - boxSize 3
  { color: 6, boxSize: 3, cells: makeRotations([[0,0],[0,1],[1,1],[2,1]], 3) },
  // L - boxSize 3
  { color: 7, boxSize: 3, cells: makeRotations([[2,0],[0,1],[1,1],[2,1]], 3) },
];

const PIECE_COLORS = PALETTE.tetris;

interface Piece {
  typeIdx: number;
  rotation: number;
  x: number;
  y: number;
}

function canPlace(board: number[][], piece: Piece, dx: number, dy: number): boolean {
  const cells = PIECES[piece.typeIdx].cells[piece.rotation];
  for (const [c, r] of cells) {
    const nc = piece.x + c + dx;
    const nr = piece.y + r + dy;
    if (nc < 0 || nc >= COLS || nr >= ROWS) return false;
    if (nr >= 0 && board[nr][nc] !== 0) return false;
  }
  return true;
}

function randomTypeIdx(): number {
  return Math.floor(Math.random() * PIECES.length);
}

function spawnPiece(typeIdx: number): Piece {
  const def = PIECES[typeIdx];
  return {
    typeIdx,
    rotation: 0,
    x: Math.floor((COLS - def.boxSize) / 2),
    y: 0,
  };
}

function emptyBoard(): number[][] {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

export class TetrisGame extends Scene {
  private board: number[][] = emptyBoard();
  private current: Piece = spawnPiece(0);
  private next: Piece = spawnPiece(0);
  private linesCleared = 0;
  private gameState: 'playing' | 'won' | 'lost' = 'playing';
  private dropAccumulator = 0;

  init() {
    this.board = emptyBoard();
    this.current = spawnPiece(randomTypeIdx());
    this.next = spawnPiece(randomTypeIdx());
    this.linesCleared = 0;
    this.gameState = 'playing';
    this.dropAccumulator = 0;
  }

  update(delta: number) {
    if (this.gameState !== 'playing') return;

    this.dropAccumulator += delta;
    if (this.dropAccumulator >= DROP_INTERVAL) {
      this.dropAccumulator -= DROP_INTERVAL;
      this.tryDrop();
    }
  }

  private tryDrop() {
    if (canPlace(this.board, this.current, 0, 1)) {
      this.current = { ...this.current, y: this.current.y + 1 };
    } else {
      this.lockAndSpawn();
    }
  }

  private lockAndSpawn() {
    const def = PIECES[this.current.typeIdx];
    const cells = def.cells[this.current.rotation];
    for (const [c, r] of cells) {
      const nr = this.current.y + r;
      const nc = this.current.x + c;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
        this.board[nr][nc] = def.color;
      }
    }

    const cleared = this.clearLines();
    this.linesCleared += cleared;

    if (this.linesCleared >= PERFECT_LINES) {
      this.endGame('won');
      return;
    }

    this.current = this.next;
    this.next = spawnPiece(randomTypeIdx());

    if (!canPlace(this.board, this.current, 0, 0)) {
      this.endGame(this.linesCleared >= WIN_LINES ? 'won' : 'lost');
    }
  }

  private clearLines(): number {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every(c => c !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++; // re-check same index after shift
      }
    }
    return cleared;
  }

  private endGame(outcome: 'won' | 'lost') {
    if (this.gameState !== 'playing') return;
    this.gameState = outcome;

    let result: 'perfect' | 'win' | 'loss';
    if (outcome === 'lost') {
      result = 'loss';
    } else if (this.linesCleared >= PERFECT_LINES) {
      result = 'perfect';
    } else {
      result = 'win';
    }

    if (this.context.onGameComplete) {
      this.context.onGameComplete({ gameId: 'tetris', result, score: this.linesCleared });
    }
  }

  draw() {
    const { ctx, canvas } = this.context;
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = PALETTE.screen;
    ctx.fillRect(0, 0, w, h);

    // HUD
    const bestScore = (this.context.extra?.bestScore as number | undefined) ?? 0;
    ctx.fillStyle = PALETTE.ink;
    ctx.font = '14px "Cascadia Mono", "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TETRIS', w / 2, 16);
    ctx.textAlign = 'left';
    ctx.font = '10px "Cascadia Mono", "Courier New", monospace';
    ctx.fillText(`Lines: ${this.linesCleared}`, 4, 16);
    ctx.textAlign = 'right';
    ctx.fillText(`Best:${bestScore}`, w - 4, 16);

    // Board border
    ctx.strokeStyle = PALETTE.bezel;
    ctx.lineWidth = 1;
    ctx.strokeRect(BOARD_X - 1, BOARD_Y - 1, COLS * CELL + 2, ROWS * CELL + 2);

    // Board cells
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = this.board[r][c];
        if (color !== 0) {
          ctx.fillStyle = PIECE_COLORS[color];
          ctx.fillRect(BOARD_X + c * CELL + 1, BOARD_Y + r * CELL + 1, CELL - 2, CELL - 2);
        } else {
          ctx.fillStyle = PALETTE.screenCell;
          ctx.fillRect(BOARD_X + c * CELL, BOARD_Y + r * CELL, CELL, CELL);
        }
      }
    }

    // Current piece and ghost
    if (this.gameState === 'playing') {
      const def = PIECES[this.current.typeIdx];

      // Ghost piece
      let ghostDy = 0;
      while (canPlace(this.board, this.current, 0, ghostDy + 1)) ghostDy++;
      if (ghostDy > 0) {
        ctx.fillStyle = 'rgba(42,42,34,0.18)';
        for (const [c, r] of def.cells[this.current.rotation]) {
          const pr = this.current.y + r + ghostDy;
          const pc = this.current.x + c;
          if (pr >= 0 && pr < ROWS) {
            ctx.fillRect(BOARD_X + pc * CELL + 1, BOARD_Y + pr * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }

      // Current piece
      ctx.fillStyle = PIECE_COLORS[def.color];
      for (const [c, r] of def.cells[this.current.rotation]) {
        const pr = this.current.y + r;
        const pc = this.current.x + c;
        if (pr >= 0) {
          ctx.fillRect(BOARD_X + pc * CELL + 1, BOARD_Y + pr * CELL + 1, CELL - 2, CELL - 2);
        }
      }
    }

    // Right panel — next piece preview
    const panelX = BOARD_X + COLS * CELL + 10;
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = '9px "Cascadia Mono", "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('NEXT', panelX, BOARD_Y + 10);

    const nextDef = PIECES[this.next.typeIdx];
    ctx.fillStyle = PIECE_COLORS[nextDef.color];
    for (const [c, r] of nextDef.cells[0]) {
      ctx.fillRect(panelX + c * 9 + 1, BOARD_Y + 16 + r * 9 + 1, 8, 8);
    }

    // Controls hint
    ctx.fillStyle = PALETTE.inkMuted;
    ctx.font = '8px "Cascadia Mono", "Courier New", monospace';
    ctx.fillText('\u2190\u2192Move', panelX, BOARD_Y + 70);
    ctx.fillText('\u2191Rot', panelX, BOARD_Y + 82);
    ctx.fillText('\u2193Drop', panelX, BOARD_Y + 94);
    ctx.fillText('ENT=Hard', panelX, BOARD_Y + 106);

    // Result overlay
    if (this.gameState !== 'playing') {
      ctx.fillStyle = 'rgba(0,0,0,0.60)';
      ctx.fillRect(0, 0, w, h);

      const won = this.gameState === 'won';
      ctx.fillStyle = won ? PALETTE.win : PALETTE.lose;
      ctx.font = '20px "Cascadia Mono", "Courier New", monospace';
      ctx.textAlign = 'center';

      let msg: string;
      if (won && this.linesCleared >= PERFECT_LINES) msg = 'PERFECT!';
      else if (won) msg = 'YOU WIN!';
      else msg = 'GAME OVER';

      ctx.fillText(msg, w / 2, h / 2 - 10);
      ctx.fillStyle = PALETTE.screen;
      ctx.font = '12px "Cascadia Mono", "Courier New", monospace';
      ctx.fillText(`Lines: ${this.linesCleared}`, w / 2, h / 2 + 10);
      if (this.linesCleared > bestScore) {
        ctx.fillStyle = PALETTE.accentSoft;
        ctx.fillText('New Best!', w / 2, h / 2 + 26);
        ctx.fillStyle = PALETTE.screen;
        ctx.font = '10px "Cascadia Mono", "Courier New", monospace';
        ctx.fillText('Press Enter to continue', w / 2, h / 2 + 42);
      } else {
        ctx.fillStyle = PALETTE.screenShade;
        ctx.font = '10px "Cascadia Mono", "Courier New", monospace';
        ctx.fillText(`Best: ${bestScore}`, w / 2, h / 2 + 26);
        ctx.fillText('Press Enter to continue', w / 2, h / 2 + 40);
      }
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
      case 'LEFT':
        if (canPlace(this.board, this.current, -1, 0)) {
          this.current = { ...this.current, x: this.current.x - 1 };
        }
        break;
      case 'RIGHT':
        if (canPlace(this.board, this.current, 1, 0)) {
          this.current = { ...this.current, x: this.current.x + 1 };
        }
        break;
      case 'UP':
        this.tryRotate();
        break;
      case 'DOWN':
        // Soft drop — force drop on next update cycle
        this.dropAccumulator = DROP_INTERVAL;
        break;
      case 'ENTER':
        this.hardDrop();
        break;
      case 'BACK':
        this.endGame('lost');
        this.context.onSceneChange('select');
        break;
    }
  }

  private tryRotate() {
    const nextRot = (this.current.rotation + 1) % 4;
    const candidate: Piece = { ...this.current, rotation: nextRot };
    if (canPlace(this.board, candidate, 0, 0)) {
      this.current = candidate;
    } else if (canPlace(this.board, candidate, 1, 0)) {
      this.current = { ...candidate, x: candidate.x + 1 };
    } else if (canPlace(this.board, candidate, -1, 0)) {
      this.current = { ...candidate, x: candidate.x - 1 };
    }
  }

  private hardDrop() {
    let dy = 0;
    while (canPlace(this.board, this.current, 0, dy + 1)) dy++;
    this.current = { ...this.current, y: this.current.y + dy };
    this.lockAndSpawn();
  }
}
