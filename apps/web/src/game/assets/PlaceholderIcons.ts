import { AssetManager } from '../renderer/SpriteRenderer';

const B = import.meta.env.BASE_URL;

export const ICON_MAP = {
    // Stats (local UI assets)
    icon_hunger: `${B}assets/ui/icon_hunger.png`,
    icon_happy: `${B}assets/ui/icon_happy.png`,
    icon_energy: `${B}assets/ui/icon_energy.png`,
    icon_health: `${B}assets/ui/icon_health.png`,
    icon_love: `${B}assets/ui/icon_love.png`,

    // Menu (local UI assets)
    menu_food: `${B}assets/ui/menu_food.png`,
    menu_light: `${B}assets/ui/menu_light.png`,
    menu_play: `${B}assets/ui/menu_play.png`,
    menu_medicine: `${B}assets/ui/menu_medicine.png`,
    menu_toilet: `${B}assets/ui/menu_toilet.png`,
    menu_stats: `${B}assets/ui/menu_stats.png`,
    menu_discipline: `${B}assets/ui/menu_discipline.png`,
    menu_gift: `${B}assets/ui/menu_gift.png`,
    menu_album: `${B}assets/ui/menu_album.png`,
    menu_settings: `${B}assets/ui/menu_settings.png`,
    menu_minigames: `${B}assets/ui/menu_minigames.png`,
    gift_judge: `${B}assets/ui/gift_judge.png`,

    // Labels
    label_hunger: `${B}assets/ui/labels/label_hunger.png`,
    label_happy: `${B}assets/ui/labels/label_happy.png`,
    label_energy: `${B}assets/ui/labels/label_energy.png`,
    label_health: `${B}assets/ui/labels/label_health.png`,
    label_love: `${B}assets/ui/labels/label_love.png`,
};

export async function loadPlaceholders(assetManager: AssetManager): Promise<void> {
    const promises = Object.entries(ICON_MAP).map(([key, url]) => assetManager.load(key, url));
    const results = await Promise.allSettled(promises);
    for (const result of results) {
        if (result.status === 'rejected') {
            console.warn('[PomPom] Failed to load one UI placeholder icon', result.reason);
        }
    }
}
