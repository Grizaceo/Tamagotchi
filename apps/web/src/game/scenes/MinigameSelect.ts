import { Scene } from './Scene';

export class MinigameSelect extends Scene {
    private selectedIndex = 0;
    private options = ['Pudding Catch', 'Memory 2x2'];

    init() { }

    update(_delta: number) { }

    draw() {
        const { ctx, canvas } = this.context;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0F0';
        ctx.font = '20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SELECT MINIGAME', canvas.width / 2, 50);

        ctx.font = '16px monospace';
        this.options.forEach((opt, i) => {
            const y = 100 + i * 30;
            if (i === this.selectedIndex) {
                ctx.fillText(`> ${opt} <`, canvas.width / 2, y);
            } else {
                ctx.fillText(opt, canvas.width / 2, y);
            }
        });

        ctx.font = '10px monospace';
        ctx.fillText('Arrows to select - Enter to play - ESC back', canvas.width / 2, 220);
    }

    handleInput(e: KeyboardEvent) {
        if (e.key === 'ArrowUp') {
            this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
        } else if (e.key === 'ArrowDown') {
            this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
        } else if (e.key === 'Enter') {
            const scene = this.selectedIndex === 0 ? 'pudding-game' : 'memory-game';
            this.context.onSceneChange(scene);
        } else if (e.key === 'Escape') {
            this.context.onSceneChange('main');
        }
    }
}
