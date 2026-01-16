import { Scene } from './Scene';

export class MemoryGame extends Scene {
    private cards: { id: number; symbol: string; flipped: boolean; matched: boolean }[] = [];
    private selectedIds: number[] = [];
    private attempts = 0;
    private maxAttempts = 3;
    private gameState: 'playing' | 'won' | 'lost' = 'playing';

    init() {
        const symbols = ['🍮', '🍩', '🍮', '🍩'];
        // Simple shuffle (seeded-like if we wanted, but here just fixed for now or simple)
        this.cards = symbols
            .map((symbol, id) => ({ id, symbol, flipped: false, matched: false }))
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
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFF';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MEMORY 2x2', canvas.width / 2, 40);

        ctx.font = '12px monospace';
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

            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, cardSize, cardSize);

            if (card.flipped || card.matched) {
                ctx.fillStyle = '#FFF';
                ctx.font = '30px serif';
                ctx.fillText(card.symbol, x + cardSize / 2, y + cardSize / 2 + 10);
            } else {
                ctx.fillStyle = '#444';
                ctx.fillRect(x + 5, y + 5, cardSize - 10, cardSize - 10);
            }

            // Selection indicator
            if (this.gameState === 'playing' && i === this.getCurrentSelectionIndex()) {
                ctx.strokeStyle = '#0F0';
                ctx.strokeRect(x - 2, y - 2, cardSize + 4, cardSize + 4);
            }
        });

        if (this.gameState !== 'playing') {
            ctx.fillStyle = this.gameState === 'won' ? '#0F0' : '#F00';
            ctx.font = '20px monospace';
            ctx.fillText(this.gameState === 'won' ? 'YOU WIN!' : 'GAME OVER', canvas.width / 2, 220);
        }
    }

    private selectionIndex = 0;
    private getCurrentSelectionIndex() { return this.selectionIndex; }

    handleInput(e: KeyboardEvent) {
        if (this.gameState !== 'playing') {
            if (e.key === 'Enter') this.context.onSceneChange('minigame-select');
            return;
        }

        if (e.key === 'ArrowRight') this.selectionIndex = (this.selectionIndex + 1) % 4;
        else if (e.key === 'ArrowLeft') this.selectionIndex = (this.selectionIndex - 1 + 4) % 4;
        else if (e.key === 'ArrowDown') this.selectionIndex = (this.selectionIndex + 2) % 4;
        else if (e.key === 'ArrowUp') this.selectionIndex = (this.selectionIndex - 2 + 4) % 4;
        else if (e.key === 'Enter') {
            const card = this.cards[this.selectionIndex];
            if (card.matched || card.flipped) return;

            card.flipped = true;
            this.selectedIds.push(this.selectionIndex);

            if (this.selectedIds.length === 2) {
                this.attempts++;
                const [id1, id2] = this.selectedIds;
                if (this.cards[id1].symbol === this.cards[id2].symbol) {
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
        } else if (e.key === 'Escape') {
            this.context.onSceneChange('minigame-select');
        }
    }
}
