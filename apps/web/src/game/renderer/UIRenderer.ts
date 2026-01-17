import { AssetManager } from './SpriteRenderer';
import type { PetState } from '@pompom/core';

export class UIRenderer {
    private assetManager: AssetManager;
    private iconSrc: string = '/assets/retro_ui_icons_1768544742647.png';

    // Icon Layout in the strip: 
    // 0: Food, 1: Light, 2: Play, 3: Medicine, 4: Toilet, 5: Stats, 6: Discipline, 7: Gift, 8: Album
    private ICONS = ['food', 'light', 'play', 'medicine', 'toilet', 'stats', 'discipline', 'gift', 'album'];
    
    // Source size in the spritesheet (each icon's actual dimension)
    private iconSourceSize: number = 32; // Estimated from spritesheet
    // Display size on canvas
    private iconDisplaySize: number = 24;

    private selectedIconIndex: number = -1; // -1 means no menu selection active

    constructor(assetManager: AssetManager) {
        this.assetManager = assetManager;
    }

    async load() {
        await this.assetManager.load('ui_icons', this.iconSrc);
    }

    setSelectedIcon(index: number) {
        this.selectedIconIndex = index;
    }

    draw(ctx: CanvasRenderingContext2D, state: PetState) {
        const img = this.assetManager.get('ui_icons');
        if (!img) return;

        // Draw Header (Status)
        this.drawHeader(ctx, state);

        // Draw Footer (Menu)
        this.drawFooter(ctx, img);
    }

    private drawHeader(ctx: CanvasRenderingContext2D, state: PetState) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#202020';
        ctx.textAlign = 'right';
        // Clock placeholder
        const time = Math.floor(state.totalTicks / 60); // minutes
        ctx.fillText(`${time}m`, 310, 15);

        // Status icons (simple text fallback for now if sick/hungry)
        ctx.textAlign = 'left';
        let statusText = '';
        if (state.stats.health < 30) statusText += 'Sick ';
        if (state.stats.hunger > 70) statusText += 'Hungry ';
        if (statusText) {
            ctx.fillStyle = '#FF5252';
            ctx.fillText(statusText, 10, 15);
        }
    }

    private drawFooter(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
        const padding = 8;
        const startX = (320 - (this.ICONS.length * (this.iconDisplaySize + padding))) / 2;
        const y = 240 - 30; // Bottom 30px

        this.ICONS.forEach((_, index) => {
            const x = startX + index * (this.iconDisplaySize + padding);
            
            // Highlight if selected
            if (index === this.selectedIconIndex) {
                ctx.fillStyle = '#FFD94A'; // Highlight color
                ctx.fillRect(x - 2, y - 2, this.iconDisplaySize + 4, this.iconDisplaySize + 4);
            }

            // Draw Icon from horizontal strip
            // Source: read from left to right, each icon is iconSourceSize wide
            const srcX = index * this.iconSourceSize;
            const srcY = 0;
            
            ctx.drawImage(
                img,
                srcX, srcY,
                this.iconSourceSize, this.iconSourceSize,
                x, y,
                this.iconDisplaySize, this.iconDisplaySize
            );
        });
    }
}
