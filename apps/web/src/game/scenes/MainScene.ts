// Deprecated: replaced by the retro UI flow in GameLoop + Render.
import { Scene } from './Scene';
import type { InputCommand } from '../Input';

export class MainScene extends Scene {
    init() {
        console.log('MainScene initialized');
    }

    update(_delta: number) { }

    draw() {
        const { ctx, canvas } = this.context;
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#FFF';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Main Pet View', canvas.width / 2, 50);

        ctx.font = '14px monospace';
        ctx.fillText('Press [M] for Minigames', canvas.width / 2, 120);
    }

    handleInput(command: InputCommand) {
        if (command === 'ENTER') {
            this.context.onSceneChange('select');
        }
    }
}
