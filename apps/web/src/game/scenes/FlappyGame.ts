import { Scene } from './Scene';
import type { InputCommand } from '../Input';
import { PALETTE } from '../palette';
import { SpriteRenderer } from '../renderer/SpriteRenderer';
import { SPRITE_CONFIGS } from '../renderer/SpriteConfigs';

interface Pipe {
    x: number;
    topHeight: number;
    passed: boolean;
}

export class FlappyGame extends Scene {
    private birdY = 120;
    private birdVelocity = 0;
    private gravity = 0.25;
    private jumpStrength = -4.5;
    private score = 0;
    private pipes: Pipe[] = [];
    private pipeTimer = 0;
    private pipeInterval = 1800; // ms
    private gameState: 'playing' | 'won' | 'lost' = 'playing';
    
    private birdRenderer: SpriteRenderer | null = null;
    private readonly pipeWidth = 40;
    private readonly gapHeight = 70;

    init() {
        this.birdY = 120;
        this.birdVelocity = 0;
        this.score = 0;
        this.pipes = [];
        this.pipeTimer = 0;
        this.gameState = 'playing';

        if (this.context.assetManager) {
            const config = SPRITE_CONFIGS['FIU_BABY'];
            this.birdRenderer = new SpriteRenderer(this.context.assetManager, 'FIU_BABY', config);
            this.birdRenderer.displaySize = 40;
            this.birdRenderer.setAnimation('idle');
        }
    }

    update(delta: number) {
        if (this.gameState !== 'playing') return;

        // Physics
        this.birdVelocity += this.gravity * (delta / 16);
        this.birdY += this.birdVelocity * (delta / 16);

        if (this.birdRenderer) {
            this.birdRenderer.update(delta);
        }

        // Spawn pipes
        this.pipeTimer += delta;
        if (this.pipeTimer >= this.pipeInterval) {
            this.pipeTimer = 0;
            const minHeight = 40;
            const maxHeight = this.context.canvas.height - this.gapHeight - minHeight;
            this.pipes.push({
                x: this.context.canvas.width,
                topHeight: minHeight + Math.random() * (maxHeight - minHeight),
                passed: false
            });
        }

        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const p = this.pipes[i];
            p.x -= 2 * (delta / 16);

            // Collision detection
            const birdX = 60;
            const birdRadius = 12;

            if (birdX + birdRadius > p.x && birdX - birdRadius < p.x + this.pipeWidth) {
                if (this.birdY - birdRadius < p.topHeight || this.birdY + birdRadius > p.topHeight + this.gapHeight) {
                    this.endGame('lost');
                }
            }

            // Scoring
            if (!p.passed && p.x + this.pipeWidth < birdX) {
                p.passed = true;
                this.score++;
                if (this.score >= 10 && !this.context.extra?.arcade) {
                    this.endGame('won');
                }
            }

            // Remove off-screen
            if (p.x < -this.pipeWidth) {
                this.pipes.splice(i, 1);
            }
        }

        // Floor/Ceiling collision
        if (this.birdY < 0 || this.birdY > this.context.canvas.height) {
            this.endGame('lost');
        }
    }

    private endGame(state: 'won' | 'lost') {
        if (this.gameState !== 'playing') return;
        this.gameState = state;
        if (this.context.onGameComplete) {
            this.context.onGameComplete({
                gameId: 'flappy',
                result: state === 'won' ? 'perfect' : 'loss',
                score: this.score
            });
        }
    }

    draw() {
        const { ctx, canvas } = this.context;
        const w = canvas.width;
        const h = canvas.height;

        // Background
        ctx.fillStyle = '#a0d8ef'; // Sky blue
        ctx.fillRect(0, 0, w, h);

        // Pipes
        ctx.fillStyle = '#73bf2e'; // Green pipes
        for (const p of this.pipes) {
            // Top pipe
            ctx.fillRect(p.x, 0, this.pipeWidth, p.topHeight);
            ctx.strokeStyle = '#4e8d1c';
            ctx.lineWidth = 2;
            ctx.strokeRect(p.x, 0, this.pipeWidth, p.topHeight);

            // Bottom pipe
            ctx.fillRect(p.x, p.topHeight + this.gapHeight, this.pipeWidth, h - (p.topHeight + this.gapHeight));
            ctx.strokeRect(p.x, p.topHeight + this.gapHeight, this.pipeWidth, h - (p.topHeight + this.gapHeight));
            
            // Pipe caps
            ctx.fillStyle = '#8ce03d';
            ctx.fillRect(p.x - 2, p.topHeight - 12, this.pipeWidth + 4, 12);
            ctx.strokeRect(p.x - 2, p.topHeight - 12, this.pipeWidth + 4, 12);
            ctx.fillRect(p.x - 2, p.topHeight + this.gapHeight, this.pipeWidth + 4, 12);
            ctx.strokeRect(p.x - 2, p.topHeight + this.gapHeight, this.pipeWidth + 4, 12);
            ctx.fillStyle = '#73bf2e';
        }

        // Bird
        if (this.birdRenderer) {
            this.birdRenderer.x = 60 - 20;
            this.birdRenderer.y = this.birdY - 20;
            ctx.save();
            // Tilt based on velocity
            ctx.translate(60, this.birdY);
            ctx.rotate(Math.max(-0.5, Math.min(0.5, this.birdVelocity * 0.1)));
            ctx.translate(-60, -this.birdY);
            this.birdRenderer.draw(ctx);
            ctx.restore();
        } else {
            ctx.fillStyle = '#f8d547';
            ctx.beginPath();
            ctx.arc(60, this.birdY, 15, 0, Math.PI * 2);
            ctx.fill();
        }

        // HUD
        ctx.fillStyle = PALETTE.ink;
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${this.score}`, 10, 25);

        if (this.gameState !== 'playing') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = this.gameState === 'won' ? PALETTE.win : PALETTE.lose;
            ctx.font = '24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.gameState === 'won' ? 'FLAPPY MASTER!' : 'GAME OVER', w / 2, h / 2);
            
            ctx.fillStyle = PALETTE.screen;
            ctx.font = '10px monospace';
            ctx.fillText('Press Enter or Back to return', w / 2, h / 2 + 30);
        }
    }

    handleInput(command: InputCommand) {
        if (this.gameState !== 'playing') {
            if (command === 'ENTER' || command === 'BACK') this.context.onSceneChange('select');
            return;
        }

        if (command === 'UP' || command === 'ENTER') {
            this.birdVelocity = this.jumpStrength;
        } else if (command === 'BACK') {
            this.context.onSceneChange('select');
        }
    }
}
