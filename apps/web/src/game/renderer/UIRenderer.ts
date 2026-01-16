import { AssetManager } from './SpriteRenderer';
import { PetState } from '@pompom/core';

export class UIRenderer {
    private assetManager: AssetManager;
    private iconSrc: string = '/assets/retro_ui_icons_1768544742647.png';

    // Icon Layout in the strip: 
    // 0: Food, 1: Light, 2: Play, 3: Medicine, 4: Toilet, 5: Stats, 6: Discipline, 7: Gift, 8: Album
    private ICONS = ['food', 'light', 'play', 'medicine', 'toilet', 'stats', 'discipline', 'gift', 'album'];

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
        ctx.fillText(\`\${time}m\`, 310, 15);

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
    const iconSize = 24; // Source size
    const displaySize = 24; 
    const padding = 8;
    const startX = (320 - (this.ICONS.length * (displaySize + padding))) / 2;
    const y = 240 - 30; // Bottom 30px

    this.ICONS.forEach((icon, index) => {
        const x = startX + index * (displaySize + padding);
        
        // Highlight if selected
        if (index === this.selectedIconIndex) {
            ctx.fillStyle = '#FFD94A'; // Highlight color
            ctx.fillRect(x - 2, y - 2, displaySize + 4, displaySize + 4);
        }

        // Draw Icon
        // Assuming horizontal strip
        ctx.drawImage(img, index * iconSize, 0, iconSize, iconSize, x, y, displaySize, displaySize);
    });
  }
}
