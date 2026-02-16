import { AssetManager } from '../renderer/SpriteRenderer';

export const ICON_MAP = {
    // Stats
    icon_hunger: 'https://picsum.photos/id/1080/32/32', // Strawberries?
    icon_happy: 'https://picsum.photos/id/1062/32/32', // Dog wrapped in blanket
    icon_energy: 'https://picsum.photos/id/1005/32/32', // Person on hill?
    icon_health: 'https://picsum.photos/id/1004/32/32', // Kiss
    icon_love: 'https://picsum.photos/id/30/32/32',    // Mug (Love?)

    // Menu
    menu_food: 'https://picsum.photos/id/292/64/64',     // Food ingredients
    menu_light: 'https://picsum.photos/id/357/64/64',    // Clock/alarm?
    menu_play: 'https://picsum.photos/id/454/64/64',     // Concert/Fun
    menu_medicine: 'https://picsum.photos/id/593/64/64', // Needle/thread (Medicine?)
    menu_toilet: 'https://picsum.photos/id/111/64/64',   // Old car (Toilet? lol)
    menu_stats: 'https://picsum.photos/id/180/64/64',    // Laptop/Papers
    menu_discipline: 'https://picsum.photos/id/190/64/64', // Architecture (Strict?)
    menu_gift: 'https://picsum.photos/id/65/64/64',      // Girl (Gift?) 
    menu_album: 'https://picsum.photos/id/22/64/64',     // Walk alone (Album?)
    menu_settings: '/assets/ui/menu_settings.png', // Gear icon
    menu_minigames: 'https://picsum.photos/id/96/64/64', // Abstract (Game?)
    gift_judge: '/assets/ui/gift_judge.png', // Judge Pompom

    // Labels
    label_hunger: '/assets/ui/labels/label_hunger.png',
    label_happy: '/assets/ui/labels/label_happy.png',
    label_energy: '/assets/ui/labels/label_energy.png',
    label_health: '/assets/ui/labels/label_health.png',
    label_love: '/assets/ui/labels/label_love.png',
};

export async function loadPlaceholders(assetManager: AssetManager): Promise<void> {
    const promises = Object.entries(ICON_MAP).map(([key, url]) => {
        return assetManager.load(key, url);
    });
    await Promise.all(promises);
}
