import { AssetManager } from './SpriteRenderer';
import type { PetState } from '@pompom/core';

/**
 * Menu items aligned 1:1 with BOTTOM_MENU in Scenes.ts.
 * Each entry maps to a source-icon index in the sprite strip.
 * Sprite strip order: 0:Food, 1:Light, 2:Play, 3:Medicine, 4:Toilet, 5:Stats, 6:Discipline, 7:Gift, 8:Album
 */
const MENU_ICONS: { label: string; srcIndex: number }[] = [
    // Home removed
    { label: 'care', srcIndex: 0 }, // Care  → Food icon
    { label: 'gifts', srcIndex: 7 }, // Gifts → Gift icon
    { label: 'album', srcIndex: 8 }, // Album → Album icon
    { label: 'settings', srcIndex: 1 }, // Setup → Light icon
    { label: 'games', srcIndex: 2 }, // Games → Play icon
];

export class UIRenderer {
    private assetManager: AssetManager;
    private iconSrc: string = `${(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/'}assets/ui/icons.png`;

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

        this.drawHeader(ctx, state);
        this.drawFooter(ctx, img);
    }

    private drawHeader(ctx: CanvasRenderingContext2D, state: PetState) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#202020';
        ctx.textAlign = 'right';
        const time = Math.floor(state.totalTicks / 60);
        ctx.fillText(`${time}m`, 310, 15);

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
        const displaySize = 14; // Smaller to fit better
        const padding = 24; // More breathing room
        const count = MENU_ICONS.length;
        const totalWidth = count * displaySize + (count - 1) * padding;
        const startX = (320 - totalWidth) / 2;
        const footerH = 24;
        const footerY = 240 - footerH;
        const iconY = footerY + 2; 

        // 1. Draw Background Bar (Align the background)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, footerY, 320, footerH);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, footerY);
        ctx.lineTo(320, footerY);
        ctx.stroke();

        const iconMap: Record<string, string> = {
            'care': 'menu_care',
            'gifts': 'menu_gifts',
            'album': 'menu_album',
            'settings': 'menu_settings',
            'games': 'menu_games',
        };

        MENU_ICONS.forEach((icon, index) => {
            const x = startX + index * (displaySize + padding);

            // Selection Highlight - Premium Glow/Box
            if (index === this.selectedIconIndex) {
                ctx.save();
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(255, 217, 74, 0.8)';
                
                ctx.fillStyle = '#FFD94A';
                const r = 3;
                const hx = x - 4;
                const hy = iconY - 2;
                const hw = displaySize + 8;
                const hh = footerH - 4;
                
                // Rounded rect
                ctx.beginPath();
                ctx.roundRect(hx, hy, hw, hh, r);
                ctx.fill();
                ctx.restore();
            }

            // Draw Icon
            let drawn = false;
            const placeholderKey = iconMap[icon.label];
            if (placeholderKey) {
                const pImg = this.assetManager.get(placeholderKey);
                if (pImg) {
                    ctx.save();
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Draw with slight shadow for depth
                    ctx.shadowBlur = 2;
                    ctx.shadowColor = 'rgba(0,0,0,0.2)';
                    ctx.shadowOffsetY = 1;
                    
                    ctx.drawImage(pImg, x, iconY, displaySize, displaySize);
                    ctx.restore();
                    drawn = true;
                }
            }

            if (!drawn) {
                const srcCol = icon.srcIndex % 4;
                const srcRow = Math.floor(icon.srcIndex / 4);
                const srcX = srcCol * 256;
                const srcY = srcRow * 256;

                ctx.drawImage(img, srcX, srcY, 256, 256, x, iconY, displaySize, displaySize);
            }

            // Draw Label
            ctx.fillStyle = index === this.selectedIconIndex ? '#202020' : '#606060';
            ctx.font = 'bold 7px "Cascadia Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            const label = icon.label.toUpperCase();
            ctx.fillText(label, x + displaySize / 2, iconY + displaySize + 1);
        });
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
    }
}
