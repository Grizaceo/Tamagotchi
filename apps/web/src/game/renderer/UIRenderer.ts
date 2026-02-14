import { AssetManager } from './SpriteRenderer';
import type { PetState } from '@pompom/core';

/**
 * Menu items aligned 1:1 with BOTTOM_MENU in Scenes.ts.
 * Each entry maps to a source-icon index in the sprite strip.
 * Sprite strip order: 0:Food, 1:Light, 2:Play, 3:Medicine, 4:Toilet, 5:Stats, 6:Discipline, 7:Gift, 8:Album
 */
const MENU_ICONS: { label: string; srcIndex: number }[] = [
    { label: 'home', srcIndex: 5 }, // Home  → Stats icon
    { label: 'care', srcIndex: 0 }, // Care  → Food icon
    { label: 'gifts', srcIndex: 7 }, // Gifts → Gift icon
    { label: 'album', srcIndex: 8 }, // Album → Album icon
    { label: 'settings', srcIndex: 1 }, // Setup → Light icon
    { label: 'games', srcIndex: 2 }, // Games → Play icon
];

export class UIRenderer {
    private assetManager: AssetManager;
    private iconSrc: string = '/assets/ui_icons_strip.png';

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
        const iconSize = 24;
        const displaySize = 24;
        const padding = 8;
        const count = MENU_ICONS.length;
        const startX = (320 - (count * (displaySize + padding))) / 2;
        const y = 240 - 30;

        MENU_ICONS.forEach((icon, index) => {
            const x = startX + index * (displaySize + padding);

            if (index === this.selectedIconIndex) {
                ctx.fillStyle = '#FFD94A';
                ctx.fillRect(x - 2, y - 2, displaySize + 4, displaySize + 4);
            }

            ctx.drawImage(img, icon.srcIndex * iconSize, 0, iconSize, iconSize, x, y, displaySize, displaySize);
        });
    }
}
