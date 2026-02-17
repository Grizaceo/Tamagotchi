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
    private iconSrc: string = '/assets/ui/icons.png';

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
        const displaySize = 24;
        const padding = 20; // Increase padding for text
        const count = MENU_ICONS.length;
        const totalWidth = count * displaySize + (count - 1) * padding;
        const startX = (320 - totalWidth) / 2;
        const y = 240 - 32; // Move up slightly to fit text

        // Grid assumption for retro icons: 1024x1024, ~256px grid
        const cols = 4;
        const gridSize = 256;

        const iconMap: Record<string, string> = {
            'care': 'menu_food',
            'gifts': 'menu_gift',
            'album': 'menu_album',
            'settings': 'menu_settings',
            'games': 'menu_minigames',
        };

        MENU_ICONS.forEach((icon, index) => {
            const x = startX + index * (displaySize + padding);

            // Selection Highlight
            if (index === this.selectedIconIndex) {
                ctx.fillStyle = '#FFD94A';
                ctx.fillRect(x - 2, y - 2, displaySize + 4, displaySize + 4);
            }

            // Draw Icon
            // Try placeholder first
            let drawn = false;
            const placeholderKey = iconMap[icon.label];
            if (placeholderKey) {
                const pImg = this.assetManager.get(placeholderKey);
                if (pImg) {
                    ctx.drawImage(pImg, x, y, displaySize, displaySize);
                    drawn = true;
                }
            }

            if (!drawn) {
                const srcCol = icon.srcIndex % cols;
                const srcRow = Math.floor(icon.srcIndex / cols);
                const srcX = srcCol * gridSize;
                const srcY = srcRow * gridSize;

                ctx.drawImage(img, srcX, srcY, gridSize, gridSize, x, y, displaySize, displaySize);
            }

            // Draw Label
            ctx.fillStyle = '#202020'; // use PALETTE.inkSoft? Hardcoded for now to match file style
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            // Shorten longer labels if needed
            const label = icon.label.toUpperCase().substring(0, 6);
            ctx.fillText(label, x + displaySize / 2, y + displaySize + 2);
        });
        ctx.textAlign = 'left'; // Reset
    }
}
