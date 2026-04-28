import { Scene } from './Scene';
import type { InputCommand } from '../Input';
import { PALETTE } from '../palette';
import { SpriteRenderer } from '../renderer/SpriteRenderer';
import { SPRITE_CONFIGS } from '../renderer/SpriteConfigs';

interface GameItem {
    x: number;
    y: number;
    type: 'fish' | 'orca';
    active: boolean;
}

export class SealGame extends Scene {
    private sealY = 120;
    private targetY = 120;
    private score = 0;
    private distance = 0;
    private items: GameItem[] = [];
    private spawnTimer = 0;
    private spawnInterval = 1200;
    private gameState: 'playing' | 'won' | 'lost' = 'playing';
    
    private sealRenderer: SpriteRenderer | null = null;
    private speed = 3;

    init() {
        this.sealY = 120;
        this.targetY = 120;
        this.score = 0;
        this.distance = 0;
        this.items = [];
        this.spawnTimer = 0;
        this.speed = 3;
        this.gameState = 'playing';

        if (this.context.assetManager) {
            const config = SPRITE_CONFIGS['SEAL_BABY'];
            this.sealRenderer = new SpriteRenderer(this.context.assetManager, 'SEAL_BABY', config);
            this.sealRenderer.displaySize = 50;
            this.sealRenderer.setAnimation('idle');
        }
    }

    update(delta: number) {
        if (this.gameState !== 'playing') return;

        // Move seal towards target lane
        const lerpFactor = 0.15;
        this.sealY += (this.targetY - this.sealY) * lerpFactor * (delta / 16);

        if (this.sealRenderer) {
            this.sealRenderer.update(delta);
        }

        // Spawn items
        this.spawnTimer += delta;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnInterval = Math.max(600, this.spawnInterval * 0.995);
            this.speed += 0.01;

            const lanes = [60, 120, 180];
            const lane = lanes[Math.floor(Math.random() * lanes.length)];
            const type = Math.random() > 0.4 ? 'fish' : 'orca';
            
            this.items.push({
                x: this.context.canvas.width + 50,
                y: lane,
                type,
                active: true
            });
        }

        // Update items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.x -= this.speed * (delta / 16);

            // Collision
            const sealX = 60;
            const dist = Math.sqrt((item.x - sealX) ** 2 + (item.y - this.sealY) ** 2);

            if (item.active && dist < 28) { // Slightly larger collision for orca
                if (item.type === 'fish') {
                    item.active = false;
                    this.score++;
                    if (this.sealRenderer) this.sealRenderer.setAnimation('happy');
                    setTimeout(() => { if(this.gameState === 'playing') this.sealRenderer?.setAnimation('idle')}, 500);
                    
                    if (this.score >= 15 && !this.context.extra?.arcade) {
                        this.endGame('won');
                    }
                } else {
                    this.endGame('lost');
                }
            }

            if (item.x < -100) {
                this.items.splice(i, 1);
            }
        }

        this.distance += this.speed * (delta / 1600);
    }

    private endGame(state: 'won' | 'lost') {
        if (this.gameState !== 'playing') return;
        this.gameState = state;
        if (this.context.onGameComplete) {
            this.context.onGameComplete({
                gameId: 'seal',
                result: state === 'won' ? 'perfect' : 'loss',
                score: this.score
            });
        }
    }

    draw() {
        const { ctx, canvas } = this.context;
        const w = canvas.width;
        const h = canvas.height;

        // Background (Snow/Ice)
        ctx.fillStyle = '#f0f8ff'; // AliceBlue
        ctx.fillRect(0, 0, w, h);

        // Snow lines (speed effect)
        ctx.strokeStyle = '#d0e0f0';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const lx = ( (this.distance * 50 + i * 100) % (w + 100) ) - 50;
            const ly = 40 + i * 40;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + 40, ly);
            ctx.stroke();
        }

        // Lanes
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(0, 90); ctx.lineTo(w, 90);
        ctx.moveTo(0, 150); ctx.lineTo(w, 150);
        ctx.stroke();
        ctx.setLineDash([]);

        // Items
        for (const item of this.items) {
            if (!item.active) continue;
            
            if (item.type === 'fish') {
                this.drawFish(ctx, item.x, item.y);
            } else if (item.type === 'orca') {
                this.drawOrca(ctx, item.x, item.y);
            }
        }

        // Seal
        if (this.sealRenderer) {
            this.sealRenderer.x = 60 - 25;
            this.sealRenderer.y = this.sealY - 25;
            // Add a slight tilt while sliding
            ctx.save();
            ctx.translate(60, this.sealY);
            ctx.rotate(0.1); // Slightly tilted forward
            ctx.translate(-60, -this.sealY);
            this.sealRenderer.draw(ctx);
            ctx.restore();
        }

        // HUD
        ctx.fillStyle = PALETTE.ink;
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FISH: ${this.score}`, 10, 20);
        ctx.textAlign = 'right';
        ctx.fillText(`DIST: ${Math.floor(this.distance)}m`, w - 10, 20);

        if (this.gameState !== 'playing') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, w, h);

            ctx.fillStyle = this.gameState === 'won' ? PALETTE.win : PALETTE.lose;
            ctx.font = '24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.gameState === 'won' ? 'ARCTIC CHAMP!' : 'ORCA DINNER!', w / 2, h / 2);
            
            ctx.fillStyle = PALETTE.screen;
            ctx.font = '10px monospace';
            ctx.fillText('Press Enter or Back to return', w / 2, h / 2 + 30);
        }
    }

    private drawFish(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.fillStyle = '#ff9a00'; // Orange fish
        ctx.beginPath();
        ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.beginPath();
        ctx.moveTo(x + 8, y);
        ctx.lineTo(x + 14, y - 5);
        ctx.lineTo(x + 14, y + 5);
        ctx.closePath();
        ctx.fill();
        // Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x - 5, y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawOrca(ctx: CanvasRenderingContext2D, x: number, y: number) {
        ctx.save();
        // Face left
        ctx.translate(x, y);
        
        // Body (Black)
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Belly (White)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 6, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dorsal Fin
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(-8, -25);
        ctx.lineTo(4, -5);
        ctx.fill();

        // Eye spot (White patch)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-14, -4, 6, 3, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Tail (Black)
        ctx.fillStyle = '#222222';
        ctx.beginPath();
        ctx.moveTo(25, 0);
        ctx.lineTo(35, -10);
        ctx.lineTo(35, 10);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    handleInput(command: InputCommand) {
        if (this.gameState !== 'playing') {
            if (command === 'ENTER' || command === 'BACK') this.context.onSceneChange('select');
            return;
        }

        if (command === 'UP') {
            this.targetY = Math.max(60, this.targetY - 60);
        } else if (command === 'DOWN') {
            this.targetY = Math.min(180, this.targetY + 60);
        } else if (command === 'BACK') {
            this.context.onSceneChange('select');
        }
    }
}
