import { Scene } from './Scene';
import type { InputCommand } from '../Input';
import { PALETTE } from '../palette';
import { SpriteRenderer } from '../renderer/SpriteRenderer';
import { SPRITE_CONFIGS } from '../renderer/SpriteConfigs';

interface FallingObject {
    x: number;
    y: number;
    speed: number;
    active: boolean;
}

export class PuddingGame extends Scene {
    private playerX = 160;
    private score = 0;
    private missed = 0;
    private maxMissed = 5;
    private puddings: FallingObject[] = [];
    private spawnTimer = 0;
    private spawnInterval = 1500;
    private gameState: 'playing' | 'won' | 'lost' = 'playing';
    
    private playerRenderer: SpriteRenderer | null = null;
    private currentAnim: string = 'idle';
    private animTimer = 0;

    init() {
        this.playerX = 160;
        this.score = 0;
        this.missed = 0;
        this.puddings = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500;
        this.gameState = 'playing';
        this.animTimer = 0;

        if (this.context.assetManager) {
            const config = SPRITE_CONFIGS['POMPOMPURIN'];
            this.playerRenderer = new SpriteRenderer(this.context.assetManager, 'POMPOMPURIN', config);
            this.playerRenderer.displaySize = 64;
            this.playerRenderer.setAnimation('idle');
        }
    }

    update(delta: number) {
        if (this.gameState !== 'playing') return;

        // Update player animation
        if (this.playerRenderer) {
            this.playerRenderer.update(delta);
            if (this.animTimer > 0) {
                this.animTimer -= delta;
                if (this.animTimer <= 0) {
                    this.playerRenderer.setAnimation('idle');
                    this.currentAnim = 'idle';
                }
            }
        }

        // Spawn logic
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(600, this.spawnInterval * 0.98);
            this.puddings.push({
                x: 20 + Math.random() * (this.context.canvas.width - 40),
                y: -20,
                speed: 1.5 + Math.random() * 1.5,
                active: true
            });
        }

        // Update puddings
        for (const p of this.puddings) {
            if (!p.active) continue;
            p.y += p.speed * (delta / 16);

            // Collision detection (MOUTH area)
            // Pompompurin's mouth is roughly at the center-upper part of the 64x64 sprite.
            const mouthX = this.playerX;
            const mouthY = this.context.canvas.height - 50 - 12; // Moved higher (from -5 to -12)
            
            const dist = Math.sqrt((p.x - mouthX) ** 2 + (p.y - mouthY) ** 2);
            
            if (dist < 20) {
                p.active = false;
                this.score++;
                if (this.playerRenderer) {
                    this.playerRenderer.setAnimation('eat');
                    this.currentAnim = 'eat';
                    this.animTimer = 800; // Show eat animation for 800ms
                }
            } else if (p.y > this.context.canvas.height) {
                p.active = false;
                this.missed++;
                if (this.playerRenderer) {
                    this.playerRenderer.setAnimation('sad');
                    this.currentAnim = 'sad';
                    this.animTimer = 1000; // Show sad animation for 1s
                }
                if (this.missed >= this.maxMissed) {
                    this.endGame('lost');
                }
            }
        }

        this.puddings = this.puddings.filter(p => p.active || p.y < this.context.canvas.height);

        if (this.score >= 20) {
            this.endGame('won');
        }
    }

    private endGame(state: 'won' | 'lost') {
        this.gameState = state;
        if (this.context.onGameComplete) {
            let resultType: 'perfect' | 'win' | 'loss' = 'loss';
            if (state === 'won') {
                resultType = this.missed === 0 ? 'perfect' : 'win';
            }
            this.context.onGameComplete({
                gameId: 'pudding',
                result: resultType,
                score: this.score
            });
        }
    }

    draw() {
        const { ctx, canvas, assetManager } = this.context;
        const w = canvas.width;
        const h = canvas.height;

        ctx.fillStyle = PALETTE.screen;
        ctx.fillRect(0, 0, w, h);

        const flanImg = assetManager?.get('FLAN_BEBE');
        for (const p of this.puddings) {
            if (!p.active) continue;
            if (flanImg) {
                ctx.drawImage(flanImg, 0, 0, 128, 128, p.x - 16, p.y - 16, 32, 32);
            } else {
                ctx.fillStyle = PALETTE.accent;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const playerY = h - 50;
        if (this.playerRenderer) {
            this.playerRenderer.x = this.playerX - 32;
            this.playerRenderer.y = playerY - 32;
            this.playerRenderer.draw(ctx);

            // Procedural "Mouth Open" for 'eat' state
            if (this.currentAnim === 'eat' && this.animTimer > 0) {
                const my = playerY - 8; // Adjust mouth Y
                ctx.fillStyle = '#6b3e26'; 
                ctx.beginPath();
                ctx.ellipse(this.playerX, my, 6, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#ff8a80';
                ctx.beginPath();
                ctx.ellipse(this.playerX, my + 2, 3, 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Procedural "Sad Eyes" for 'sad' state
            if (this.currentAnim === 'sad' && this.animTimer > 0) {
                // First, mask the original eyes
                ctx.fillStyle = '#f8d547'; // Pompompurin yellow
                ctx.fillRect(this.playerX - 12, playerY - 10, 24, 10);

                ctx.strokeStyle = PALETTE.ink;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                // Left eye (inverted U)
                ctx.beginPath();
                ctx.arc(this.playerX - 8, playerY - 6, 3, Math.PI, 0);
                ctx.stroke();
                // Right eye
                ctx.beginPath();
                ctx.arc(this.playerX + 8, playerY - 6, 3, Math.PI, 0);
                ctx.stroke();
            }
        } else {
            ctx.fillStyle = '#f8d547';
            ctx.beginPath();
            ctx.arc(this.playerX, playerY, 20, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = PALETTE.ink;
        ctx.font = '12px "Cascadia Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${this.score}`, 10, 20);
        ctx.textAlign = 'right';
        ctx.fillText(`MISSES: ${this.missed}/${this.maxMissed}`, w - 10, 20);

        if (this.gameState !== 'playing') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = this.gameState === 'won' ? PALETTE.win : PALETTE.lose;
            ctx.font = '24px "Cascadia Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.gameState === 'won' ? 'PUDDING MASTER!' : 'GAME OVER', w / 2, h / 2);
            
            ctx.fillStyle = PALETTE.screen;
            ctx.font = '10px monospace';
            ctx.fillText('Press Enter to continue', w / 2, h / 2 + 30);
        }
    }

    handleInput(command: InputCommand) {
        if (this.gameState !== 'playing') {
            if (command === 'ENTER' || command === 'BACK') this.context.onSceneChange('select');
            return;
        }

        const moveSpeed = 15;
        if (command === 'LEFT') {
            this.playerX = Math.max(32, this.playerX - moveSpeed);
            if (this.playerRenderer) this.playerRenderer.flipX = true;
        } else if (command === 'RIGHT') {
            this.playerX = Math.min(this.context.canvas.width - 32, this.playerX + moveSpeed);
            if (this.playerRenderer) this.playerRenderer.flipX = false;
        } else if (command === 'BACK') {
            this.context.onSceneChange('select');
        }
    }
}
