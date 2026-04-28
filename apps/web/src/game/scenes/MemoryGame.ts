import { Scene } from './Scene';
import type { InputCommand } from '../Input';
import { PALETTE } from '../palette';

interface Card {
    id: number;
    spriteKey: string;
    flipped: boolean;
    matched: boolean;
}

export class MemoryGame extends Scene {
    private cards: Card[] = [];
    private selectedIds: number[] = [];
    private attempts = 0;
    private maxAttempts = 5;
    private gameState: 'playing' | 'won' | 'lost' | 'level_up' = 'playing';
    private selectionIndex = 0;
    private gridCols = 2;
    private gridRows = 2;
    private level = 1;

    private readonly spritePool = [
        'POMPOMPURIN', 'FLAN_BEBE', 'BAGEL', 'MUFFIN',
        'SCONE', 'FIU_BABY', 'SALCHICHA_BABY', 'SEAL_BABY',
        'FLAN_TEEN', 'SALCHICHA_TEEN', 'SEAL_TEEN', 'FIU_TEEN',
        'FLAN_ADULT', 'FIU_PERFECT', 'SALCHICHA_PERFECT', 'SEAL_PERFECT'
    ];

    init() {
        this.level = 1;
        this.startLevel();
    }

    private startLevel() {
        if (this.level === 1) {
            this.gridCols = 2;
            this.gridRows = 2;
            this.maxAttempts = 6;
        } else if (this.level === 2) {
            this.gridCols = 4;
            this.gridRows = 2;
            this.maxAttempts = 12;
        } else {
            this.gridCols = 4;
            this.gridRows = 4;
            this.maxAttempts = 24;
        }

        const totalCards = this.gridCols * this.gridRows;
        const pairsCount = totalCards / 2;
        
        // Randomly rotate sprites from pool
        const shuffledPool = [...this.spritePool].sort(() => Math.random() - 0.5);
        const selectedSprites = shuffledPool.slice(0, pairsCount);
        const cardSprites = [...selectedSprites, ...selectedSprites];
        
        this.cards = cardSprites
            .sort(() => Math.random() - 0.5)
            .map((spriteKey, id) => ({
                id,
                spriteKey,
                flipped: false,
                matched: false
            }));

        this.attempts = 0;
        this.gameState = 'playing';
        this.selectionIndex = 0;
        this.selectedIds = [];
    }

    update(_delta: number) {
        if (this.gameState === 'playing') {
            if (this.cards.every(c => c.matched)) {
                if (this.level < 3) {
                    this.gameState = 'level_up';
                } else {
                    this.gameState = 'won';
                    if (this.context.onGameComplete) {
                        this.context.onGameComplete({ gameId: 'memory', result: 'perfect', score: this.attempts });
                    }
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
        const { ctx, canvas, assetManager } = this.context;
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = PALETTE.screen;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = PALETTE.ink;
        ctx.font = 'bold 16px "Cascadia Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`MEMORY LVL ${this.level}`, w / 2, 25);

        ctx.font = '10px monospace';
        ctx.fillStyle = PALETTE.inkSoft;
        ctx.fillText(`Attempts: ${this.attempts}/${this.maxAttempts}`, w / 2, 40);

        // Grid layout optimization to fit 240px height
        const cardSize = this.level === 3 ? 38 : (this.level === 2 ? 55 : 70);
        const gap = this.level === 3 ? 4 : 8;
        const totalW = this.gridCols * cardSize + (this.gridCols - 1) * gap;
        const startX = (w - totalW) / 2;
        const startY = 50;

        this.cards.forEach((card, i) => {
            const col = i % this.gridCols;
            const row = Math.floor(i / this.gridCols);
            const x = startX + col * (cardSize + gap);
            const y = startY + row * (cardSize + gap);

            const isSelected = this.gameState === 'playing' && i === this.selectionIndex;

            ctx.fillStyle = isSelected ? PALETTE.accentSoft : (card.matched ? PALETTE.screenGrid : PALETTE.screenShade);
            ctx.strokeStyle = isSelected ? PALETTE.accent : PALETTE.bezel;
            ctx.lineWidth = isSelected ? 3 : 1;
            
            this.drawRoundedRect(ctx, x, y, cardSize, cardSize, 6);
            ctx.fill();
            ctx.stroke();

            if (card.flipped || card.matched) {
                const img = assetManager?.get(card.spriteKey);
                if (img) {
                    ctx.drawImage(img, 0, 0, 128, 128, x + 5, y + 5, cardSize - 10, cardSize - 10);
                } else {
                    ctx.fillStyle = PALETTE.ink;
                    ctx.fillText(card.spriteKey.substring(0, 3), x + cardSize / 2, y + cardSize / 2);
                }
            } else {
                ctx.fillStyle = PALETTE.inkMuted;
                ctx.font = '16px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', x + cardSize / 2, y + cardSize / 2);
            }
        });

        if (this.gameState !== 'playing') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, w, h);
            
            ctx.fillStyle = (this.gameState === 'won' || this.gameState === 'level_up') ? PALETTE.win : PALETTE.lose;
            ctx.font = '22px monospace';
            ctx.textAlign = 'center';
            
            let msg = '';
            if (this.gameState === 'won') msg = 'MATCH MASTER!';
            else if (this.gameState === 'level_up') msg = 'LEVEL CLEAR!';
            else msg = 'GAME OVER';
            
            ctx.fillText(msg, w / 2, h / 2);
            
            ctx.fillStyle = PALETTE.screen;
            ctx.font = '10px monospace';
            ctx.fillText('Press Enter to continue', w / 2, h / 2 + 30);
        }
    }

    private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
    }

    handleInput(command: InputCommand) {
        if (this.gameState === 'level_up') {
            if (command === 'ENTER') {
                this.level++;
                this.startLevel();
            }
            return;
        }

        if (this.gameState !== 'playing') {
            if (command === 'ENTER' || command === 'BACK') this.context.onSceneChange('select');
            return;
        }

        const cols = this.gridCols;
        const rows = this.gridRows;

        if (command === 'RIGHT') this.selectionIndex = (this.selectionIndex + 1) % (cols * rows);
        else if (command === 'LEFT') this.selectionIndex = (this.selectionIndex - 1 + cols * rows) % (cols * rows);
        else if (command === 'UP') this.selectionIndex = (this.selectionIndex - cols + cols * rows) % (cols * rows);
        else if (command === 'DOWN') this.selectionIndex = (this.selectionIndex + cols) % (cols * rows);
        else if (command === 'ENTER') {
            const card = this.cards[this.selectionIndex];
            if (card.matched || card.flipped || this.selectedIds.length >= 2) return;

            card.flipped = true;
            this.selectedIds.push(this.selectionIndex);

            if (this.selectedIds.length === 2) {
                this.attempts++;
                const [id1, id2] = this.selectedIds;
                if (this.cards[id1].spriteKey === this.cards[id2].spriteKey) {
                    this.cards[id1].matched = true;
                    this.cards[id2].matched = true;
                    this.selectedIds = [];
                } else {
                    setTimeout(() => {
                        this.cards[id1].flipped = false;
                        this.cards[id2].flipped = false;
                        this.selectedIds = [];
                    }, 800);
                }
            }
        } else if (command === 'BACK') {
            this.context.onSceneChange('select');
        }
    }
}
