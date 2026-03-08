import { Scene } from './Scene';
import type { InputCommand } from '../Input';
import { PALETTE } from '../palette';

function drawCardSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, sym: number) {
    ctx.fillStyle = PALETTE.ink;
    if (sym === 0) {
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-11, -11, 22, 22);
        ctx.restore();
    }
}

export class MemoryGame extends Scene {
    private cards: { id: number; sym: number; flipped: boolean; matched: boolean }[] = [];
    private selectedIds: number[] = [];
    private attempts = 0;
    private maxAttempts = 3;
    private gameState: 'playing' | 'won' | 'lost' = 'playing';

    init() {
        const syms = [0, 1, 0, 1];
        this.cards = syms
            .map((sym, id) => ({ id, sym, flipped: false, matched: false }))
            .sort(() => Math.random() - 0.5);

        this.selectedIds = [];
        this.attempts = 0;
        this.gameState = 'playing';
    }

    update(_delta: number) {
        if (this.gameState === 'playing') {
            if (this.cards.every(c => c.matched)) {
                this.gameState = 'won';
                if (this.context.onGameComplete) {
                    this.context.onGameComplete({ gameId: 'memory', result: 'win', score: this.attempts });
                }
            } else if (this.attempts >= this.maxAttempts) {
                this.gameState = 'lost';
                if (this.context.onGameComplete) {
                    this.context.onGameComplete({ gameId: 'memory', result: 'loss', score: this.attempts });
                }
            }
        }
    }

    draw() {
        const { ctx, canvas } = this.context;
        ctx.fillStyle = PALETTE.screen;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = PALETTE.ink;
        ctx.font = '16px "Cascadia Mono", "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MEMORY 2x2', canvas.width / 2, 40);

        ctx.font = '12px "Cascadia Mono", "Courier New", monospace';
        ctx.fillText(`Attempts: ${this.attempts}/${this.maxAttempts}`, canvas.width / 2, 65);

        // Cards
        const cardSize = 60;
        const gap = 10;
        const startX = (canvas.width - (cardSize * 2 + gap)) / 2;
        const startY = 80;

        this.cards.forEach((card, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = startX + col * (cardSize + gap);
            const y = startY + row * (cardSize + gap);

            ctx.strokeStyle = PALETTE.bezel;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cardSize, cardSize);

            if (card.flipped || card.matched) {
                ctx.fillStyle = PALETTE.accentSoft;
                ctx.fillRect(x + 1, y + 1, cardSize - 2, cardSize - 2);
                drawCardSymbol(ctx, x + cardSize / 2, y + cardSize / 2, card.sym);
            } else {
                ctx.fillStyle = PALETTE.screenShade;
                ctx.fillRect(x + 5, y + 5, cardSize - 10, cardSize - 10);
            }

            // Selection indicator
            if (this.gameState === 'playing' && i === this.getCurrentSelectionIndex()) {
                ctx.strokeStyle = PALETTE.accent;
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 2, y - 2, cardSize + 4, cardSize + 4);
            }
        });

        if (this.gameState !== 'playing') {
            ctx.fillStyle = this.gameState === 'won' ? PALETTE.win : PALETTE.lose;
            ctx.font = '20px "Cascadia Mono", "Courier New", monospace';
            ctx.fillText(this.gameState === 'won' ? 'YOU WIN!' : 'GAME OVER', canvas.width / 2, 220);
        }
    }

    private selectionIndex = 0;
    private getCurrentSelectionIndex() { return this.selectionIndex; }

    handleInput(command: InputCommand) {
        if (this.gameState !== 'playing') {
            if (command === 'ENTER') this.context.onSceneChange('select');
            return;
        }

        if (command === 'RIGHT') this.selectionIndex = (this.selectionIndex + 1) % 4;
        else if (command === 'LEFT') this.selectionIndex = (this.selectionIndex - 1 + 4) % 4;
        else if (command === 'ENTER') {
            const card = this.cards[this.selectionIndex];
            if (card.matched || card.flipped) return;

            card.flipped = true;
            this.selectedIds.push(this.selectionIndex);

            if (this.selectedIds.length === 2) {
                this.attempts++;
                const [id1, id2] = this.selectedIds;
                if (this.cards[id1].sym === this.cards[id2].sym) {
                    this.cards[id1].matched = true;
                    this.cards[id2].matched = true;
                    this.selectedIds = [];
                } else {
                    // Flip back after a short delay
                    setTimeout(() => {
                        this.cards[id1].flipped = false;
                        this.cards[id2].flipped = false;
                        this.selectedIds = [];
                    }, 500);
                }
            }
        } else if (command === 'BACK') {
            this.context.onSceneChange('select');
        }
    }
}
