import { Scene } from './Scene';
import { gameCore } from '../GameCore';
import { createAction } from '@pompom/core';

export class PuddingGame extends Scene {
    private pos = 0;
    private speed = 0.02;
    private direction = 1;
    private gameState: 'playing' | 'won' | 'lost' = 'playing';
    private resultMessage = '';

    init() {
        this.pos = 0;
        this.gameState = 'playing';
    }

    update(delta: number) {
        if (this.gameState !== 'playing') return;

        this.pos += this.speed * this.direction * (delta / 16);
        if (this.pos > 1) {
            this.pos = 1;
            this.direction = -1;
        } else if (this.pos < 0) {
            this.pos = 0;
            this.direction = 1;
        }
    }

    draw() {
        const { ctx, canvas } = this.context;
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFF';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CATCH THE PUDDING!', canvas.width / 2, 50);

        // Bar
        const barWidth = 200;
        const barX = (canvas.width - barWidth) / 2;
        const barY = 120;
        const barHeight = 20;

        ctx.strokeStyle = '#555';
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Target area (center)
        ctx.fillStyle = '#0F0';
        const targetWidth = 40;
        ctx.fillRect(canvas.width / 2 - targetWidth / 2, barY, targetWidth, barHeight);

        // Indicator
        ctx.fillStyle = '#F0F';
        const indicatorX = barX + this.pos * barWidth;
        ctx.fillRect(indicatorX - 2, barY - 5, 4, barHeight + 10);

        if (this.gameState !== 'playing') {
            ctx.fillStyle = this.gameState === 'won' ? '#0F0' : '#F00';
            ctx.fillText(this.resultMessage, canvas.width / 2, 180);
            ctx.fillStyle = '#FFF';
            ctx.font = '10px monospace';
            ctx.fillText('Press Enter to continue', canvas.width / 2, 210);
        } else {
            ctx.fillStyle = '#AAA';
            ctx.font = '10px monospace';
            ctx.fillText('Press ENTER to catch!', canvas.width / 2, 210);
        }
    }

    handleInput(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            if (this.gameState === 'playing') {
                const targetMin = 0.5 - (20 / 200); // 40px width / 200px bar
                const targetMax = 0.5 + (20 / 200);

                if (this.pos >= targetMin && this.pos <= targetMax) {
                    this.gameState = 'won';
                    this.resultMessage = 'PERFECT CATCH!';
                    // Emit event to core (mock for now, need core instance)
                    console.log('MINIGAME_PERFECT: pudding');
                } else {
                    this.gameState = 'won'; // In this game even a bad catch is a "win" but less rewards? 
                    // Per requirements: "Enter cuando esté en zona objetivo". 
                    // Let's say if you miss completely it's a loss.
                    if (Math.abs(this.pos - 0.5) < 0.3) {
                        this.gameState = 'won';
                        this.resultMessage = 'NICE!';
                    } else {
                        this.gameState = 'lost';
                        this.resultMessage = 'MISSED!';
                    }
                }
            } else {
                this.context.onSceneChange('minigame-select');
            }
        } else if (e.key === 'Escape') {
            this.context.onSceneChange('minigame-select');
        }
    }
}
